CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`cardType` enum('chance','community_chest') NOT NULL,
	`cardIndex` int NOT NULL,
	`hasBeenDrawn` boolean NOT NULL DEFAULT false,
	`drawnBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diceRolls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`playerId` int NOT NULL,
	`die1` int NOT NULL,
	`die2` int NOT NULL,
	`isDouble` boolean NOT NULL,
	`totalSpaces` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diceRolls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(8) NOT NULL,
	`createdBy` int NOT NULL,
	`status` enum('waiting','active','finished') NOT NULL DEFAULT 'waiting',
	`currentPlayerIndex` int NOT NULL DEFAULT 0,
	`currentPhase` enum('roll','move','action','buy','auction','end_turn') NOT NULL DEFAULT 'roll',
	`doubleRolled` boolean NOT NULL DEFAULT false,
	`consecutiveDoubles` int NOT NULL DEFAULT 0,
	`gameState` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`finishedAt` timestamp,
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_roomCode_unique` UNIQUE(`roomCode`),
	CONSTRAINT `roomCode_idx` UNIQUE(`roomCode`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`userId` int NOT NULL,
	`playerIndex` int NOT NULL,
	`token` enum('dog','hat','car','iron','ship','thimble','wheelbarrow','shoe') NOT NULL,
	`cash` decimal(10,2) NOT NULL DEFAULT '1500.00',
	`position` int NOT NULL DEFAULT 0,
	`inJail` boolean NOT NULL DEFAULT false,
	`jailTurns` int NOT NULL DEFAULT 0,
	`getOutOfJailFreeCards` int NOT NULL DEFAULT 0,
	`isEliminated` boolean NOT NULL DEFAULT false,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`spaceIndex` int NOT NULL,
	`ownerId` int,
	`isMortgaged` boolean NOT NULL DEFAULT false,
	`houses` int NOT NULL DEFAULT 0,
	`hotels` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`proposerId` int NOT NULL,
	`responderId` int NOT NULL,
	`status` enum('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`proposedData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`respondedAt` timestamp,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`playerId` int NOT NULL,
	`type` enum('rent_paid','rent_received','property_purchased','property_mortgaged','property_unmortgaged','house_built','hotel_built','house_sold','hotel_sold','card_effect','tax_paid','go_collected','trade_sent','trade_received','bankruptcy_payment') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`relatedPlayerId` int,
	`relatedPropertyId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `gameId_idx` ON `cards` (`gameId`);--> statement-breakpoint
CREATE INDEX `gameId_idx` ON `diceRolls` (`gameId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `games` (`status`);--> statement-breakpoint
CREATE INDEX `gameId_idx` ON `players` (`gameId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `players` (`userId`);--> statement-breakpoint
CREATE INDEX `gameId_idx` ON `properties` (`gameId`);--> statement-breakpoint
CREATE INDEX `spaceIndex_idx` ON `properties` (`spaceIndex`);--> statement-breakpoint
CREATE INDEX `gameId_idx` ON `trades` (`gameId`);--> statement-breakpoint
CREATE INDEX `gameId_idx` ON `transactions` (`gameId`);--> statement-breakpoint
CREATE INDEX `playerId_idx` ON `transactions` (`playerId`);