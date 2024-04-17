import { Logger } from '@nestjs/common';
import {
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'dgram';
import { WebSocketGateway } from '@nestjs/websockets';

export interface IPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
}
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
  private clients: Map<string, IPlayer> = new Map();
  private spawns: { x: number; y: number }[] = [];

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);

    this.clients.delete(client.id);
    client.broadcast.to(this.globalRoom).emit('leave', { id: client.id });
  }
  afterInit(server: any) {
    //server is a socket.io server

    this.generateSpawns();

    console.log('spawns', this.spawns);

    this.clearCoins();
    this.tickNewItems();

    this.logger.log('Init on port: ');
  }

  @SubscribeMessage('join')
  handleMessageJoin(client: any, payload: any) {
    client.join(this.globalRoom);

    this.clients.set(client.id, payload);
    client.broadcast.to(this.globalRoom).emit('joined', { player: payload });
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
    this.logger.log('sum-score', payload);

    client.broadcast.to(this.globalRoom).emit('sum-score', {
      id: client.id,
      points: payload.points,
    });
  }

  private clearCoins() {
    setInterval(() => {
      this.spawns = [];
      this.generateSpawns();
      this.server.to(this.globalRoom).emit('reset-objects', {
        positions: this.spawns,
      });
    }, 1000 * 60);
  }

  @SubscribeMessage('get-all-players')
  handleGetAllPlayers(client: any) {
    const data = Array.from(this.clients.values()).filter(
      (player) => player.id !== client.id,
    );

    const clients = JSON.stringify(data);

    Logger.log(
      'get-all-players',
      'SE CONECTO UNO NUEVO Y  NECESITA LOS JUGADORES Y OBJETOS',
    );

    client.emit('get-objects', {
      positions: this.spawns,
    });

    client.emit('get-all-players', {
      clients: clients,
    });
  }

  @SubscribeMessage('get-spawns')
  handleSetSpawn(client: any) {}

  private getRandomPosition() {
    const margin = 16;
    const mapWidth = 1280;
    const mapHeight = 928;
    const x = Math.random() * (mapWidth - 2 * margin) + margin;
    const y = Math.random() * (mapHeight - 2 * margin) + margin;
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  private generateSpawns() {
    let i = 0;
    while (i < 10) {
      this.spawns.push(this.getRandomPosition());
      i++;
    }
  }

  private tickNewItems() {
    setInterval(() => {
      const len = this.spawns.length;
      // get random index from spawns
      let indexRan = 0;
      let coin = null;

      do {
        indexRan = Math.floor(Math.random() * len);
        coin = this.spawns[indexRan];
      } while (!coin);

      this.spawns = this.spawns.filter((_, index) => index !== indexRan);
      const cords = this.getRandomPosition();
      this.spawns.push(cords);

      this.server.to(this.globalRoom).emit('new-object', {
        remove: { x: coin.x, y: coin.y },
        ...cords,
      });
    }, 1000 * 4);
  }

  @SubscribeMessage('leave')
  handleLeave(client: any) {
    this.clients.delete(client.id);
    client.broadcast.to(this.globalRoom).emit('leave', { id: client.id });
  }

  @SubscribeMessage('coin-collected')
  handleCoinCollected(client: any, payload: { x: number; y: number }) {
    this.spawns = this.spawns.filter(
      (x) => x.x !== payload.x && x.y !== payload.y,
    );

    this.server.to(this.globalRoom).emit('remove-coin', {
      x: payload.x,
      y: payload.y,
    });
  }
}
