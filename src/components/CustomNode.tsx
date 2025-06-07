"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Handle,
  Position,
} from "@xyflow/react";

export type Line = {
  id: string;
  text: string;
};

export type CustomNodeData = {
  title: string;       // Judul yang bisa di-edit
  lines: Line[];       // Daftar baris teks
};

type CustomNodeProps = {
  id: string;
  data: CustomNodeData;
  selected: boolean;
  onChangeTitle: (nodeId: string, newTitle: string) => void;
  onChangeLineText: (nodeId: string, lineId: string, newText: string) => void;
};

const CustomNode: React.FC<CustomNodeProps> = ({
  id,
  data,
  selected,
  onChangeTitle,
  onChangeLineText,
}) => {
  // ───── STATE EDIT JUDUL ─────
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ───── STATE EDIT BARIS ─────
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [tempText, setTempText] = useState("");
  const lineInputRef = useRef<HTMLInputElement>(null);

  // ───── UKURAN & PERHITUNGAN ─────
  const nodeWidth = 180;      // Lebar kotak node
  const titleHeight = 24;     // Tinggi area judul
  const lineHeight = 20;      // Tinggi tiap baris teks
  const paddingY = 4;         // Padding vertikal (atas & bawah)
  const handleSize = 8;       // Ukuran titik Handle (8×8 px)
  const totalHeight =
    paddingY + titleHeight + data.lines.length * lineHeight + paddingY;

  // ───── EDIT JUDUL ─────
  const startEditingTitle = () => {
    setEditingTitle(true);
    setTempTitle(data.title);
  };

  const finishEditingTitle = () => {
    const trimmed = tempTitle.trim();
    if (trimmed !== "" && trimmed !== data.title) {
      onChangeTitle(id, trimmed);
    }
    setEditingTitle(false);
    setTempTitle("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      titleInputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditingTitle(false);
      setTempTitle("");
    }
  };

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // ───── EDIT BARIS ─────
  const startEditingLine = (lineId: string, currentText: string) => {
    setEditingLineId(lineId);
    setTempText(currentText);
  };

  const finishEditingLine = () => {
    if (editingLineId) {
      const trimmed = tempText.trim();
      if (trimmed !== "") {
        onChangeLineText(id, editingLineId, trimmed);
      }
    }
    setEditingLineId(null);
    setTempText("");
  };

  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      lineInputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditingLineId(null);
      setTempText("");
    }
  };

  useEffect(() => {
    if (editingLineId && lineInputRef.current) {
      lineInputRef.current.focus();
      lineInputRef.current.select();
    }
  }, [editingLineId]);

  return (
    <div
      className={`
        relative
        bg-white
        border border-gray-300
        rounded-md
        shadow-sm
        user-select-none
      `}
      style={{ width: nodeWidth, height: totalHeight }}
    >
      {/* ─── AREA JUDUL ─── */}
      <div
        className="absolute left-0 right-0 flex items-center px-2"
        style={{ top: paddingY, height: titleHeight }}
      >
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={finishEditingTitle}
            onKeyDown={handleTitleKeyDown}
            className="
              flex-1
              h-full
              px-1
              text-sm
              bg-blue-50
              border border-blue-300
              rounded
              focus:outline-none
              w-20
            "
          />
        ) : (
          <div
            onDoubleClick={startEditingTitle}
            className="
              flex-1
              h-full
              px-1
              text-sm font-semibold text-gray-900
              truncate
              cursor-text
              hover:bg-gray-100
              rounded
            "
          >
            {data.title}
          </div>
        )}
      </div>

      {/* ─── GARIS PEMISAH ─── */}
      <div
        className="absolute left-1 right-1 bg-gray-200"
        style={{
          top: paddingY + titleHeight,
          height: 1,
        }}
      />

      {/* ─── AREA BARIS ─── */}
      {data.lines.map((line, idx) => {
        const yOffset = paddingY + titleHeight + idx * lineHeight;
        const handleTop = (lineHeight - handleSize) / 2;
        const leftX = -handleSize / 2;
        const rightX = -handleSize / 2;

        const leftSourceId = `ls-${id}-${line.id}`;
        const leftTargetId = `lt-${id}-${line.id}`;
        const rightSourceId = `rs-${id}-${line.id}`;
        const rightTargetId = `rt-${id}-${line.id}`;

        return (
          <div
            key={line.id}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: yOffset, height: lineHeight }}
          >
            {/* Handle Kiri */}
            <Handle
              type="source"
              id={leftSourceId}
              position={Position.Left}
              style={{
                top: handleTop,
                left: leftX,
                background: "blue",
                width: handleSize,
                height: handleSize,
                borderRadius: handleSize / 2,
                zIndex: 10,
              }}
            />
            <Handle
              type="target"
              id={leftTargetId}
              position={Position.Left}
              style={{
                top: handleTop,
                left: leftX,
                background: "#555",
                width: handleSize,
                height: handleSize,
                borderRadius: handleSize / 2,
              }}
            />

            {/* Teks Baris */}
            {editingLineId === line.id ? (
              <input
                ref={lineInputRef}
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={finishEditingLine}
                onKeyDown={handleLineKeyDown}
                className="
                  flex-1
                  mx-2
                  h-full
                  px-1
                  text-sm
                  bg-blue-50
                  border border-blue-300
                  rounded
                  focus:outline-none
                  w-20
                "
              />
            ) : (
              <div
                onDoubleClick={() => startEditingLine(line.id, line.text)}
                className="
                  flex-1
                  mx-2
                  text-sm
                  text-gray-800
                  truncate
                  cursor-text
                  hover:bg-gray-100
                  px-1
                  rounded
                "
              >
                {line.text}
              </div>
            )}

            {/* Handle Kanan */}
            <Handle
              type="source"
              id={rightSourceId}
              position={Position.Right}
              style={{
                top: handleTop,
                right: rightX,
                background: "green",
                width: handleSize,
                height: handleSize,
                borderRadius: handleSize / 2,
                zIndex: 10,
              }}
            />
            <Handle
              type="target"
              id={rightTargetId}
              position={Position.Right}
              style={{
                top: handleTop,
                right: rightX,
                background: "#555",
                width: handleSize,
                height: handleSize,
                borderRadius: handleSize / 2,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CustomNode;
