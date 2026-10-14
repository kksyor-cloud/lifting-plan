import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeInput, ReviewInput } from './calc';

// Results are not stored; only the input and the selected crane are saved.
// On reopen, results are rebuilt with the same calculation logic so values never diverge between screens.
export type SavedReview = {
  id: string;
  savedAt: string;
  input: ReviewInput;
  craneId: string;
};

const KEY = 'liftnote.reviews.v1';

export async function loadReviews(): Promise<SavedReview[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedReview[]) : [];
    return list.map((r) => ({ ...r, input: normalizeInput(r.input) }));
  } catch {
    return [];
  }
}

async function write(list: SavedReview[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function saveReview(input: ReviewInput, craneId: string): Promise<SavedReview> {
  const item: SavedReview = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    savedAt: new Date().toISOString(),
    input,
    craneId,
  };
  const list = await loadReviews();
  await write([item, ...list]);
  return item;
}

export async function deleteReview(id: string) {
  const list = await loadReviews();
  await write(list.filter((r) => r.id !== id));
}

export async function clearReviews() {
  await write([]);
}
