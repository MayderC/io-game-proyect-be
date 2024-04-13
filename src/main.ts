import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOptions = {
    credentials: true,
    origin: ['http://localhost:5173', '*'],
  };

  app.enableCors(corsOptions);

  await app.listen(3000);
}
bootstrap();
