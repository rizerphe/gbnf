import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onNew: () => void;
  onExport: () => void;
  onCommandOpen: () => void;
  onSelectAll?: () => void;
}

export function useKeyboardShortcuts({
  onNew,
  onExport,
  onCommandOpen,
  onSelectAll,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't handle shortcuts if we're in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key.toLowerCase() === "k" && isMod) {
        e.preventDefault();
        onCommandOpen();
      } else if (e.key.toLowerCase() === "e" && isMod) {
        e.preventDefault();
        onExport();
      } else if (
        (e.key.toLowerCase() === "n" && isMod) ||
        (e.key.toLowerCase() === "m" && isMod)
      ) {
        e.preventDefault();
        onNew();
      } else if (e.key.toLowerCase() === "a" && isMod) {
        e.preventDefault();
        onSelectAll?.();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onNew, onExport, onCommandOpen, onSelectAll]);
}
