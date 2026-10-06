"use client";

import { useEffect, useState } from "react";

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
