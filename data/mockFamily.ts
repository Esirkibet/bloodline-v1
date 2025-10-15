import { TreeLink, TreeNode } from '@/utils/treeLayout';

export const mockNodes: TreeNode[] = [
  { id: 'me', name: 'You', tier: 'CENTER' },
  // Superior ring
  { id: 'mother', name: 'Mother', tier: 'SUPERIOR' },
  { id: 'father', name: 'Father', tier: 'SUPERIOR' },
  { id: 'spouse', name: 'Spouse', tier: 'SUPERIOR' },
  { id: 'child1', name: 'Daughter', tier: 'SUPERIOR' },
  { id: 'child2', name: 'Son', tier: 'SUPERIOR' },
  { id: 'sibling1', name: 'Sister', tier: 'SUPERIOR' },
  { id: 'sibling2', name: 'Brother', tier: 'SUPERIOR' },
  // Intermediate ring
  { id: 'aunt_m', name: 'Aunt (M)', tier: 'INTERMEDIATE' },
  { id: 'uncle_f', name: 'Uncle (F)', tier: 'INTERMEDIATE' },
  { id: 'cousin1', name: 'Cousin', tier: 'INTERMEDIATE' },
  { id: 'cousin2', name: 'Cousin', tier: 'INTERMEDIATE' },
  // Distant ring
  { id: 'g_aunt', name: 'Great Aunt', tier: 'DISTANT' },
  { id: 'second_cousin', name: '2nd Cousin', tier: 'DISTANT' },
];

export const mockLinks: TreeLink[] = [
  { source: 'me', target: 'mother', verified: true },
  { source: 'me', target: 'father', verified: true },
  { source: 'me', target: 'spouse', verified: true },
  { source: 'me', target: 'child1', verified: true },
  { source: 'me', target: 'child2', verified: false },
  { source: 'me', target: 'sibling1', verified: true },
  { source: 'me', target: 'sibling2', verified: false },
  { source: 'mother', target: 'aunt_m', verified: true },
  { source: 'father', target: 'uncle_f', verified: true },
  { source: 'uncle_f', target: 'cousin1', verified: true },
  { source: 'aunt_m', target: 'cousin2', verified: false },
  { source: 'aunt_m', target: 'g_aunt', verified: false },
  { source: 'cousin1', target: 'second_cousin', verified: false },
];
