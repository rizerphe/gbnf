import { useCallback, useState } from "react";
import {
  Connection,
  useEdgesState,
  useNodesState,
  OnNodesChange,
  OnEdgesChange,
} from "@xyflow/react";
import { GBNFNode, GBNFEdge, initialNodes } from "../../types";
import { addEdge } from "@xyflow/react";
import { generateUUID } from "@/components/gbnf/utils/uuid";

export interface EditorState {
  nodes: GBNFNode[];
  edges: GBNFEdge[];
  selectedNodes: string[];
  feedbackEdges: Set<string>;
  currentId: string;
  currentName: string | null;
  isEditingName: boolean;
}

export interface EditorStateActions {
  setNodes: (nodes: GBNFNode[] | ((nodes: GBNFNode[]) => GBNFNode[])) => void;
  onNodesChange: OnNodesChange;
  setEdges: (edges: GBNFEdge[] | ((edges: GBNFEdge[]) => GBNFEdge[])) => void;
  onEdgesChange: OnEdgesChange;
  setSelectedNodes: (nodes: string[]) => void;
  setFeedbackEdges: (edges: Set<string>) => void;
  setCurrentName: (name: string | null) => void;
  setIsEditingName: (isEditing: boolean) => void;
  setCurrentId: (id: string) => void;
  onConnect: (params: Connection) => void;
  resetState: () => void;
}

export function useEditorState(): [EditorState, EditorStateActions] {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<GBNFNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GBNFEdge>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [feedbackEdges, setFeedbackEdges] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string>(() => generateUUID());
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const resetState = useCallback(() => {
    setNodes(initialNodes);
    setEdges([]);
    setCurrentName(null);
    setCurrentId(generateUUID());
  }, [setNodes, setEdges]);

  return [
    {
      nodes,
      edges,
      selectedNodes,
      feedbackEdges,
      currentId,
      currentName,
      isEditingName,
    },
    {
      setNodes: setNodes as EditorStateActions["setNodes"],
      onNodesChange: onNodesChange as OnNodesChange,
      setEdges: setEdges as EditorStateActions["setEdges"],
      onEdgesChange: onEdgesChange as OnEdgesChange,
      setSelectedNodes,
      setFeedbackEdges,
      setCurrentName,
      setIsEditingName,
      setCurrentId,
      onConnect,
      resetState,
    },
  ];
}
