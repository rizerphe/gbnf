import { useCallback, useEffect } from "react";
import { Node, useReactFlow } from "@xyflow/react";
import { GBNFNode, GBNFEdge } from "../../types";
import { GBNFNodeTypes } from "../../nodes";
import { ContextMenuState } from "./use-context-menu";

export interface NodeEventHandlers {
  onNodeEvent: (type: string, nodeId: string) => void;
  onPropertyChange: (
    nodeId: string,
    key: string,
    value: string | number | boolean
  ) => void;
  onSelectionChange: ({ nodes }: { nodes: Node[] }) => void;
  addNode: (
    type: keyof typeof GBNFNodeTypes,
    position?: { x: number; y: number }
  ) => string;
}

export function useNodeEvents(
  setNodes: (nodes: GBNFNode[] | ((nodes: GBNFNode[]) => GBNFNode[])) => void,
  setEdges: (edges: GBNFEdge[] | ((edges: GBNFEdge[]) => GBNFEdge[])) => void,
  setSelectedNodes: (nodes: string[]) => void,
  setContextMenu: (menu: ContextMenuState | null) => void
): NodeEventHandlers {
  const { getViewport } = useReactFlow();

  const onNodeEvent = useCallback(
    (type: string, nodeId: string) => {
      if (["start", "end"].includes(nodeId)) return;

      switch (type) {
        case "delete":
          setNodes((nds) => nds.filter((node) => node.id !== nodeId));
          setEdges((eds) =>
            eds.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            )
          );
          break;
        case "toggleLoop":
          setEdges((eds) => {
            const existing = eds.find(
              (edge) => edge.source === nodeId && edge.target === nodeId
            );
            if (existing) {
              return eds.filter((edge) => edge.id !== existing.id);
            }
            return [
              ...eds,
              {
                id: `${nodeId}->${nodeId}`,
                source: nodeId,
                target: nodeId,
                type: "self-connecting",
                style: { stroke: "#666" },
              },
            ];
          });
          break;
        case "disconnectIncoming":
          setEdges((eds) => eds.filter((edge) => edge.target !== nodeId));
          break;
        case "disconnectOutgoing":
          setEdges((eds) => eds.filter((edge) => edge.source !== nodeId));
          break;
      }
    },
    [setNodes, setEdges]
  );

  // Set up event listeners for custom node events and keyboard shortcuts
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const handleCustomEvent = (event: CustomEvent<{ id: string }>) => {
      const type = event.type.replace("Node", "");
      onNodeEvent(type, event.detail.id);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        const selectedElements = document.querySelectorAll(
          ".react-flow__node.selected"
        );
        selectedElements.forEach((element) => {
          const nodeId = element.getAttribute("data-id");
          if (nodeId) {
            onNodeEvent("delete", nodeId);
          }
        });
      }
    };

    window.addEventListener("deleteNode", handleCustomEvent as EventListener, {
      signal,
    });
    window.addEventListener("toggleLoop", handleCustomEvent as EventListener, {
      signal,
    });
    window.addEventListener(
      "disconnectIncoming",
      handleCustomEvent as EventListener,
      { signal }
    );
    window.addEventListener(
      "disconnectOutgoing",
      handleCustomEvent as EventListener,
      { signal }
    );
    window.addEventListener("keydown", handleKeyDown, { signal });

    return () => controller.abort();
  }, [onNodeEvent]);

  const onPropertyChange = useCallback(
    (nodeId: string, key: string, value: string | number | boolean) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  [key]: key === "name" ? (value === "" ? null : value) : value,
                  properties:
                    key === "name"
                      ? node.data.properties
                      : {
                          ...node.data.properties,
                          [key]: value,
                        },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      setSelectedNodes(nodes.map((n) => n.id));
      setContextMenu(null);
    },
    [setSelectedNodes, setContextMenu]
  );

  const addNode = useCallback(
    (type: keyof typeof GBNFNodeTypes, position?: { x: number; y: number }) => {
      let nodePosition: { x: number; y: number };

      if (!position) {
        // Default center position for keyboard/command shortcuts
        const viewport = getViewport();
        nodePosition = {
          x: (window.innerWidth / 2 - viewport.x) / viewport.zoom,
          y: (window.innerHeight / 2 - viewport.y) / viewport.zoom,
        };
      } else {
        // Use the provided flow position
        nodePosition = position;
      }

      let newNodeId: string | undefined;

      setNodes((nds) => {
        newNodeId = `${type}-${nds.length + 1}`;
        const label =
          type === "stringNode"
            ? "String Match"
            : type === "charSetNode"
            ? "Character Set"
            : type === "letterNode"
            ? "Letter"
            : type === "digitNode"
            ? "Digit"
            : type === "nonNewlineNode"
            ? "Non-Newline"
            : type === "identifierNode"
            ? "Identifier"
            : type === "timeNode"
            ? "Time Duration"
            : type === "routerNode"
            ? "Router"
            : type;

        const initialProperties: Record<string, string | number | boolean> = {};
        switch (type) {
          case "stringNode":
            initialProperties.value = "";
            break;
          case "charSetNode":
            initialProperties.pattern = "";
            break;
        }

        return [
          ...nds,
          {
            id: newNodeId!,
            type,
            position: nodePosition,
            data: {
              label,
              name: null,
              properties: initialProperties,
            },
          },
        ];
      });

      return newNodeId!;
    },
    [getViewport, setNodes]
  );

  return {
    onNodeEvent,
    onPropertyChange,
    onSelectionChange,
    addNode,
  };
}
