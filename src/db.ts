import Dexie, { Table } from "dexie";

export interface Entry {
  text: string;
  photos: string[];
  mood: string;
}

export interface State {
  theme: "light" | "dark";
  fontSize: number;
  entries: Record<string, Entry>;
}

interface StateRecord {
  id: string;
  value: State;
}

class DiaryDB extends Dexie {
  public state!: Table<StateRecord>;

  constructor() {
    super("travel-diary-db");
    this.version(1).stores({
      state: "&id",
    });
  }
}

const db = new DiaryDB();
const STORAGE_ID = "state";

export async function getState(): Promise<State | null> {
  try {
    const row = await db.state.get(STORAGE_ID);
    return row?.value ?? null;
  } catch (e) {
    console.error("getState error", e);
    return null;
  }
}

export async function putState(state: State): Promise<void> {
  try {
    await db.state.put({ id: STORAGE_ID, value: state });
  } catch (e) {
    console.error("putState error", e);
  }
}
