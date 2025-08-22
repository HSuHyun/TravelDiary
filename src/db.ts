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

const STORAGE_KEY = 'travel-diary-v1';

export async function getState(): Promise<State | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch (e) {
    console.error('getState error', e);
    return null;
  }
}

export async function putState(state: State): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('putState error', e);
  }
}
