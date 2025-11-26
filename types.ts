
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD'
}

export interface ScoreData {
  current: number;
  high: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface CommentaryResponse {
  message: string;
}
