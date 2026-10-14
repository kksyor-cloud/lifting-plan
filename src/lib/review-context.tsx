import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { DEFAULT_INPUT, review, ReviewInput, ReviewResult } from './calc';

// 검토 한 건의 단일 상태. 모든 화면은 같은 input 에서 계산한 result 를 읽는다.
type Ctx = {
  input: ReviewInput;
  setInput: (patch: Partial<ReviewInput>) => void;
  reset: (next?: ReviewInput, craneId?: string | null) => void;
  result: ReviewResult;
  craneId: string | null;
  setCraneId: (id: string) => void;
};

const ReviewContext = createContext<Ctx | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [input, setInputState] = useState<ReviewInput>(DEFAULT_INPUT);
  const [chosen, setChosen] = useState<string | null>(null);
  const result = useMemo(() => review(input), [input]);

  const value: Ctx = {
    input,
    setInput: (patch) => setInputState((prev) => ({ ...prev, ...patch })),
    reset: (next = DEFAULT_INPUT, craneId = null) => {
      setInputState(next);
      setChosen(craneId);
    },
    result,
    // 사용자가 고르지 않았으면 추천 장비를 쓴다.
    craneId: chosen ?? result.recommendedId,
    setCraneId: setChosen,
  };
  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used inside ReviewProvider');
  return ctx;
}
