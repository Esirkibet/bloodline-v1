import type { GraphPath } from '@/utils/graphTraversal';

export type RelationshipKind =
  | 'self'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'spouse'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin';

export type AnalyzedRelationship = {
  kind: RelationshipKind;
  label: string; // e.g., "Your Uncle", "Your First Cousin Once Removed"
  stepsAway: number; // consanguinity steps ignoring spouse edges
  inLaw: boolean; // true if path crosses a spouse edge
  degree?: number; // for cousins: 1 = first, 2 = second, ...
  removed?: number; // for cousins only
};

function degreeName(d: number): string {
  switch (d) {
    case 1:
      return 'First';
    case 2:
      return 'Second';
    case 3:
      return 'Third';
    default:
      return `${d}th`;
  }
}

function removedName(r: number): string {
  switch (r) {
    case 0:
      return '';
    case 1:
      return ' Once Removed';
    case 2:
      return ' Twice Removed';
    default:
      return ` ${r} Times Removed`;
  }
}

export function analyzeRelationship(path: GraphPath): AnalyzedRelationship {
  // Track spouse for in-law labeling and fold siblings into up+down
  let inLaw = false;
  let up = 0;
  let down = 0;
  let hasSibling = false;

  for (const e of path.edges) {
    if (e === 'parent') up += 1;
    else if (e === 'child') down += 1;
    else if (e === 'sibling') {
      hasSibling = true;
      up += 1;
      down += 1;
    } else if (e === 'spouse') {
      inLaw = true;
      // spouse does not affect consanguinity
    }
  }

  const stepsAway = up + down;

  // Direct self
  if (path.edges.length === 0) {
    return { kind: 'self', label: 'You', stepsAway: 0, inLaw: false };
  }

  // Direct one-step
  if (path.edges.length === 1) {
    const e = path.edges[0];
    if (e === 'parent') return { kind: 'parent', label: `Your Parent${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 1, inLaw };
    if (e === 'child') return { kind: 'child', label: `Your Child${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 1, inLaw };
    if (e === 'sibling') return { kind: 'sibling', label: `Your Sibling${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 2, inLaw };
    if (e === 'spouse') return { kind: 'spouse', label: 'Your Spouse', stepsAway: 0, inLaw };
  }

  // Grandparent / Grandchild
  if (up === 2 && down === 0) return { kind: 'grandparent', label: 'Your Grandparent', stepsAway: 2, inLaw };
  if (up === 0 && down === 2) return { kind: 'grandchild', label: 'Your Grandchild', stepsAway: 2, inLaw };

  // Sibling via parent
  if (up === 1 && down === 1 && hasSibling) return { kind: 'sibling', label: `Your Sibling${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 2, inLaw };

  // Aunt / Uncle (parent -> sibling pattern)
  if (hasSibling && up === 2 && down === 1) return { kind: 'aunt_uncle', label: `Your Aunt/Uncle${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 3, inLaw };

  // Niece / Nephew (sibling -> child pattern)
  if (hasSibling && up === 1 && down === 2) return { kind: 'niece_nephew', label: `Your Niece/Nephew${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 3, inLaw };

  // Parent/Child-in-law cases (through spouse)
  if (inLaw && up === 1 && down === 0) return { kind: 'parent', label: 'Your Parent-in-law', stepsAway: 1, inLaw };
  if (inLaw && up === 0 && down === 1) return { kind: 'child', label: 'Your Child-in-law', stepsAway: 1, inLaw };

  // Cousins: use standard degree/removed calc
  if (up >= 1 && down >= 1) {
    const degree = Math.max(1, Math.min(up, down) - 1);
    const removed = Math.max(0, Math.abs(up - down));
    const label = `Your ${degreeName(degree)} Cousin${removedName(removed)}${inLaw ? ' (In-Law)' : ''}`.trim();
    return { kind: 'cousin', label, stepsAway, inLaw, degree, removed };
  }

  // Fallbacks
  if (up === 1 && down === 0) return { kind: 'parent', label: `Your Parent${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 1, inLaw };
  if (up === 0 && down === 1) return { kind: 'child', label: `Your Child${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway: 1, inLaw };

  // Default unknown but distant
  return { kind: 'cousin', label: `Your Distant Relative${inLaw ? ' (In-Law)' : ''}`.trim(), stepsAway, inLaw };
}
