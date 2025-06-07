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

export default function FlowDiagram() {
  // ───── STATE: Nodes & Edges ─────
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nextId, setNextId] = useState(1);

  // ───── STATE SELECTION ─────
  const [selected, setSelected] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  // Ref untuk input file impor (disembunyikan)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─────────────────────────────────────────────────────────
  // Load & normalisasi data dari localStorage saat mount
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load nodes
      const savedNodes = localStorage.getItem("flow-nodes");
      if (savedNodes) {
        try {
          const parsedNodes: Node[] = JSON.parse(savedNodes);
          const normalizedNodes = parsedNodes.map((n) => {
            const dataAny = n.data as any;
            const title =
              typeof dataAny.title === "string"
                ? dataAny.title
                : `Judul ${n.id}`;
            const lines =
              Array.isArray(dataAny?.lines) &&
              dataAny.lines.every(
                (ln: any) =>
                  typeof ln.id === "string" && typeof ln.text === "string"
              )
                ? dataAny.lines
                : [{ id: `${n.id}-1`, text: "Baris 1" }];

            return {
              ...n,
              data: { title, lines },
            } as Node & { data: CustomNodeData };
          });
          setNodes(normalizedNodes);
        } catch {
          // Abaikan jika JSON.parse gagal
        }
      }

      // Load edges
      const savedEdges = localStorage.getItem("flow-edges");
      if (savedEdges) {
        try {
          const parsedEdges: Edge[] = JSON.parse(savedEdges);
          setEdges(parsedEdges);
        } catch {
          // Abaikan jika gagal
        }
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Hitung nextId berdasarkan ID terbesar + 1 saat nodes berubah
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const maxId = nodes.reduce((max, n) => {
      const num = parseInt(n.id, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    setNextId(maxId + 1);
  }, [nodes]);

  // ─────────────────────────────────────────────────────────
  // Simpan nodes ke localStorage tiap nodes berubah
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flow-nodes", JSON.stringify(nodes));
    }
  }, [nodes]);

  // ─────────────────────────────────────────────────────────
  // Simpan edges ke localStorage tiap edges berubah
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flow-edges", JSON.stringify(edges));
    }
  }, [edges]);

  // ─────────────────────────────────────────────────────────
  // Tambah node baru dengan title & satu baris default
  // ─────────────────────────────────────────────────────────
  const addNewNode = () => {
    const newId = String(nextId);
    const defaultLineId = `${newId}-1`;
    const newNode: Node = {
      id: newId,
      type: "custom",
      position: {
        x: 50 + Math.random() * 300,
        y: 50 + Math.random() * 200,
      },
      data: {
        title: `Judul ${newId}`,
        lines: [{ id: defaultLineId, text: "Baris 1" }],
      },
    } as Node & { data: CustomNodeData };

    setNodes((nds) => [...nds, newNode]);
  };

  // ─────────────────────────────────────────────────────────
  // Tambah baris ke node yang terpilih
  // ─────────────────────────────────────────────────────────
  const handleAddLineToSelected = () => {
    if (selected.nodes.length === 0) return;
    const nodeId = selected.nodes[0].id;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const currLines: Line[] = (node.data as CustomNodeData).lines;
        const newIndex = currLines.length + 1;
        const newLineId = `${nodeId}-${newIndex}`;
        return {
          ...node,
          data: {
            title: node.data.title,
            lines: [
              ...currLines,
              { id: newLineId, text: `Baris ${newIndex}` },
            ],
          },
        } as Node & { data: CustomNodeData };
      })
    );
  };

  // ─────────────────────────────────────────────────────────
  // Update teks satu baris (dipanggil oleh CustomNode)
  // ─────────────────────────────────────────────────────────
  const handleChangeLineText = useCallback(
    (nodeId: string, lineId: string, newText: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          const updatedLines = (node.data as CustomNodeData).lines.map((line) =>
            line.id === lineId ? { id: line.id, text: newText } : line
          );
          return { ...node, data: { title: node.data.title, lines: updatedLines } };
        })
      );
    },
    []
  );

  // ─────────────────────────────────────────────────────────
  // Update judul node (dipanggil oleh CustomNode)
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // Handler ReactFlow: edit node/edge
  // ─────────────────────────────────────────────────────────
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // ─────────────────────────────────────────────────────────
  // Handler ReactFlow: membuat koneksi (edge) baru
  // ─────────────────────────────────────────────────────────
  const onConnect = useCallback((connection: Connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.sourceHandle}-to-${connection.target}-${connection.targetHandle}`,
      type: "step",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 },
      label: "",
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, []);

  // ─────────────────────────────────────────────────────────
  // Hapus node/edge yang dipilih saat tekan Delete
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // Callback saat seleksi berubah (klik node/edge)
  // ─────────────────────────────────────────────────────────
  const onSelectionChange = useCallback((sel: any) => {
    setSelected({
      nodes: sel?.nodes ?? [],
      edges: sel?.edges ?? [],
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // Daftarkan custom nodeTypes
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // onInit: langsung fit view & zoom 60% saat pertama load
  // ─────────────────────────────────────────────────────────
  const onInit = useCallback((instance: ReactFlowInstance) => {
    instance.fitView();
    instance.zoomTo(0.6);
  }, []);

  const selectedNodeId =
    selected.nodes.length > 0 ? selected.nodes[0].id : null;

  // ─────────────────────────────────────────────────────────
  // Fungsi: Ekspor nodes+edges ke file JSON
  // ─────────────────────────────────────────────────────────
  const exportToFile = () => {
    const payload = { nodes, edges };
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Nama default file: flow-diagram-YYYYMMDD-HHMMSS.json
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const filename = `flow-diagram-${date.getFullYear()}${pad(
      date.getMonth() + 1
    )}${pad(date.getDate())}-${pad(date.getHours())}${pad(
      date.getMinutes()
    )}${pad(date.getSeconds())}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────
  // Fungsi: Restore dari file JSON
  // ─────────────────────────────────────────────────────────
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text) as {
          nodes: Node[];
          edges: Edge[];
        };
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (err) {
        console.error("Gagal parse JSON:", err);
        alert("Gagal membuka file: format JSON tidak valid.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="w-screen h-screen relative">
      {/* + Tambah Node */}
      <button
        onClick={addNewNode}
        className="
          absolute top-2 left-2 z-10
          px-3 py-2
          bg-blue-500 text-white
          rounded-md
          hover:bg-blue-600
          focus:outline-none
          focus:ring-2 focus:ring-blue-300
        "
      >
        + Tambah Node
      </button>

      {/* + Tambah Baris (global) */}
      <button
        onClick={handleAddLineToSelected}
        disabled={!selectedNodeId}
        className={`
          absolute top-14 left-2 z-10
          px-3 py-2
          bg-green-500 text-white
          rounded-md
          hover:bg-green-600
          focus:outline-none
          focus:ring-2 focus:ring-green-300
          ${!selectedNodeId ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        + Tambah Baris
      </button>

      {/* Simpan ke File */}
      <button
        onClick={exportToFile}
        className="
          absolute top-2 left-40 z-10
          px-3 py-2
          bg-indigo-500 text-white
          rounded-md
          hover:bg-indigo-600
          focus:outline-none
          focus:ring-2 focus:ring-indigo-300
        "
      >
        Simpan ke File
      </button>

      {/* Restore dari File */}
      <button
        onClick={openFileDialog}
        className="
          absolute top-14 left-40 z-10
          px-3 py-2
          bg-yellow-500 text-white
          rounded-md
          hover:bg-yellow-600
          focus:outline-none
          focus:ring-2 focus:ring-yellow-300
        "
      >
        Restore dari File
      </button>

      {/* Input file tersembunyi */}
      <input
        type="file"
        accept=".json,application/json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Canvas ReactFlow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onInit={onInit}
        connectionLineType={ConnectionLineType.Step}
      >
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
