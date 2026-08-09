// Pure game-logic reducer. Every function takes a GameState and returns a NEW GameState.
// No side effects, no I/O — the caller (client) persists the result to Supabase.
//
// NOTE ON ARCHITECTURE: this game is client-authoritative. Whichever connected
// browser performs an action computes the next state and writes it to Supabase;
// Realtime then pushes it to everyone else. That's the right tradeoff for a
// casual game played among trusted friends. It is NOT tamper-proof — a
// malicious client could write an illegal state. If you ever need that
// guarantee, move these same functions into a Supabase Edge Function.

import { BOARD, spaceAt, COLOR_GROUPS, ownedGroupComplete } from "./board";
import { WILDCARD_CARDS, COMMUNITY_FUND_CARDS, shuffledDeck, findCard } from "./cards";
import {
  GameState,
  Player,
  PropertyState,
  AuctionState,
  TradeOffer,
  LogEntry,
  STARTING_MONEY,
  SALARY,
  TOTAL_HOUSES,
  TOTAL_HOTELS,
} from "./types";

function log(state: GameState, text: string): LogEntry[] {
  const entry: LogEntry = { id: crypto.randomUUID(), text, ts: new Date().toISOString() };
  return [...state.log.slice(-99), entry];
}

function touch(state: GameState): GameState {
  return { ...state, updatedAt: new Date().toISOString() };
}

function getPlayer(state: GameState, playerId: string): Player {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) throw new Error("Player not found");
  return p;
}

function updatePlayer(state: GameState, playerId: string, patch: Partial<Player>): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
  };
}

function activePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.bankrupt);
}

function nextActiveIndex(state: GameState, fromIndex: number): number {
  const n = state.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n;
    if (!state.players[idx].bankrupt) return idx;
  }
  return fromIndex;
}

// ---------- Lobby ----------

export function createGame(code: string, host: Omit<Player, "money" | "position" | "inJail" | "jailTurns" | "getOutOfJailFreeCards" | "bankrupt" | "isHost">): GameState {
  const hostPlayer: Player = {
    ...host,
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailFreeCards: 0,
    bankrupt: false,
    isHost: true,
  };
  const now = new Date().toISOString();
  return {
    code,
    phase: "lobby",
    players: [hostPlayer],
    properties: {},
    turnIndex: 0,
    turnPhase: "awaiting-roll",
    dice: null,
    doublesCount: 0,
    pendingAuction: null,
    pendingTrade: null,
    wildcardDeck: shuffledDeck(WILDCARD_CARDS),
    communityFundDeck: shuffledDeck(COMMUNITY_FUND_CARDS),
    log: [],
    bank: { houses: TOTAL_HOUSES, hotels: TOTAL_HOTELS },
    winnerId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function addPlayer(state: GameState, player: Omit<Player, "money" | "position" | "inJail" | "jailTurns" | "getOutOfJailFreeCards" | "bankrupt" | "isHost">): GameState {
  if (state.phase !== "lobby") throw new Error("Game already started");
  if (state.players.length >= 8) throw new Error("Game is full");
  const newPlayer: Player = {
    ...player,
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailFreeCards: 0,
    bankrupt: false,
    isHost: false,
  };
  return touch({ ...state, players: [...state.players, newPlayer], log: log(state, `${player.name} joined the game.`) });
}

export function startGame(state: GameState): GameState {
  if (state.players.length < 2) throw new Error("Need at least 2 players");
  const properties: Record<number, PropertyState> = {};
  for (const space of BOARD) {
    if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
      properties[space.position] = { position: space.position, ownerId: null, houses: 0, mortgaged: false };
    }
  }
  return touch({
    ...state,
    phase: "playing",
    properties,
    turnIndex: 0,
    turnPhase: "awaiting-roll",
    log: log(state, "The game has started. Good luck!"),
  });
}

// ---------- Turn / dice ----------

export function rollDice(state: GameState, playerId: string): GameState {
  if (state.turnPhase !== "awaiting-roll") throw new Error("Not time to roll");
  const current = state.players[state.turnIndex];
  if (current.id !== playerId) throw new Error("Not your turn");

  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const isDouble = d1 === d2;

  let next: GameState = { ...state, dice: [d1, d2] };

  // Jailed player
  if (current.inJail) {
    if (isDouble) {
      next = updatePlayer(next, playerId, { inJail: false, jailTurns: 0 });
      next = { ...next, log: log(next, `${current.name} rolled doubles and is released from lockup.`) };
      return movePlayer(next, playerId, d1 + d2);
    }
    const turns = current.jailTurns + 1;
    if (turns >= 3) {
      next = updatePlayer(next, playerId, { inJail: false, jailTurns: 0, money: current.money - 50 });
      next = { ...next, log: log(next, `${current.name} paid $50 after 3 failed attempts and is released.`) };
      return movePlayer(next, playerId, d1 + d2);
    }
    next = updatePlayer(next, playerId, { jailTurns: turns });
    next = { ...next, log: log(next, `${current.name} rolled ${d1}+${d2}, still in lockup (attempt ${turns}/3).`), turnPhase: "awaiting-action" };
    return touch(next);
  }

  if (isDouble) {
    const doublesCount = state.doublesCount + 1;
    if (doublesCount === 3) {
      next = { ...next, doublesCount: 0, log: log(next, `${current.name} rolled doubles three times in a row — straight to lockup!`) };
      return sendToJail(next, playerId);
    }
    next = { ...next, doublesCount };
  } else {
    next = { ...next, doublesCount: 0 };
  }

  next = { ...next, log: log(next, `${current.name} rolled ${d1} + ${d2}.`) };
  return movePlayer(next, playerId, d1 + d2);
}

function movePlayer(state: GameState, playerId: string, spaces: number): GameState {
  const player = getPlayer(state, playerId);
  const newPos = (player.position + spaces) % 40;
  const passedGo = newPos < player.position || spaces >= 40;
  let next = updatePlayer(state, playerId, { position: newPos });
  if (passedGo) {
    next = updatePlayer(next, playerId, { money: getPlayer(next, playerId).money + SALARY });
    next = { ...next, log: log(next, `${player.name} passed Start and collected $${SALARY}.`) };
  }
  return landOnSpace(next, playerId, newPos);
}

function landOnSpace(state: GameState, playerId: string, position: number): GameState {
  const space = spaceAt(position);
  const player = getPlayer(state, playerId);
  let next = { ...state, log: log(state, `${player.name} landed on ${space.name}.`) };

  switch (space.type) {
    case "property":
    case "railroad":
    case "utility": {
      const prop = next.properties[position];
      if (!prop || prop.ownerId === null) {
        return { ...next, turnPhase: "awaiting-purchase-decision" };
      }
      if (prop.ownerId === playerId || prop.mortgaged) {
        return { ...next, turnPhase: "awaiting-action" };
      }
      return payRent(next, playerId, prop.ownerId, position);
    }
    case "tax": {
      const amount = space.taxAmount || 0;
      next = updatePlayer(next, playerId, { money: player.money - amount });
      next = { ...next, log: log(next, `${player.name} paid $${amount} in tax.`) };
      return checkBankruptOrContinue(next, playerId, "bank");
    }
    case "wildcard":
      return drawCard(next, playerId, "wildcard");
    case "communityFund":
      return drawCard(next, playerId, "communityFund");
    case "goToJail":
      return sendToJail(next, playerId);
    case "go":
    case "jail":
    case "freeParking":
    default:
      return { ...next, turnPhase: "awaiting-action" };
  }
}

function payRent(state: GameState, payerId: string, ownerId: string, position: number): GameState {
  const space = spaceAt(position);
  const prop = state.properties[position];
  const payer = getPlayer(state, payerId);
  const owner = getPlayer(state, ownerId);
  let rent = 0;

  if (space.type === "property") {
    const houses = prop.houses;
    const groupComplete = ownedGroupComplete(space.colorGroup!, state.properties, ownerId);
    if (houses > 0) {
      rent = space.rent![houses];
    } else if (groupComplete) {
      rent = space.rent![0] * 2;
    } else {
      rent = space.rent![0];
    }
  } else if (space.type === "railroad") {
    const ownedCount = COLOR_GROUPS_RAILROADS(state, ownerId);
    rent = space.rent![Math.min(ownedCount, 4) - 1];
  } else if (space.type === "utility") {
    const ownedUtilities = utilitiesOwnedBy(state, ownerId);
    const [d1, d2] = state.dice || [1, 1];
    const multiplier = ownedUtilities >= 2 ? 10 : 4;
    rent = (d1 + d2) * multiplier;
  }

  let next = updatePlayer(state, payerId, { money: payer.money - rent });
  next = updatePlayer(next, ownerId, { money: getPlayer(next, ownerId).money + rent });
  next = { ...next, log: log(next, `${payer.name} paid $${rent} rent to ${owner.name}.`) };
  return checkBankruptOrContinue(next, payerId, ownerId);
}

function COLOR_GROUPS_RAILROADS(state: GameState, ownerId: string): number {
  const railroadPositions = BOARD.filter((s) => s.type === "railroad").map((s) => s.position);
  return railroadPositions.filter((pos) => state.properties[pos]?.ownerId === ownerId).length;
}

function utilitiesOwnedBy(state: GameState, ownerId: string): number {
  const utilityPositions = BOARD.filter((s) => s.type === "utility").map((s) => s.position);
  return utilityPositions.filter((pos) => state.properties[pos]?.ownerId === ownerId).length;
}

function drawCard(state: GameState, playerId: string, deckName: "wildcard" | "communityFund"): GameState {
  const deckKey = deckName === "wildcard" ? "wildcardDeck" : "communityFundDeck";
  const sourceDeck = deckName === "wildcard" ? WILDCARD_CARDS : COMMUNITY_FUND_CARDS;
  let deck = state[deckKey];
  if (deck.length === 0) deck = shuffledDeck(sourceDeck);
  const [cardId, ...rest] = deck;
  const card = findCard(cardId);
  let next: GameState = { ...state, [deckKey]: rest } as GameState;
  next = { ...next, log: log(next, `${getPlayer(next, playerId).name} drew: "${card.text}"`) };

  const effect = card.effect;
  const player = getPlayer(next, playerId);

  switch (effect.kind) {
    case "move": {
      const passedGo = effect.collectGoIfPassed && effect.to < player.position;
      let n2 = updatePlayer(next, playerId, { position: effect.to });
      if (passedGo) {
        n2 = updatePlayer(n2, playerId, { money: getPlayer(n2, playerId).money + SALARY });
        n2 = { ...n2, log: log(n2, `${player.name} passed Start and collected $${SALARY}.`) };
      }
      return landOnSpace(n2, playerId, effect.to);
    }
    case "moveRelative": {
      const newPos = ((player.position + effect.spaces) % 40 + 40) % 40;
      return landOnSpace(updatePlayer(next, playerId, { position: newPos }), playerId, newPos);
    }
    case "moveToNearest": {
      const targets = BOARD.filter((s) => s.type === effect.type).map((s) => s.position);
      let nearest = targets.find((p) => p > player.position);
      if (nearest === undefined) nearest = targets[0];
      const passedGo = nearest < player.position;
      let n2 = updatePlayer(next, playerId, { position: nearest });
      if (passedGo) {
        n2 = updatePlayer(n2, playerId, { money: getPlayer(n2, playerId).money + SALARY });
      }
      return landOnSpace(n2, playerId, nearest);
    }
    case "collect": {
      const n2 = updatePlayer(next, playerId, { money: player.money + effect.amount });
      return { ...n2, turnPhase: "awaiting-action" };
    }
    case "pay": {
      const n2 = updatePlayer(next, playerId, { money: player.money - effect.amount });
      return checkBankruptOrContinue(n2, playerId, "bank");
    }
    case "payEachPlayer": {
      let n2 = next;
      for (const other of activePlayers(next)) {
        if (other.id === playerId) continue;
        n2 = updatePlayer(n2, playerId, { money: getPlayer(n2, playerId).money - effect.amount });
        n2 = updatePlayer(n2, other.id, { money: getPlayer(n2, other.id).money + effect.amount });
      }
      return checkBankruptOrContinue(n2, playerId, "bank");
    }
    case "collectFromEachPlayer": {
      let n2 = next;
      for (const other of activePlayers(next)) {
        if (other.id === playerId) continue;
        n2 = updatePlayer(n2, other.id, { money: getPlayer(n2, other.id).money - effect.amount });
        n2 = updatePlayer(n2, playerId, { money: getPlayer(n2, playerId).money + effect.amount });
      }
      return { ...n2, turnPhase: "awaiting-action" };
    }
    case "goToJail":
      return sendToJail(next, playerId);
    case "getOutOfJailFree": {
      const n2 = updatePlayer(next, playerId, { getOutOfJailFreeCards: player.getOutOfJailFreeCards + 1 });
      return { ...n2, turnPhase: "awaiting-action" };
    }
    case "repairs": {
      let houseTotal = 0;
      let hotelTotal = 0;
      for (const pos of Object.keys(next.properties).map(Number)) {
        const prop = next.properties[pos];
        if (prop.ownerId !== playerId) continue;
        if (prop.houses === 5) hotelTotal++;
        else houseTotal += prop.houses;
      }
      const cost = houseTotal * effect.perHouse + hotelTotal * effect.perHotel;
      const n2 = updatePlayer(next, playerId, { money: player.money - cost });
      return checkBankruptOrContinue(n2, playerId, "bank");
    }
    default:
      return { ...next, turnPhase: "awaiting-action" };
  }
}

function sendToJail(state: GameState, playerId: string): GameState {
  const player = getPlayer(state, playerId);
  const next = updatePlayer(state, playerId, { position: 10, inJail: true, jailTurns: 0 });
  return { ...next, turnPhase: "awaiting-action", log: log(next, `${player.name} was sent to the County Lockup.`) };
}

// ---------- Buying & auctions ----------

export function buyProperty(state: GameState, playerId: string): GameState {
  if (state.turnPhase !== "awaiting-purchase-decision") throw new Error("No property to buy");
  const player = getPlayer(state, playerId);
  const position = player.position;
  const space = spaceAt(position);
  if (!space.price) throw new Error("Not purchasable");
  if (player.money < space.price) throw new Error("Not enough money");

  let next = updatePlayer(state, playerId, { money: player.money - space.price });
  next = {
    ...next,
    properties: { ...next.properties, [position]: { ...next.properties[position], ownerId: playerId } },
    turnPhase: "awaiting-action",
  };
  return touch({ ...next, log: log(next, `${player.name} bought ${space.name} for $${space.price}.`) });
}

export function declinePurchaseAndAuction(state: GameState, playerId: string): GameState {
  if (state.turnPhase !== "awaiting-purchase-decision") throw new Error("No property to decline");
  const player = getPlayer(state, playerId);
  const position = player.position;
  const space = spaceAt(position);
  const bidders = activePlayers(state).map((p) => p.id);
  const auction: AuctionState = {
    position,
    highestBid: 0,
    highestBidderId: null,
    activeBidderIds: bidders,
    turnBidderId: bidders[0],
  };
  return touch({
    ...state,
    pendingAuction: auction,
    turnPhase: "in-auction",
    log: log(state, `${player.name} declined to buy ${space.name}. Auction started.`),
  });
}

export function placeBid(state: GameState, playerId: string, amount: number): GameState {
  const auction = state.pendingAuction;
  if (!auction) throw new Error("No active auction");
  if (auction.turnBidderId !== playerId) throw new Error("Not your bidding turn");
  if (amount <= auction.highestBid) throw new Error("Bid must exceed current highest bid");
  const player = getPlayer(state, playerId);
  if (amount > player.money) throw new Error("Not enough money");

  const nextBidder = advanceAuctionTurn(auction, playerId);
  const updatedAuction: AuctionState = { ...auction, highestBid: amount, highestBidderId: playerId, turnBidderId: nextBidder };
  const next = { ...state, pendingAuction: updatedAuction, log: log(state, `${player.name} bid $${amount}.`) };
  return maybeResolveAuction(next);
}

export function passBid(state: GameState, playerId: string): GameState {
  const auction = state.pendingAuction;
  if (!auction) throw new Error("No active auction");
  if (auction.turnBidderId !== playerId) throw new Error("Not your bidding turn");
  const remaining = auction.activeBidderIds.filter((id) => id !== playerId);
  const player = getPlayer(state, playerId);
  const nextBidder = remaining.length > 0 ? advanceAuctionTurn({ ...auction, activeBidderIds: remaining }, playerId, true) : playerId;
  const updatedAuction: AuctionState = { ...auction, activeBidderIds: remaining, turnBidderId: nextBidder };
  const next = { ...state, pendingAuction: updatedAuction, log: log(state, `${player.name} passed on the auction.`) };
  return maybeResolveAuction(next);
}

function advanceAuctionTurn(auction: AuctionState, currentPlayerId: string, alreadyRemoved = false): string {
  const pool = alreadyRemoved ? auction.activeBidderIds : auction.activeBidderIds;
  if (pool.length === 0) return currentPlayerId;
  const idx = pool.indexOf(currentPlayerId);
  const startIdx = idx === -1 ? 0 : idx;
  for (let step = 1; step <= pool.length; step++) {
    const candidate = pool[(startIdx + step) % pool.length];
    if (candidate !== currentPlayerId || pool.length === 1) return candidate;
  }
  return pool[0];
}

function maybeResolveAuction(state: GameState): GameState {
  const auction = state.pendingAuction;
  if (!auction) return state;
  if (auction.activeBidderIds.length <= 1) {
    const space = spaceAt(auction.position);
    let next: GameState = { ...state, pendingAuction: null, turnPhase: "awaiting-action" };
    if (auction.highestBidderId) {
      const winner = getPlayer(next, auction.highestBidderId);
      next = updatePlayer(next, auction.highestBidderId, { money: winner.money - auction.highestBid });
      next = {
        ...next,
        properties: { ...next.properties, [auction.position]: { ...next.properties[auction.position], ownerId: auction.highestBidderId } },
      };
      next = { ...next, log: log(next, `${winner.name} won the auction for ${space.name} at $${auction.highestBid}.`) };
    } else {
      next = { ...next, log: log(next, `No bids — ${space.name} remains unowned.`) };
    }
    return touch(next);
  }
  return state;
}

// ---------- Mortgage / houses ----------

export function mortgageProperty(state: GameState, playerId: string, position: number): GameState {
  const prop = state.properties[position];
  if (!prop || prop.ownerId !== playerId) throw new Error("You don't own this property");
  if (prop.houses > 0) throw new Error("Sell houses first");
  if (prop.mortgaged) throw new Error("Already mortgaged");
  const space = spaceAt(position);
  const value = space.mortgageValue || 0;
  let next = updatePlayer(state, playerId, { money: getPlayer(state, playerId).money + value });
  next = { ...next, properties: { ...next.properties, [position]: { ...prop, mortgaged: true } } };
  return touch({ ...next, log: log(next, `${getPlayer(next, playerId).name} mortgaged ${space.name} for $${value}.`) });
}

export function unmortgageProperty(state: GameState, playerId: string, position: number): GameState {
  const prop = state.properties[position];
  if (!prop || prop.ownerId !== playerId) throw new Error("You don't own this property");
  if (!prop.mortgaged) throw new Error("Not mortgaged");
  const space = spaceAt(position);
  const cost = Math.round((space.mortgageValue || 0) * 1.1);
  const player = getPlayer(state, playerId);
  if (player.money < cost) throw new Error("Not enough money");
  let next = updatePlayer(state, playerId, { money: player.money - cost });
  next = { ...next, properties: { ...next.properties, [position]: { ...prop, mortgaged: false } } };
  return touch({ ...next, log: log(next, `${getPlayer(next, playerId).name} paid off the mortgage on ${space.name} for $${cost}.`) });
}

export function buildHouse(state: GameState, playerId: string, position: number): GameState {
  const space = spaceAt(position);
  if (space.type !== "property") throw new Error("Can't build here");
  const prop = state.properties[position];
  if (prop.ownerId !== playerId) throw new Error("You don't own this");
  if (prop.mortgaged) throw new Error("Property is mortgaged");
  if (!ownedGroupComplete(space.colorGroup!, state.properties, playerId)) throw new Error("You must own the full color group");
  if (prop.houses >= 5) throw new Error("Already a hotel");

  // Even-building rule: can't build here if another property in the group has fewer houses.
  const groupPositions = COLOR_GROUPS[space.colorGroup!];
  const minHouses = Math.min(...groupPositions.map((p) => state.properties[p].houses));
  if (prop.houses > minHouses) throw new Error("Build evenly across the color group");

  const isHotel = prop.houses === 4;
  if (isHotel && state.bank.hotels <= 0) throw new Error("No hotels left in the bank");
  if (!isHotel && state.bank.houses <= 0) throw new Error("No houses left in the bank");

  const player = getPlayer(state, playerId);
  const cost = space.houseCost || 0;
  if (player.money < cost) throw new Error("Not enough money");

  let next = updatePlayer(state, playerId, { money: player.money - cost });
  next = {
    ...next,
    properties: { ...next.properties, [position]: { ...prop, houses: prop.houses + 1 } },
    bank: isHotel ? { houses: next.bank.houses + 4, hotels: next.bank.hotels - 1 } : { ...next.bank, houses: next.bank.houses - 1 },
  };
  const label = isHotel ? "a hotel" : "a house";
  return touch({ ...next, log: log(next, `${player.name} built ${label} on ${space.name}.`) });
}

export function sellHouse(state: GameState, playerId: string, position: number): GameState {
  const space = spaceAt(position);
  const prop = state.properties[position];
  if (prop.ownerId !== playerId) throw new Error("You don't own this");
  if (prop.houses <= 0) throw new Error("No houses to sell");

  const groupPositions = COLOR_GROUPS[space.colorGroup!];
  const maxHouses = Math.max(...groupPositions.map((p) => state.properties[p].houses));
  if (prop.houses < maxHouses) throw new Error("Sell evenly across the color group");

  const wasHotel = prop.houses === 5;
  const refund = Math.round((space.houseCost || 0) / 2);
  const player = getPlayer(state, playerId);

  let next = updatePlayer(state, playerId, { money: player.money + refund });
  next = {
    ...next,
    properties: { ...next.properties, [position]: { ...prop, houses: prop.houses - 1 } },
    bank: wasHotel ? { houses: next.bank.houses - 4, hotels: next.bank.hotels + 1 } : { ...next.bank, houses: next.bank.houses + 1 },
  };
  return touch({ ...next, log: log(next, `${player.name} sold a building on ${space.name} for $${refund}.`) });
}

// ---------- Jail actions (outside of dice roll) ----------

export function payJailFine(state: GameState, playerId: string): GameState {
  const player = getPlayer(state, playerId);
  if (!player.inJail) throw new Error("Not in jail");
  if (player.money < 50) throw new Error("Not enough money");
  const next = updatePlayer(state, playerId, { money: player.money - 50, inJail: false, jailTurns: 0 });
  return touch({ ...next, log: log(next, `${player.name} paid $50 to get out of the County Lockup.`) });
}

export function useJailCard(state: GameState, playerId: string): GameState {
  const player = getPlayer(state, playerId);
  if (!player.inJail) throw new Error("Not in jail");
  if (player.getOutOfJailFreeCards < 1) throw new Error("No card to use");
  const next = updatePlayer(state, playerId, { inJail: false, jailTurns: 0, getOutOfJailFreeCards: player.getOutOfJailFreeCards - 1 });
  return touch({ ...next, log: log(next, `${player.name} used a Get Out of Lockup Free card.`) });
}

// ---------- Trading ----------

export function proposeTrade(state: GameState, trade: Omit<TradeOffer, "id" | "status">): GameState {
  const offer: TradeOffer = { ...trade, id: crypto.randomUUID(), status: "pending" };
  const from = getPlayer(state, trade.fromPlayerId);
  const to = getPlayer(state, trade.toPlayerId);
  return touch({ ...state, pendingTrade: offer, log: log(state, `${from.name} proposed a trade with ${to.name}.`) });
}

export function respondToTrade(state: GameState, accept: boolean): GameState {
  const trade = state.pendingTrade;
  if (!trade) throw new Error("No pending trade");
  if (!accept) {
    return touch({ ...state, pendingTrade: null, log: log(state, "Trade declined.") });
  }
  const from = getPlayer(state, trade.fromPlayerId);
  const to = getPlayer(state, trade.toPlayerId);
  if (from.money < trade.offerMoney) throw new Error("Offering player lacks funds");
  if (to.money < trade.requestMoney) throw new Error("Receiving player lacks funds");

  let next = state;
  next = updatePlayer(next, trade.fromPlayerId, {
    money: from.money - trade.offerMoney + trade.requestMoney,
    getOutOfJailFreeCards: from.getOutOfJailFreeCards - trade.offerJailCards + trade.requestJailCards,
  });
  next = updatePlayer(next, trade.toPlayerId, {
    money: to.money - trade.requestMoney + trade.offerMoney,
    getOutOfJailFreeCards: to.getOutOfJailFreeCards - trade.requestJailCards + trade.offerJailCards,
  });

  const properties = { ...next.properties };
  for (const pos of trade.offerProperties) properties[pos] = { ...properties[pos], ownerId: trade.toPlayerId };
  for (const pos of trade.requestProperties) properties[pos] = { ...properties[pos], ownerId: trade.fromPlayerId };

  next = { ...next, properties, pendingTrade: null };
  return touch({ ...next, log: log(next, `Trade completed between ${from.name} and ${to.name}.`) });
}

export function cancelTrade(state: GameState): GameState {
  return touch({ ...state, pendingTrade: null, log: log(state, "Trade cancelled.") });
}

// ---------- Bankruptcy & turn end ----------

function checkBankruptOrContinue(state: GameState, playerId: string, creditor: string | "bank"): GameState {
  const player = getPlayer(state, playerId);
  if (player.money >= 0) return { ...state, turnPhase: "awaiting-action" };
  return declareBankruptcy(state, playerId, creditor === "bank" ? null : creditor);
}

export function declareBankruptcy(state: GameState, playerId: string, creditorId: string | null): GameState {
  const player = getPlayer(state, playerId);
  let next = state;
  const properties = { ...next.properties };
  for (const pos of Object.keys(properties).map(Number)) {
    const prop = properties[pos];
    if (prop.ownerId === playerId) {
      properties[pos] = { ...prop, ownerId: creditorId, houses: 0, mortgaged: creditorId ? prop.mortgaged : false };
    }
  }
  next = { ...next, properties };
  if (creditorId) {
    const creditor = getPlayer(next, creditorId);
    next = updatePlayer(next, creditorId, { money: creditor.money + Math.max(0, player.money) });
  }
  next = updatePlayer(next, playerId, { money: 0, bankrupt: true });
  next = { ...next, log: log(next, `${player.name} went bankrupt${creditorId ? ` to ${getPlayer(next, creditorId).name}` : " to the bank"} and is out of the game.`) };

  const remaining = activePlayers(next);
  if (remaining.length === 1) {
    next = { ...next, phase: "ended", winnerId: remaining[0].id, turnPhase: "game-over" };
    next = { ...next, log: log(next, `${remaining[0].name} wins the game!`) };
  }
  return touch(next);
}

export function endTurn(state: GameState, playerId: string): GameState {
  const current = state.players[state.turnIndex];
  if (current.id !== playerId) throw new Error("Not your turn");
  if (state.turnPhase !== "awaiting-action") throw new Error("Resolve the current action first");

  // Extra roll on doubles (unless just released from jail this turn via doubles logic already handled).
  if (state.doublesCount > 0 && !current.inJail) {
    return touch({ ...state, turnPhase: "awaiting-roll", dice: null, log: log(state, `${current.name} rolled doubles and goes again.`) });
  }

  const nextIndex = nextActiveIndex(state, state.turnIndex);
  return touch({
    ...state,
    turnIndex: nextIndex,
    turnPhase: "awaiting-roll",
    dice: null,
    doublesCount: 0,
    log: log(state, `It's now ${state.players[nextIndex].name}'s turn.`),
  });
}
