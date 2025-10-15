import type { FamilyGraph, RelationshipEdge } from '@/utils/graphTraversal';

// Graph consistent with mock nodes in mockFamily.ts
const edges: RelationshipEdge[] = [
  // Parents
  { kind: 'parent_child', parent: 'mother', child: 'me' },
  { kind: 'parent_child', parent: 'father', child: 'me' },
  // Spouse
  { kind: 'spouse', a: 'me', b: 'spouse' },
  // Children
  { kind: 'parent_child', parent: 'me', child: 'child1' },
  { kind: 'parent_child', parent: 'me', child: 'child2' },
  // Siblings
  { kind: 'sibling', a: 'me', b: 'sibling1' },
  { kind: 'sibling', a: 'me', b: 'sibling2' },
  // Mother's sister (Aunt M) and her child (cousin2)
  { kind: 'sibling', a: 'mother', b: 'aunt_m' },
  { kind: 'parent_child', parent: 'aunt_m', child: 'cousin2' },
  // Father's brother (Uncle F) and his child (cousin1)
  { kind: 'sibling', a: 'father', b: 'uncle_f' },
  { kind: 'parent_child', parent: 'uncle_f', child: 'cousin1' },
  // Great aunt relation via aunt_m
  { kind: 'sibling', a: 'g_aunt', b: 'mother' },
];

export const mockGraph: FamilyGraph = {
  nodes: [
    'me',
    'mother',
    'father',
    'spouse',
    'child1',
    'child2',
    'sibling1',
    'sibling2',
    'aunt_m',
    'uncle_f',
    'cousin1',
    'cousin2',
    'g_aunt',
    'second_cousin',
  ],
  edges,
};
