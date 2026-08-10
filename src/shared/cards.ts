import type { Card } from "./types";

// Original, paraphrased flavor text — not copied from any existing game.
export const WILDCARD_CARDS: Card[] = [
  { id: "w1", text: "Advance to Start. Collect your salary.", effect: { kind: "move", to: 0, collectGoIfPassed: false } },
  { id: "w2", text: "Advance to Crown Point.", effect: { kind: "move", to: 39, collectGoIfPassed: true } },
  { id: "w3", text: "Advance to Sunset Blvd. If you pass Start, collect your salary.", effect: { kind: "move", to: 16, collectGoIfPassed: true } },
  { id: "w4", text: "Advance to the nearest Transit Line. Pay double the usual rent.", effect: { kind: "moveToNearest", type: "railroad" } },
  { id: "w5", text: "Advance to the nearest Utility. If unowned, you may buy it. If owned, pay 10x the dice roll.", effect: { kind: "moveToNearest", type: "utility" } },
  { id: "w6", text: "A dividend arrives. Collect $50.", effect: { kind: "collect", amount: 50 } },
  { id: "w7", text: "Redeem this card to get out of the County Lockup free. Keep it until needed.", effect: { kind: "getOutOfJailFree" } },
  { id: "w8", text: "Go back three spaces.", effect: { kind: "moveRelative", spaces: -3 } },
  { id: "w9", text: "Go directly to the County Lockup. Do not pass Start.", effect: { kind: "goToJail" } },
  { id: "w10", text: "Fund a neighborhood improvement. Pay $25 per house and $100 per hotel you own.", effect: { kind: "repairs", perHouse: 25, perHotel: 100 } },
  { id: "w11", text: "You're elected chair of the board. Pay each player $50.", effect: { kind: "payEachPlayer", amount: 50 } },
  { id: "w12", text: "Your bonds mature. Collect $150.", effect: { kind: "collect", amount: 150 } },
  { id: "w13", text: "A speeding fine arrives. Pay $15.", effect: { kind: "pay", amount: 15 } },
  { id: "w14", text: "Advance to Rosewood Ave.", effect: { kind: "move", to: 11, collectGoIfPassed: true } },
  { id: "w15", text: "Building loan matures. Collect $150.", effect: { kind: "collect", amount: 150 } },
  { id: "w16", text: "Advance to Garnet St.", effect: { kind: "move", to: 21, collectGoIfPassed: true } },
];

export const COMMUNITY_FUND_CARDS: Card[] = [
  { id: "c1", text: "Advance to Start. Collect your salary.", effect: { kind: "move", to: 0, collectGoIfPassed: false } },
  { id: "c2", text: "A bank error works in your favor. Collect $200.", effect: { kind: "collect", amount: 200 } },
  { id: "c3", text: "A checkup runs long. Pay $50.", effect: { kind: "pay", amount: 50 } },
  { id: "c4", text: "You sell back stock. Collect $50.", effect: { kind: "collect", amount: 50 } },
  { id: "c5", text: "Redeem this card to get out of the County Lockup free. Keep it until needed.", effect: { kind: "getOutOfJailFree" } },
  { id: "c6", text: "Go directly to the County Lockup. Do not pass Start.", effect: { kind: "goToJail" } },
  { id: "c7", text: "A community grant arrives. Collect $100.", effect: { kind: "collect", amount: 100 } },
  { id: "c8", text: "Community fund matures. Collect $25 from every player.", effect: { kind: "collectFromEachPlayer", amount: 25 } },
  { id: "c9", text: "You take first place in a contest. Collect $10.", effect: { kind: "collect", amount: 10 } },
  { id: "c10", text: "An inheritance arrives. Collect $100.", effect: { kind: "collect", amount: 100 } },
  { id: "c11", text: "Pay your annual dues. Pay $100.", effect: { kind: "pay", amount: 100 } },
  { id: "c12", text: "Property repairs come due. Pay $40 per house and $115 per hotel you own.", effect: { kind: "repairs", perHouse: 40, perHotel: 115 } },
  { id: "c13", text: "A gift arrives on your birthday. Collect $10 from every player.", effect: { kind: "collectFromEachPlayer", amount: 10 } },
  { id: "c14", text: "A tax refund arrives. Collect $20.", effect: { kind: "collect", amount: 20 } },
  { id: "c15", text: "Hospital bills come due. Pay $100.", effect: { kind: "pay", amount: 100 } },
  { id: "c16", text: "Your savings mature. Collect $100.", effect: { kind: "collect", amount: 100 } },
];

export function shuffledDeck(cards: Card[]): string[] {
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function findCard(id: string): Card {
  const card = [...WILDCARD_CARDS, ...COMMUNITY_FUND_CARDS].find((c) => c.id === id);
  if (!card) throw new Error(`Unknown card id ${id}`);
  return card;
}
