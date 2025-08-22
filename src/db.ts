import Dexie, { Table } from 'dexie';

export interface Entry {
  text: string;
  photos: string[];
  mood: string;
}

export interface State {
  theme: 'light' | 'dark';
  fontSize: number;
  entries: Record<string, Entry>;
}

interface EntryRow extends Entry {
  date: string;
}

interface SettingsRow {
  id: string;
  theme: 'light' | 'dark';
  fontSize: number;
}

class TravelDiaryDB extends Dexie {
  entries!: Table<EntryRow, string>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super('TravelDiaryDB');
    this.version(1).stores({
      entries: '&date',
      settings: '&id',
    });
  }
}

const db = new TravelDiaryDB();
const STORAGE_KEY = 'travel-diary-v1';
let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const hasEntries = await db.entries.count();
      if (hasEntries === 0) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const legacy = JSON.parse(raw) as State;
            await db.transaction('rw', db.entries, db.settings, async () => {
              await db.settings.put({ id: 'settings', theme: legacy.theme, fontSize: legacy.fontSize });
              for (const [date, entry] of Object.entries(legacy.entries || {})) {
                await db.entries.put({ date, ...entry });
              }
            });
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {
            console.error('migration failed', e);
          }
        }
      }
    })();
  }
  return initPromise;
}

export async function getState(): Promise<State | null> {
  await init();
  const settings = await db.settings.get('settings');
  const rows = await db.entries.toArray();
  const entries: Record<string, Entry> = {};
  rows.forEach(({ date, text, photos, mood }) => {
    entries[date] = { text, photos, mood };
  });
  if (!settings && rows.length === 0) return null;
  return {
    theme: settings?.theme ?? 'light',
    fontSize: settings?.fontSize ?? 16,
    entries,
  };
}

export async function putState(state: State): Promise<void> {
  await init();
  await db.transaction('rw', db.settings, db.entries, async () => {
    await db.settings.put({ id: 'settings', theme: state.theme, fontSize: state.fontSize });
    await db.entries.clear();
    for (const [date, entry] of Object.entries(state.entries)) {
      await db.entries.put({ date, ...entry });
    }
  });
}

export async function addOrUpdateEntry(date: string, entry: Entry): Promise<void> {
  await init();
  await db.entries.put({ date, ...entry });
}

export async function deleteEntry(date: string): Promise<void> {
  await init();
  await db.entries.delete(date);
}

export async function getAllEntries(): Promise<Record<string, Entry>> {
  await init();
  const rows = await db.entries.toArray();
  return Object.fromEntries(rows.map(({ date, text, photos, mood }) => [date, { text, photos, mood }]));
}

// Migration runs once on first DB access and removes legacy localStorage data.
