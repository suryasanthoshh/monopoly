import { BOARD, COLOR_HEX } from "../shared/board";
import type { GameState } from "../shared/types";

function gridPos(position: number): { row: number; col: number } {
  if (position <= 10) return { row: 10, col: 10 - position };
  if (position <= 20) return { row: 10 - (position - 10), col: 0 };
  if (position <= 30) return { row: 0, col: position - 20 };
  return { row: position - 30, col: 10 };
}

export default function Board({
  state,
  selectedPosition,
  onSelectPosition,
}: {
  state: GameState;
  selectedPosition: number | null;
  onSelectPosition: (position: number) => void;
}) {
  return (
    <div style={styles.grid}>
      {BOARD.map((space) => {
        const { row, col } = gridPos(space.position);
        const isCorner = space.position % 10 === 0;
        const prop = state.properties[space.position];
        const owner = prop?.ownerId ? state.players.find((p) => p.id === prop.ownerId) : null;
        const tokensHere = state.players.filter((p) => !p.bankrupt && p.position === space.position);
        const selected = selectedPosition === space.position;

        return (
          <button
            key={space.position}
            onClick={() => onSelectPosition(space.position)}
            style={{
              ...styles.cell,
              gridRow: row + 1,
              gridColumn: col + 1,
              outline: selected ? "2px solid var(--gold-bright)" : "1px solid var(--line)",
              opacity: prop?.mortgaged ? 0.55 : 1,
            }}
            title={space.name}
          >
            {space.colorGroup && (
              <div style={{ ...styles.colorBar, background: COLOR_HEX[space.colorGroup] }} />
            )}
            <div style={{ ...styles.cellName, fontSize: isCorner ? 10 : 9 }}>{space.name}</div>
            {space.price && <div style={styles.cellPrice}>${space.price}</div>}
            {owner && (
              <div style={{ ...styles.ownerDot, background: owner.color }} title={`Owned by ${owner.name}`} />
            )}
            {prop && prop.houses > 0 && (
              <div style={styles.houseRow}>
                {prop.houses === 5 ? "🏨" : "🏠".repeat(prop.houses)}
              </div>
            )}
            {tokensHere.length > 0 && (
              <div style={styles.tokenRow}>
                {tokensHere.map((p) => (
                  <span key={p.id} style={styles.tokenChip} title={p.name}>
                    {p.token}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
      <div style={styles.center}>
        <div style={styles.centerTitle}>PROPERTY TABLE</div>
        <div style={styles.centerSub}>Meridian City</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
    gridTemplateRows: "repeat(11, minmax(0, 1fr))",
    gap: 2,
    background: "var(--felt)",
    border: "3px solid var(--gold)",
    borderRadius: 10,
    aspectRatio: "1 / 1",
    width: "100%",
    maxWidth: 720,
    padding: 4,
  },
  cell: {
    position: "relative",
    background: "var(--felt-light)",
    borderRadius: 4,
    padding: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    color: "var(--parchment)",
    cursor: "pointer",
    overflow: "hidden",
    minWidth: 0,
  },
  colorBar: { position: "absolute", top: 0, left: 0, right: 0, height: 6 },
  cellName: { fontWeight: 600, textAlign: "center", lineHeight: 1.1, marginTop: 8 },
  cellPrice: { fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--gold-bright)", marginTop: 2 },
  ownerDot: { width: 8, height: 8, borderRadius: "50%", marginTop: 2 },
  houseRow: { fontSize: 8, marginTop: 1 },
  tokenRow: { display: "flex", gap: 1, marginTop: "auto", flexWrap: "wrap", justifyContent: "center" },
  tokenChip: { fontSize: 11 },
  center: {
    gridRow: "2 / 11",
    gridColumn: "2 / 11",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at center, #1e4038 0%, #16302a 100%)",
    borderRadius: 8,
  },
  centerTitle: { fontFamily: "var(--font-display)", fontSize: "clamp(20px, 4vw, 34px)", color: "var(--gold-bright)", letterSpacing: "0.05em" },
  centerSub: { fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--parchment-dim)", marginTop: 6, letterSpacing: "0.15em" },
};
