# Property Table

A full-stack, Monopoly-compatible multiplayer property trading game for 2-8 players.

It uses original UI and paraphrased card text rather than Hasbro artwork, logos, or copied card prose. The rules engine models the classic rule set: property buying, required auctions, rent, color sets, houses, hotels, trading, mortgages, jail, Chance, Community Chest, debts, bankruptcy, and persistent game state.

## Recommended Stack

- React + Vite + TypeScript for the Surge-hosted static frontend.
- Node.js 24 + Express + Socket.IO for authoritative realtime multiplayer.
- Node's built-in SQLite bindings for persistence without native npm database packages.
- Docker Compose on Umbrel or Portainer with a named volume for durable game data.

Surge should host only the static frontend. The API/WebSocket backend needs to run on Umbrel and must be reachable from browsers that load the Surge site.

## Local Development

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3000`

The Vite dev server proxies `/api` and `/socket.io` to the backend.

## Production Build

```bash
npm run build
npm run server
```

The backend serves `dist/` when it exists, so the Docker container can serve both the API and the built app.

## Docker / Umbrel

```bash
docker compose up -d --build
```

The default compose file exposes the app on host port `3000` and persists SQLite in the `monopoly-data` named volume.

For Umbrel, deploy the compose stack through Portainer or adapt it into an Umbrel app. Set:

```bash
MONOPOLY_PORT=3000
CORS_ORIGIN=https://your-surge-site.surge.sh
```

If the backend is not public, the Surge frontend can only connect from devices that can reach the Umbrel backend URL, such as through your LAN, VPN, Tailscale, reverse proxy, or tunnel.

## Surge Frontend

Build the frontend with the backend URL baked in:

```bash
VITE_API_URL=https://your-umbrel-backend.example.com npm run build
npx surge dist your-table.surge.sh
```

You can also enter the backend URL on the lobby screen; it is saved in browser local storage.

## Environment

Copy `.env.example` to `.env` for local overrides.

```bash
PORT=3000
DATABASE_PATH=./data/monopoly.sqlite
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=
```

## Notes

- Game codes are short room codes; player identity is stored in browser local storage.
- The server is authoritative and saves the full game state after every successful action.
- House and hotel inventory is finite. Asset commands are validated server-side.
- For public distribution, replace trademarked board/property names with your own themed board data in `src/shared/board.ts`.
