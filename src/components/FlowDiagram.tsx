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

// Fungsi untuk warna edge
function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.random() * 20;
  const l = 50 + Math.random() * 10;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export default function FlowDiagram() {
  type FlowNode = RFNode;

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

  // Load dari localStorage, assign warna edge bila perlu
  useEffect(() => {
    const saved = localStorage.getItem("flow-diagram");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { nodes: FlowNode[]; edges: Edge[] };
        const edgesWithColor = parsed.edges.map((ed) => {
          const style = ed.style || {};
          const stroke = typeof style.stroke === "string" ? style.stroke : randomColor();
          return {
            ...ed,
            style: {
              ...style,
              stroke,
              strokeWidth: style.strokeWidth ?? 2,
            },
          };
        });
        setFlowState({
          nodes: parsed.nodes,
          edges: edgesWithColor,
        });
      } catch {
        // ignore
      }
    }
  }, [setFlowState]);

  const [selected, setSelected] = useState<{ nodes: FlowNode[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  // Hitung next numeric ID
  const nextId = React.useMemo(() => {
    return (
      nodes.reduce((max, n) => {
        const match = String(n.id).match(/^\d+$/);
        if (!match) return max;
        const num = parseInt(n.id, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1
    );
  }, [nodes]);

  const updateState = useCallback(
    (newNodes: FlowNode[], newEdges: Edge[]) => {
      const sameNodes = JSON.stringify(nodes) === JSON.stringify(newNodes);
      const sameEdges = JSON.stringify(edges) === JSON.stringify(newEdges);
      if (sameNodes && sameEdges) return;
      setFlowState({ nodes: newNodes, edges: newEdges });
    },
    [setFlowState, nodes, edges]
  );

  const handleChangeTitle = useCallback(
    (nodeId: string, newTitle: string) => {
      const newNodes = nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const data = node.data as CustomNodeData;
        return { ...node, data: { title: newTitle, lines: data.lines } };
      });
      updateState(newNodes, edges);
    },
    [nodes, edges, updateState]
  );

  const handleChangeLineText = useCallback(
    (nodeId: string, lineId: string, newText: string) => {
      const newNodes = nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const data = node.data as CustomNodeData;
        const updatedLines = data.lines.map((l) =>
          l.id === lineId ? { ...l, text: newText } : l
        );
        return { ...node, data: { title: data.title, lines: updatedLines } };
      });
      updateState(newNodes, edges);
    },
    [nodes, edges, updateState]
  );

  const handleDeleteLine = useCallback(
    (nodeId: string, lineId: string) => {
      const newNodes = nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const data = node.data as CustomNodeData;
        const filtered = data.lines.filter((l) => l.id !== lineId);
        return { ...node, data: { title: data.title, lines: filtered } };
      });
      updateState(newNodes, edges);
    },
    [nodes, edges, updateState]
  );

  const nodeTypes = React.useMemo(
    () => ({
      custom: (props: any) => (
        <CustomNode
          id={props.id}
          data={props.data as CustomNodeData}
          selected={props.selected}
          onChangeTitle={handleChangeTitle}
          onChangeLineText={handleChangeLineText}
          onDeleteLine={handleDeleteLine}
        />
      ),
    }),
    [handleChangeTitle, handleChangeLineText, handleDeleteLine]
  );

  const edgeTypes = React.useMemo(() => ({ animated: AnimatedEdge }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes);
      updateState(updated, edges);
    },
    [nodes, edges, updateState]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      updateState(nodes, updated);
    },
    [nodes, edges, updateState]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeId = `e-${connection.source}-${connection.sourceHandle}-to-${connection.target}-${connection.targetHandle}-${Date.now()}`;
      const strokeColor = randomColor();
      const newEdge: Edge = {
        ...connection,
        id: edgeId,
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: strokeColor, strokeWidth: 2 },
      };
      updateState(nodes, addEdge(newEdge, edges));
    },
    [nodes, edges, updateState]
  );

  const addNewNode = useCallback(() => {
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
  }, [nextId, nodes, edges, updateState]);

  const handleAddLineToSelected = useCallback(() => {
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
            {
              id: `${nodeId}-${newIndex}`,
              text: `Baris ${newIndex}`,
            },
          ],
        } as CustomNodeData,
      };
    });
    updateState(newNodes, edges);
  }, [selected, nodes, edges, updateState]);

  const onSelectionChange = useCallback((sel: any) => {
    setSelected({
      nodes: sel?.nodes ?? [],
      edges: sel?.edges ?? [],
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (selected.nodes.length === 0 && selected.edges.length === 0) return;
    const confirmDelete = confirm("Hapus node/edge yang terpilih?");
    if (!confirmDelete) return;
    const remainingNodes = nodes.filter((n) =>
      !selected.nodes.some((sn) => sn.id === n.id)
    );
    const remainingEdges = edges.filter((ed) =>
      !selected.edges.some((se) => se.id === ed.id)
    );
    updateState(remainingNodes, remainingEdges);
  }, [selected, nodes, edges, updateState]);

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
        deleteSelected();
      }
      if (isCtrl && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addNewNode();
      }
      if (isCtrl && e.key.toLowerCase() === "l") {
        e.preventDefault();
        handleAddLineToSelected();
      }
    };
    window.addEventListener("keydown", keyDownHandler);
    return () => window.removeEventListener("keydown", keyDownHandler);
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    addNewNode,
    handleAddLineToSelected,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem("flow-diagram", JSON.stringify({ nodes, edges }));
      } catch {}
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportToFile = useCallback(() => {
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
  }, [nodes, edges]);

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
        const edgesWithColor = parsed.edges.map((ed) => {
          const style = ed.style || {};
          const stroke = typeof style.stroke === "string" ? style.stroke : randomColor();
          return {
            ...ed,
            style: {
              ...style,
              stroke,
              strokeWidth: style.strokeWidth ?? 2,
            },
          };
        });
        setFlowState({ nodes: parsed.nodes, edges: edgesWithColor });
      } catch {
        alert("Gagal membuka file: format JSON tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onInit = useCallback((instance: ReactFlowInstance) => {
    instance.fitView();
    instance.zoomTo(0.6);
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <button
        onClick={addNewNode}
        title="Ctrl+N"
        className="absolute top-2 left-2 z-10 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        + Tambah Node
      </button>
      <button
        onClick={handleAddLineToSelected}
        disabled={selected.nodes.length === 0}
        title="Ctrl+L (jika node terpilih)"
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
