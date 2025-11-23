export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface ScoreData {
  current: number;
  high: number;
}

export interface CommentaryResponse {
  message: string;
}
