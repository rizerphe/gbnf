import { GBNFNode, GBNFEdge } from "../types";

export function findFeedbackEdges(
  nodes: GBNFNode[],
  edges: GBNFEdge[]
): { feedbackEdges: Set<string>; pathLengths: Map<string, number> } {
  const adjacencyList = new Map<string, string[]>();
  const nodePositions = new Map<string, { x: number; y: number }>();
  const pathLengths = new Map<string, number>();

  // Map node positions
  nodes.forEach((node) => {
    nodePositions.set(node.id, { x: node.position.x, y: node.position.y });
    adjacencyList.set(node.id, []);
  });

  edges.forEach((edge) => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });

  const feedbackEdges = new Set<string>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function evaluateEdge(
    source: string,
    target: string
  ): { rightToLeft: number; verticalDistance: number; isBottomToTop: boolean } {
    const sourcePos = nodePositions.get(source) || { x: 0, y: 0 };
    const targetPos = nodePositions.get(target) || { x: 0, y: 0 };
    const xDiff = sourcePos.x - targetPos.x;
    return {
      // For vertical edges (xDiff === 0), consider them as right-to-left if they go bottom-to-top
      rightToLeft: xDiff === 0 ? (sourcePos.y > targetPos.y ? 1 : -1) : xDiff,
      verticalDistance: Math.abs(sourcePos.y - targetPos.y),
      isBottomToTop: sourcePos.y > targetPos.y,
    };
  }

  function isBetterFeedbackEdge(
    newEdge: { source: string; target: string },
    currentBest: { source: string; target: string } | null
  ): boolean {
    if (!currentBest) return true;

    const newMetrics = evaluateEdge(newEdge.source, newEdge.target);
    const currentMetrics = evaluateEdge(currentBest.source, currentBest.target);

    // First criterion: right-to-left distance (including vertical edges)
    if (newMetrics.rightToLeft !== currentMetrics.rightToLeft) {
      return newMetrics.rightToLeft > currentMetrics.rightToLeft;
    }

    // Second criterion: vertical distance
    if (newMetrics.verticalDistance !== currentMetrics.verticalDistance) {
      return newMetrics.verticalDistance > currentMetrics.verticalDistance;
    }

    // Third criterion: prefer bottom-to-top
    if (newMetrics.isBottomToTop !== currentMetrics.isBottomToTop) {
      return newMetrics.isBottomToTop;
    }

    // If everything is equal, randomly choose (using source id as seed)
    return newEdge.source > currentBest.source;
  }

  function processCycle(cycle: string[]): void {
    let bestFeedbackEdge: { source: string; target: string } | null = null;

    // Check all edges in the cycle
    for (let i = 0; i < cycle.length - 1; i++) {
      const newEdge = { source: cycle[i], target: cycle[i + 1] };
      if (isBetterFeedbackEdge(newEdge, bestFeedbackEdge)) {
        bestFeedbackEdge = newEdge;
      }
    }

    // Check the closing edge
    const closingEdge = {
      source: cycle[cycle.length - 1],
      target: cycle[0],
    };
    if (isBetterFeedbackEdge(closingEdge, bestFeedbackEdge)) {
      bestFeedbackEdge = closingEdge;
    }

    // Consider vertical edges as potential feedback edges
    if (bestFeedbackEdge) {
      const metrics = evaluateEdge(
        bestFeedbackEdge.source,
        bestFeedbackEdge.target
      );
      if (
        metrics.rightToLeft > 0 ||
        (metrics.rightToLeft === 0 && metrics.isBottomToTop)
      ) {
        const edgeId = `${bestFeedbackEdge.source}->${bestFeedbackEdge.target}`;
        feedbackEdges.add(edgeId);
        // Store the path length for this feedback edge
        pathLengths.set(edgeId, cycle.length);
      }
    }
  }

  function dfs(node: string, path: string[] = []): void {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = [...path.slice(cycleStart), node];
      processCycle(cycle);
      return;
    }

    recursionStack.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, path);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        const cycle = [...path.slice(cycleStart), neighbor];
        processCycle(cycle);
      }
    }

    path.pop();
    recursionStack.delete(node);
    visited.add(node);
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return { feedbackEdges, pathLengths };
}
