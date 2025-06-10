// src/components/AnimatedEdge.tsx
"use client";

import React from "react";
import {
  EdgeProps,
  getSmoothStepPath,
  BaseEdge,
} from "@xyflow/react";

const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  // Dapatkan path smooth step
  const res = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgePath = Array.isArray(res) ? res[0] : (res as string);

  // Ambil warna stroke dari style atau fallback
  const strokeColor = typeof style.stroke === "string" ? style.stroke : "#888";
  const strokeWidth = style.strokeWidth ?? 2;

  // ID unik untuk gradient
  const gradientId = `edge-gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={1} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.2} />
        </linearGradient>
      </defs>

      {/* Layer dasar tipis */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#ddd",
          strokeWidth: 1,
          ...style,
        }}
      />

      {/* Layer gradient animasi */}
      <path
        d={edgePath}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animated-edge-path"
      />
    </>
  );
};

export default AnimatedEdge;
