import { Module } from '@nestjs/common';
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [GameGateway, GameService],
})
export class AppModule {}
