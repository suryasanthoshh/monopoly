import { startGame } from "../shared/engine";
import { saveGame } from "../lib/gameStore";
import type { GameState } from "../shared/types";
import { MIN_PLAYERS, MAX_PLAYERS } from "../shared/types";

export default function Lobby({ state, myPlayerId }: { state: GameState; myPlayerId: string }) {
  const isHost = state.players.find((p) => p.id === myPlayerId)?.isHost;
  const canStart = state.players.length >= MIN_PLAYERS;

  async function handleStart() {
    const next = startGame(state);
    await saveGame(next);
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${state.code}`;
    navigator.clipboard?.writeText(url);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.eyebrow}>ROOM CODE</div>
        <div style={styles.code}>{state.code}</div>
        <button style={styles.linkBtn} onClick={copyLink}>
          Copy invite link
        </button>

        <div style={styles.playersHeader}>
          Players ({state.players.length}/{MAX_PLAYERS})
        </div>
        <ul style={styles.playerList}>
          {state.players.map((p) => (
            <li key={p.id} style={styles.playerRow}>
              <span style={{ ...styles.tokenBadge, background: `${p.color}33`, borderColor: p.color }}>{p.token}</span>
              <span style={styles.playerName}>{p.name}</span>
              {p.isHost && <span style={styles.hostTag}>HOST</span>}
              {p.id === myPlayerId && <span style={styles.youTag}>YOU</span>}
            </li>
          ))}
        </ul>

        {isHost ? (
          <button style={{ ...styles.primaryBtn, opacity: canStart ? 1 : 0.5 }} onClick={handleStart} disabled={!canStart}>
            {canStart ? "Start game" : `Need at least ${MIN_PLAYERS} players`}
          </button>
        ) : (
          <div style={styles.waiting}>Waiting for the host to start the game…</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { background: "var(--felt)", border: "1px solid var(--line)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 440 },
  eyebrow: { fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.2em", color: "var(--parchment-dim)" },
  code: { fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "0.1em", color: "var(--gold-bright)", margin: "6px 0 14px" },
  linkBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--parchment)",
    cursor: "pointer",
    fontSize: 13,
  },
  playersHeader: { marginTop: 28, marginBottom: 10, fontSize: 12, letterSpacing: "0.1em", color: "var(--parchment-dim)", textTransform: "uppercase" },
  playerList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 },
  playerRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 10 },
  tokenBadge: { width: 30, height: 30, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 },
  playerName: { fontWeight: 600, flex: 1 },
  hostTag: { fontSize: 10, letterSpacing: "0.08em", color: "var(--gold-bright)", border: "1px solid var(--gold)", padding: "2px 6px", borderRadius: 6 },
  youTag: { fontSize: 10, letterSpacing: "0.08em", color: "var(--parchment-dim)", border: "1px solid var(--line)", padding: "2px 6px", borderRadius: 6 },
  primaryBtn: { marginTop: 26, width: "100%", padding: "14px 0", borderRadius: 10, border: "none", background: "var(--gold)", color: "#241a08", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  waiting: { marginTop: 26, textAlign: "center", color: "var(--parchment-dim)", fontSize: 14 },
};
