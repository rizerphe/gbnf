import { Node, Edge, XYPosition } from "@xyflow/react";
import { GBNFNodeTypes } from "./nodes";

export interface GBNFNode extends Node {
  type: keyof typeof GBNFNodeTypes;
  position: XYPosition;
  data: {
    label: string;
    name: string | null;
    properties: Record<string, string | number | boolean>;
    onPropertyChange?: (key: string, value: string | number | boolean) => void;
  };
}

export interface GBNFEdge extends Edge {
  source: string;
  target: string;
  type?: "default" | "smoothstep" | "bezier" | "self-connecting";
  data?: {
    label?: string;
    isFeedback?: boolean;
    pathLength?: number;
  };
}

export interface SavedGrammar {
  id: string;
  name: string | null;
  nodes: GBNFNode[];
  edges: GBNFEdge[];
  createdAt: number;
  updatedAt: number;
}

export const initialNodes: GBNFNode[] = [
  {
    id: "start",
    type: "startNode",
    position: { x: 0, y: 0 },
    data: {
      label: "Start",
      name: "root",
      properties: {},
    },
  },
  {
    id: "end",
    type: "endNode",
    position: { x: 1000, y: 0 },
    data: {
      label: "End",
      name: null,
      properties: {},
    },
  },
];
