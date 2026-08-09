import { useState } from "react";
import Board from "./Board";
import PlayersPanel from "./PlayersPanel";
import ActionPanel from "./ActionPanel";
import TradeModal, { PendingTradeBanner } from "./TradeModal";
import { saveGame } from "../lib/gameStore";
import type { GameState } from "../shared/types";

export default function Game({ state, myPlayerId }: { state: GameState; myPlayerId: string }) {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: (s: GameState) => GameState) {
    try {
      const next = fn(state);
      await saveGame(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setTimeout(() => setError(null), 4000);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.roomCode}>Room {state.code}</div>
        {error && <div style={styles.errorToast}>{error}</div>}
      </div>

      <PendingTradeBanner state={state} myPlayerId={myPlayerId} run={run} />

      <div className="game-layout">
        <div style={styles.left}>
          <PlayersPanel state={state} myPlayerId={myPlayerId} />
        </div>
        <div style={styles.center}>
          <Board state={state} selectedPosition={selectedPosition} onSelectPosition={setSelectedPosition} />
        </div>
        <div style={styles.right}>
          <ActionPanel state={state} myPlayerId={myPlayerId} selectedPosition={selectedPosition} run={run} onOpenTrade={() => setTradeOpen(true)} />
        </div>
      </div>

      {tradeOpen && <TradeModal state={state} myPlayerId={myPlayerId} onClose={() => setTradeOpen(false)} run={run} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100%", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  roomCode: { fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--parchment-dim)", letterSpacing: "0.1em" },
  errorToast: { background: "var(--danger)", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 13 },
  left: { minHeight: 0 },
  center: { display: "flex", alignItems: "flex-start", justifyContent: "center" },
  right: { minHeight: 0 },
};
