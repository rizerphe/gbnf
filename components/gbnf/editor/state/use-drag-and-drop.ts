import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { GBNFNodeTypes } from "@/components/gbnf/nodes";
import type { DragEvent, RefObject } from "react";

export interface DragAndDropHandlers {
  onDragOver: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

export function useDragAndDrop(
  containerRef: RefObject<HTMLDivElement | null>,
  addNode: (
    type: keyof typeof GBNFNodeTypes,
    position?: { x: number; y: number }
  ) => void
): DragAndDropHandlers {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as keyof typeof GBNFNodeTypes;
      if (!type) return;

      const reactFlowBounds = containerRef.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, containerRef, addNode]
  );

  return {
    onDragOver,
    onDrop,
  };
}
