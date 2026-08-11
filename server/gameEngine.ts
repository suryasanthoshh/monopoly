/**
 * Core Monopoly game engine.
 * Implements all official Monopoly rules and game logic.
 */

import {
  BOARD,
  BOARD_SPACES,
  COLOR_GROUPS,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  INCOME_TAX,
  LUXURY_TAX,
  JAIL_SPACE,
  GO_TO_JAIL_SPACE,
  JAIL_BAIL,
  MAX_JAIL_TURNS,
  MAX_HOUSES_IN_BANK,
  MAX_HOTELS_IN_BANK,
  HOUSES_PER_HOTEL,
  calculateRent,
  ownsColorGroup,
} from "@shared/monopoly";

export interface GamePlayer {
  id: number;
  userId: number;
  token: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailFreeCards: number;
  isEliminated: boolean;
  order: number;
}

export interface PropertyState {
  spaceIndex: number;
  ownerId: number | null;
  isMortgaged: boolean;
  houses: number;
  hotels: number;
}

export interface GameState {
  gameId: number;
  roomCode: string;
  status: "waiting" | "active" | "finished";
  players: GamePlayer[];
  properties: PropertyState[];
  currentPlayerIndex: number;
  currentPhase: "roll" | "move" | "action" | "buy" | "auction" | "end_turn";
  doubleRolled: boolean;
  consecutiveDoubles: number;
  lastDiceRoll: { die1: number; die2: number } | null;
  housesInBank: number;
  hotelsInBank: number;
  winner: number | null;
  turnHistory: string[];
}

/**
 * Initialize a new game state.
 */
export function initializeGameState(
  gameId: number,
  roomCode: string,
  players: Omit<GamePlayer, "cash" | "position" | "inJail" | "jailTurns" | "getOutOfJailFreeCards" | "isEliminated">[]
): GameState {
  const initializedPlayers: GamePlayer[] = players.map((p) => ({
    ...p,
    cash: 1500,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailFreeCards: 0,
    isEliminated: false,
  }));

  const properties: PropertyState[] = Array.from({ length: BOARD_SPACES }, (_, i) => ({
    spaceIndex: i,
    ownerId: null,
    isMortgaged: false,
    houses: 0,
    hotels: 0,
  }));

  return {
    gameId,
    roomCode,
    status: "active",
    players: initializedPlayers,
    properties,
    currentPlayerIndex: 0,
    currentPhase: "roll",
    doubleRolled: false,
    consecutiveDoubles: 0,
    lastDiceRoll: null,
    housesInBank: MAX_HOUSES_IN_BANK,
    hotelsInBank: MAX_HOTELS_IN_BANK,
    winner: null,
    turnHistory: [],
  };
}

/**
 * Roll two dice.
 */
export function rollDice(): { die1: number; die2: number } {
  return {
    die1: Math.floor(Math.random() * 6) + 1,
    die2: Math.floor(Math.random() * 6) + 1,
  };
}

/**
 * Move a player on the board.
 * Handles passing Go, landing on spaces, etc.
 */
export function movePlayer(
  state: GameState,
  playerIndex: number,
  spaces: number
): { newPosition: number; passedGo: boolean } {
  const player = state.players[playerIndex];
  if (!player) throw new Error("Player not found");

  let newPosition = player.position + spaces;
  let passedGo = false;

  if (newPosition >= BOARD_SPACES) {
    newPosition -= BOARD_SPACES;
    passedGo = true;
    player.cash += 200; // Collect $200 for passing Go
  }

  player.position = newPosition;
  return { newPosition, passedGo };
}

/**
 * Send a player to jail.
 */
export function sendToJail(state: GameState, playerIndex: number): void {
  const player = state.players[playerIndex];
  if (!player) throw new Error("Player not found");

  player.position = JAIL_SPACE;
  player.inJail = true;
  player.jailTurns = 0;
}

/**
 * Release a player from jail.
 */
export function releaseFromJail(state: GameState, playerIndex: number): void {
  const player = state.players[playerIndex];
  if (!player) throw new Error("Player not found");

  player.inJail = false;
  player.jailTurns = 0;
}

/**
 * Handle landing on a space.
 * Returns actions needed (e.g., "buy_property", "pay_rent", "draw_card").
 */
export function handleLanding(
  state: GameState,
  playerIndex: number
): { action: string; details?: any } {
  const player = state.players[playerIndex];
  const space = BOARD[player.position];

  if (!space) return { action: "none" };

  // Check if landed on Go to Jail
  if (player.position === GO_TO_JAIL_SPACE) {
    sendToJail(state, playerIndex);
    return { action: "go_to_jail" };
  }

  // Handle different space types
  switch (space.type) {
    case "street":
    case "railroad":
    case "utility": {
      const property = state.properties[player.position];
      if (!property || !property.ownerId) {
        // Unowned property - offer to buy
        return { action: "buy_property", details: { price: space.purchasePrice } };
      } else if (property.ownerId !== playerIndex) {
        // Owned by another player - pay rent
        const owner = state.players.find((p) => p.id === property.ownerId);
        if (!owner) return { action: "none" };

        const diceTotal = (state.lastDiceRoll?.die1 || 0) + (state.lastDiceRoll?.die2 || 0);
        const ownedByPlayer = new Map(
          state.properties
            .filter((p) => p.ownerId === property.ownerId)
            .map((p) => [p.spaceIndex, { houses: p.houses, hotels: p.hotels, isMortgaged: p.isMortgaged }])
        );

        const colorGroup = space.color || "";
        const ownsAll = ownsColorGroup(colorGroup, new Map(state.properties.map((p) => [p.spaceIndex, p.ownerId])));

        const rent = calculateRent(player.position, diceTotal, ownedByPlayer, new Map([[colorGroup, ownsAll]]));

        return { action: "pay_rent", details: { amount: rent, toPlayerId: property.ownerId } };
      }
      break;
    }

    case "tax": {
      const amount = player.position === 4 ? INCOME_TAX : LUXURY_TAX;
      return { action: "pay_tax", details: { amount } };
    }

    case "card": {
      const isChance = player.position === 7 || player.position === 22 || player.position === 36;
      return { action: "draw_card", details: { cardType: isChance ? "chance" : "community_chest" } };
    }

    case "corner": {
      if (player.position === 0) {
        // Go - already collected $200 when passing
        return { action: "none" };
      } else if (player.position === 10) {
        // Jail - just visiting
        return { action: "none" };
      } else if (player.position === 20) {
        // Free Parking - do nothing
        return { action: "none" };
      }
      break;
    }
  }

  return { action: "none" };
}

/**
 * Purchase a property.
 */
export function purchaseProperty(
  state: GameState,
  playerIndex: number,
  spaceIndex: number,
  price: number
): boolean {
  const player = state.players[playerIndex];
  if (!player || player.cash < price) return false;

  const property = state.properties[spaceIndex];
  if (!property || property.ownerId !== null) return false;

  player.cash -= price;
  property.ownerId = player.id;

  return true;
}

/**
 * Start an auction for a property.
 */
export function startAuction(
  state: GameState,
  spaceIndex: number,
  startingBid: number = 1
): { action: string; details: { spaceIndex: number; startingBid: number } } {
  return {
    action: "auction",
    details: { spaceIndex, startingBid },
  };
}

/**
 * Build a house on a property.
 */
export function buildHouse(
  state: GameState,
  playerIndex: number,
  spaceIndex: number
): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const property = state.properties[spaceIndex];
  const space = BOARD[spaceIndex];

  if (!player || !property || !space) return { success: false, error: "Invalid player or property" };

  if (property.ownerId !== player.id) return { success: false, error: "You don't own this property" };

  if (property.isMortgaged) return { success: false, error: "Property is mortgaged" };

  if (property.hotels > 0) return { success: false, error: "Property already has a hotel" };

  if (property.houses >= HOUSES_PER_HOTEL) return { success: false, error: "Cannot build more houses" };

  const houseCost = space.houseCost || 0;
  if (player.cash < houseCost) return { success: false, error: "Insufficient funds" };

  if (state.housesInBank <= 0) return { success: false, error: "No houses available in bank" };

  // Check if player owns all properties in color group
  const colorGroup = space.color || "";
  const ownsAll = ownsColorGroup(colorGroup, new Map(state.properties.map((p) => [p.spaceIndex, p.ownerId])));

  if (!ownsAll) return { success: false, error: "You must own all properties in this color group" };

  player.cash -= houseCost;
  property.houses += 1;
  state.housesInBank -= 1;

  return { success: true };
}

/**
 * Build a hotel on a property.
 */
export function buildHotel(
  state: GameState,
  playerIndex: number,
  spaceIndex: number
): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const property = state.properties[spaceIndex];
  const space = BOARD[spaceIndex];

  if (!player || !property || !space) return { success: false, error: "Invalid player or property" };

  if (property.ownerId !== player.id) return { success: false, error: "You don't own this property" };

  if (property.isMortgaged) return { success: false, error: "Property is mortgaged" };

  if (property.houses < HOUSES_PER_HOTEL) return { success: false, error: "Must have 4 houses to build a hotel" };

  if (property.hotels > 0) return { success: false, error: "Property already has a hotel" };

  const hotelCost = space.hotelCost || 0;
  if (player.cash < hotelCost) return { success: false, error: "Insufficient funds" };

  if (state.hotelsInBank <= 0) return { success: false, error: "No hotels available in bank" };

  player.cash -= hotelCost;
  property.houses = 0;
  property.hotels = 1;
  state.housesInBank += HOUSES_PER_HOTEL;
  state.hotelsInBank -= 1;

  return { success: true };
}

/**
 * Mortgage a property.
 */
export function mortgageProperty(
  state: GameState,
  playerIndex: number,
  spaceIndex: number
): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const property = state.properties[spaceIndex];
  const space = BOARD[spaceIndex];

  if (!player || !property || !space) return { success: false, error: "Invalid player or property" };

  if (property.ownerId !== player.id) return { success: false, error: "You don't own this property" };

  if (property.isMortgaged) return { success: false, error: "Property is already mortgaged" };

  if (property.houses > 0 || property.hotels > 0) {
    return { success: false, error: "Must sell all houses/hotels before mortgaging" };
  }

  const mortgageValue = space.mortgageValue || 0;
  player.cash += mortgageValue;
  property.isMortgaged = true;

  return { success: true };
}

/**
 * Unmortgage a property.
 */
export function unmortgageProperty(
  state: GameState,
  playerIndex: number,
  spaceIndex: number
): { success: boolean; error?: string } {
  const player = state.players[playerIndex];
  const property = state.properties[spaceIndex];
  const space = BOARD[spaceIndex];

  if (!player || !property || !space) return { success: false, error: "Invalid player or property" };

  if (property.ownerId !== player.id) return { success: false, error: "You don't own this property" };

  if (!property.isMortgaged) return { success: false, error: "Property is not mortgaged" };

  const mortgageValue = space.mortgageValue || 0;
  const unmortgageCost = Math.ceil(mortgageValue * 1.1); // 10% interest

  if (player.cash < unmortgageCost) return { success: false, error: "Insufficient funds" };

  player.cash -= unmortgageCost;
  property.isMortgaged = false;

  return { success: true };
}

/**
 * Pay money to another player.
 */
export function payPlayer(
  state: GameState,
  fromPlayerIndex: number,
  toPlayerId: number,
  amount: number
): { success: boolean; error?: string } {
  const fromPlayer = state.players[fromPlayerIndex];
  const toPlayer = state.players.find((p) => p.id === toPlayerId);

  if (!fromPlayer || !toPlayer) return { success: false, error: "Player not found" };

  if (fromPlayer.cash < amount) {
    return { success: false, error: "Insufficient funds" };
  }

  fromPlayer.cash -= amount;
  toPlayer.cash += amount;

  return { success: true };
}

/**
 * Check if a player is bankrupt and eliminate them if so.
 */
export function checkBankruptcy(state: GameState, playerIndex: number): boolean {
  const player = state.players[playerIndex];
  if (!player || player.cash >= 0) return false;

  // Liquidate all assets
  let liquidatedValue = 0;

  // Sell all houses and hotels
  state.properties.forEach((prop) => {
    if (prop.ownerId === player.id) {
      const space = BOARD[prop.spaceIndex];
      if (space) {
        if (prop.hotels > 0) {
          liquidatedValue += (space.hotelCost || 0) / 2;
          state.hotelsInBank += 1;
          state.housesInBank += HOUSES_PER_HOTEL;
        } else if (prop.houses > 0) {
          liquidatedValue += ((space.houseCost || 0) / 2) * prop.houses;
          state.housesInBank += prop.houses;
        }
        prop.houses = 0;
        prop.hotels = 0;
      }
    }
  });

  // Mortgage all remaining properties
  state.properties.forEach((prop) => {
    if (prop.ownerId === player.id && !prop.isMortgaged) {
      const space = BOARD[prop.spaceIndex];
      if (space) {
        liquidatedValue += space.mortgageValue || 0;
        prop.isMortgaged = true;
      }
    }
  });

  player.cash += liquidatedValue;

  if (player.cash < 0) {
    player.isEliminated = true;
    return true;
  }

  return false;
}

/**
 * End the current turn and move to the next player.
 */
export function endTurn(state: GameState): void {
  const activePlayers = state.players.filter((p) => !p.isEliminated);

  if (activePlayers.length <= 1) {
    state.status = "finished";
    state.winner = activePlayers[0]?.id || null;
    return;
  }

  // Move to next active player
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  while (state.players[nextIndex]?.isEliminated) {
    nextIndex = (nextIndex + 1) % state.players.length;
  }

  state.currentPlayerIndex = nextIndex;
  state.currentPhase = "roll";
  state.doubleRolled = false;
  state.consecutiveDoubles = 0;
  state.lastDiceRoll = null;
}

/**
 * Get current player.
 */
export function getCurrentPlayer(state: GameState): GamePlayer | null {
  return state.players[state.currentPlayerIndex] || null;
}

/**
 * Get all properties owned by a player.
 */
export function getPlayerProperties(state: GameState, playerId: number): PropertyState[] {
  return state.properties.filter((p) => p.ownerId === playerId);
}

/**
 * Calculate total net worth of a player (cash + property value).
 */
export function calculateNetWorth(state: GameState, playerId: number): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;

  let worth = player.cash;

  state.properties.forEach((prop) => {
    if (prop.ownerId === playerId) {
      const space = BOARD[prop.spaceIndex];
      if (space) {
        if (prop.isMortgaged) {
          worth += (space.mortgageValue || 0) * 0.5; // Mortgaged property worth 50% of mortgage value
        } else {
          worth += space.mortgageValue || 0;
          if (prop.hotels > 0) {
            worth += (space.hotelCost || 0) * 0.5;
          } else if (prop.houses > 0) {
            worth += ((space.houseCost || 0) * 0.5) * prop.houses;
          }
        }
      }
    }
  });

  return worth;
}
