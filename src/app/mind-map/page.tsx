// src/app/mind-map/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';

// Custom node: setiap sisi punya dua handles (source + target)
const CustomNode: React.FC<{ data: { label: string } }> = ({ data }) => (
  <div
    style={{
      padding: 10,
      borderRadius: 8,
      backgroundColor: '#fef3c7',
      border: '1px solid #facc15',
      textAlign: 'center',
      position: 'relative',
      width: 120,
    }}
  >
    {/* Top */}
    <Handle type="source" position={Position.Top} style={{ background: '#555' }} id="topSource" />
    <Handle type="target" position={Position.Top} style={{ top: 8, background: '#555' }} id="topTarget" />
    {/* Right */}
    <Handle type="source" position={Position.Right} style={{ background: '#555' }} id="rightSource" />
    <Handle type="target" position={Position.Right} style={{ right: 8, background: '#555' }} id="rightTarget" />
    {/* Bottom */}
    <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} id="bottomSource" />
    <Handle type="target" position={Position.Bottom} style={{ bottom: 8, background: '#555' }} id="bottomTarget" />
    {/* Left */}
    <Handle type="source" position={Position.Left} style={{ background: '#555' }} id="leftSource" />
    <Handle type="target" position={Position.Left} style={{ left: 8, background: '#555' }} id="leftTarget" />

    {data.label}
  </div>
);

const nodeTypes = { custom: CustomNode };

export default function MindMapPage() {
  const initialNodes: Node[] = [
    {
      id: 'start',
      type: 'custom',
      data: { label: '🧠 Mulai' },
      position: { x: 250, y: 50 },
    },
  ];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState<string>('');

  // Load dari localStorage
  useEffect(() => {
    const ns = localStorage.getItem('mf-nodes');
    const es = localStorage.getItem('mf-edges');
    if (ns && es) {
      setNodes(JSON.parse(ns));
      setEdges(JSON.parse(es));
    }
  }, [setNodes, setEdges]);

  // Auto-save
  useEffect(() => {
    localStorage.setItem('mf-nodes', JSON.stringify(nodes));
    localStorage.setItem('mf-edges', JSON.stringify(edges));
  }, [nodes, edges]);

  const getEdgeColor = () => '#4ade80';

  // onConnect: membuat edge baru
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: nanoid(),
        animated: true,
        style: { stroke: getEdgeColor() },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add node
  const addNode = () => {
    const id = nanoid();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'custom',
        data: { label: '🧩 Node' },
        position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      },
    ]);
  };

  // Select node untuk rename/delete
  const onNodeClick = (_: any, node: Node) => {
    setSelectedId(node.id);
    setLabelInput(node.data.label as string);
  };

  // Rename
  const renameNode = () => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { label: labelInput } } : n))
    );
    setSelectedId(null);
  };

  // Delete
  const deleteNode = () => {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  };

  // Simpan & Restore manual
  const handleSave = () => {
    localStorage.setItem('mf-nodes', JSON.stringify(nodes));
    localStorage.setItem('mf-edges', JSON.stringify(edges));
    alert('💾 Tersimpan!');
  };
  const handleRestore = () => {
    const ns = localStorage.getItem('mf-nodes');
    const es = localStorage.getItem('mf-edges');
    if (ns && es) {
      setNodes(JSON.parse(ns));
      setEdges(JSON.parse(es));
      alert('🔄 Direstore!');
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={addNode} className="px-4 py-2 bg-blue-600 text-white rounded">
          ➕ Tambah Node
        </button>
        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
          💾 Simpan
        </button>
        <button onClick={handleRestore} className="px-4 py-2 bg-yellow-600 text-white rounded">
          🔄 Restore
        </button>

        {selectedId && (
          <>
            <input
              className="border rounded px-2 py-1"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
            />
            <button onClick={renameNode} className="px-3 py-1 bg-green-500 text-white rounded">
              ✏️ Rename
            </button>
            <button onClick={deleteNode} className="px-3 py-1 bg-red-500 text-white rounded">
              🗑️ Hapus
            </button>
          </>
        )}
      </div>

      {/* Canvas MindMap */}
      <div className="w-full h-[85vh] bg-white rounded shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} />
        </ReactFlow>
      </div>
    </div>
  );
}
