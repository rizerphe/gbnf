import { GBNFNode, GBNFEdge } from "../types";

export function validateConnections(
  nodes: GBNFNode[],
  edges: GBNFEdge[]
): { valid: boolean; unconnectedNodes: string[] } {
  const unconnectedNodes: string[] = [];

  nodes.forEach((node) => {
    if (node.type === "startNode") {
      const hasOutgoing = edges.some((edge) => edge.source === node.id);
      if (!hasOutgoing) unconnectedNodes.push("Start");
    } else if (node.type === "endNode") {
      const hasIncoming = edges.some((edge) => edge.target === node.id);
      if (!hasIncoming) unconnectedNodes.push("End");
    } else {
      const hasIncoming = edges.some((edge) => edge.target === node.id);
      const hasOutgoing = edges.some((edge) => edge.source === node.id);
      if (!hasIncoming || !hasOutgoing) {
        unconnectedNodes.push(node.data.name || node.data.label);
      }
    }
  });

  return {
    valid: unconnectedNodes.length === 0,
    unconnectedNodes,
  };
}
