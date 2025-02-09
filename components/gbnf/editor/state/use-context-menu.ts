import {
  MouseEventHandler,
  TouchEventHandler,
  TouchEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface ContextMenuState {
  x: number;
  y: number;
  sourceNode?: string;
  targetNode?: string;
  showEndOption?: boolean;
  handleType?: "source" | "target";
  existingConnection?: { id: string; source: string; target: string };
}

export interface ContextMenuHandlers {
  contextMenu: ContextMenuState | null;
  setContextMenu: (menu: ContextMenuState | null) => void;
  handlePaneContextMenu: MouseEventHandler<HTMLDivElement>;
  handlePaneTouchStart: TouchEventHandler<HTMLDivElement>;
  handlePaneTouchEnd: () => void;
  handlePaneTouchMove: () => void;
}

const MENU_PADDING = 4; // Padding from viewport edges

export function useContextMenu(): ContextMenuHandlers {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Adjust menu position to stay within viewport
  const adjustMenuPosition = useCallback((x: number, y: number) => {
    const menuElement = document.querySelector(".context-menu");
    if (!menuElement) {
      // If menu isn't mounted yet, use reasonable defaults
      const menuWidth = 200;
      const menuHeight = 300;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust horizontal position
      if (x + menuWidth > viewportWidth - MENU_PADDING) {
        adjustedX = viewportWidth - menuWidth - MENU_PADDING;
      }
      if (adjustedX < MENU_PADDING) {
        adjustedX = MENU_PADDING;
      }

      // Adjust vertical position
      if (y + menuHeight > viewportHeight - MENU_PADDING) {
        adjustedY = viewportHeight - menuHeight - MENU_PADDING;
      }
      if (adjustedY < MENU_PADDING) {
        adjustedY = MENU_PADDING;
      }

      return { x: adjustedX, y: adjustedY };
    }

    const { width: menuWidth, height: menuHeight } =
      menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + menuWidth > viewportWidth - MENU_PADDING) {
      adjustedX = viewportWidth - menuWidth - MENU_PADDING;
    }
    if (adjustedX < MENU_PADDING) {
      adjustedX = MENU_PADDING;
    }

    // Adjust vertical position
    if (y + menuHeight > viewportHeight - MENU_PADDING) {
      adjustedY = viewportHeight - menuHeight - MENU_PADDING;
    }
    if (adjustedY < MENU_PADDING) {
      adjustedY = MENU_PADDING;
    }

    return { x: adjustedX, y: adjustedY };
  }, []);

  // Update menu position after it's mounted
  useEffect(() => {
    if (!contextMenu) return;

    // Wait for the menu to be mounted and measured
    requestAnimationFrame(() => {
      const { x, y } = adjustMenuPosition(contextMenu.x, contextMenu.y);
      if (x !== contextMenu.x || y !== contextMenu.y) {
        setContextMenu((prev) => prev && { ...prev, x, y });
      }
    });
  }, [contextMenu, adjustMenuPosition]);

  const handlePaneContextMenu = useCallback<MouseEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();

      // Don't show pane context menu if clicking on a node
      const target = event.target as Element;
      if (target.closest(".react-flow__node")) return;

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        showEndOption: false,
      });
    },
    []
  );

  const handlePaneTouchStart = useCallback(
    (event: TouchEvent) => {
      // Only handle touch events, not mouse events
      if (!event.touches) return;

      if (longPressTimer) clearTimeout(longPressTimer);
      const timer = setTimeout(() => {
        const touch = event.touches[0];
        setContextMenu({
          x: touch.clientX,
          y: touch.clientY,
        });
      }, 500);
      setLongPressTimer(timer);
    },
    [longPressTimer]
  );

  const handlePaneTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handlePaneTouchMove = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Handle clicking outside and escape key
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".context-menu")) {
        setContextMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  return {
    contextMenu,
    setContextMenu,
    handlePaneContextMenu,
    handlePaneTouchStart,
    handlePaneTouchEnd,
    handlePaneTouchMove,
  };
}
