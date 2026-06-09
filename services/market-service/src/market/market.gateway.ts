import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { PriceTick } from '@simcoin/types';

/**
 * Streams live price ticks to connected clients over Socket.IO.
 *
 * Clients `subscribe` to one or more symbols (joining a per-symbol room); the
 * ingestion loop calls {@link broadcast} for each new tick, which fans out only
 * to the rooms that asked for that symbol.
 */
@WebSocketGateway({
  namespace: '/markets',
  cors: { origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',') },
})
export class MarketGateway {
  private readonly logger = new Logger(MarketGateway.name);

  @WebSocketServer()
  server!: Server;

  /** Subscribe the socket to live ticks for the given symbols. */
  @SubscribeMessage('subscribe')
  onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() symbols: string[],
  ): { subscribed: string[] } {
    const upper = (symbols ?? []).map((s) => s.toUpperCase());
    for (const symbol of upper) void client.join(`sym:${symbol}`);
    return { subscribed: upper };
  }

  /** Unsubscribe the socket from the given symbols. */
  @SubscribeMessage('unsubscribe')
  onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() symbols: string[],
  ): { unsubscribed: string[] } {
    const upper = (symbols ?? []).map((s) => s.toUpperCase());
    for (const symbol of upper) void client.leave(`sym:${symbol}`);
    return { unsubscribed: upper };
  }

  /** Fan a tick out to every client subscribed to its symbol. */
  broadcast(tick: PriceTick): void {
    this.server?.to(`sym:${tick.symbol}`).emit('price.tick', tick);
  }
}
