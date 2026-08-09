import { BOARD } from "../shared/board";
import type { GameState } from "../shared/types";

export default function PlayersPanel({ state, myPlayerId }: { state: GameState; myPlayerId: string }) {
  const current = state.players[state.turnIndex];
  return (
    <div style={styles.panel}>
      <div style={styles.header}>Players</div>
      <div style={styles.list}>
        {state.players.map((p) => {
          const owned = BOARD.filter((s) => state.properties[s.position]?.ownerId === p.id);
          const isTurn = current?.id === p.id && state.phase === "playing";
          return (
            <div key={p.id} style={{ ...styles.row, opacity: p.bankrupt ? 0.4 : 1, borderColor: isTurn ? p.color : "var(--line)" }}>
              <div style={styles.rowTop}>
                <span style={{ ...styles.badge, background: `${p.color}33`, borderColor: p.color }}>{p.token}</span>
                <span style={styles.name}>
                  {p.name}
                  {p.id === myPlayerId ? " (you)" : ""}
                </span>
                {isTurn && <span style={styles.turnTag}>TURN</span>}
                {p.bankrupt && <span style={styles.bankruptTag}>OUT</span>}
              </div>
              <div style={styles.money} className="mono">
                ${p.money.toLocaleString()}
                {p.inJail && <span style={styles.jailTag}> · in lockup</span>}
                {p.getOutOfJailFreeCards > 0 && <span style={styles.jailTag}> · {p.getOutOfJailFreeCards} jail card(s)</span>}
              </div>
              {owned.length > 0 && (
                <div style={styles.propList}>
                  {owned.map((s) => (
                    <span key={s.position} style={styles.propChip}>
                      {s.name}
                      {state.properties[s.position].mortgaged ? " (mortgaged)" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: "var(--felt)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, height: "100%", overflowY: "auto" },
  header: { fontSize: 12, letterSpacing: "0.1em", color: "var(--parchment-dim)", textTransform: "uppercase", marginBottom: 10 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: { border: "1px solid var(--line)", borderRadius: 10, padding: 10, background: "rgba(0,0,0,0.15)" },
  rowTop: { display: "flex", alignItems: "center", gap: 8 },
  badge: { width: 24, height: 24, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 },
  name: { fontWeight: 600, flex: 1, fontSize: 14 },
  turnTag: { fontSize: 10, letterSpacing: "0.08em", color: "var(--ink)", background: "var(--gold-bright)", padding: "2px 6px", borderRadius: 6, fontWeight: 700 },
  bankruptTag: { fontSize: 10, letterSpacing: "0.08em", color: "var(--danger)", border: "1px solid var(--danger)", padding: "2px 6px", borderRadius: 6 },
  money: { fontSize: 15, color: "var(--gold-bright)", marginTop: 4 },
  jailTag: { fontSize: 11, color: "var(--parchment-dim)" },
  propList: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 },
  propChip: { fontSize: 10, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 6, color: "var(--parchment-dim)" },
};
