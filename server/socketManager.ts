/**
 * Socket.IO manager for real-time multiplayer game synchronization.
 * Handles room management, player connections, and game state broadcasts.
 */

import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { GameState } from "./gameEngine";

export interface GameRoom {
  gameId: number;
  roomCode: string;
  gameState: GameState;
  players: Map<string, { userId: number; socketId: string }>;
  createdAt: Date;
}

export class SocketManager {
  private io: Server;
  private rooms: Map<string, GameRoom> = new Map();
  private userSockets: Map<number, string[]> = new Map(); // userId -> socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      socket.on("join_room", (data: { roomCode: string; userId: number }, callback: any) => {
        this.handleJoinRoom(socket, data.roomCode, data.userId, callback);
      });

      socket.on("leave_room", (data: { roomCode: string }, callback: any) => {
        this.handleLeaveRoom(socket, data.roomCode, callback);
      });

      socket.on("game_action", (data: any, callback: any) => {
        this.handleGameAction(socket, data, callback);
      });

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      socket.on("error", (error: any) => {
        console.error(`[Socket] Error on ${socket.id}:`, error);
      });
    });
  }

  private handleJoinRoom(
    socket: Socket,
    roomCode: string,
    userId: number,
    callback: (error: string | null, data?: any) => void
  ): void {
    try {
      const room = this.rooms.get(roomCode);

      if (!room) {
        return callback("Room not found");
      }

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(socket.id);

      // Add player to room
      room.players.set(socket.id, { userId, socketId: socket.id });

      // Join socket to room
      socket.join(roomCode);

      // Notify others
      this.io.to(roomCode).emit("player_joined", {
        userId,
        socketId: socket.id,
        playersInRoom: room.players.size,
      });

      callback(null, {
        gameState: room.gameState,
        roomCode,
      });
    } catch (error) {
      console.error("[Socket] Error joining room:", error);
      callback(String(error));
    }
  }

  private handleLeaveRoom(
    socket: Socket,
    roomCode: string,
    callback: (error: string | null) => void
  ): void {
    try {
      const room = this.rooms.get(roomCode);

      if (!room) {
        return callback("Room not found");
      }

      const player = room.players.get(socket.id);
      if (player) {
        room.players.delete(socket.id);

        // Remove from user sockets
        const userSockets = this.userSockets.get(player.userId);
        if (userSockets) {
          const idx = userSockets.indexOf(socket.id);
          if (idx >= 0) userSockets.splice(idx, 1);
        }
      }

      socket.leave(roomCode);

      // Notify others
      this.io.to(roomCode).emit("player_left", {
        socketId: socket.id,
        playersInRoom: room.players.size,
      });

      callback(null);
    } catch (error) {
      console.error("[Socket] Error leaving room:", error);
      callback(String(error));
    }
  }

  private handleGameAction(
    socket: Socket,
    data: any,
    callback: (error: string | null, result?: any) => void
  ): void {
    try {
      const { roomCode, action, payload } = data;
      const room = this.rooms.get(roomCode);

      if (!room) {
        return callback("Room not found");
      }

      // Broadcast action to all players in room
      this.io.to(roomCode).emit("game_action", {
        action,
        payload,
        timestamp: Date.now(),
      });

      callback(null, { success: true });
    } catch (error) {
      console.error("[Socket] Error handling game action:", error);
      callback(String(error));
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log(`[Socket] Client disconnected: ${socket.id}`);

    // Find and remove from all rooms
    this.rooms.forEach((room) => {
      const player = room.players.get(socket.id);
      if (player) {
        room.players.delete(socket.id);

        // Notify others
        this.io.to(room.roomCode).emit("player_left", {
          socketId: socket.id,
          playersInRoom: room.players.size,
        });

        // Remove from user sockets
        const userSockets = this.userSockets.get(player.userId);
        if (userSockets) {
          const idx = userSockets.indexOf(socket.id);
          if (idx >= 0) userSockets.splice(idx, 1);
        }
      }
    });
  }

  /**
   * Create a new game room.
   */
  public createRoom(
    gameId: number,
    roomCode: string,
    initialGameState: GameState
  ): GameRoom {
    const room: GameRoom = {
      gameId,
      roomCode,
      gameState: initialGameState,
      players: new Map(),
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  /**
   * Get a room by code.
   */
  public getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }

  /**
   * Broadcast game state update to all players in a room.
   */
  public broadcastGameState(roomCode: string, gameState: GameState): void {
    this.io.to(roomCode).emit("game_state_update", {
      gameState,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast a specific event to all players in a room.
   */
  public broadcastEvent(roomCode: string, eventName: string, data: any): void {
    this.io.to(roomCode).emit(eventName, {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Send a message to a specific player.
   */
  public sendToPlayer(socketId: string, eventName: string, data: any): void {
    this.io.to(socketId).emit(eventName, {
      ...data,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete a room.
   */
  public deleteRoom(roomCode: string): void {
    this.rooms.delete(roomCode);
  }

  /**
   * Get all active rooms.
   */
  public getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get the Socket.IO server instance.
   */
  public getIO(): Server {
    return this.io;
  }
}

let socketManager: SocketManager | null = null;

export function initializeSocketManager(httpServer: HTTPServer): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(httpServer);
  }
  return socketManager;
}

export function getSocketManager(): SocketManager | null {
  return socketManager;
}
