"use client";
import { useCallback, useState, useRef } from "react";
import { GBNFNode, GBNFEdge, SavedGrammar } from "../../types";
import { toast } from "sonner";

export interface SavedGrammarsHandlers {
  savedGrammars: SavedGrammar[];
  handleDelete: (id: string) => void;
  loadGrammar: (grammar: SavedGrammar) => void;
  saveCurrentGrammar: (
    currentId: string,
    currentName: string | null,
    nodes: GBNFNode[],
    edges: GBNFEdge[]
  ) => void;
}

function getStateHash(nodes: GBNFNode[], edges: GBNFEdge[]): string {
  const nodeStr = nodes
    .map(
      (n) =>
        `${n.id}:${n.type}:${n.position.x}:${n.position.y}:${JSON.stringify(
          n.data
        )}`
    )
    .join("|");
  const edgeStr = edges
    .map((e) => `${e.id}:${e.source}:${e.target}:${e.type}`)
    .join("|");
  return `${nodeStr}#${edgeStr}`;
}

export function useSavedGrammars(
  setNodes: (nodes: GBNFNode[]) => void,
  setEdges: (edges: GBNFEdge[]) => void,
  setCurrentName: (name: string | null) => void,
  setCurrentId: (id: string) => void
): SavedGrammarsHandlers {
  const [savedGrammars, setSavedGrammars] = useState<SavedGrammar[]>(() => {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem("gbnf-grammars");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep track of the last saved state to avoid unnecessary updates
  const lastSavedRef = useRef<{
    id: string;
    hash: string;
    name: string | null;
  } | null>(null);

  const handleDelete = useCallback((id: string) => {
    setSavedGrammars((grammars) => {
      const newGrammars = grammars.filter((g) => g.id !== id);
      localStorage.setItem("gbnf-grammars", JSON.stringify(newGrammars));
      return newGrammars;
    });
  }, []);

  const loadGrammar = useCallback(
    (grammar: SavedGrammar) => {
      try {
        const clonedNodes = grammar.nodes.map((node) => ({
          ...node,
          position: { ...node.position },
          data: {
            ...node.data,
            properties: { ...node.data.properties },
          },
        }));

        const clonedEdges = grammar.edges.map((edge) => ({
          ...edge,
          style: { stroke: "#666" },
        }));

        setNodes(clonedNodes);
        setEdges(clonedEdges);
        setCurrentName(grammar.name);
        setCurrentId(grammar.id);

        // Update last saved state after loading
        lastSavedRef.current = {
          id: grammar.id,
          hash: getStateHash(clonedNodes, clonedEdges),
          name: grammar.name,
        };
      } catch {
        toast.error("Failed to load grammar");
      }
    },
    [setNodes, setEdges, setCurrentName, setCurrentId]
  );

  const saveCurrentGrammar = useCallback(
    (
      currentId: string,
      currentName: string | null,
      nodes: GBNFNode[],
      edges: GBNFEdge[]
    ) => {
      if (!currentId) return;

      if (nodes.length <= 2) return;

      // Check if this state is different from the last saved state
      const currentHash = getStateHash(nodes, edges);
      const lastSaved = lastSavedRef.current;
      if (
        lastSaved &&
        lastSaved.id === currentId &&
        lastSaved.hash === currentHash &&
        lastSaved.name === currentName
      )
        return;

      try {
        // Clean up edges but preserve necessary information
        const cleanedEdges: GBNFEdge[] = edges.map((edge) => {
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type,
            data: edge.data,
          };
        });

        const grammar: SavedGrammar = {
          id: currentId,
          name: currentName,
          nodes,
          edges: cleanedEdges,
          createdAt:
            savedGrammars.find((g) => g.id === currentId)?.createdAt ||
            Date.now(),
          updatedAt: Date.now(),
        };

        setSavedGrammars((grammars) => {
          const newGrammars = grammars.filter((g) => g.id !== currentId);
          newGrammars.push(grammar);
          try {
            localStorage.setItem("gbnf-grammars", JSON.stringify(newGrammars));

            // Update last saved state
            lastSavedRef.current = {
              id: currentId,
              hash: currentHash,
              name: currentName,
            };
          } catch {
            toast.error("Failed to save grammar");
          }
          return newGrammars;
        });
      } catch {
        toast.error("Failed to save grammar");
      }
    },
    [savedGrammars]
  );

  return {
    savedGrammars,
    handleDelete,
    loadGrammar,
    saveCurrentGrammar,
  };
}
