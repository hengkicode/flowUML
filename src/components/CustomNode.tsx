// src/components/CustomNode.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";

export type Line = {
  id: string;
  text: string;
};

export type CustomNodeData = {
  title: string;
  lines: Line[];
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
  // State editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [tempText, setTempText] = useState("");
  const lineInputRef = useRef<HTMLInputElement>(null);

  // Hover highlight
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  // Ukuran
  const nodeWidth = 180;
  const titleHeight = 24;
  const lineHeight = 24; // sedikit diperbesar agar area klik nyaman
  const paddingY = 8;
  const handleSize = 8; // area klik handle lebih besar
  const totalHeight = paddingY + titleHeight + data.lines.length * lineHeight + paddingY;

  // Edit judul
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

  // Edit baris
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
        relative bg-white border border-gray-300
        rounded-md shadow-sm user-select-none
      `}
      style={{ width: nodeWidth, height: totalHeight }}
    >
      {/* Judul */}
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
              flex-1 h-full px-1 text-sm
              bg-blue-50 border border-blue-300 w-20
              rounded focus:outline-none
            "
          />
        ) : (
          <div
            onDoubleClick={startEditingTitle}
            className="
              flex-1 h-full px-1 text-sm font-semibold text-gray-900
              truncate cursor-text hover:bg-gray-100 rounded
            "
          >
            {data.title}
          </div>
        )}
      </div>
      {/* Garis pemisah judul */}
      <div
        className="absolute left-1 right-1 bg-gray-200"
        style={{ top: paddingY + titleHeight, height: 1 }}
      />

      {/* Baris */}
      {data.lines.map((line, idx) => {
        const yOffset = paddingY + titleHeight + idx * lineHeight;
        const handleTop = (lineHeight - handleSize) / 1;

        // IDs handle unik
        const leftSourceId = `source-left-${id}-${line.id}`;
        const leftTargetId = `target-left-${id}-${line.id}`;
        const rightSourceId = `source-right-${id}-${line.id}`;
        const rightTargetId = `target-right-${id}-${line.id}`;

        // Highlight jika hover
        const isHovered = hoveredLineId === line.id;

        return (
          <div
            key={line.id}
            className={`absolute left-0 right-0 flex items-center px-1 ${
              isHovered ? "bg-gray-100" : ""
            }`}
            style={{ top: yOffset, height: lineHeight }}
            onMouseEnter={() => setHoveredLineId(line.id)}
            onMouseLeave={() => setHoveredLineId(null)}
          >
            {/* Handle kiri: source */}
            <Handle
              type="source"
              id={leftSourceId}
              position={Position.Left}
              style={{
                top: handleTop,
                left: -handleSize / 2,
                width: handleSize,
                height: handleSize,
                background: "gray",
                borderRadius: handleSize / 2,
                zIndex: 10,
              }}
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
            />
            {/* Handle kiri: target */}
            <Handle
              type="target"
              id={leftTargetId}
              position={Position.Left}
              style={{
                top: handleTop,
                left: -handleSize / 2,
                width: handleSize,
                height: handleSize,
                background: "#555",
                borderRadius: handleSize / 2,
                zIndex: 10,
              }}
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
            />

            {/* Teks baris atau input */}
            {editingLineId === line.id ? (
              <input
                ref={lineInputRef}
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={finishEditingLine}
                onKeyDown={handleLineKeyDown}
                className="
                  flex-1 mx-2 h-full px-1 text-sm
                  bg-blue-50 border border-blue-300 w-20
                  rounded focus:outline-none
                "
              />
            ) : (
              <div
                onDoubleClick={() => startEditingLine(line.id, line.text)}
                className="flex-1 mx-2 text-sm text-gray-800 truncate cursor-text"
              >
                {line.text}
              </div>
            )}

            {/* Handle kanan: source */}
            <Handle
              type="source"
              id={rightSourceId}
              position={Position.Right}
              style={{
                top: handleTop,
                right: -handleSize / 2,
                width: handleSize,
                height: handleSize,
                background: "gray",
                borderRadius: handleSize / 2,
                zIndex: 10,
              }}
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
            />
            {/* Handle kanan: target */}
            <Handle
              type="target"
              id={rightTargetId}
              position={Position.Right}
              style={{
                top: handleTop,
                right: -handleSize / 2,
                width: handleSize,
                height: handleSize,
                background: "#555",
                borderRadius: handleSize / 2,
                zIndex: 10,
              }}
              onMouseEnter={() => setHoveredLineId(line.id)}
              onMouseLeave={() => setHoveredLineId(null)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CustomNode;
