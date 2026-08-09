// Core domain types shared between all game logic and UI.

export type SpaceType =
  | "go"
  | "property"
  | "railroad"
  | "utility"
  | "tax"
  | "wildcard" // Chance-equivalent
  | "communityFund" // Community Chest-equivalent
  | "jail"
  | "freeParking"
  | "goToJail";

export interface BoardSpace {
  position: number; // 0-39
  name: string;
  type: SpaceType;
  colorGroup?: string; // for properties
  price?: number;
  rent?: number[]; // [base, 1house,2,3,4,hotel] for property; [1 owned,2,3,4] for railroad
  houseCost?: number;
  mortgageValue?: number;
  taxAmount?: number;
}

export type CardEffect =
  | { kind: "move"; to: number; collectGoIfPassed?: boolean }
  | { kind: "moveRelative"; spaces: number }
  | { kind: "moveToNearest"; type: "railroad" | "utility" }
  | { kind: "collect"; amount: number }
  | { kind: "pay"; amount: number }
  | { kind: "payEachPlayer"; amount: number }
  | { kind: "collectFromEachPlayer"; amount: number }
  | { kind: "goToJail" }
  | { kind: "getOutOfJailFree" }
  | { kind: "repairs"; perHouse: number; perHotel: number };

export interface Card {
  id: string;
  text: string;
  effect: CardEffect;
}

export interface Player {
  id: string;
  name: string;
  token: string; // emoji or short label
  color: string;
  position: number;
  money: number;
  inJail: boolean;
  jailTurns: number;
  getOutOfJailFreeCards: number;
  bankrupt: boolean;
  isHost: boolean;
}

export interface PropertyState {
  position: number;
  ownerId: string | null;
  houses: number; // 0-4, 5 means hotel
  mortgaged: boolean;
}

export interface AuctionState {
  position: number;
  highestBid: number;
  highestBidderId: string | null;
  activeBidderIds: string[]; // players still eligible to bid (haven't passed)
  turnBidderId: string;
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offerMoney: number;
  offerProperties: number[];
  requestMoney: number;
  requestProperties: number[];
  offerJailCards: number;
  requestJailCards: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export type TurnPhase =
  | "awaiting-roll"
  | "awaiting-purchase-decision"
  | "in-auction"
  | "awaiting-action" // post-move, can buy houses/mortgage/trade/end turn
  | "jail-decision"
  | "game-over";

export interface GameState {
  code: string;
  phase: "lobby" | "playing" | "ended";
  players: Player[];
  properties: Record<number, PropertyState>;
  turnIndex: number;
  turnPhase: TurnPhase;
  dice: [number, number] | null;
  doublesCount: number;
  pendingAuction: AuctionState | null;
  pendingTrade: TradeOffer | null;
  wildcardDeck: string[]; // remaining card ids, shuffled
  communityFundDeck: string[];
  log: LogEntry[];
  bank: { houses: number; hotels: number };
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  text: string;
  ts: string;
}

export const STARTING_MONEY = 1500;
export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;
export const SALARY = 200;
export const TOTAL_HOUSES = 32;
export const TOTAL_HOTELS = 12;
