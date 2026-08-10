import { useState } from "react";
import { spaceAt } from "../shared/board";
import * as engine from "../shared/engine";
import type { GameState } from "../shared/types";

export default function ActionPanel({
  state,
  myPlayerId,
  selectedPosition,
  run,
  onOpenTrade,
}: {
  state: GameState;
  myPlayerId: string;
  selectedPosition: number | null;
  run: (fn: (s: GameState) => GameState) => Promise<void>;
  onOpenTrade: () => void;
}) {
  const [bidAmount, setBidAmount] = useState("");
  const me = state.players.find((p) => p.id === myPlayerId)!;
  const current = state.players[state.turnIndex];
  const isMyTurn = current?.id === myPlayerId;

  const selectedSpace = selectedPosition !== null ? spaceAt(selectedPosition) : null;
  const selectedProp = selectedPosition !== null ? state.properties[selectedPosition] : null;
  const iOwnSelected = selectedProp?.ownerId === myPlayerId;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        {state.phase === "ended" ? "Game over" : isMyTurn ? "Your turn" : `${current?.name}'s turn`}
      </div>

      {state.phase === "ended" && (
        <div style={styles.winner}>🏆 {state.players.find((p) => p.id === state.winnerId)?.name} wins!</div>
      )}

      {state.phase === "playing" && (
        <>
          {state.dice && (
            <div style={styles.dice}>
              🎲 {state.dice[0]} + {state.dice[1]} = {state.dice[0] + state.dice[1]}
            </div>
          )}

          {isMyTurn && state.turnPhase === "awaiting-roll" && !me.inJail && (
            <button style={styles.primaryBtn} onClick={() => run((s) => engine.rollDice(s, myPlayerId))}>
              Roll dice
            </button>
          )}

          {isMyTurn && state.turnPhase === "awaiting-roll" && me.inJail && (
            <div style={styles.jailBox}>
              <div style={styles.jailText}>You're in the County Lockup (attempt {me.jailTurns}/3).</div>
              <button style={styles.primaryBtn} onClick={() => run((s) => engine.rollDice(s, myPlayerId))}>
                Try to roll doubles
              </button>
              <button style={styles.secondaryBtn} onClick={() => run((s) => engine.payJailFine(s, myPlayerId))} disabled={me.money < 50}>
                Pay $50 to get out
              </button>
              {me.getOutOfJailFreeCards > 0 && (
                <button style={styles.secondaryBtn} onClick={() => run((s) => engine.useJailCard(s, myPlayerId))}>
                  Use Get Out of Lockup Free card
                </button>
              )}
            </div>
          )}

          {isMyTurn && state.turnPhase === "awaiting-purchase-decision" && (
            <div style={styles.purchaseBox}>
              <div style={styles.jailText}>
                Buy {spaceAt(current.position).name} for ${spaceAt(current.position).price}?
              </div>
              <button style={styles.primaryBtn} onClick={() => run((s) => engine.buyProperty(s, myPlayerId))} disabled={me.money < (spaceAt(current.position).price || 0)}>
                Buy
              </button>
              <button style={styles.secondaryBtn} onClick={() => run((s) => engine.declinePurchaseAndAuction(s, myPlayerId))}>
                Decline &amp; auction
              </button>
            </div>
          )}

          {state.turnPhase === "in-auction" && state.pendingAuction && (
            <AuctionBox state={state} myPlayerId={myPlayerId} bidAmount={bidAmount} setBidAmount={setBidAmount} run={run} />
          )}

          {isMyTurn && state.turnPhase === "awaiting-action" && (
            <div style={styles.actionGrid}>
              <button style={styles.secondaryBtn} onClick={onOpenTrade}>
                Propose trade
              </button>
              <button style={styles.endBtn} onClick={() => run((s) => engine.endTurn(s, myPlayerId))}>
                {state.doublesCount > 0 ? "Roll again (doubles)" : "End turn"}
              </button>
            </div>
          )}

          {selectedSpace && selectedProp && (
            <PropertyControls
              space={selectedSpace}
              position={selectedPosition!}
              prop={selectedProp}
              iOwn={iOwnSelected}
              me={me}
              run={run}
              myPlayerId={myPlayerId}
            />
          )}
        </>
      )}

      <div style={styles.logHeader}>Game log</div>
      <div style={styles.log}>
        {[...state.log].reverse().map((entry) => (
          <div key={entry.id} style={styles.logLine}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuctionBox({
  state,
  myPlayerId,
  bidAmount,
  setBidAmount,
  run,
}: {
  state: GameState;
  myPlayerId: string;
  bidAmount: string;
  setBidAmount: (v: string) => void;
  run: (fn: (s: GameState) => GameState) => Promise<void>;
}) {
  const auction = state.pendingAuction!;
  const space = spaceAt(auction.position);
  const myTurn = auction.turnBidderId === myPlayerId;
  const leader = auction.highestBidderId ? state.players.find((p) => p.id === auction.highestBidderId)?.name : null;

  return (
    <div style={styles.purchaseBox}>
      <div style={styles.jailText}>
        Auction: {space.name} — current bid ${auction.highestBid}
        {leader ? ` (${leader})` : " (no bids yet)"}
      </div>
      {myTurn ? (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={styles.bidInput}
              type="number"
              min={auction.highestBid + 1}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`> $${auction.highestBid}`}
            />
            <button
              style={styles.secondaryBtn}
              onClick={() => {
                const amt = parseInt(bidAmount, 10);
                if (!Number.isNaN(amt)) run((s) => engine.placeBid(s, myPlayerId, amt)).then(() => setBidAmount(""));
              }}
            >
              Bid
            </button>
          </div>
          <button style={styles.secondaryBtn} onClick={() => run((s) => engine.passBid(s, myPlayerId))}>
            Pass
          </button>
        </>
      ) : (
        <div style={styles.jailText}>Waiting on {state.players.find((p) => p.id === auction.turnBidderId)?.name}…</div>
      )}
    </div>
  );
}

function PropertyControls({
  space,
  position,
  prop,
  iOwn,
  me,
  run,
  myPlayerId,
}: {
  space: ReturnType<typeof spaceAt>;
  position: number;
  prop: GameState["properties"][number];
  iOwn: boolean;
  me: GameState["players"][number];
  run: (fn: (s: GameState) => GameState) => Promise<void>;
  myPlayerId: string;
}) {
  if (!iOwn) return null;
  return (
    <div style={styles.propControls}>
      <div style={styles.logHeader}>{space.name}</div>
      {space.type === "property" && !prop.mortgaged && (
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.tinyBtn} onClick={() => run((s) => engine.buildHouse(s, myPlayerId, position))}>
            Build (+{prop.houses < 4 ? "house" : "hotel"})
          </button>
          {prop.houses > 0 && (
            <button style={styles.tinyBtn} onClick={() => run((s) => engine.sellHouse(s, myPlayerId, position))}>
              Sell building
            </button>
          )}
        </div>
      )}
      {prop.houses === 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {!prop.mortgaged ? (
            <button style={styles.tinyBtn} onClick={() => run((s) => engine.mortgageProperty(s, myPlayerId, position))}>
              Mortgage
            </button>
          ) : (
            <button style={styles.tinyBtn} onClick={() => run((s) => engine.unmortgageProperty(s, myPlayerId, position))} disabled={me.money < Math.round((space.mortgageValue || 0) * 1.1)}>
              Pay off mortgage
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { background: "var(--felt)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, height: "100%", display: "flex", flexDirection: "column", minHeight: 0 },
  header: { fontSize: 12, letterSpacing: "0.1em", color: "var(--parchment-dim)", textTransform: "uppercase", marginBottom: 10 },
  winner: { fontSize: 18, fontWeight: 700, color: "var(--gold-bright)", marginBottom: 12 },
  dice: { fontFamily: "var(--font-mono)", fontSize: 20, marginBottom: 10 },
  primaryBtn: { padding: "12px 0", borderRadius: 10, border: "none", background: "var(--gold)", color: "#241a08", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%", marginBottom: 8 },
  secondaryBtn: { padding: "10px 0", borderRadius: 10, border: "1px solid var(--gold)", background: "transparent", color: "var(--gold-bright)", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%", marginBottom: 8 },
  endBtn: { padding: "10px 0", borderRadius: 10, border: "1px solid var(--line)", background: "rgba(255,255,255,0.06)", color: "var(--parchment)", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  jailBox: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 },
  jailText: { fontSize: 13, color: "var(--parchment-dim)", marginBottom: 6 },
  purchaseBox: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 10, background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 10 },
  actionGrid: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 },
  bidInput: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(0,0,0,0.25)", color: "var(--parchment)" },
  propControls: { marginTop: 8, padding: 10, background: "rgba(0,0,0,0.2)", borderRadius: 10 },
  tinyBtn: { flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.06)", color: "var(--parchment)", fontSize: 12, cursor: "pointer" },
  logHeader: { fontSize: 11, letterSpacing: "0.1em", color: "var(--parchment-dim)", textTransform: "uppercase", margin: "10px 0 6px" },
  log: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column-reverse", gap: 4, fontSize: 12, color: "var(--parchment-dim)", minHeight: 80 },
  logLine: { borderBottom: "1px solid var(--line)", paddingBottom: 4 },
};
