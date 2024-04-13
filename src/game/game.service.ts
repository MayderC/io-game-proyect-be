import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {
  getRamdonOperation(): string {
    const operations = ['+', '-', '*', '/'];
    const randomIndex = Math.floor(Math.random() * operations.length);
    return operations[randomIndex];
  }

  getRamdonNumber(): number {
    return Math.floor(Math.random() * 10);
  }
}
