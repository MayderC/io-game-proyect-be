import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'dgram';
import { WebSocketGateway } from '@nestjs/websockets';
import { Player } from './Player.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class GameGateway implements OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server;
  private globalRoom = 'global';
  private defendTimeout = 1000;
  private logger = new Logger('GameGateway');
  private clients: Map<string, Player> = new Map();

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);

    this.clients.delete(client.id);
    client.broadcast.to(this.globalRoom).emit('leave', { id: client.id });
  }
  afterInit(server: any) {
    //server is a socket.io server
    this.logger.log('Init on port: ');
  }

  @SubscribeMessage('join')
  handleMessageJoin(client: any, payload: any) {
    client.join(this.globalRoom);
    this.clients.set(client.id, payload.player);
    client.broadcast
      .to(this.globalRoom)
      .emit('joined', { player: payload.player });
  }

  @SubscribeMessage('move')
  handleMessage(
    client: any,
    payload: { x: number; y: number; direction: string },
  ) {
    this.logger.log('move', payload);
    client.broadcast.to(this.globalRoom).emit('move', {
      id: client.id,
      x: payload.x,
      y: payload.y,
      direction: payload.direction,
    });
  }

  @SubscribeMessage('attack')
  handleAttack(client: Socket, payload: { idEnemy: string }) {
    this.server.broadcast.to(this.globalRoom).emit('attack-animation');
    client.emit(payload.idEnemy, 'attack-action');
  }

  @SubscribeMessage('defend-start')
  handleDefendStart(client: any) {
    client.broadcast
      .to(this.globalRoom)
      .emit('defend-start', { id: client.id });
    setTimeout(() => {
      client.broadcast
        .to(this.globalRoom)
        .emit('defend-end', { id: client.id });
    }, this.defendTimeout);
  }

  @SubscribeMessage('sum-score')
  handleSumPoints(client: any, payload: { points: number }) {
    client.broadcast.to(this.globalRoom).emit('sum-score', {
      id: client.id,
      points: payload.points,
    });
  }

  @SubscribeMessage('get-all-players')
  handleGetAllPlayers(client: any) {
    const clients = Array.from(this.clients.values()).filter(
      (player) => player.id !== client.id,
    );

    Logger.log(
      'get-all-players',
      'SE CONECTO UNO NUEVO Y  NECESITA LOS JUGADORES',
    );

    client.emit('get-all-players', {
      clients: [...clients],
    });
  }

  @SubscribeMessage('leave')
  handleLeave(client: any, payload: any) {
    console.log('SE FUE', payload);
    client.broadcast.to(this.globalRoom).emit('leave', { id: client.id });
  }
}
