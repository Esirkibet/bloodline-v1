import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { computeTreeLayout, TreeLink, TreeNode } from '@/utils/treeLayout';

export type FamilyTreeProps = {
  nodes: TreeNode[];
  links: TreeLink[];
  centerId: string;
  onNodePress?: (nodeId: string) => void;
};

export default function FamilyTree({ nodes, links, centerId, onNodePress }: FamilyTreeProps) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const positions = useMemo(() => {
    if (!size) return {} as Record<string, { x: number; y: number; ring: number }>;
    return computeTreeLayout(nodes, centerId, size.w, size.h);
  }, [nodes, centerId, size]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  const nodeRadius = (tier: TreeNode['tier']) => {
    switch (tier) {
      case 'CENTER':
        return 28;
      case 'SUPERIOR':
        return 20;
      case 'INTERMEDIATE':
        return 14;
      default:
        return 10;
    }
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {size && (
        <Svg width={size.w} height={size.h}>
          {/* Links */}
          {links.map((lnk, idx) => {
            const s = positions[lnk.source];
            const t = positions[lnk.target];
            if (!s || !t) return null;
            return (
              <Line
                key={`L-${idx}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke="#8B0000"
                strokeWidth={lnk.verified ? 2 : 1.5}
                strokeDasharray={lnk.verified ? undefined : '4,4'}
                opacity={0.8}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const r = nodeRadius(n.tier);
            const fill = n.tier === 'CENTER' ? '#8B0000' : '#DAA520';
            const textColor = n.tier === 'CENTER' ? '#fff' : '#333';
            const name = n.name.length > 9 ? n.name.slice(0, 8) + '…' : n.name;
            return (
              <React.Fragment key={`N-${n.id}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={fill}
                  opacity={0.95}
                  onPress={() => onNodePress?.(n.id)}
                />
                <SvgText
                  x={p.x}
                  y={p.y + 4}
                  fontSize={10}
                  fontWeight={n.tier === 'CENTER' ? '700' : '500'}
                  fill={textColor}
                  textAnchor="middle"
                >
                  {name}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
