# Property Table

A full-rules, Monopoly-compatible multiplayer property trading game for 2–8 players. Original board, card, and UI content — no Hasbro names, art, or copied text.

Rules implemented: buying, required auctions on decline, rent (including full color-set doubling), houses & hotels with the even-building rule, mortgaging, jail (pay/roll/card), Wildcard & Community Fund draw decks, trading, and bankruptcy with asset transfer.

## Stack

- **Frontend**: React + Vite + TypeScript, deployed as a static site (Vercel or Netlify).
- **Backend**: Supabase — Postgres stores one row per game (`state` as `jsonb`), Realtime pushes updates to every connected player.
- **No custom server.** The game logic in `src/shared/engine.ts` runs in the browser of whichever player takes an action; the result is written to Supabase and broadcast to everyone else. This is the right tradeoff for a casual game among friends — see the note at the top of `engine.ts` if you ever need a tamper-proof authoritative server instead (move the same functions into a Supabase Edge Function).

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run everything in [`supabase/schema.sql`](supabase/schema.sql). This creates the `games` table, sets Row Level Security policies (open access gated only by room code — no accounts needed), and enables Realtime on the table.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **Publishable key** (Supabase's newer key naming; if you see `anon` / `public` instead, that's the same key under the old naming).

## 2. Configure the frontend

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Open a second tab (or share the room code with a friend) to test multiplayer — moves sync live via Supabase Realtime.

## 4. Deploy

Push this repo to GitHub, then import it into **Vercel** or **Netlify**:

- Build command: `npm run build`
- Output directory: `dist`
- Add the two `VITE_SUPABASE_*` env vars in the project's dashboard settings.

Deploy — you'll get a live `*.vercel.app` / `*.netlify.app` URL immediately, with free HTTPS.

## 5. Connect your own domain

Buy a domain (Cloudflare Registrar is usually cheapest with no markup), then in Vercel/Netlify's **Domains** settings add it and follow the DNS records they give you (usually a CNAME). Propagation is typically minutes to a few hours.

## How a game works

1. One player creates a game from the home screen — this generates a 5-character room code and writes the first row to Supabase.
2. Others join with that code. The host starts the game once 2+ players are in.
3. Everyone's browser subscribes to `postgres_changes` on that room's row, so every action (roll, buy, trade, bankruptcy, etc.) appears live for all players.
4. Identity is a random ID stored in `localStorage`, scoped per room code — reloading the page keeps you as the same player.

## Extending it

- `src/shared/board.ts` — board layout, prices, rents, color groups.
- `src/shared/cards.ts` — Wildcard / Community Fund deck text and effects.
- `src/shared/engine.ts` — all rules. Every function is a pure `(GameState) => GameState` reducer, so it's straightforward to unit test or port into an Edge Function later.
- `src/components/` — UI. `Board.tsx` renders the 40 spaces in a CSS grid; `ActionPanel.tsx` drives turn actions; `TradeModal.tsx` handles trade proposals.

## Known simplifications

- Client-authoritative (see stack note above) — fine for playing with people you trust.
- No spectator mode — every participant is a player.
- No reconnect-to-a-different-device support (identity is tied to the browser that joined).
