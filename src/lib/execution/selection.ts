// Foundation Phase 1 — Batch F4 — Unified Execution Context.
// One selection contract so a node click in OrchestrationGraph (@xyflow/react)
// and a data-point click in an ECharts view resolve to the same
// ExecutionEntity shape and land in the same store field.

import type { Node } from '@xyflow/react';
import type { ECElementEvent } from 'echarts';
import { useExecutionStore } from './store';
import type { ExecutionEntity, ExecutionEntityType } from './types';

export interface SelectableView {
  selected: ExecutionEntity | null;
  hovered: ExecutionEntity | null;
  select: (entity: ExecutionEntity | null) => void;
  hover: (entity: ExecutionEntity | null) => void;
}

export function useSelection(): SelectableView {
  const selected = useExecutionStore((s) => s.selected);
  const hovered = useExecutionStore((s) => s.hovered);
  const select = useExecutionStore((s) => s.select);
  const hover = useExecutionStore((s) => s.hover);
  return { selected, hovered, select, hover };
}

// xyflow node.data carries whatever OrchestrationGraph puts there — `type`
// and `label` are optional because the graph may not set them yet; falls
// back to treating the node as a stage keyed by its own id.
export function fromXYFlowNode(node: Node<{ type?: ExecutionEntityType; label?: string }>): ExecutionEntity {
  return {
    id: node.id,
    type: node.data?.type ?? 'stage',
    label: node.data?.label ?? node.id,
  };
}

// ECharts click/mouseover params — `name` is the category label ECharts
// resolves per data point, used as both id and label here.
export function fromEChartsParam(param: ECElementEvent): ExecutionEntity {
  return {
    id: String(param.name ?? param.dataIndex ?? ''),
    type: 'stage',
    label: String(param.name ?? ''),
  };
}
