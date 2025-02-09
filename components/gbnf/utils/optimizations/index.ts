import { GBNFRule } from "../../types";

/**
 * Helper function to count how many times each rule is referenced
 */
function countRuleReferences(
  adjacencyList: Map<string, string[]>
): Map<string, number> {
  const referenceCounts = new Map<string, number>();

  // Initialize all rules with 0 references
  for (const ruleName of adjacencyList.keys()) {
    referenceCounts.set(ruleName, 0);
  }

  // Count references
  for (const [, targets] of adjacencyList.entries()) {
    for (const target of targets) {
      referenceCounts.set(target, (referenceCounts.get(target) || 0) + 1);
    }
  }

  return referenceCounts;
}

/**
 * Optimization that removes rules that are only referenced once by inlining them
 * Returns true if an optimization was applied
 */
function inlineSingleReferences(
  adjacencyList: Map<string, string[]>,
  ownRules: Map<string, GBNFRule>
): boolean {
  const referenceCounts = countRuleReferences(adjacencyList);

  for (const [ruleName, count] of referenceCounts.entries()) {
    // Skip root and rules referenced multiple times
    if (ruleName === "root" || count !== 1) continue;

    // Find the rule that references this one
    let mentionerName: string | null = null;
    for (const [source, targets] of adjacencyList.entries()) {
      if (targets.includes(ruleName)) {
        mentionerName = source;
        break;
      }
    }
    if (!mentionerName) continue;

    // Check if the mentioned rule has exactly one target
    const mentionerTargets = adjacencyList.get(mentionerName) || [];
    if (mentionerTargets.length !== 1) continue;

    // Get the rules
    const mentioner = ownRules.get(mentionerName);
    const mentioned = ownRules.get(ruleName);
    if (!mentioner || !mentioned) continue;

    // Update the mentioner's implementation
    mentioner.intrinsic =
      `${mentioner.intrinsic} ${mentioned.intrinsic}`.trim();

    const mentionedTargets = adjacencyList.get(ruleName) || [];

    // Update adjacency list - replace the single reference with the mentioned rule's targets
    adjacencyList.set(mentionerName, mentionedTargets);

    // Remove the inlined rule
    adjacencyList.delete(ruleName);
    ownRules.delete(ruleName);

    return true;
  }

  return false;
}

/**
 * Optimization that merges rules that have identical intrinsic and adjacency patterns
 * Returns true if an optimization was applied
 */
function mergeIdenticalRules(
  adjacencyList: Map<string, string[]>,
  ownRules: Map<string, GBNFRule>
): boolean {
  const ruleEntries = Array.from(ownRules.entries());

  for (let i = 0; i < ruleEntries.length; i++) {
    const [ruleName1, rule1] = ruleEntries[i];
    if (ruleName1 === "root") continue;

    for (let j = i + 1; j < ruleEntries.length; j++) {
      const [ruleName2, rule2] = ruleEntries[j];
      if (ruleName2 === "root") continue;

      // Check if rules have identical intrinsic definitions
      if (rule1.intrinsic !== rule2.intrinsic) continue;

      // Check if rules have identical adjacency patterns
      const adj1 = adjacencyList.get(ruleName1) || [];
      const adj2 = adjacencyList.get(ruleName2) || [];
      if (adj1.length !== adj2.length) continue;
      if (!adj1.every((target, idx) => target === adj2[idx])) continue;

      // Rules are identical - merge them by replacing all references to rule2 with rule1
      for (const [source, targets] of adjacencyList.entries()) {
        const newTargets = targets.map((target) =>
          target === ruleName2 ? ruleName1 : target
        );
        adjacencyList.set(source, newTargets);
      }

      // Remove the duplicate rule
      adjacencyList.delete(ruleName2);
      ownRules.delete(ruleName2);

      return true;
    }
  }

  return false;
}

/**
 * Optimization that replaces single-mentioner rules with their intrinsic definition
 * when the mentioner has multiple references and the mentioned rule's adjacencies
 * are a subset of the mentioner's adjacencies
 * Returns true if an optimization was applied
 */
function inlineSingleMentionerRules(
  adjacencyList: Map<string, string[]>,
  ownRules: Map<string, GBNFRule>
): boolean {
  const referenceCounts = countRuleReferences(adjacencyList);

  for (const [ruleName, count] of referenceCounts.entries()) {
    if (ruleName === "root" || count !== 1) continue;

    // Find the rule that references this one
    let mentionerName: string | null = null;
    for (const [source, targets] of adjacencyList.entries()) {
      if (targets.includes(ruleName)) {
        mentionerName = source;
        break;
      }
    }
    if (!mentionerName) continue;

    // Get the rules
    const mentioned = ownRules.get(ruleName);
    if (!mentioned) continue;

    // Get both rules' adjacency lists
    const mentionerTargets = adjacencyList.get(mentionerName) || [];
    const mentionedTargets = adjacencyList.get(ruleName) || [];

    // Check if mentioned rule's adjacencies are a subset of mentioner's adjacencies
    if (!mentionedTargets.every((target) => mentionerTargets.includes(target)))
      continue;

    // Update adjacency list - remove the reference to the inlined rule
    adjacencyList.set(
      mentionerName,
      mentionerTargets.map((target) =>
        target === ruleName ? `(${mentioned.intrinsic})` : target
      )
    );

    // Remove the inlined rule if it's no longer referenced
    adjacencyList.delete(ruleName);
    ownRules.delete(ruleName);

    return true;
  }

  return false;
}

/**
 * Apply the first set of optimizations (inlining single references and merging identical rules)
 */
function applyBasicOptimizations(
  adjacencyList: Map<string, string[]>,
  ownRules: Map<string, GBNFRule>
): boolean {
  return (
    inlineSingleReferences(adjacencyList, ownRules) ||
    mergeIdenticalRules(adjacencyList, ownRules)
  );
}

/**
 * Apply all optimizations to the grammar
 */
export function optimize(
  adjacencyList: Map<string, string[]>,
  ownRules: Map<string, GBNFRule>
): void {
  let outerOptimizationApplied: boolean;

  do {
    outerOptimizationApplied = false;

    // Step 1: Apply basic optimizations until done
    let basicOptimizationApplied: boolean;
    do {
      basicOptimizationApplied = applyBasicOptimizations(
        adjacencyList,
        ownRules
      );
      if (basicOptimizationApplied) {
        outerOptimizationApplied = true;
      }
    } while (basicOptimizationApplied);

    // Step 2: Apply single-mentioner optimization
    if (inlineSingleMentionerRules(adjacencyList, ownRules)) {
      outerOptimizationApplied = true;
    }
  } while (outerOptimizationApplied);
}
