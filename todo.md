# Monopoly Pro - Development TODO

## Database & Schema
- [ ] Create Drizzle schema for games, players, properties, cards, transactions
- [ ] Generate and apply migrations to MySQL

## Game Engine Core
- [ ] Implement game state manager (turns, phases, player order)
- [ ] Dice rolling logic with doubles and three-doubles-to-jail
- [ ] Property purchase and auction system
- [ ] Rent calculation with color sets, houses, hotels
- [ ] Mortgage and unmortgage system with 10% interest
- [ ] Housing and hotel placement with bank limits (32 houses, 12 hotels)
- [ ] Trading system with proposal/acceptance flow
- [ ] Jail mechanics (landing, rolling doubles, paying, using cards)
- [ ] Chance and Community Chest card decks and effects
- [ ] Bankruptcy detection and asset liquidation
- [ ] Game end condition (last player standing)

## Socket.IO & Real-time Sync
- [ ] Set up Socket.IO server with room management
- [ ] Implement game state broadcast on every action
- [ ] Handle player disconnection and reconnection
- [ ] Sync game state to database after critical actions

## Backend (tRPC Routers)
- [ ] Create game room management (create, join, leave, list)
- [ ] Implement game action procedures (roll dice, buy property, trade, etc.)
- [ ] Add player query procedures
- [ ] Implement game history and replay data

## Frontend - Lobby & Setup
- [ ] Create lobby page with room creation/joining UI
- [ ] Implement player token selection
- [ ] Add player list display with ready status
- [ ] Create "Start Game" button with validation

## Frontend - Board & Game UI
- [ ] Render 40-space Monopoly board with all properties
- [ ] Implement animated player tokens on board
- [ ] Create property detail cards (color, owner, rent, houses)
- [ ] Add dice rolling animation and results display
- [ ] Implement player turn indicator and phase display

## Frontend - Game Panels (Tabs)
- [ ] Create Properties tab (owned properties, building UI)
- [ ] Create Trading tab (propose/accept trades)
- [ ] Create Jail tab (pay, use card, roll)
- [ ] Create Cards tab (Chance, Community Chest, Get Out of Jail Free)
- [ ] Create Transactions tab (payment history, mortgages)
- [ ] Create Player Info tab (cash, properties, status)

## Frontend - Modals & Interactions
- [ ] Property purchase modal (buy or auction)
- [ ] Auction bidding modal
- [ ] Trade proposal modal
- [ ] Mortgage/unmortgage modal
- [ ] House/hotel building modal
- [ ] Bankruptcy confirmation modal

## Polish & Testing
- [ ] Test full game flow with multiple players
- [ ] Verify all Monopoly rules are correctly enforced
- [ ] Test Socket.IO reconnection and state sync
- [ ] Test database persistence across server restarts
- [ ] Optimize UI performance and animations
- [ ] Add error handling and user feedback (toasts)

## Deployment
- [ ] Create Docker configuration
- [ ] Test on Umbrel server
- [ ] Configure Surge tunnel for external access
