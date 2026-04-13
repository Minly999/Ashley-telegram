export interface Class {
  index: number;
  discipline: string;
  room: string;
}

export interface Day {
  date: string; // Format: YYYY-MM-DD
  classes: Class[];
}

export type Schedule = Day[];