import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Game room/session table.
 * Represents a single Monopoly game instance.
 */
export const games = mysqlTable(
  "games",
  {
    id: int("id").autoincrement().primaryKey(),
    roomCode: varchar("roomCode", { length: 8 }).notNull().unique(),
    createdBy: int("createdBy").notNull(), // user id
    status: mysqlEnum("status", ["waiting", "active", "finished"]).default("waiting").notNull(),
    currentPlayerIndex: int("currentPlayerIndex").default(0).notNull(),
    currentPhase: mysqlEnum("currentPhase", [
      "roll",
      "move",
      "action",
      "buy",
      "auction",
      "end_turn",
    ]).default("roll").notNull(),
    doubleRolled: boolean("doubleRolled").default(false).notNull(),
    consecutiveDoubles: int("consecutiveDoubles").default(0).notNull(),
    gameState: json("gameState").notNull(), // Full game state snapshot
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    finishedAt: timestamp("finishedAt"),
  },
  (table) => ({
    roomCodeIdx: uniqueIndex("roomCode_idx").on(table.roomCode),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Player in a game.
 * Each game has 2-8 players.
 */
export const players = mysqlTable(
  "players",
  {
    id: int("id").autoincrement().primaryKey(),
    gameId: int("gameId").notNull(),
    userId: int("userId").notNull(),
    playerIndex: int("playerIndex").notNull(), // 0-7
    token: mysqlEnum("token", [
      "dog",
      "hat",
      "car",
      "iron",
      "ship",
      "thimble",
      "wheelbarrow",
      "shoe",
    ]).notNull(),
    cash: decimal("cash", { precision: 10, scale: 2 }).default("1500.00").notNull(),
    position: int("position").default(0).notNull(), // 0-39 on board
    inJail: boolean("inJail").default(false).notNull(),
    jailTurns: int("jailTurns").default(0).notNull(), // 0-3
    getOutOfJailFreeCards: int("getOutOfJailFreeCards").default(0).notNull(),
    isEliminated: boolean("isEliminated").default(false).notNull(),
    order: int("order").notNull(), // Turn order
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    gameIdIdx: index("gameId_idx").on(table.gameId),
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Property ownership and state.
 * Represents each of the 40 board spaces that can be owned.
 */
export const properties = mysqlTable(
  "properties",
  {
    id: int("id").autoincrement().primaryKey(),
    gameId: int("gameId").notNull(),
    spaceIndex: int("spaceIndex").notNull(), // 0-39
    ownerId: int("ownerId"), // player id, null if unowned
    isMortgaged: boolean("isMortgaged").default(false).notNull(),
    houses: int("houses").default(0).notNull(), // 0-4 (4 = hotel)
    hotels: int("hotels").default(0).notNull(), // 0-1
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    gameIdIdx: index("gameId_idx").on(table.gameId),
    spaceIdxIdx: index("spaceIndex_idx").on(table.spaceIndex),
  })
);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Card instances (Chance and Community Chest).
 * Tracks which cards have been drawn and their state.
 */
export const cards = mysqlTable(
  "cards",
  {
    id: int("id").autoincrement().primaryKey(),
    gameId: int("gameId").notNull(),
    cardType: mysqlEnum("cardType", ["chance", "community_chest"]).notNull(),
    cardIndex: int("cardIndex").notNull(), // 0-15 for each deck
    hasBeenDrawn: boolean("hasBeenDrawn").default(false).notNull(),
    drawnBy: int("drawnBy"), // player id who drew it
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    gameIdIdx: index("gameId_idx").on(table.gameId),
  })
);

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

/**
 * Transaction log for audit trail and game history.
 * Records all money movements, property transfers, etc.
 */
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    gameId: int("gameId").notNull(),
    playerId: int("playerId").notNull(),
    type: mysqlEnum("type", [
      "rent_paid",
      "rent_received",
      "property_purchased",
      "property_mortgaged",
      "property_unmortgaged",
      "house_built",
      "hotel_built",
      "house_sold",
      "hotel_sold",
      "card_effect",
      "tax_paid",
      "go_collected",
      "trade_sent",
      "trade_received",
      "bankruptcy_payment",
    ]).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    relatedPlayerId: int("relatedPlayerId"), // Other player involved (if any)
    relatedPropertyId: int("relatedPropertyId"), // Property involved (if any)
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    gameIdIdx: index("gameId_idx").on(table.gameId),
    playerIdIdx: index("playerId_idx").on(table.playerId),
  })
);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Trade proposals between players.
 */
export const trades = mysqlTable(
  "trades",
  {
    id: int("id").autoincrement().primaryKey(),
    gameId: int("gameId").notNull(),
    proposerId: int("proposerId").notNull(), // player proposing
    responderId: int("responderId").notNull(), // player responding
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "cancelled"]).default("pending").notNull(),
    proposedData: json("proposedData").notNull(), // { proposerGives: {...}, responderGives: {...} }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    respondedAt: timestamp("respondedAt"),
  },
  (table) => ({
    gameIdIdx: index("gameId_idx").on(table.gameId),
  })
);

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Dice roll history for audit and debugging.
 */
export const diceRolls = mysqlTable(
  "diceRolls",
  {
    id: int("id").autoincrement().primaryKey(),
    gameId: int("gameId").notNull(),
    playerId: int("playerId").notNull(),
    die1: int("die1").notNull(), // 1-6
    die2: int("die2").notNull(), // 1-6
    isDouble: boolean("isDouble").notNull(),
    totalSpaces: int("totalSpaces").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    gameIdIdx: index("gameId_idx").on(table.gameId),
  })
);

export type DiceRoll = typeof diceRolls.$inferSelect;
export type InsertDiceRoll = typeof diceRolls.$inferInsert;
