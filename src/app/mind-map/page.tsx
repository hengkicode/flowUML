'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function MindMapPage() {
  const initialNodes: Node[] = useMemo(() => [
    {
      id: '1',
      type: 'input',
      position: { x: 250, y: 0 },
      data: { label: '📄 Halaman Next.js' },
      style: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#f0f9ff',
        border: '1px solid #38bdf8',
      },
    },
    {
      id: '2',
      position: { x: 100, y: 150 },
      data: { label: '🧭 Layout Utama' },
      style: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#ecfccb',
        border: '1px solid #84cc16',
      },
    },
    {
      id: '3',
      type: 'output',
      position: { x: 400, y: 150 },
      data: { label: '📦 Komponen Utama' },
      style: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        border: '1px solid #f87171',
      },
    },
  ], []);

  const initialEdges: Edge[] = useMemo(() => [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#38bdf8' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#f87171' } },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[90vh] bg-gray-100 rounded-lg shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={setNodes}
        onEdgesDelete={setEdges}
        fitView
        className="bg-white rounded-lg"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  );
}
