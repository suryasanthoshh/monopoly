import { useEffect, useRef, useState } from "react";
import { POSITION_COORDS } from "../shared/boardGeometry";
import type { GameState } from "../shared/types";

const STEP_DURATION_MS = 90; // animation time per board space
const MAX_TOTAL_MS = 1600; // cap so long jumps (e.g. sent to jail) don't drag on

// Picks whichever direction (forward or backward around the board) is fewer
// spaces, so cards like "go back 3 spaces" slide backward instead of
// looping almost all the way around.
function shortestPath(from: number, to: number): number[] {
  if (from === to) return [from];
  const forwardSteps = (to - from + 40) % 40;
  const backwardSteps = (from - to + 40) % 40;
  const path: number[] = [];
  if (forwardSteps <= backwardSteps) {
    for (let i = 0; i <= forwardSteps; i++) path.push((from + i) % 40);
  } else {
    for (let i = 0; i <= backwardSteps; i++) path.push((from - i + 40) % 40);
  }
  return path;
}

interface Anim {
  path: number[];
  startTime: number;
  duration: number;
}

export default function AnimatedTokens({ state }: { state: GameState }) {
  const lastKnownPosition = useRef<Record<string, number>>({});
  const anims = useRef<Record<string, Anim>>({});
  const [coords, setCoords] = useState<Record<string, { x: number; y: number }>>({});
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let needsAnim = false;
    setCoords((prevCoords) => {
      const nextCoords = { ...prevCoords };
      for (const p of state.players) {
        const known = lastKnownPosition.current[p.id];
        if (known === undefined) {
          lastKnownPosition.current[p.id] = p.position;
          nextCoords[p.id] = POSITION_COORDS[p.position];
          continue;
        }
        if (known !== p.position) {
          const path = shortestPath(known, p.position);
          const steps = path.length - 1;
          const duration = Math.min(MAX_TOTAL_MS, Math.max(STEP_DURATION_MS, steps * STEP_DURATION_MS));
          anims.current[p.id] = { path, startTime: performance.now(), duration };
          lastKnownPosition.current[p.id] = p.position;
          needsAnim = true;
        }
      }
      return nextCoords;
    });
    if (needsAnim && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function tick(now: number) {
    let stillAnimating = false;
    setCoords((prev) => {
      const next = { ...prev };
      for (const [playerId, anim] of Object.entries(anims.current)) {
        const elapsed = now - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const eased = 1 - Math.pow(1 - t, 2); // ease-out, feels less mechanical than linear
        const steps = anim.path.length - 1;

        if (steps === 0) {
          next[playerId] = POSITION_COORDS[anim.path[0]];
          delete anims.current[playerId];
          continue;
        }

        const rawIndex = eased * steps;
        const segment = Math.min(steps - 1, Math.floor(rawIndex));
        const frac = rawIndex - segment;
        const fromCoord = POSITION_COORDS[anim.path[segment]];
        const toCoord = POSITION_COORDS[anim.path[segment + 1]];
        next[playerId] = {
          x: fromCoord.x + (toCoord.x - fromCoord.x) * frac,
          y: fromCoord.y + (toCoord.y - fromCoord.y) * frac,
        };

        if (t >= 1) {
          next[playerId] = POSITION_COORDS[anim.path[steps]];
          delete anims.current[playerId];
        } else {
          stillAnimating = true;
        }
      }
      return next;
    });

    rafRef.current = stillAnimating ? requestAnimationFrame(tick) : null;
  }

  const activePlayers = state.players.filter((p) => !p.bankrupt);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {activePlayers.map((p) => {
        const c = coords[p.id] || POSITION_COORDS[p.position];
        // Offset players sharing a space into a small ring so tokens don't fully stack.
        const sameSpace = activePlayers.filter((op) => op.position === p.position);
        const idxWithin = sameSpace.findIndex((op) => op.id === p.id);
        const angle = (idxWithin / Math.max(1, sameSpace.length)) * Math.PI * 2;
        const radius = sameSpace.length > 1 ? 1.7 : 0;
        const x = c.x + Math.cos(angle) * radius;
        const y = c.y + Math.sin(angle) * radius;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: `${p.color}55`,
                border: `2px solid ${p.color}`,
                fontSize: 13,
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.6))",
              }}
              title={p.name}
            >
              {p.token}
            </span>
          </div>
        );
      })}
    </div>
  );
}
