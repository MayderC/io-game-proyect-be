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

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class GameGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server;
  private globalRoom = 'global';
  private defendTimeout = 1000;
  private logger = new Logger('GameGateway');

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.broadcast.to(this.globalRoom).emit('leave', { id: client.id });
  }
  afterInit(server: any) {
    //server is a socket.io server
    this.logger.log('Init on port: ');
    console.log(server.eio.opts.cors);
    //get websocket port
    console.log(server.eio.opts);
  }

  handleConnection(client: any, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(client.handshake.query);

    client.join(this.globalRoom);
    client.broadcast.to(this.globalRoom).emit('join', { id: client.id });
  }

  @SubscribeMessage('move')
  handleMessage(client: any, payload: { x: number; y: number }) {
    this.logger.log('move', payload);
    client.broadcast.to(this.globalRoom).emit('move', {
      id: client.id,
      x: payload.x,
      y: payload.y,
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
}
