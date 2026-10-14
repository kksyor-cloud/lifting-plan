import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { autoDistance, DEFAULT_INPUT, Locks, review, ReviewInput, ReviewResult, stepCrane } from './calc';
import { findCrane } from './cranes';

// 검토 한 건의 단일 상태. 모든 화면은 같은 input 에서 계산한 result 를 읽는다.
type Ctx = {
  input: ReviewInput;
  setInput: (patch: Partial<ReviewInput>) => void;
  reset: (next?: ReviewInput, craneId?: string | null) => void;
  result: ReviewResult;
  craneId: string | null;
  setCraneId: (id: string) => void;
  /** 자물쇠: 고정한 값은 자동계산에서 바꾸지 않는다 */
  locks: Locks;
  toggleLock: (k: keyof Locks) => void;
  /** UP(+1) / DN(-1): 한 단계 큰·작은 장비로 바꾼다. 끝이면 false */
  step: (dir: 1 | -1) => boolean;
  /** 최대거리 자동계산. 찾으면 이격거리·작업반경을 바꾸고 true */
  auto: () => boolean;
};

const ReviewContext = createContext<Ctx | null>(null);

const NO_LOCKS: Locks = { setback: false, radius: false };

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [input, setInputState] = useState<ReviewInput>(DEFAULT_INPUT);
  const [chosen, setChosen] = useState<string | null>(null);
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const result = useMemo(() => review(input), [input]);
  // 사용자가 고르지 않았으면 추천 장비(조건을 만족하는 가장 작은 장비)를 쓴다.
  const craneId = chosen ?? result.recommendedId ?? result.evals[result.evals.length - 1]?.crane.id ?? null;

  const value: Ctx = {
    input,
    setInput: (patch) => setInputState((prev) => ({ ...prev, ...patch })),
    reset: (next = DEFAULT_INPUT, id = null) => {
      setInputState(next);
      setChosen(id);
      setLocks(NO_LOCKS);
    },
    result,
    craneId,
    setCraneId: setChosen,
    locks,
    toggleLock: (k) => setLocks((l) => ({ ...l, [k]: !l[k] })),
    step: (dir) => {
      const next = stepCrane(craneId, dir);
      if (!next) return false;
      setChosen(next.id);
      return true;
    },
    auto: () => {
      const crane = craneId ? findCrane(craneId) : undefined;
      const plan = crane ? autoDistance(crane, input, locks) : null;
      if (!crane || !plan) return false;
      setChosen(crane.id);
      setInputState((prev) => ({ ...prev, setback: plan.setback, radius: plan.radius }));
      return true;
    },
  };
  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used inside ReviewProvider');
  return ctx;
}
