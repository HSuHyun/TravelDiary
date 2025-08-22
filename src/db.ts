import Dexie, { type Table } from 'dexie';

export interface DiaryEntry {
  date: string;
  text: string;
  photos: string[];
  mood: string;
}

export interface Settings {
  id: number;
  theme: string;
  fontSize: number;
}

export class TravelDiaryDB extends Dexie {
  entries!: Table<DiaryEntry, string>;
  settings!: Table<Settings, number>;

  constructor() {
    super('travelDiary');
    this.version(1).stores({
      entries: '&date, text, photos, mood',
      settings: 'id, theme, fontSize',
    });
  }
}

export const db = new TravelDiaryDB();
