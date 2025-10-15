import { FamilyGraph, GraphPath, shortestPath } from '@/utils/graphTraversal';
import { analyzeRelationship, type AnalyzedRelationship } from '@/utils/relationshipLabels';

export type Tier = 'SUPERIOR' | 'INTERMEDIATE' | 'DISTANT';

export type CalculatedRelationship = AnalyzedRelationship & {
  tier: Tier;
  path: GraphPath;
};

export function calculateTier(stepsAway: number, kind: AnalyzedRelationship['kind']): Tier {
  if (
    kind === 'parent' ||
    kind === 'child' ||
    kind === 'sibling' ||
    kind === 'spouse' ||
    kind === 'grandparent' ||
    kind === 'grandchild'
  ) {
    return 'SUPERIOR';
  }
  if (stepsAway <= 3 && (kind === 'aunt_uncle' || kind === 'niece_nephew' || kind === 'cousin')) {
    return 'INTERMEDIATE';
  }
  return 'DISTANT';
}

export function calculateRelationship(
  graph: FamilyGraph,
  youId: string,
  otherId: string
): CalculatedRelationship | null {
  const path = shortestPath(graph, youId, otherId);
  if (!path) return null;
  const analyzed = analyzeRelationship(path);
  const tier = calculateTier(analyzed.stepsAway, analyzed.kind);
  return { ...analyzed, tier, path };
}
