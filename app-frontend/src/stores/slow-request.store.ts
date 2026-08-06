import { create } from "zustand";

const SLOW_REQUEST_DELAY_MS = 2_000;

interface SlowRequestState {
  pendingRequests: number;
  start: () => void;
  finish: () => void;
}

export const useSlowRequestStore = create<SlowRequestState>()((set) => ({
  pendingRequests: 0,
  start: () => set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  finish: () =>
    set((state) => ({ pendingRequests: Math.max(0, state.pendingRequests - 1) }))
}));

export function trackSlowRequest(): () => void {
  if (typeof window === "undefined") return () => undefined;

  let isVisible = false;
  const timeout = window.setTimeout(() => {
    isVisible = true;
    useSlowRequestStore.getState().start();
  }, SLOW_REQUEST_DELAY_MS);

  return () => {
    window.clearTimeout(timeout);
    if (isVisible) useSlowRequestStore.getState().finish();
  };
}
