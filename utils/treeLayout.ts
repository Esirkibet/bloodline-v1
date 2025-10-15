export type TreeNode = {
  id: string;
  name: string;
  tier: 'CENTER' | 'SUPERIOR' | 'INTERMEDIATE' | 'DISTANT';
};

export type TreeLink = {
  source: string;
  target: string;
  verified?: boolean;
};

export type Position = { x: number; y: number; ring: number };

export function computeTreeLayout(
  nodes: TreeNode[],
  centerId: string,
  width: number,
  height: number
): Record<string, Position> {
  const cx = width / 2;
  const cy = height / 2;

  const radii = {
    SUPERIOR: Math.min(width, height) * 0.25,
    INTERMEDIATE: Math.min(width, height) * 0.4,
    DISTANT: Math.min(width, height) * 0.52,
  } as const;

  const center = nodes.find((n) => n.id === centerId);
  const superiors = nodes.filter((n) => n.tier === 'SUPERIOR');
  const intermediates = nodes.filter((n) => n.tier === 'INTERMEDIATE');
  const distants = nodes.filter((n) => n.tier === 'DISTANT');

  const positions: Record<string, Position> = {};
  if (center) positions[center.id] = { x: cx, y: cy, ring: 0 };

  function placeInRing(list: TreeNode[], radius: number) {
    const count = list.length;
    if (count === 0) return;
    const angleStep = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const a = i * angleStep - Math.PI / 2; // start at top
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      positions[list[i].id] = { x, y, ring: radius };
    }
  }

  placeInRing(superiors, radii.SUPERIOR);
  placeInRing(intermediates, radii.INTERMEDIATE);
  placeInRing(distants, radii.DISTANT);

  return positions;
}
