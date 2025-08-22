import Dexie, { Table } from 'dexie';

export interface Entry {
  text: string;
  photos: string[];
  mood: string;
}

interface EntryRecord extends Entry {
  date: string;
}

class TravelDiaryDB extends Dexie {
  entries!: Table<EntryRecord, string>;

  constructor() {
    super('TravelDiaryDB');
    this.version(1).stores({
      entries: '&date',
    });
  }
}

const db = new TravelDiaryDB();

export async function addOrUpdateEntry(date: string, entry: Entry): Promise<void> {
  await db.entries.put({ date, ...entry });
}

export async function deleteEntry(date: string): Promise<void> {
  await db.entries.delete(date);
}

export async function getAllEntries(): Promise<Record<string, Entry>> {
  const all = await db.entries.toArray();
  return all.reduce<Record<string, Entry>>((acc, { date, ...rest }) => {
    acc[date] = rest;
    return acc;
  }, {});
}

export default db;
