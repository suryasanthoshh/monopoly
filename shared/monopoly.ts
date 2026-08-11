/**
 * Monopoly board and game constants.
 * Defines all 40 spaces, properties, cards, and rules.
 */

export const BOARD_SPACES = 40;
export const STARTING_CASH = 1500;
export const MAX_PLAYERS = 8;
export const MIN_PLAYERS = 2;

export const PLAYER_TOKENS = [
  "dog",
  "hat",
  "car",
  "iron",
  "ship",
  "thimble",
  "wheelbarrow",
  "shoe",
] as const;

export type PlayerToken = (typeof PLAYER_TOKENS)[number];

/**
 * Board space definitions.
 * Index 0-39 representing the 40 spaces on the board.
 */
export interface BoardSpace {
  index: number;
  name: string;
  type: "corner" | "street" | "railroad" | "utility" | "tax" | "card";
  color?: string; // Property color group
  purchasePrice?: number;
  rentBase?: number;
  rentWithHouse?: number[];
  rentWithHotel?: number;
  houseCost?: number;
  hotelCost?: number;
  mortgageValue?: number;
}

export const BOARD: Record<number, BoardSpace> = {
  0: { index: 0, name: "Go", type: "corner" },
  1: { index: 1, name: "Mediterranean Avenue", type: "street", color: "brown", purchasePrice: 60, rentBase: 2, rentWithHouse: [10, 30, 90, 160], rentWithHotel: 250, houseCost: 50, hotelCost: 50, mortgageValue: 30 },
  2: { index: 2, name: "Community Chest", type: "card" },
  3: { index: 3, name: "Baltic Avenue", type: "street", color: "brown", purchasePrice: 60, rentBase: 4, rentWithHouse: [20, 60, 180, 320], rentWithHotel: 450, houseCost: 50, hotelCost: 50, mortgageValue: 30 },
  4: { index: 4, name: "Income Tax", type: "tax" },
  5: { index: 5, name: "Reading Railroad", type: "railroad", purchasePrice: 200, mortgageValue: 100 },
  6: { index: 6, name: "Oriental Avenue", type: "street", color: "light-blue", purchasePrice: 100, rentBase: 6, rentWithHouse: [30, 90, 270, 400], rentWithHotel: 550, houseCost: 50, hotelCost: 50, mortgageValue: 50 },
  7: { index: 7, name: "Chance", type: "card" },
  8: { index: 8, name: "Vermont Avenue", type: "street", color: "light-blue", purchasePrice: 100, rentBase: 6, rentWithHouse: [30, 90, 270, 400], rentWithHotel: 550, houseCost: 50, hotelCost: 50, mortgageValue: 50 },
  9: { index: 9, name: "Connecticut Avenue", type: "street", color: "light-blue", purchasePrice: 120, rentBase: 8, rentWithHouse: [40, 120, 360, 500], rentWithHotel: 700, houseCost: 50, hotelCost: 50, mortgageValue: 60 },
  10: { index: 10, name: "Jail", type: "corner" },
  11: { index: 11, name: "St. Charles Place", type: "street", color: "pink", purchasePrice: 140, rentBase: 10, rentWithHouse: [50, 150, 450, 625], rentWithHotel: 750, houseCost: 100, hotelCost: 100, mortgageValue: 70 },
  12: { index: 12, name: "Electric Company", type: "utility", purchasePrice: 150, mortgageValue: 75 },
  13: { index: 13, name: "States Avenue", type: "street", color: "pink", purchasePrice: 140, rentBase: 10, rentWithHouse: [50, 150, 450, 625], rentWithHotel: 750, houseCost: 100, hotelCost: 100, mortgageValue: 70 },
  14: { index: 14, name: "Virginia Avenue", type: "street", color: "pink", purchasePrice: 160, rentBase: 12, rentWithHouse: [60, 180, 500, 700], rentWithHotel: 900, houseCost: 100, hotelCost: 100, mortgageValue: 80 },
  15: { index: 15, name: "Pennsylvania Railroad", type: "railroad", purchasePrice: 200, mortgageValue: 100 },
  16: { index: 16, name: "St. James Place", type: "street", color: "orange", purchasePrice: 180, rentBase: 14, rentWithHouse: [70, 200, 550, 750], rentWithHotel: 950, houseCost: 100, hotelCost: 100, mortgageValue: 90 },
  17: { index: 17, name: "Community Chest", type: "card" },
  18: { index: 18, name: "Tennessee Avenue", type: "street", color: "orange", purchasePrice: 180, rentBase: 14, rentWithHouse: [70, 200, 550, 750], rentWithHotel: 950, houseCost: 100, hotelCost: 100, mortgageValue: 90 },
  19: { index: 19, name: "New York Avenue", type: "street", color: "orange", purchasePrice: 200, rentBase: 16, rentWithHouse: [80, 220, 600, 800], rentWithHotel: 1000, houseCost: 100, hotelCost: 100, mortgageValue: 100 },
  20: { index: 20, name: "Free Parking", type: "corner" },
  21: { index: 21, name: "Kentucky Avenue", type: "street", color: "red", purchasePrice: 220, rentBase: 18, rentWithHouse: [90, 250, 700, 875], rentWithHotel: 1050, houseCost: 150, hotelCost: 150, mortgageValue: 110 },
  22: { index: 22, name: "Chance", type: "card" },
  23: { index: 23, name: "Indiana Avenue", type: "street", color: "red", purchasePrice: 220, rentBase: 18, rentWithHouse: [90, 250, 700, 875], rentWithHotel: 1050, houseCost: 150, hotelCost: 150, mortgageValue: 110 },
  24: { index: 24, name: "Illinois Avenue", type: "street", color: "red", purchasePrice: 240, rentBase: 20, rentWithHouse: [100, 300, 750, 925], rentWithHotel: 1100, houseCost: 150, hotelCost: 150, mortgageValue: 120 },
  25: { index: 25, name: "B&O Railroad", type: "railroad", purchasePrice: 200, mortgageValue: 100 },
  26: { index: 26, name: "Atlantic Avenue", type: "street", color: "yellow", purchasePrice: 260, rentBase: 22, rentWithHouse: [110, 330, 800, 975], rentWithHotel: 1150, houseCost: 150, hotelCost: 150, mortgageValue: 130 },
  27: { index: 27, name: "Ventnor Avenue", type: "street", color: "yellow", purchasePrice: 260, rentBase: 22, rentWithHouse: [110, 330, 800, 975], rentWithHotel: 1150, houseCost: 150, hotelCost: 150, mortgageValue: 130 },
  28: { index: 28, name: "Water Works", type: "utility", purchasePrice: 150, mortgageValue: 75 },
  29: { index: 29, name: "Marvin Gardens", type: "street", color: "yellow", purchasePrice: 280, rentBase: 24, rentWithHouse: [120, 360, 850, 1025], rentWithHotel: 1200, houseCost: 150, hotelCost: 150, mortgageValue: 140 },
  30: { index: 30, name: "Go to Jail", type: "corner" },
  31: { index: 31, name: "Pacific Avenue", type: "street", color: "green", purchasePrice: 300, rentBase: 26, rentWithHouse: [130, 390, 900, 1100], rentWithHotel: 1275, houseCost: 200, hotelCost: 200, mortgageValue: 150 },
  32: { index: 32, name: "North Carolina Avenue", type: "street", color: "green", purchasePrice: 300, rentBase: 26, rentWithHouse: [130, 390, 900, 1100], rentWithHotel: 1275, houseCost: 200, hotelCost: 200, mortgageValue: 150 },
  33: { index: 33, name: "Community Chest", type: "card" },
  34: { index: 34, name: "Pennsylvania Avenue", type: "street", color: "green", purchasePrice: 320, rentBase: 28, rentWithHouse: [150, 450, 1000, 1200], rentWithHotel: 1500, houseCost: 200, hotelCost: 200, mortgageValue: 160 },
  35: { index: 35, name: "Short Line", type: "railroad", purchasePrice: 200, mortgageValue: 100 },
  36: { index: 36, name: "Chance", type: "card" },
  37: { index: 37, name: "Park Place", type: "street", color: "blue", purchasePrice: 350, rentBase: 35, rentWithHouse: [175, 500, 1100, 1300], rentWithHotel: 1500, houseCost: 200, hotelCost: 200, mortgageValue: 175 },
  38: { index: 38, name: "Luxury Tax", type: "tax" },
  39: { index: 39, name: "Boardwalk", type: "street", color: "blue", purchasePrice: 400, rentBase: 50, rentWithHouse: [200, 600, 1400, 1700], rentWithHotel: 2000, houseCost: 200, hotelCost: 200, mortgageValue: 200 },
};

/**
 * Property color groups and their properties.
 */
export const COLOR_GROUPS: Record<string, number[]> = {
  brown: [1, 3],
  "light-blue": [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  blue: [37, 39],
  railroad: [5, 15, 25, 35],
  utility: [12, 28],
};

/**
 * Chance card effects.
 * 16 cards total in a standard Monopoly deck.
 */
export interface ChanceCard {
  id: number;
  name: string;
  description: string;
  effect: (playerIndex: number) => void;
}

export const CHANCE_CARDS = [
  { id: 0, name: "Advance to Go", description: "Advance to Go (Collect $200)" },
  { id: 1, name: "Advance to Illinois Avenue", description: "Advance to Illinois Avenue" },
  { id: 2, name: "Advance to St. Charles Place", description: "Advance to St. Charles Place" },
  { id: 3, name: "Advance to nearest Railroad", description: "Advance to the nearest Railroad" },
  { id: 4, name: "Advance to nearest Utility", description: "Advance to the nearest Utility" },
  { id: 5, name: "Go back 3 spaces", description: "Go back 3 spaces" },
  { id: 6, name: "Go to Jail", description: "Go directly to Jail" },
  { id: 7, name: "Get Out of Jail Free", description: "Get Out of Jail Free Card" },
  { id: 8, name: "Make general repairs", description: "Make general repairs on all your properties" },
  { id: 9, name: "Pay poor tax", description: "Pay poor tax of $15" },
  { id: 10, name: "Take a trip to Reading Railroad", description: "Take a trip to Reading Railroad" },
  { id: 11, name: "You have won a crossword competition", description: "You have won a crossword competition. Collect $100" },
  { id: 12, name: "Your building and loan matures", description: "Your building and loan matures. Collect $150" },
  { id: 13, name: "You are assessed for street repairs", description: "You are assessed for street repairs" },
  { id: 14, name: "Speeding fine", description: "Speeding fine. Pay $15" },
  { id: 15, name: "Bank error in your favor", description: "Bank error in your favor. Collect $200" },
];

/**
 * Community Chest card effects.
 * 16 cards total in a standard Monopoly deck.
 */
export interface CommunityChestCard {
  id: number;
  name: string;
  description: string;
}

export const COMMUNITY_CHEST_CARDS = [
  { id: 0, name: "Advance to Go", description: "Advance to Go (Collect $200)" },
  { id: 1, name: "Bank error in your favor", description: "Bank error in your favor. Collect $200" },
  { id: 2, name: "Doctor's fees", description: "Doctor's fees. Pay $50" },
  { id: 3, name: "From sale of stock", description: "From sale of stock you have $50" },
  { id: 4, name: "Get Out of Jail Free", description: "Get Out of Jail Free Card" },
  { id: 5, name: "Go to Jail", description: "Go directly to Jail" },
  { id: 6, name: "Grand Opera Night", description: "Grand Opera Night. Collect $50 from every player" },
  { id: 7, name: "Holiday fund matures", description: "Holiday fund matures. Collect $100" },
  { id: 8, name: "Income tax refund", description: "Income tax refund. Collect $20" },
  { id: 9, name: "It is your birthday", description: "It is your birthday. Collect $10 from every player" },
  { id: 10, name: "Life insurance matures", description: "Life insurance matures. Collect $100" },
  { id: 11, name: "Pay hospital fees", description: "Pay hospital fees of $100" },
  { id: 12, name: "Pay school fees", description: "Pay school fees of $50" },
  { id: 13, name: "Receive for services", description: "Receive for services $25" },
  { id: 14, name: "You have won second prize", description: "You have won second prize in a beauty contest. Collect $10" },
  { id: 15, name: "You inherit", description: "You inherit $100" },
];

/**
 * Tax amounts.
 */
export const INCOME_TAX = 200; // Player can choose to pay $200 or 10% of total assets
export const LUXURY_TAX = 100;

/**
 * Jail constants.
 */
export const JAIL_SPACE = 10;
export const GO_TO_JAIL_SPACE = 30;
export const JAIL_BAIL = 50;
export const MAX_JAIL_TURNS = 3;

/**
 * Building constants.
 */
export const MAX_HOUSES_IN_BANK = 32;
export const MAX_HOTELS_IN_BANK = 12;
export const HOUSES_PER_PROPERTY = 4;
export const HOUSES_PER_HOTEL = 4; // Must sell 4 houses to build a hotel

/**
 * Get rent for a property based on current state.
 */
export function calculateRent(
  spaceIndex: number,
  diceTotal: number,
  ownedProperties: Map<number, { houses: number; hotels: number; isMortgaged: boolean }>,
  colorGroupOwnership: Map<string, boolean> // true if player owns all in group
): number {
  const space = BOARD[spaceIndex];
  if (!space || !space.purchasePrice) return 0;

  const propState = ownedProperties.get(spaceIndex);
  if (!propState || propState.isMortgaged) return 0;

  if (space.type === "railroad") {
    // Count how many railroads the owner has
    const railroadsOwned = Array.from(ownedProperties.entries())
      .filter(([idx]) => BOARD[idx]?.type === "railroad" && !ownedProperties.get(idx)?.isMortgaged)
      .length;
    return 25 * Math.pow(2, railroadsOwned - 1);
  }

  if (space.type === "utility") {
    // Rent is 4x or 10x the dice roll
    const utilitiesOwned = Array.from(ownedProperties.entries())
      .filter(([idx]) => BOARD[idx]?.type === "utility" && !ownedProperties.get(idx)?.isMortgaged)
      .length;
    const multiplier = utilitiesOwned === 1 ? 4 : 10;
    return diceTotal * multiplier;
  }

  if (space.type === "street") {
    let baseRent = space.rentBase || 0;

    // Double rent if owner has all properties in color group
    if (colorGroupOwnership.get(space.color || "")) {
      baseRent *= 2;
    }

    // Add house/hotel rent
    if (propState.hotels > 0 && space.rentWithHotel) {
      return space.rentWithHotel;
    }

    if (propState.houses > 0 && space.rentWithHouse) {
      return space.rentWithHouse[propState.houses - 1] || baseRent;
    }

    return baseRent;
  }

  return 0;
}

/**
 * Check if a player owns all properties in a color group.
 */
export function ownsColorGroup(
  colorGroup: string,
  ownedProperties: Map<number, number | null> // spaceIndex -> ownerId
): boolean {
  const spacesInGroup = COLOR_GROUPS[colorGroup] || [];
  return spacesInGroup.every((spaceIdx) => ownedProperties.has(spaceIdx));
}
