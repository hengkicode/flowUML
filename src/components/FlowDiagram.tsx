// src/components/FlowDiagram.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  Node as RFNode,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  ConnectionLineType,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CustomNode, { CustomNodeData, Line } from "./CustomNode";
import AnimatedEdge from "./AnimatedEdge";
import { useUndoRedo } from "../hooks/useUndoRedo";

export default function FlowDiagram() {
  type FlowNode = RFNode;

  // 1. Inisialisasi useUndoRedo dengan state kosong
  const {
    state: flowState,
    set: setFlowState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<{ nodes: FlowNode[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  const { nodes, edges } = flowState;

  // 2. Setelah mount, load data dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flow-diagram");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { nodes: FlowNode[]; edges: Edge[] };
        setFlowState({
          nodes: parsed.nodes || [],
          edges: parsed.edges || [],
        });
      } catch {
        // ignore parse errors
      }
    }
  }, [setFlowState]);

  // 3. Simpan selected nodes & edges
  const [selected, setSelected] = useState<{ nodes: FlowNode[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  // 4. Hitung next numeric ID
  const nextId = React.useMemo(() => {
    return (
      nodes.reduce((max, n) => {
        const match = n.id.match(/^\d+$/);
        if (!match) return max;
        const num = parseInt(n.id, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1
    );
  }, [nodes]);

  // 5. Helper untuk update state (push ke history)
  const updateState = useCallback(
    (newNodes: FlowNode[], newEdges: Edge[]) => {
      setFlowState({ nodes: newNodes, edges: newEdges });
    },
    [setFlowState]
  );

  // 6. Handler ubah judul node
  const handleChangeTitle = useCallback(
    (nodeId: string, newTitle: string) => {
      const newNodes = nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const data = node.data as CustomNodeData;
        return {
          ...node,
          data: { title: newTitle, lines: data.lines },
        };
      });
      updateState(newNodes, edges);
    },
    [nodes, edges, updateState]
  );

  // 7. Handler ubah teks baris di node
  const handleChangeLineText = useCallback(
    (nodeId: string, lineId: string, newText: string) => {
      const newNodes = nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const data = node.data as CustomNodeData;
        const updatedLines = data.lines.map((l) =>
          l.id === lineId ? { ...l, text: newText } : l
        );
        return {
          ...node,
          data: { title: data.title, lines: updatedLines },
        };
      });
      updateState(newNodes, edges);
    },
    [nodes, edges, updateState]
  );

  // 8. Definisikan nodeTypes
  const nodeTypes = React.useMemo(
    () => ({
      custom: (props: any) => (
        <CustomNode
          id={props.id}
          data={props.data as CustomNodeData}
          selected={props.selected}
          onChangeTitle={handleChangeTitle}
          onChangeLineText={handleChangeLineText}
        />
      ),
    }),
    [handleChangeTitle, handleChangeLineText]
  );

  // 9. Definisikan edgeTypes
  const edgeTypes = React.useMemo(() => ({ animated: AnimatedEdge }), []);

  // 10. Handler perubahan nodes (drag, select, resize)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes);
      updateState(updated, edges);
    },
    [nodes, edges, updateState]
  );

  // 11. Handler perubahan edges
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      updateState(nodes, updated);
    },
    [nodes, edges, updateState]
  );

  // 12. Handler membuat koneksi baru antar node
  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeId = `e-${connection.source}-${connection.sourceHandle}-to-${connection.target}-${connection.targetHandle}`;
      const newEdge: Edge = {
        ...connection,
        id: edgeId,
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, strokeLinecap: "round" },
      };
      updateState(nodes, addEdge(newEdge, edges));
    },
    [nodes, edges, updateState]
  );

  // 13. Tambah node baru dengan ID numeric
  const addNewNode = () => {
    const id = String(nextId);
    const newNode: FlowNode = {
      id,
      type: "custom",
      position: { x: 50 + Math.random() * 300, y: 50 + Math.random() * 200 },
      data: {
        title: `Judul ${id}`,
        lines: [{ id: `${id}-1`, text: "Baris 1" }],
      } as CustomNodeData,
    };
    updateState([...nodes, newNode], edges);
  };

  // 14. Tambah baris pada node terpilih (node pertama)
  const handleAddLineToSelected = () => {
    const selNode = selected.nodes[0];
    if (!selNode) return;
    const nodeId = selNode.id;
    const newNodes = nodes.map((node) => {
      if (node.id !== nodeId) return node;
      const data = node.data as CustomNodeData;
      const currLines: Line[] = data.lines;
      const newIndex = currLines.length + 1;
      return {
        ...node,
        data: {
          title: data.title,
          lines: [
            ...currLines,
            { id: `${nodeId}-${newIndex}`, text: `Baris ${newIndex}` },
          ],
        } as CustomNodeData,
      };
    });
    updateState(newNodes, edges);
  };

  // 15. Simpan hasil seleksi nodes & edges
  const onSelectionChange = useCallback((sel: any) => {
    setSelected({
      nodes: sel?.nodes ?? [],
      edges: sel?.edges ?? [],
    });
  }, []);

  // 16. Hapus semua nodes & edges yang terpilih
  const deleteSelected = useCallback(() => {
    const remainingNodes = nodes.filter(
      (n) => !selected.nodes.some((sn) => sn.id === n.id)
    );
    const remainingEdges = edges.filter(
      (ed) => !selected.edges.some((se) => se.id === ed.id)
    );
    updateState(remainingNodes, remainingEdges);
  }, [selected, nodes, edges, updateState]);

  // 17. Shortcut keyboard: Ctrl+Z, Ctrl+Y, Delete
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key === "z" && canUndo) {
        e.preventDefault();
        undo();
        return;
      }
      if (isCtrl && e.key === "y" && canRedo) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Delete") {
        if (selected.nodes.length === 0 && selected.edges.length === 0) return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", keyDownHandler);
    return () => window.removeEventListener("keydown", keyDownHandler);
  }, [undo, redo, canUndo, canRedo, selected, nodes, edges, deleteSelected]);

  // 18. Simpan ke localStorage saat nodes/edges berubah
  useEffect(() => {
    try {
      localStorage.setItem("flow-diagram", JSON.stringify({ nodes, edges }));
    } catch {}
  }, [nodes, edges]);

  // 19. Export/Import file JSON
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportToFile = () => {
    const payload = { nodes, edges };
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    a.download = `flow-diagram-${date.getFullYear()}${pad(
      date.getMonth() + 1
    )}${pad(date.getDate())}-${pad(date.getHours())}${pad(
      date.getMinutes()
    )}${pad(date.getSeconds())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const openFileDialog = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(
          evt.target?.result as string
        ) as { nodes: FlowNode[]; edges: Edge[] };
        updateState(parsed.nodes || [], parsed.edges || []);
      } catch {
        alert("Gagal membuka file: format JSON tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 20. Inisialisasi ReactFlow: fit view & zoom
  const onInit = useCallback((instance: ReactFlowInstance) => {
    instance.fitView();
    instance.zoomTo(0.6);
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <button
        onClick={addNewNode}
        className="absolute top-2 left-2 z-10 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        + Tambah Node
      </button>
      <button
        onClick={handleAddLineToSelected}
        disabled={selected.nodes.length === 0}
        className={`absolute top-14 left-2 z-10 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 ${
          selected.nodes.length === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        + Tambah Baris
      </button>
      <button
        onClick={exportToFile}
        className="absolute top-2 left-40 z-10 px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
      >
        Simpan ke File
      </button>
      <button
        onClick={openFileDialog}
        className="absolute top-14 left-40 z-10 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
      >
        Restore dari File
      </button>
      <input
        type="file"
        accept=".json,application/json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onInit={onInit}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
