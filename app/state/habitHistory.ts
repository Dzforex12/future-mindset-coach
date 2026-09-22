import { useMemoryStore, type HabitHistoryEntry } from "./memoryStore";

export function addHistoryEntry(habits: (number | string)[], date = new Date().toISOString().slice(0, 10)) {
  const { habitHistory, setHabitHistory } = useMemoryStore.getState();
  const entry: HabitHistoryEntry = { date, habits: [...habits] };
  const withoutDate = habitHistory.filter((history) => history.date !== date);

  setHabitHistory([...withoutDate, entry].sort((a, b) => a.date.localeCompare(b.date)));
}

export function getHistory() {
  return useMemoryStore.getState().habitHistory;
}