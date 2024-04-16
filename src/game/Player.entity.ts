export interface Payload {
  player: Player;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  lives: number;
  livePercentage: number;
  isAlive: boolean;
  isWinner: boolean;
  iDefending: boolean;
  isReading: boolean;
  team: string;
  x: number;
  y: number;
  kPlayer: KPlayer;
}

export interface KPlayer {
  id: number;
  hidden: boolean;
  transform: Transform;
  children: any[];
  parent: null;
  paused: boolean;
  width: number;
  height: number;
  frame: number;
  quad: Quad;
  animSpeed: number;
  flipX: boolean;
  flipY: boolean;
  collisionIgnore: any[];
  area: Area;
  vel: Pos;
  jumpForce: number;
  gravityScale: number;
  isStatic: boolean;
  mass: number;
  anchor: string;
  pos: Pos;
  scale: Pos;
  speed: number;
  direction: string;
  isInDialog: boolean;
}

export interface Area {
  shape: Shape;
  scale: Pos;
  offset: Pos;
  cursor: null;
}

export interface Pos {
  x: number;
  y: number;
}

export interface Shape {
  pos: Pos;
  width: number;
  height: number;
}

export interface Quad {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Transform {
  m: number[];
}
