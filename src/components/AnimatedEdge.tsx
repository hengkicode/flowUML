// src/components/AnimatedEdge.tsx
"use client";

import React from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";

const AnimatedEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  // SmoothStep agar jalur orthogonal halus
  const res = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgePath = Array.isArray(res) ? res[0] : (res as string);

  return (
    <>
      {/* Layer dasar */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#ddd",
          strokeWidth: 1,
          ...style,
        }}
      />
      {/* Layer animasi dashed */}
      <path
        d={edgePath}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="animated-edge-path"
      />
    </>
  );
};

export default AnimatedEdge;
