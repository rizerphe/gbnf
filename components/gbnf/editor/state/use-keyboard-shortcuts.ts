import { useEffect } from "react";
import { GBNFNode, GBNFEdge } from "../../types";
import { generateUUID } from "../../utils/uuid";

interface KeyboardShortcutHandlers {
  onNew: () => void;
  onExport: () => void;
  onCommandOpen: () => void;
  onSelectAll?: () => void;
  nodes: GBNFNode[];
  edges: GBNFEdge[];
  selectedNodes: string[];
  setNodes: (nodes: GBNFNode[] | ((nodes: GBNFNode[]) => GBNFNode[])) => void;
  setEdges: (edges: GBNFEdge[] | ((edges: GBNFEdge[]) => GBNFEdge[])) => void;
}

export function useKeyboardShortcuts({
  onNew,
  onExport,
  onCommandOpen,
  onSelectAll,
  nodes,
  edges,
  selectedNodes,
  setNodes,
  setEdges,
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
      } else if (e.key.toLowerCase() === "c" && isMod) {
        e.preventDefault();
        // Copy selected nodes
        if (selectedNodes.length > 0) {
          const nodesToCopy = nodes.filter(node => selectedNodes.includes(node.id));
          const edgesToCopy = edges.filter(edge => 
            selectedNodes.includes(edge.source) && selectedNodes.includes(edge.target)
          );
          
          const clipboardData = {
            nodes: nodesToCopy,
            edges: edgesToCopy
          };
          
          localStorage.setItem('gbnf-clipboard', JSON.stringify(clipboardData));
        }
      } else if (e.key.toLowerCase() === "x" && isMod) {
        e.preventDefault();
        // Cut selected nodes
        if (selectedNodes.length > 0) {
          const nodesToCopy = nodes.filter(node => selectedNodes.includes(node.id));
          const edgesToCopy = edges.filter(edge => 
            selectedNodes.includes(edge.source) && selectedNodes.includes(edge.target)
          );
          
          const clipboardData = {
            nodes: nodesToCopy,
            edges: edgesToCopy
          };
          
          localStorage.setItem('gbnf-clipboard', JSON.stringify(clipboardData));
          
          // Remove cut nodes and their edges
          setNodes(nodes => nodes.filter(node => !selectedNodes.includes(node.id)));
          setEdges(edges => edges.filter(edge => 
            !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)
          ));
        }
      } else if (e.key.toLowerCase() === "v" && isMod) {
        e.preventDefault();
        // Paste nodes
        const clipboardJson = localStorage.getItem('gbnf-clipboard');
        if (clipboardJson) {
          try {
            const clipboard = JSON.parse(clipboardJson);
            const idMap = new Map<string, string>();
            
            // Deselect all existing nodes first
            setNodes(nodes => nodes.map(node => ({
              ...node,
              selected: false
            })));
            
            // Create new nodes with new IDs
            const newNodes = clipboard.nodes.map((node: GBNFNode) => {
              const newId = `${node.type}-${generateUUID()}`;
              idMap.set(node.id, newId);
              
              // Offset pasted nodes slightly from original position
              const position = {
                x: node.position.x + 50,
                y: node.position.y + 50
              };
              
              return {
                ...node,
                id: newId,
                position,
                selected: true
              };
            });
            
            // Create new edges with updated IDs
            const newEdges = clipboard.edges.map((edge: GBNFEdge) => ({
              ...edge,
              id: `${idMap.get(edge.source)}->${idMap.get(edge.target)}`,
              source: idMap.get(edge.source)!,
              target: idMap.get(edge.target)!
            }));
            
            setNodes(nodes => [...nodes, ...newNodes]);
            setEdges(edges => [...edges, ...newEdges]);

            // Update clipboard with the newly pasted nodes and edges
            const updatedClipboardData = {
              nodes: newNodes,
              edges: newEdges
            };
            localStorage.setItem('gbnf-clipboard', JSON.stringify(updatedClipboardData));
          } catch (error) {
            console.error('Failed to paste nodes:', error);
          }
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onNew, onExport, onCommandOpen, onSelectAll, nodes, edges, selectedNodes, setNodes, setEdges]);
}
