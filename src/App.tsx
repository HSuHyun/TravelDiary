import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Travel Diary – minimal offline-first web app (MVP)
// -------------------------------------------------
// ✔ 날짜별 일기 작성 (자동 날짜)
// ✔ 즉시 저장(로컬스토리지) + 수동 저장 (Ctrl/Cmd+S)
// ✔ 사진 첨부(로컬에 dataURL로 저장)
// ✔ 검색/필터(간단 키워드)
// ✔ 다크모드 토글 / 글자 크기 조절
// ✔ JSON 내보내기 / 가져오기 (포폴용)
// TODO: IndexedDB, PWA, 동기화, Markdown, 지도, 감정 태그 등 확장

// ----- Utilities -----
const STORAGE_KEY = "travel-diary-v1";
const defaultFontSize = 16;

interface Entry {
  text: string;
  photos: string[];
  mood: string;
}

interface State {
  theme: "light" | "dark";
  fontSize: number;
  entries: Record<string, Entry>;
}

function loadState(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch (e) {
    console.error("loadState error", e);
    return null;
  }
}

function saveState(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("saveState error", e);
  }
}

function formatDateISO(d: Date = new Date()): string {
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
}

function classNames(...xs: (string | undefined | null | false)[]): string {
  return xs.filter(Boolean).join(" ");
}

export default function App(): JSX.Element {
  const initial = useMemo<State>(() => {
  const loaded = loadState();
  if (loaded?.entries) {
    const entries = Object.fromEntries(
      Object.entries(loaded.entries).map(([d, e]) => {
        const base: Entry = { text: "", photos: [], mood: "😐" };
        return [d, { ...base, ...(e as Partial<Entry>) }];
      })
    ) as Record<string, Entry>;
    return { ...loaded, entries };
  }
  return {
    theme: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    fontSize: defaultFontSize,
    entries: { [formatDateISO()]: { text: "", photos: [], mood: "😐" } },
  };
}, []);

  const [state, setState] = useState<State>(initial);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateISO());
  const [query, setQuery] = useState<string>("");
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // Ensure selected date entry exists
  useEffect(() => {
    setState((s) => {
      if (s.entries[selectedDate]) return s;
      return { ...s, entries: { ...s.entries, [selectedDate]: { text: "", photos: [], mood: "😐" } } };
    });
  }, [selectedDate]);

  // Autosave (debounced)
  useEffect(() => {
    const id = setTimeout(() => saveState(state), 400);
    return () => clearTimeout(id);
  }, [state]);

  const saveNow = useCallback(() => {
    saveState(state);
    const el = document.getElementById("save-toast");
    if (el) {
      el.classList.remove("hidden");
      setTimeout(() => el.classList.add("hidden"), 800);
    }
  }, [state]);

  // Keyboard: Cmd/Ctrl+S to force save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  const dates = useMemo(() => Object.keys(state.entries).sort((a, b) => (a < b ? 1 : -1)), [state.entries]);

  const filteredDates = useMemo(() => {
    if (!query.trim()) return dates;
    const q = query.toLowerCase();
    return dates.filter((d) => {
      const e = state.entries[d];
      return d.includes(q) || (e?.text || "").toLowerCase().includes(q);
    });
  }, [dates, query, state.entries]);

  const entry = useMemo<Entry>(() => {
    const e = state.entries[selectedDate] as Partial<Entry> | undefined;
    return { text: "", photos: [], mood: "😐", ...(e ?? {}) };
  }, [state.entries, selectedDate]);

  const setEntry = (upd: Partial<Entry>) => {
    setState((s) => ({ ...s, entries: { ...s.entries, [selectedDate]: { ...entry, ...upd } } }));
  };

  const handleAddPhoto = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const list = Array.from(files);
    const dataURLs = await Promise.all(list.map(fileToDataURL));
    setEntry({ photos: [...(entry.photos || []), ...dataURLs] });
  };

  const removePhoto = (idx: number) => {
    const next = [...(entry.photos || [])];
    next.splice(idx, 1);
    setEntry({ photos: next });
  };

  const deleteEntry = () => {
    if (!window.confirm("이 일기를 삭제할까요?")) return;
    const entries = { ...state.entries };
    delete entries[selectedDate];
    setState({ ...state, entries });
    const remaining = Object.keys(entries);
    setSelectedDate(remaining[0] || formatDateISO());
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travel-diary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as State;
      if (!data.entries) throw new Error("Invalid file");
      const entries = Object.fromEntries(
        Object.entries(data.entries).map(([d, e]) => {
          const base: Entry = { text: "", photos: [], mood: "😐" };
          return [d, { ...base, ...(e as Partial<Entry>) }];
        })
      ) as Record<string, Entry>;
      setState({ ...data, entries });
      setSelectedDate(Object.keys(entries)[0] || formatDateISO());
    } catch (e: any) {
      alert("가져오기 실패: " + e.message);
    }
  };

  const toggleTheme = () => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));

  const incFont = () => setState((s) => ({ ...s, fontSize: Math.min(24, (s.fontSize || defaultFontSize) + 1) }));
  const decFont = () => setState((s) => ({ ...s, fontSize: Math.max(12, (s.fontSize || defaultFontSize) - 1) }));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  return (
    <div className={classNames("min-h-screen", "bg-zinc-50 text-zinc-900", "dark:bg-zinc-900 dark:text-zinc-100")}
      style={{ fontSize: state.fontSize }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <h1 className="text-xl font-bold mr-auto">✈️ Travel Diary</h1>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색(날짜/본문)"
            className="rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 focus:outline-none focus:ring ring-zinc-300 dark:ring-zinc-700"
          />

          <button onClick={toggleTheme} className="ml-2 px-3 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700">{state.theme === 'dark' ? '🌙' : '☀️'}</button>
          <div className="ml-1 flex items-center rounded-xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <button onClick={decFont} className="px-3 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-700">A−</button>
            <div className="px-2 select-none">{state.fontSize}px</div>
            <button onClick={incFont} className="px-3 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-700">A＋</button>
          </div>

          <button onClick={exportJSON} className="ml-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">내보내기</button>
          <label className="ml-2 px-3 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer">
            가져오기
            <input type="file" accept="application/json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-[260px_1fr] gap-4 p-4">
        {/* Sidebar: Dates */}
        <aside className="rounded-2xl p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800"
            />
            <button
              onClick={() => setSelectedDate(formatDateISO())}
              className="px-3 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="오늘로 이동"
            >오늘</button>
          </div>

          <div className="max-h-[60vh] overflow-auto pr-1 space-y-1">
            {filteredDates.length === 0 && (
              <div className="text-sm text-zinc-500">검색 결과가 없어요.</div>
            )}
            {filteredDates.map((d) => {
              const isActive = d === selectedDate;
              const e = state.entries[d] || {};
              const snippet = (e.text || "").slice(0, 50);
              const mood = e.mood || "😐";
              return (
                <button key={d}
                  onClick={() => setSelectedDate(d)}
                  className={classNames(
                    "w-full text-left px-3 py-2 rounded-xl",
                    isActive ? "bg-emerald-100 dark:bg-emerald-900/40" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <div className="text-sm font-semibold flex items-center justify-between">
                    <span>{d}</span>
                    <span>{mood}</span>
                  </div>
                  <div className="text-xs text-zinc-500 line-clamp-1">{snippet || "(빈 내용)"}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Editor */}
        <main className="rounded-2xl p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-lg font-semibold flex items-center gap-2">
              {selectedDate} 기록 <span>{entry.mood}</span>
            </div>
            <div className="flex items-center gap-2">
              <div id="save-toast" className="hidden text-xs px-2 py-1 rounded bg-emerald-500 text-white">저장됨</div>
              <button
                onClick={deleteEntry}
                className="px-2 py-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800"
                title="삭제"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {['😀', '😐', '😢', '😡'].map((m) => (
                <button
                  key={m}
                  onClick={() => setEntry({ mood: m })}
                  className={classNames(
                    'px-2 py-1 rounded-xl text-xl',
                    entry.mood === m
                      ? 'bg-emerald-200 dark:bg-emerald-800'
                      : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                  )}
                >
                  {m}
                </button>
              ))}
              <input
                type="text"
                value={entry.mood || ''}
                onChange={(e) => setEntry({ mood: e.target.value })}
                placeholder="🙂"
                className="w-12 text-center rounded-xl px-2 py-1 bg-zinc-100 dark:bg-zinc-800"
              />
            </div>
            <button
              onClick={saveNow}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              저장
            </button>
          </div>

          <textarea
            ref={textRef}
            value={entry.text}
            onChange={(e) => setEntry({ text: e.target.value })}
            placeholder="오늘의 순간을 바로바로 적어보세요…"
            className="w-full h-[36vh] md:h-[48vh] resize-vertical rounded-xl p-3 bg-zinc-100 dark:bg-zinc-800 focus:outline-none focus:ring ring-zinc-300 dark:ring-zinc-700"
          />

          {/* Photos */}
          <section className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-semibold">사진</h2>
              <label className="px-3 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer text-sm">
                사진 추가
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAddPhoto(e.target.files)} />
              </label>
            </div>

            {(!entry.photos || entry.photos.length === 0) && (
              <div className="text-sm text-zinc-500">아직 사진이 없어요. 위 버튼으로 추가해보세요.</div>
            )}

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {(entry.photos || []).map((src, i) => (
                <figure key={i} className="relative group">
                  <img src={src} alt={`photo-${i}`} className="w-full h-28 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-lg bg-zinc-900/80 text-white text-xs"
                  >삭제</button>
                </figure>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-zinc-500">
        오프라인에서도 작동합니다 · Ctrl/Cmd+S 저장 · Made for fast journaling ✍️
      </footer>
    </div>
  );
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}
