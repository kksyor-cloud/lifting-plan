import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { autoDistance, DEFAULT_INPUT, Locks, review, ReviewInput, ReviewResult, stepCrane } from './calc';
import { findCrane } from './cranes';

// Single state for one review. Every screen reads the result computed from the same input.
type Ctx = {
  input: ReviewInput;
  setInput: (patch: Partial<ReviewInput>) => void;
  reset: (next?: ReviewInput, craneId?: string | null) => void;
  result: ReviewResult;
  craneId: string | null;
  setCraneId: (id: string) => void;
  /** Locks: locked values are not changed by auto-calc */
  locks: Locks;
  toggleLock: (k: keyof Locks) => void;
  /** UP(+1) / DN(-1): switch to the next larger/smaller crane. false at either end */
  step: (dir: 1 | -1) => boolean;
  /** Max-distance auto-calc. If found, updates setback and working radius and returns true */
  auto: () => boolean;
};

const ReviewContext = createContext<Ctx | null>(null);

const NO_LOCKS: Locks = { setback: false, radius: false };

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [input, setInputState] = useState<ReviewInput>(DEFAULT_INPUT);
  const [chosen, setChosen] = useState<string | null>(null);
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const result = useMemo(() => review(input), [input]);
  // If the user has not picked one, use the recommended crane (the smallest that meets the conditions).
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
