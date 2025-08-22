import Dexie, { Table } from 'dexie';

export interface DiaryEntry {
  date: string;
  text: string;
  photos: string[];
  mood: string;
}

class TravelDiaryDB extends Dexie {
  entries!: Table<DiaryEntry, string>;

  constructor() {
    super('TravelDiary');
    this.version(1).stores({
      entries: '&date',
    });
  }
}

export const db = new TravelDiaryDB();

const LEGACY_KEY = 'travel-diary-v1';

// Migration from legacy localStorage to Dexie.
// Runs only once: after successful migration, legacy data is removed.
export async function migrateLegacyData(): Promise<void> {
  const hasEntries = await db.entries.count();
  if (hasEntries > 0) return;

  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw) as {
      entries?: Record<string, Partial<DiaryEntry>>;
    };
    const entriesObj = state.entries || {};
    const records = Object.entries(entriesObj).map(([date, e]) => ({
      date,
      text: e.text || '',
      photos: e.photos || [],
      mood: e.mood || '😐',
    }));
    if (records.length) {
      await db.entries.bulkPut(records);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch (e) {
    console.error('Failed to migrate legacy data', e);
  }
}
