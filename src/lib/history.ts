import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeInput, ReviewInput } from './calc';

// 결과는 저장하지 않고 입력과 선택 장비만 저장한다.
// 다시 열 때 같은 계산 로직으로 결과를 만들어 화면마다 값이 어긋나지 않게 한다.
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
