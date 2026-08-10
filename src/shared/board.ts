import type { BoardSpace } from "./types";

// Fictional city "Meridian" — original names throughout, classic balance numbers.
export const BOARD: BoardSpace[] = [
  { position: 0, name: "Start", type: "go" },
  { position: 1, name: "Cannery Row", type: "property", colorGroup: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 },
  { position: 2, name: "Community Fund", type: "communityFund" },
  { position: 3, name: "Dockside Lane", type: "property", colorGroup: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 },
  { position: 4, name: "Income Tax", type: "tax", taxAmount: 200 },
  { position: 5, name: "Northline Transit", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { position: 6, name: "Willow Creek", type: "property", colorGroup: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { position: 7, name: "Wildcard", type: "wildcard" },
  { position: 8, name: "Maple Hollow", type: "property", colorGroup: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { position: 9, name: "Cedar Bend", type: "property", colorGroup: "lightblue", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60 },
  { position: 10, name: "County Lockup", type: "jail" },
  { position: 11, name: "Rosewood Ave", type: "property", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { position: 12, name: "Power & Light Co.", type: "utility", price: 150, mortgageValue: 75 },
  { position: 13, name: "Magnolia St", type: "property", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { position: 14, name: "Orchid Court", type: "property", colorGroup: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 },
  { position: 15, name: "Eastline Transit", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { position: 16, name: "Sunset Blvd", type: "property", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { position: 17, name: "Community Fund", type: "communityFund" },
  { position: 18, name: "Amber Way", type: "property", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { position: 19, name: "Copper Ridge", type: "property", colorGroup: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 },
  { position: 20, name: "Free Parking", type: "freeParking" },
  { position: 21, name: "Garnet St", type: "property", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { position: 22, name: "Wildcard", type: "wildcard" },
  { position: 23, name: "Ruby Lane", type: "property", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { position: 24, name: "Scarlet Ave", type: "property", colorGroup: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  { position: 25, name: "Southline Transit", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { position: 26, name: "Goldenrod Ave", type: "property", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { position: 27, name: "Saffron St", type: "property", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { position: 28, name: "Waterworks Co.", type: "utility", price: 150, mortgageValue: 75 },
  { position: 29, name: "Marigold Plaza", type: "property", colorGroup: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
  { position: 30, name: "Go to Lockup", type: "goToJail" },
  { position: 31, name: "Emerald Court", type: "property", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { position: 32, name: "Jade Terrace", type: "property", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { position: 33, name: "Community Fund", type: "communityFund" },
  { position: 34, name: "Clover Hill", type: "property", colorGroup: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  { position: 35, name: "Westline Transit", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { position: 36, name: "Wildcard", type: "wildcard" },
  { position: 37, name: "Sapphire Heights", type: "property", colorGroup: "darkblue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  { position: 38, name: "Luxury Tax", type: "tax", taxAmount: 100 },
  { position: 39, name: "Crown Point", type: "property", colorGroup: "darkblue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 },
];

export const COLOR_GROUPS: Record<string, number[]> = {};
for (const space of BOARD) {
  if (space.type === "property" && space.colorGroup) {
    COLOR_GROUPS[space.colorGroup] = COLOR_GROUPS[space.colorGroup] || [];
    COLOR_GROUPS[space.colorGroup].push(space.position);
  }
}

export const COLOR_HEX: Record<string, string> = {
  brown: "#7a4a3a",
  lightblue: "#a3d5f0",
  pink: "#e05fa0",
  orange: "#f0932b",
  red: "#e6402f",
  yellow: "#f2d43d",
  green: "#3fa34d",
  darkblue: "#2b5fa3",
};

export function spaceAt(position: number): BoardSpace {
  return BOARD[((position % 40) + 40) % 40];
}

export function ownedGroupComplete(
  colorGroup: string,
  properties: Record<number, { ownerId: string | null }>,
  ownerId: string
): boolean {
  const positions = COLOR_GROUPS[colorGroup] || [];
  return positions.every((pos) => properties[pos]?.ownerId === ownerId);
}
