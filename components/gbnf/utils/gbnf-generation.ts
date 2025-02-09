import { GBNFNode, GBNFEdge } from "../types";

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
      // This will be handled specially in the rule generation
      return "";
    case "timeNode":
      // This will be handled specially in the rule generation
      return "";
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
      isComplex?: boolean;
    }
  >(
    nodes.map((node, index) => {
      const isComplex =
        node.type === "identifierNode" || node.type === "timeNode";
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
          isComplex,
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

  // Generate special rules for complex nodes
  const complexRules = new Map<string, string>();
  nodes.forEach((node) => {
    const rule = ownRules.get(node.id);
    if (!rule?.isComplex) return;

    switch (node.type) {
      case "identifierNode":
        complexRules.set(rule.name, `${rule.name} ::= [a-zA-Z_] [a-zA-Z0-9_]*`);
        break;
      case "timeNode":
        complexRules.set(
          rule.name,
          `${rule.name} ::= [0-9] [0-9]? ("s" | "m" | "h" | "d" | "w" | "mo" | "y")`
        );
        break;
    }
  });

  // Format the rules, ensuring root is first, followed by complex rules
  return [
    ...nodes
      .map((node) => ownRules.get(node.id)!)
      .filter((rule) => !rule.isComplex)
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
    ...Array.from(complexRules.values()),
  ]
    .filter(Boolean)
    .join("\n");
}
