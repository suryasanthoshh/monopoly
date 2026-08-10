import { useState } from "react";
import { createGame, addPlayer } from "../shared/engine";
import { createGameRow, fetchGame, saveGame, randomRoomCode, getOrCreatePlayerIdForRoom, getStoredPlayerName, storePlayerName } from "../lib/gameStore";

const TOKENS = ["🚗", "🎩", "🐕", "🚀", "⚓", "🎸", "🦊", "🏛️"];
const COLORS = ["#e6402f", "#2b5fa3", "#3fa34d", "#f0932b", "#8e5fd6", "#e05fa0", "#c9a24b", "#4ac2c2"];

export default function Home({ onEnterRoom }: { onEnterRoom: (code: string) => void }) {
  const [name, setName] = useState(getStoredPlayerName());
  const [joinCode, setJoinCode] = useState("");
  const [tokenIdx, setTokenIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name first.");
    setBusy(true);
    setError(null);
    try {
      storePlayerName(name.trim());
      const code = randomRoomCode();
      const playerId = getOrCreatePlayerIdForRoom(code);
      const state = createGame(code, { id: playerId, name: name.trim(), token: TOKENS[tokenIdx], color: COLORS[tokenIdx] });
      await createGameRow(state);
      onEnterRoom(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the game.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!name.trim()) return setError("Enter your name first.");
    if (!code) return setError("Enter a room code.");
    setBusy(true);
    setError(null);
    try {
      storePlayerName(name.trim());
      const existing = await fetchGame(code);
      if (!existing) return setError("No game found with that code.");
      const playerId = getOrCreatePlayerIdForRoom(code);
      const alreadyIn = existing.players.some((p) => p.id === playerId);
      if (!alreadyIn) {
        if (existing.phase !== "lobby") {
          setError("That game has already started.");
          return;
        }
        const usedColors = new Set(existing.players.map((p) => p.color));
        const freeIdx = COLORS.findIndex((c) => !usedColors.has(c));
        const idx = freeIdx === -1 ? existing.players.length % COLORS.length : freeIdx;
        const nextState = addPlayer(existing, { id: playerId, name: name.trim(), token: TOKENS[idx], color: COLORS[idx] });
        await saveGame(nextState);
      }
      onEnterRoom(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't join the game.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.eyebrow}>A PROPERTY-TRADING PARTY GAME</div>
        <h1 style={styles.title}>PROPERTY TABLE</h1>
        <p style={styles.sub}>Buy blocks, build up Meridian, and bankrupt your friends. 2–8 players, one browser tab each.</p>
      </div>

      <div style={styles.card}>
        <label style={styles.label}>Your name</label>
        <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam" maxLength={20} />

        <label style={styles.label}>Your token</label>
        <div style={styles.tokenRow}>
          {TOKENS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTokenIdx(i)}
              style={{
                ...styles.tokenBtn,
                borderColor: i === tokenIdx ? COLORS[i] : "transparent",
                background: i === tokenIdx ? `${COLORS[i]}33` : "rgba(255,255,255,0.04)",
              }}
              aria-pressed={i === tokenIdx}
              aria-label={`Token ${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.primaryBtn} onClick={handleCreate} disabled={busy}>
          Create new game
        </button>

        <div style={styles.divider}>
          <span>or join one</span>
        </div>

        <div style={styles.joinRow}>
          <input
            style={{ ...styles.input, flex: 1, textTransform: "uppercase", letterSpacing: "0.15em" }}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="ROOM CODE"
            maxLength={5}
          />
          <button style={styles.secondaryBtn} onClick={handleJoin} disabled={busy}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    background: "radial-gradient(ellipse at top, #1f2933 0%, #14181c 70%)",
  },
  hero: { textAlign: "center", maxWidth: 520, marginBottom: 36 },
  eyebrow: { fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--gold-bright)", marginBottom: 10 },
  title: { fontFamily: "var(--font-display)", fontSize: "clamp(36px, 7vw, 56px)", margin: 0, letterSpacing: "0.02em" },
  sub: { color: "var(--parchment-dim)", fontSize: 16, lineHeight: 1.5, marginTop: 14 },
  card: {
    background: "var(--felt)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  },
  label: { display: "block", fontSize: 12, letterSpacing: "0.08em", color: "var(--parchment-dim)", marginBottom: 8, marginTop: 18, textTransform: "uppercase" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "rgba(0,0,0,0.25)",
    color: "var(--parchment)",
    fontSize: 15,
  },
  tokenRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  tokenBtn: { fontSize: 22, padding: "10px 0", borderRadius: 10, border: "2px solid transparent", cursor: "pointer" },
  primaryBtn: {
    marginTop: 24,
    width: "100%",
    padding: "14px 0",
    borderRadius: 10,
    border: "none",
    background: "var(--gold)",
    color: "#241a08",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "0 20px",
    borderRadius: 10,
    border: "1px solid var(--gold)",
    background: "transparent",
    color: "var(--gold-bright)",
    fontWeight: 700,
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "22px 0 16px",
    color: "var(--parchment-dim)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  joinRow: { display: "flex", gap: 10 },
  error: { color: "var(--danger)", fontSize: 13, marginTop: 14 },
};
