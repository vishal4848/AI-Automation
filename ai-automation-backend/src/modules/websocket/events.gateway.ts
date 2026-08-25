import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export const WsEvents = {
  GENERATION_STARTED: 'generation.started',
  GENERATION_PROGRESS: 'generation.progress',
  GENERATION_COMPLETED: 'generation.completed',
  GENERATION_FAILED: 'generation.failed',
  UPLOAD_COMPLETED: 'upload.completed',
} as const;

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }, namespace: '/ws' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private userSockets = new Map<string, string[]>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    for (const [userId, sockets] of this.userSockets.entries()) {
      this.userSockets.set(userId, sockets.filter(s => s !== client.id));
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    const existing = this.userSockets.get(data.userId) || [];
    this.userSockets.set(data.userId, [...existing, client.id]);
    client.join(`user:${data.userId}`);
    return { joined: true };
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitGenerationStarted(userId: string, jobId: string, type: string) {
    this.emitToUser(userId, WsEvents.GENERATION_STARTED, { jobId, type, timestamp: new Date() });
  }

  emitGenerationProgress(userId: string, jobId: string, progress: number, message?: string) {
    this.emitToUser(userId, WsEvents.GENERATION_PROGRESS, { jobId, progress, message, timestamp: new Date() });
  }

  emitGenerationCompleted(userId: string, jobId: string, result: any) {
    this.emitToUser(userId, WsEvents.GENERATION_COMPLETED, { jobId, result, timestamp: new Date() });
  }

  emitGenerationFailed(userId: string, jobId: string, error: string) {
    this.emitToUser(userId, WsEvents.GENERATION_FAILED, { jobId, error, timestamp: new Date() });
  }
}
