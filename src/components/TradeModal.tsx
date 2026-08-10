import { useState } from "react";
import { BOARD } from "../shared/board";
import * as engine from "../shared/engine";
import type { GameState } from "../shared/types";

export default function TradeModal({
  state,
  myPlayerId,
  onClose,
  run,
}: {
  state: GameState;
  myPlayerId: string;
  onClose: () => void;
  run: (fn: (s: GameState) => GameState) => Promise<void>;
}) {
  const others = state.players.filter((p) => p.id !== myPlayerId && !p.bankrupt);
  const [toId, setToId] = useState(others[0]?.id || "");
  const [offerMoney, setOfferMoney] = useState(0);
  const [requestMoney, setRequestMoney] = useState(0);
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [requestProps, setRequestProps] = useState<number[]>([]);
  const [offerCard, setOfferCard] = useState(false);
  const [requestCard, setRequestCard] = useState(false);

  const me = state.players.find((p) => p.id === myPlayerId)!;
  const other = state.players.find((p) => p.id === toId);
  const myProps = BOARD.filter((s) => state.properties[s.position]?.ownerId === myPlayerId);
  const theirProps = BOARD.filter((s) => state.properties[s.position]?.ownerId === toId);

  function toggle(list: number[], setList: (v: number[]) => void, pos: number) {
    setList(list.includes(pos) ? list.filter((p) => p !== pos) : [...list, pos]);
  }

  async function submit() {
    if (!other) return;
    await run((s) =>
      engine.proposeTrade(s, {
        fromPlayerId: myPlayerId,
        toPlayerId: toId,
        offerMoney,
        requestMoney,
        offerProperties: offerProps,
        requestProperties: requestProps,
        offerJailCards: offerCard ? 1 : 0,
        requestJailCards: requestCard ? 1 : 0,
      })
    );
    onClose();
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>Propose a trade</div>

        <label style={styles.label}>Trade with</label>
        <select style={styles.select} value={toId} onChange={(e) => setToId(e.target.value)}>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div style={styles.columns}>
          <div style={styles.col}>
            <div style={styles.colHeader}>You give</div>
            <label style={styles.smallLabel}>Cash</label>
            <input style={styles.input} type="number" min={0} max={me.money} value={offerMoney} onChange={(e) => setOfferMoney(Number(e.target.value))} />
            {me.getOutOfJailFreeCards > 0 && (
              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={offerCard} onChange={(e) => setOfferCard(e.target.checked)} /> Jail-free card
              </label>
            )}
            <div style={styles.propPicker}>
              {myProps.map((s) => (
                <label key={s.position} style={styles.checkboxRow}>
                  <input type="checkbox" checked={offerProps.includes(s.position)} onChange={() => toggle(offerProps, setOfferProps, s.position)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div style={styles.col}>
            <div style={styles.colHeader}>You get</div>
            <label style={styles.smallLabel}>Cash</label>
            <input style={styles.input} type="number" min={0} max={other?.money || 0} value={requestMoney} onChange={(e) => setRequestMoney(Number(e.target.value))} />
            {(other?.getOutOfJailFreeCards || 0) > 0 && (
              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={requestCard} onChange={(e) => setRequestCard(e.target.checked)} /> Jail-free card
              </label>
            )}
            <div style={styles.propPicker}>
              {theirProps.map((s) => (
                <label key={s.position} style={styles.checkboxRow}>
                  <input type="checkbox" checked={requestProps.includes(s.position)} onChange={() => toggle(requestProps, setRequestProps, s.position)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button style={styles.primaryBtn} onClick={submit} disabled={!other}>
            Send offer
          </button>
        </div>
      </div>
    </div>
  );
}

export function PendingTradeBanner({
  state,
  myPlayerId,
  run,
}: {
  state: GameState;
  myPlayerId: string;
  run: (fn: (s: GameState) => GameState) => Promise<void>;
}) {
  const trade = state.pendingTrade;
  if (!trade) return null;
  const from = state.players.find((p) => p.id === trade.fromPlayerId);
  const to = state.players.find((p) => p.id === trade.toPlayerId);
  const isRecipient = trade.toPlayerId === myPlayerId;
  const offerNames = trade.offerProperties.map((pos) => BOARD.find((s) => s.position === pos)?.name).join(", ") || "nothing";
  const requestNames = trade.requestProperties.map((pos) => BOARD.find((s) => s.position === pos)?.name).join(", ") || "nothing";

  return (
    <div style={bannerStyles.banner}>
      <div>
        <strong>{from?.name}</strong> offers <strong>${trade.offerMoney}</strong> + {offerNames} to <strong>{to?.name}</strong> for{" "}
        <strong>${trade.requestMoney}</strong> + {requestNames}
      </div>
      {isRecipient && (
        <div style={{ display: "flex", gap: 8 }}>
          <button style={bannerStyles.acceptBtn} onClick={() => run((s) => engine.respondToTrade(s, true))}>
            Accept
          </button>
          <button style={bannerStyles.declineBtn} onClick={() => run((s) => engine.respondToTrade(s, false))}>
            Decline
          </button>
        </div>
      )}
      {trade.fromPlayerId === myPlayerId && !isRecipient && (
        <button style={bannerStyles.declineBtn} onClick={() => run((s) => engine.cancelTrade(s))}>
          Cancel offer
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 },
  modal: { background: "var(--felt)", border: "1px solid var(--line)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto" },
  title: { fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 16 },
  label: { display: "block", fontSize: 12, letterSpacing: "0.08em", color: "var(--parchment-dim)", marginBottom: 6, textTransform: "uppercase" },
  smallLabel: { display: "block", fontSize: 11, color: "var(--parchment-dim)", marginBottom: 4 },
  select: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(0,0,0,0.25)", color: "var(--parchment)", marginBottom: 16 },
  columns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  col: { background: "rgba(0,0,0,0.15)", borderRadius: 10, padding: 12 },
  colHeader: { fontSize: 12, fontWeight: 700, color: "var(--gold-bright)", marginBottom: 8, textTransform: "uppercase" },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(0,0,0,0.25)", color: "var(--parchment)", marginBottom: 8 },
  propPicker: { maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 },
  checkboxRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--parchment)" },
  buttonRow: { display: "flex", gap: 10, marginTop: 20 },
  primaryBtn: { flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: "var(--gold)", color: "#241a08", fontWeight: 700, cursor: "pointer" },
  secondaryBtn: { flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--line)", background: "transparent", color: "var(--parchment)", cursor: "pointer" },
};

const bannerStyles: Record<string, React.CSSProperties> = {
  banner: {
    background: "var(--gold)",
    color: "#241a08",
    padding: "10px 16px",
    borderRadius: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    fontSize: 13,
    flexWrap: "wrap",
  },
  acceptBtn: { padding: "6px 14px", borderRadius: 8, border: "none", background: "#241a08", color: "var(--gold-bright)", fontWeight: 700, cursor: "pointer" },
  declineBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid #241a08", background: "transparent", color: "#241a08", fontWeight: 700, cursor: "pointer" },
};
