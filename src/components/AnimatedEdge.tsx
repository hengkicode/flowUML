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
  // Dapatkan path edge dengan bentuk smooth step
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
      {/* Definisi gradient untuk warna edge */}
      <defs>
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Layer dasar edge abu-abu */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#ddd",
          strokeWidth: 1,
          ...style,
        }}
      />

      {/* Layer animasi gradasi dengan stroke dash */}
      <path
        d={edgePath}
        stroke="url(#edge-gradient)"
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
