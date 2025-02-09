import { GBNFNode, GBNFEdge, GBNFRule } from "../types";
import { optimize } from "./optimizations";

function normalizeIdentifier(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return /^[0-9]/.test(normalized) ? `_${normalized}` : normalized;
}

function makeUniqueName(name: string, existingNames: Set<string>): string {
  if (!existingNames.has(name)) return name;
  let counter = 1;
  while (existingNames.has(`${name}${counter}`)) {
    counter++;
  }
  return `${name}${counter}`;
}

function processAlternatives(alternatives: string[]): string {
  // Filter out empty strings from alternatives
  const nonEmptyAlts = alternatives.filter(Boolean);
  if (nonEmptyAlts.length === 0) return "";
  const joined =
    nonEmptyAlts.length === 1
      ? nonEmptyAlts[0]
      : `(${nonEmptyAlts.join(" | ")})`;
  return nonEmptyAlts.length === alternatives.length ? joined : `${joined}?`;
}

function getIntrinsicDefinition(node: GBNFNode): string {
  switch (node.type) {
    case "stringNode":
      return `"${node.data.properties.value || ""}"`;
    case "charSetNode":
      return `${node.data.properties.pattern || "[]"}`;
    case "letterNode":
      return "[a-zA-Z]";
    case "digitNode":
      return "[0-9]";
    case "nonNewlineNode":
      return "[^\\n]";
    case "identifierNode":
      return "[a-zA-Z_] [a-zA-Z0-9_]*";
    case "timeNode":
      return '[0-9] [0-9]? ("s" | "m" | "h" | "d" | "w" | "mo" | "y")';
  }
  return "";
}

export function generateGBNF(nodes: GBNFNode[], edges: GBNFEdge[]): string {
  // First pass: collect and normalize all names
  const existingNames = new Set<string>();
  const normalizedNames = new Map<string, string>();

  nodes.forEach((node) => {
    if (node.data.name) {
      const normalized = normalizeIdentifier(node.data.name);
      const unique = makeUniqueName(normalized, existingNames);
      normalizedNames.set(node.id, unique);
      existingNames.add(unique);
    }
  });

  // Give each node a rule name
  const ownRules = new Map<
    string,
    {
      name: string;
      intrinsic: string;
    }
  >(
    nodes.map((node, index) => {
      let ruleName: string;

      if (node.type === "startNode") {
        ruleName = "root";
      } else if (node.type === "endNode") {
        ruleName = "";
      } else if (normalizedNames.has(node.id)) {
        ruleName = normalizedNames.get(node.id)!;
      } else {
        const defaultName = makeUniqueName(`_rule${index}`, existingNames);
        existingNames.add(defaultName);
        ruleName = defaultName;
      }

      return [
        node.id,
        {
          name: ruleName,
          intrinsic: getIntrinsicDefinition(node),
        },
      ];
    })
  );

  // Create adjacency list for quick traversal and optimization
  const adjacencyList = new Map<string, string[]>();
  edges.forEach((edge) => {
    const sourceEdges =
      adjacencyList.get(ownRules.get(edge.source)!.name) || [];
    sourceEdges.push(ownRules.get(edge.target)!.name);
    adjacencyList.set(ownRules.get(edge.source)!.name, sourceEdges);
  });

  // Create a name-based map of rules for optimization
  const rulesByName = new Map<string, GBNFRule>();
  for (const [, rule] of ownRules) {
    if (rule.name) {
      rulesByName.set(rule.name, rule);
    }
  }

  // Optimizations go here
  optimize(adjacencyList, rulesByName);

  // Format the rules, ensuring root is first
  return [
    ...Array.from(rulesByName.values())
      .map((rule) => [
        rule.name,
        (
          rule.intrinsic +
          " " +
          processAlternatives(adjacencyList.get(rule.name) || [])
        ).trim(),
      ])
      .sort(([a], [b]) => {
        if (a === "root") return -1;
        if (b === "root") return 1;
        return a.localeCompare(b);
      })
      .map(([name, definition]) => definition && `${name} ::= ${definition}`),
  ]
    .filter(Boolean)
    .join("\n");
}
