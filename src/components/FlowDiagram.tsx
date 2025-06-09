// src/components/FlowDiagram.tsx
"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  Node,
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

export default function FlowDiagram() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nextId, setNextId] = useState(1);
  const [selected, setSelected] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load dari localStorage saat mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sn = localStorage.getItem("flow-nodes");
    if (sn) {
      try {
        const parsedNodes: Node[] = JSON.parse(sn);
        const normalized = parsedNodes.map((n) => {
          const dataAny = n.data as any;
          const title = typeof dataAny.title === "string" ? dataAny.title : `Judul ${n.id}`;
          const lines =
            Array.isArray(dataAny?.lines) &&
            dataAny.lines.every(
              (ln: any) =>
                typeof ln.id === "string" && typeof ln.text === "string"
            )
              ? dataAny.lines
              : [{ id: `${n.id}-1`, text: "Baris 1" }];
          return { ...n, data: { title, lines } } as Node & { data: CustomNodeData };
        });
        setNodes(normalized);
      } catch {}
    }
    const se = localStorage.getItem("flow-edges");
    if (se) {
      try {
        const parsedEdges: Edge[] = JSON.parse(se);
        setEdges(parsedEdges);
      } catch {}
    }
  }, []);

  // Hitung nextId
  useEffect(() => {
    const maxId = nodes.reduce((max, n) => {
      const num = parseInt(n.id, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    setNextId(maxId + 1);
  }, [nodes]);

  // Simpan ke localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("flow-nodes", JSON.stringify(nodes));
  }, [nodes]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("flow-edges", JSON.stringify(edges));
  }, [edges]);

  // Tambah node
  const addNewNode = () => {
    const id = String(nextId);
    const newNode: Node = {
      id,
      type: "custom",
      position: { x: 50 + Math.random() * 300, y: 50 + Math.random() * 200 },
      data: { title: `Judul ${id}`, lines: [{ id: `${id}-1`, text: "Baris 1" }] },
    } as Node & { data: CustomNodeData };
    setNodes((nds) => [...nds, newNode]);
    setNextId((n) => n + 1);
  };

  // Tambah baris
  const handleAddLineToSelected = () => {
    if (selected.nodes.length === 0) return;
    const nodeId = selected.nodes[0].id;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const currLines: Line[] = (node.data as CustomNodeData).lines;
        const newIndex = currLines.length + 1;
        return {
          ...node,
          data: {
            title: node.data.title,
            lines: [
              ...currLines,
              { id: `${nodeId}-${newIndex}`, text: `Baris ${newIndex}` },
            ],
          },
        } as Node & { data: CustomNodeData };
      })
    );
  };

  // Update baris
  const handleChangeLineText = useCallback(
    (nodeId: string, lineId: string, newText: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          const updated = (node.data as CustomNodeData).lines.map((l) =>
            l.id === lineId ? { ...l, text: newText } : l
          );
          return { ...node, data: { title: node.data.title, lines: updated } };
        })
      );
    },
    []
  );
  // Update judul
  const handleChangeTitle = useCallback(
    (nodeId: string, newTitle: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { title: newTitle, lines: node.data.lines } }
            : node
        )
      );
    },
    []
  );

  // Handlers ReactFlow
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // nodeTypes & edgeTypes
  const nodeTypes = useMemo(
    () => ({
      custom: (props: any) => (
        <CustomNode
          id={props.id}
          data={props.data}
          selected={props.selected}
          onChangeTitle={handleChangeTitle}
          onChangeLineText={handleChangeLineText}
        />
      ),
    }),
    [handleChangeTitle, handleChangeLineText]
  );
  const edgeTypes = useMemo(() => ({ animated: AnimatedEdge }), []);

  // onConnect: React Flow sudah memberikan sourceHandle & targetHandle sesuai handle yang dipakai
  const onConnect = useCallback((connection: Connection) => {
    const edgeId = `e-${connection.source}-${connection.sourceHandle}-to-${connection.target}-${connection.targetHandle}`;
    const newEdge: Edge = {
      ...connection,
      id: edgeId,
      type: "animated",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2, strokeLinecap: "round" },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, []);

  const onSelectionChange = useCallback((sel: any) => {
    setSelected({ nodes: sel?.nodes ?? [], edges: sel?.edges ?? [] });
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    instance.fitView();
    instance.zoomTo(0.6);
  }, []);

  // Hapus dengan Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        setNodes((nds) =>
          nds.filter((n) => !selected.nodes.some((sn) => sn.id === n.id))
        );
        setEdges((eds) =>
          eds.filter((ed) => !selected.edges.some((se) => se.id === ed.id))
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  // Export/Restore
  const exportToFile = () => {
    const payload = { nodes, edges };
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    a.download = `flow-diagram-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`;
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
        const parsed = JSON.parse(evt.target?.result as string) as {
          nodes: Node[];
          edges: Edge[];
        };
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
      } catch {
        alert("Gagal membuka file: format JSON tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const selectedNodeId = selected.nodes[0]?.id;

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
        disabled={!selectedNodeId}
        className={`absolute top-14 left-2 z-10 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 ${!selectedNodeId ? "opacity-50 cursor-not-allowed" : ""}`}
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
