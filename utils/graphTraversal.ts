export type Relation = 'parent' | 'child' | 'sibling' | 'spouse';

export type EdgeParentChild = {
  kind: 'parent_child';
  parent: string;
  child: string;
};

export type EdgeBidirectional = {
  kind: 'sibling' | 'spouse';
  a: string;
  b: string;
};

export type RelationshipEdge = EdgeParentChild | EdgeBidirectional;

export type FamilyGraph = {
  nodes: string[];
  edges: RelationshipEdge[];
};

export type Neighbor = { to: string; rel: Relation };

export type GraphPath = {
  nodes: string[];
  edges: Relation[];
};

function buildAdjacency(graph: FamilyGraph): Map<string, Neighbor[]> {
  const adj = new Map<string, Neighbor[]>();
  for (const id of graph.nodes) adj.set(id, []);

  const ensure = (id: string) => {
    if (!adj.has(id)) adj.set(id, []);
    return adj.get(id)!;
  };

  for (const e of graph.edges) {
    if (e.kind === 'parent_child') {
      ensure(e.parent).push({ to: e.child, rel: 'child' });
      ensure(e.child).push({ to: e.parent, rel: 'parent' });
    } else if (e.kind === 'sibling') {
      ensure(e.a).push({ to: e.b, rel: 'sibling' });
      ensure(e.b).push({ to: e.a, rel: 'sibling' });
    } else if (e.kind === 'spouse') {
      ensure(e.a).push({ to: e.b, rel: 'spouse' });
      ensure(e.b).push({ to: e.a, rel: 'spouse' });
    }
  }
  return adj;
}

export function shortestPath(graph: FamilyGraph, from: string, to: string): GraphPath | null {
  if (from === to) return { nodes: [from], edges: [] };
  const adj = buildAdjacency(graph);
  const q: string[] = [];
  const visited = new Set<string>();
  const prev = new Map<string, { id: string; rel: Relation }>();

  q.push(from);
  visited.add(from);

  while (q.length) {
    const cur = q.shift()!;
    const list = adj.get(cur) ?? [];
    for (const nb of list) {
      if (visited.has(nb.to)) continue;
      visited.add(nb.to);
      prev.set(nb.to, { id: cur, rel: nb.rel });
      if (nb.to === to) {
        const nodes: string[] = [];
        const edges: Relation[] = [];
        let x: string | undefined = to;
        while (x !== undefined) {
          nodes.unshift(x);
          const p = prev.get(x);
          if (!p) break;
          edges.unshift(p.rel);
          x = p.id;
        }
        return { nodes, edges };
      }
      q.push(nb.to);
    }
  }
  return null;
}
