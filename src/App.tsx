import { useEffect, useState, useCallback } from "react";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import { fetchGame, subscribeToGame, getOrCreatePlayerIdForRoom } from "./lib/gameStore";
import type { GameState } from "./shared/types";

function getRoomFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

export default function App() {
  const [roomCode, setRoomCode] = useState<string | null>(getRoomFromUrl());
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const enterRoom = useCallback((code: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("room", code);
    window.history.pushState({}, "", url);
    setRoomCode(code);
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    let unsubscribe: (() => void) | null = null;
    setLoading(true);
    setLoadError(null);

    fetchGame(roomCode)
      .then((initial) => {
        if (!initial) {
          setLoadError("No game found with that room code.");
          setState(null);
          return;
        }
        setState(initial);
        unsubscribe = subscribeToGame(roomCode, setState);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Couldn't load the game."))
      .finally(() => setLoading(false));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomCode]);

  if (!roomCode) {
    return <Home onEnterRoom={enterRoom} />;
  }

  if (loading || !state) {
    return (
      <div style={centerStyle}>
        {loadError ? (
          <div>
            <p>{loadError}</p>
            <button onClick={() => { setRoomCode(null); window.history.pushState({}, "", window.location.pathname); }}>
              Back to home
            </button>
          </div>
        ) : (
          <p>Loading game…</p>
        )}
      </div>
    );
  }

  const myPlayerId = getOrCreatePlayerIdForRoom(roomCode);
  const iAmInGame = state.players.some((p) => p.id === myPlayerId);

  if (!iAmInGame) {
    return (
      <div style={centerStyle}>
        <p>You're not part of this game on this device.</p>
      </div>
    );
  }

  if (state.phase === "lobby") {
    return <Lobby state={state} myPlayerId={myPlayerId} />;
  }

  return <Game state={state} myPlayerId={myPlayerId} />;
}

const centerStyle: React.CSSProperties = {
  minHeight: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--parchment)",
  textAlign: "center",
  padding: 20,
};
