"use client";

import { useEffect, useState } from "react";

export function calculateActiveElapsed(session) {
  if (!session) return 0;
  let base = session.elapsedActiveSeconds || 0;
  if (session.timerState === "running" && session.lastStartedAt) {
    base += Math.max(0, Math.floor((Date.now() - new Date(session.lastStartedAt).getTime()) / 1000));
  } else if (!session.lastStartedAt && !session.elapsedActiveSeconds && session.startedAt) {
    base += Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
  }
  return base;
}

/** Elapsed-seconds ticker that survives re-renders. */
export function useElapsedSeconds({ active, initial = 0 }) {
  const [elapsed, setElapsed] = useState(initial);

  useEffect(() => {
    if (!active) return undefined;
    const iv = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(iv);
  }, [active]);

  return { elapsed, setElapsed };
}
