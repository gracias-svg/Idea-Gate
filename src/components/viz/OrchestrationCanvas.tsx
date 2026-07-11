'use client';

// Mission Control v1 — Batch M2 — OrchestrationCanvas.
// The XYFlow wrapper. Knows nothing about journey-state — it takes nodes/edges
// as props and renders them. nodeTypes/edgeTypes are module-level constants
// (inline objects trigger XYFlow's infinite-re-render warning). Pan/zoom are on
// but never REQUIRED to read the graph; fitView keeps it framed with generous
// padding, because crowding is the #1 tell of a generic graph-library demo.
//
// Framing note: fitView only runs once on init. Inside a flex hero the
// container reaches its final width AFTER first paint, so a one-shot fit lands
// on a stale (small) size and the graph gets stranded tiny in a corner. The
// inner component refits on every container resize and whenever the node set
// changes, so the graph always fills the hero.

import { memo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CoordinatorNode from './CoordinatorNode';
import AgentNode from './AgentNode';
import FlowEdge from './FlowEdge';
import type { AgentNodeData } from '@/lib/execution/adapters/orchestration';

const nodeTypes: NodeTypes = { coordinator: CoordinatorNode, agent: AgentNode };
const edgeTypes: EdgeTypes = { flow: FlowEdge };

const FIT_VIEW_OPTIONS = { padding: 0.28 };
const PRO_OPTIONS = { hideAttribution: true };

interface OrchestrationCanvasProps {
  nodes: Node<AgentNodeData>[];
  edges: Edge[];
  onSelectNode?: (agentId: string | null) => void;
}

function CanvasInner({ nodes, edges, onSelectNode }: OrchestrationCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  const refit = useCallback(() => {
    // rAF so we measure after layout has settled.
    requestAnimationFrame(() => fitView(FIT_VIEW_OPTIONS));
  }, [fitView]);

  // Refit whenever the hero resizes (flex settle, window resize, panel toggle).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(refit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [refit]);

  // Refit when the node set changes (scenario switch).
  useEffect(() => {
    refit();
  }, [refit, nodes.length]);

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => onSelectNode?.(node.id),
    [onSelectNode],
  );
  const handlePaneClick = useCallback(() => onSelectNode?.(null), [onSelectNode]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        proOptions={PRO_OPTIONS}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!!onSelectNode}
        edgesFocusable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.4}
        maxZoom={1.6}
        onNodeClick={onSelectNode ? handleNodeClick : undefined}
        onPaneClick={onSelectNode ? handlePaneClick : undefined}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}

function OrchestrationCanvasImpl(props: OrchestrationCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

export default memo(OrchestrationCanvasImpl);
