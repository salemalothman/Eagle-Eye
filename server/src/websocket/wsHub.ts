import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

interface WsClient {
  ws: WebSocket;
  channels: Set<string>;
  isAlive: boolean;
}

class WsHub {
  private wss: WebSocketServer | null = null;
  private clients = new Set<WsClient>();
  private channelMap = new Map<string, Set<WsClient>>();
  private latestData = new Map<string, string>(); // cached last broadcast per channel

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      const client: WsClient = { ws, channels: new Set(), isAlive: true };
      this.clients.add(client);
      console.log(`[WS] Client connected (total: ${this.clients.size})`);

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'subscribe' && Array.isArray(msg.channels)) {
            for (const ch of msg.channels) {
              client.channels.add(ch);
              if (!this.channelMap.has(ch)) this.channelMap.set(ch, new Set());
              this.channelMap.get(ch)!.add(client);
              // Send cached data for this channel immediately on subscribe
              const cached = this.latestData.get(ch);
              if (cached && ws.readyState === WebSocket.OPEN) {
                ws.send(cached);
              }
            }
          }
          if (msg.type === 'unsubscribe' && Array.isArray(msg.channels)) {
            for (const ch of msg.channels) {
              client.channels.delete(ch);
              this.channelMap.get(ch)?.delete(client);
            }
          }
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('pong', () => { client.isAlive = true; });

      ws.on('close', () => {
        for (const ch of client.channels) {
          this.channelMap.get(ch)?.delete(client);
        }
        this.clients.delete(client);
        console.log(`[WS] Client disconnected (total: ${this.clients.size})`);
      });

      // Send initial handshake
      ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
    });

    // Heartbeat every 30s
    setInterval(() => {
      for (const client of this.clients) {
        if (!client.isAlive) {
          client.ws.terminate();
          for (const ch of client.channels) {
            this.channelMap.get(ch)?.delete(client);
          }
          this.clients.delete(client);
          continue;
        }
        client.isAlive = false;
        client.ws.ping();
      }
    }, 30_000);
  }

  broadcast(channel: string, data: any) {
    const payload = JSON.stringify({ channel, timestamp: Date.now(), data });
    // Cache latest payload so new subscribers get it immediately
    this.latestData.set(channel, payload);

    const subscribers = this.channelMap.get(channel);
    if (!subscribers || subscribers.size === 0) return;

    for (const client of subscribers) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsHub = new WsHub();
