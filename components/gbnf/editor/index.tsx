import { RefObject, useCallback, useState, useEffect, useRef } from "react";
import {
  Background,
  Controls,
  Panel,
  ConnectionMode,
  ReactFlowProvider,
  ReactFlow,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";
import { Maximize, Minimize } from "lucide-react";
import "@xyflow/react/dist/style.css";
import { GBNFNodeTypes } from "../nodes";
import { SelfConnectingEdge } from "../edges";
import { GBNFEdge } from "../types";
import { findFeedbackEdges } from "../utils/feedback-edges";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { Toolbar } from "./toolbar";
import { NODE_TYPES } from "../sidebar";
import { useNodeEvents } from "./state/use-node-events";
import { useContextMenu } from "./state/use-context-menu";
import { useKeyboardShortcuts } from "./state/use-keyboard-shortcuts";
import { useDragAndDrop } from "./state/use-drag-and-drop";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditorProvider, useEditor } from "./context/editor-context";

const edgeTypes = {
  "self-connecting": SelfConnectingEdge,
};

export type AddNodeRef = {
  addNode: (type: keyof typeof GBNFNodeTypes) => void;
};

function GBNFEditorInner({
  addNodeRef,
}: {
  addNodeRef?: RefObject<AddNodeRef>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { isFullscreen, toggleFullscreen, dismissPrompt } = useFullscreen();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    selectedNodes,
    setSelectedNodes,
    resetState,
    handleExport,
    setCommandOpen,
  } = useEditor();

  // Context menu
  const contextMenuHandlers = useContextMenu();

  // Node event handlers
  const nodeEvents = useNodeEvents(
    setNodes,
    setEdges,
    setSelectedNodes,
    contextMenuHandlers.setContextMenu
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNew: resetState,
    onExport: handleExport,
    onCommandOpen: () => setCommandOpen(true),
    onSelectAll: () => {
      onNodesChange(
        nodes.map((node) => ({
          type: "select",
          id: node.id,
          selected: true,
        }))
      );
    },
    nodes,
    edges,
    selectedNodes,
    setNodes,
    setEdges,
  });

  // Drag and drop
  const dragAndDropHandlers = useDragAndDrop(containerRef, nodeEvents.addNode);

  // Handle node drag in fullscreen
  const handleNodeDrag = useCallback(() => {
    if (!document.fullscreenElement && isMobile) {
      dismissPrompt();
      return false;
    }
    return true;
  }, [isMobile, dismissPrompt]);

  // Update feedback edges whenever edges or nodes change
  const [feedbackEdges, setFeedbackEdges] = useState<Set<string>>(new Set());
  const [pathLengths, setPathLengths] = useState<Map<string, number>>(
    new Map()
  );

  useEffect(() => {
    const result = findFeedbackEdges(nodes, edges);
    setFeedbackEdges(result.feedbackEdges);
    setPathLengths(result.pathLengths);
  }, [nodes, edges]);

  // Add node ref effect
  useEffect(() => {
    if (addNodeRef) {
      addNodeRef.current = {
        addNode: nodeEvents.addNode,
      };
    }
  }, [addNodeRef, nodeEvents.addNode]);

  const { screenToFlowPosition } = useReactFlow();

  return (
    <div className="flex h-full flex-col">
      <Toolbar isMobile={isMobile} />
      <ReactFlow
        colorMode="dark"
        nodes={nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onPropertyChange: (key: string, value: string | number | boolean) =>
              nodeEvents.onPropertyChange(node.id, key, value),
          },
        }))}
        edges={(edges || []).map((edge) => {
          const edgeId = [
            edge.source,
            edge.sourceHandle,
            edge.target,
            edge.targetHandle,
          ]
            .filter(Boolean)
            .join("->");
          const isFeedback = feedbackEdges.has(edgeId) || edge.data?.isFeedback;
          const pathLength = pathLengths.get(edgeId) || 0;
          return {
            ...edge,
            type:
              edge.source === edge.target || isFeedback
                ? "self-connecting"
                : "smoothstep",
            data: {
              ...edge.data,
              pathLength,
              isFeedback,
            },
          } as GBNFEdge;
        })}
        className="flex-1 min-h-0 w-full touch-none overflow-hidden"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={(event, params) => {
          const nodeId = params.nodeId;
          if (!nodeId) return;

          const node = document.querySelector(`[data-id="${nodeId}"]`);
          if (node) {
            node.classList.add("connecting");
          }
        }}
        onConnectEnd={(event, connectionState) => {
          if (!event) return;

          // Always remove the connecting class, regardless of connection validity
          const connectingNodes = document.querySelectorAll(".connecting");
          connectingNodes.forEach((node) =>
            node.classList.remove("connecting")
          );

          // Check if we're trying to disconnect by drawing again
          const fromNodeId = connectionState?.fromNode?.id;
          const toNodeId = connectionState?.toNode?.id;
          if (fromNodeId && toNodeId) {
            const existingEdge = edges.find(
              (edge) => edge.source === fromNodeId && edge.target === toNodeId
            );
            if (existingEdge) {
              // If the edge already exists, remove it (disconnect)
              setEdges((edges: GBNFEdge[]) =>
                edges.filter((edge) => edge.id !== existingEdge.id)
              );
              return;
            }
          }

          // Show context menu for invalid connections or when clicking in empty space
          if (!connectionState?.isValid) {
            const { clientX, clientY } =
              "changedTouches" in event ? event.changedTouches[0] : event;

            const handleType = connectionState?.fromHandle?.type;

            // Check for existing connection to start/end
            let existingConnection = null;
            if (fromNodeId) {
              existingConnection = edges.find(
                (edge) =>
                  (handleType === "target" &&
                    edge.source === "start" &&
                    edge.target === fromNodeId) ||
                  (handleType === "source" &&
                    edge.source === fromNodeId &&
                    edge.target === "end")
              );
            }

            contextMenuHandlers.setContextMenu({
              x: clientX,
              y: clientY,
              ...(fromNodeId
                ? {
                    sourceNode: fromNodeId,
                    handleType,
                    existingConnection: existingConnection
                      ? {
                          id: existingConnection.id,
                          source: existingConnection.source,
                          target: existingConnection.target,
                        }
                      : undefined,
                  }
                : {}),
              showEndOption: Boolean(fromNodeId),
            });
          }
        }}
        onNodeDragStart={handleNodeDrag}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDrag}
        onSelectionChange={nodeEvents.onSelectionChange}
        onContextMenu={contextMenuHandlers.handlePaneContextMenu}
        onTouchStart={contextMenuHandlers.handlePaneTouchStart}
        onTouchMove={contextMenuHandlers.handlePaneTouchMove}
        onTouchEnd={contextMenuHandlers.handlePaneTouchEnd}
        nodeTypes={GBNFNodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Strict}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        onDragOver={dragAndDropHandlers.onDragOver}
        onDrop={dragAndDropHandlers.onDrop}
        ref={containerRef}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#666" },
        }}
        connectOnClick={false}
        panOnDrag={[1, 2]}
        zoomOnPinch={true}
        preventScrolling={true}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button
            className="rounded-md bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 text-sm font-medium"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </Panel>
      </ReactFlow>

      {contextMenuHandlers.contextMenu && (
        <div
          className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md context-menu"
          style={{
            top: contextMenuHandlers.contextMenu.y,
            left: contextMenuHandlers.contextMenu.x,
          }}
        >
          {NODE_TYPES.map((type) => (
            <button
              key={type.id}
              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
              onClick={() => {
                if (!contextMenuHandlers.contextMenu) return;

                const position = screenToFlowPosition({
                  x: contextMenuHandlers.contextMenu.x,
                  y: contextMenuHandlers.contextMenu.y,
                });

                const sourceNode = contextMenuHandlers.contextMenu.sourceNode;
                const handleType = contextMenuHandlers.contextMenu.handleType;
                if (handleType === "target") {
                  position.x -= 200;
                }

                const newNodeId = nodeEvents.addNode(
                  type.id as keyof typeof GBNFNodeTypes,
                  position
                );

                // If this was from a connection attempt, create the connection
                if (sourceNode && newNodeId) {
                  setEdges((eds: GBNFEdge[]) => [
                    ...eds,
                    {
                      id:
                        handleType === "target"
                          ? `${newNodeId}->${sourceNode}`
                          : `${sourceNode}->${newNodeId}`,
                      source: handleType === "target" ? newNodeId : sourceNode,
                      target: handleType === "target" ? sourceNode : newNodeId,
                      type: "bezier",
                      style: { stroke: "#666" },
                    },
                  ]);
                }

                contextMenuHandlers.setContextMenu(null);
              }}
            >
              <div className="flex flex-col items-start">
                <span>{type.label}</span>
                <span className="text-xs text-muted-foreground">
                  {type.description}
                </span>
              </div>
            </button>
          ))}
          {contextMenuHandlers.contextMenu.sourceNode && (
            <>
              <div className="-mx-1 my-1 h-px bg-border" />
              <button
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  if (contextMenuHandlers.contextMenu?.sourceNode) {
                    const sourceNode =
                      contextMenuHandlers.contextMenu.sourceNode;
                    const handleType =
                      contextMenuHandlers.contextMenu.handleType;
                    const existingConnection =
                      contextMenuHandlers.contextMenu.existingConnection;

                    if (existingConnection) {
                      // Remove the existing connection
                      setEdges((eds: GBNFEdge[]) =>
                        eds.filter((edge) => edge.id !== existingConnection.id)
                      );
                    } else {
                      // Create new connection
                      setEdges((eds: GBNFEdge[]) => [
                        ...eds,
                        {
                          id:
                            handleType === "target"
                              ? `start->${sourceNode}`
                              : `${sourceNode}->end`,
                          source:
                            handleType === "target" ? "start" : sourceNode,
                          target: handleType === "target" ? sourceNode : "end",
                          type: "bezier",
                          style: { stroke: "#666" },
                        },
                      ]);
                    }
                  }
                  contextMenuHandlers.setContextMenu(null);
                }}
              >
                <div className="flex flex-col items-start">
                  <span
                    className={
                      contextMenuHandlers.contextMenu?.existingConnection
                        ? contextMenuHandlers.contextMenu?.handleType ===
                          "target"
                          ? "text-red-400" // Red for disconnecting from start
                          : "text-green-400" // Green for disconnecting from end
                        : contextMenuHandlers.contextMenu?.handleType ===
                          "target"
                        ? "text-green-400" // Green for connecting to start
                        : "text-red-400" // Red for connecting to end
                    }
                  >
                    {contextMenuHandlers.contextMenu?.existingConnection
                      ? contextMenuHandlers.contextMenu?.handleType === "target"
                        ? "Disconnect from Start"
                        : "Disconnect from End"
                      : contextMenuHandlers.contextMenu?.handleType === "target"
                      ? "Connect to Start"
                      : "Connect to End"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contextMenuHandlers.contextMenu?.existingConnection
                      ? contextMenuHandlers.contextMenu?.handleType === "target"
                        ? "Remove connection to the start node"
                        : "Remove connection to the end node"
                      : contextMenuHandlers.contextMenu?.handleType === "target"
                      ? "Connect directly to the start node"
                      : "Connect directly to the end node"}
                  </span>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function GBNFEditor({
  addNodeRef,
}: {
  addNodeRef?: RefObject<AddNodeRef>;
}) {
  return (
    <ReactFlowProvider>
      <EditorProvider>
        <GBNFEditorInner addNodeRef={addNodeRef} />
      </EditorProvider>
    </ReactFlowProvider>
  );
}
