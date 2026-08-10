import { supabase } from "./supabase";
import type { GameState } from "../shared/types";

const TABLE = "games";

export function randomRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export function randomPlayerId(): string {
  return crypto.randomUUID();
}

export async function createGameRow(state: GameState): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({ code: state.code, state });
  if (error) throw error;
}

export async function fetchGame(code: string): Promise<GameState | null> {
  const { data, error } = await supabase.from(TABLE).select("state").eq("code", code).maybeSingle();
  if (error) throw error;
  return data ? (data.state as GameState) : null;
}

export async function saveGame(state: GameState): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ state }).eq("code", state.code);
  if (error) throw error;
}

export function subscribeToGame(code: string, onChange: (state: GameState) => void) {
  const channel = supabase
    .channel(`game:${code}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: TABLE, filter: `code=eq.${code}` },
      (payload) => {
        const newState = (payload.new as { state: GameState }).state;
        if (newState) onChange(newState);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Local identity: which player on this browser is "me", scoped per room so
// one browser can play in several different rooms over time.
export function getOrCreatePlayerIdForRoom(code: string): string {
  const key = `monopoly:playerId:${code}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = randomPlayerId();
    localStorage.setItem(key, id);
  }
  return id;
}

export function getStoredPlayerName(): string {
  return localStorage.getItem("monopoly:playerName") || "";
}

export function storePlayerName(name: string): void {
  localStorage.setItem("monopoly:playerName", name);
}
