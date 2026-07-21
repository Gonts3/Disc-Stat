export interface Player {
  id: string;
  name: string;
  goals: number;
  assists: number;
  turnovers: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  presentIds: string[]; // List of player IDs present
}

export interface PracticeLog {
  id: string;
  date: string;
  focus: string;
  notes: string;
  photo?: string; // Base64 data URL for practice picture
  attendance?: string; // Text field of who attended
}

export interface MatchPlayerStat {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  turnovers: number;
}

export interface ScrimmageMatch {
  id: string;
  date: string;
  opponent: string;
  ourScore: number;
  opponentScore: number;
  playerStats?: MatchPlayerStat[];
  mvp?: string;
}

export interface TeamData {
  players: Player[];
  attendance: AttendanceRecord[];
  practiceLogs: PracticeLog[];
  matches: ScrimmageMatch[];
}
