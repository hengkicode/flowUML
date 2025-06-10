import { useState, useCallback } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialPresent: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const set = useCallback(
    (newPresent: T | ((prev: T) => T)) => {
      setHistory(({ past, present }) => {
        const updated = typeof newPresent === 'function'
          ? (newPresent as (prev: T) => T)(present)
          : newPresent;

        return {
          past: [...past, present],
          present: updated,
          future: [],
        };
      });
    },
    []
  );

  const undo = useCallback(() => {
    setHistory(({ past, present, future }) => {
      if (past.length === 0) return { past, present, future };
      const previous = past[past.length - 1];
      const newPast = past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(({ past, present, future }) => {
      if (future.length === 0) return { past, present, future };
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const removeRow = useCallback((index: number) => {
    set((prev: T) => {
      if (!Array.isArray(prev)) return prev;
      return (prev as T & any[]).filter((_, i) => i !== index) as T;
    });
  }, [set]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    set,
    undo,
    redo,
    removeRow,
    canUndo,
    canRedo,
  };
}
