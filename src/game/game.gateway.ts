import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'dgram';

@WebSocketGateway(81, {
  cors: {
    origin: ['[http://localhost:3000', ''],
  },
})
export class GameGateway {
  @WebSocketServer() server;
  private globalRoom = 'global';
  private defendTimeout = 1000;

  handleConnection(client: any, ...args: any[]) {
    client.join(this.globalRoom);
    client.broadcast.to(this.globalRoom).emit('join', { id: client.id });
  }

  @SubscribeMessage('move')
  handleMessage(client: any, payload: { x: number; y: number }) {
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
}
