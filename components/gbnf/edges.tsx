"use client";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { CSSProperties } from "react";

interface EdgeData {
  pathLength?: number;
  label?: string;
}

export function SelfConnectingEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps & { data?: EdgeData; style?: CSSProperties }) {
  // Create a large arc for self-connections
  const xOffset = (data?.pathLength || 1) * 10 - 10;
  const yOffset = -100;

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: Math.max(sourceX, targetX) + xOffset,
    targetY: Math.min(sourceY, targetY) + yOffset,
    targetPosition: sourcePosition,
  });

  const [path2] = getSmoothStepPath({
    sourceX: Math.max(sourceX, targetX) + xOffset,
    sourceY: Math.min(sourceY, targetY) + yOffset,
    sourcePosition,
    targetX: Math.min(sourceX, targetX) - xOffset,
    targetY: Math.min(sourceY, targetY) + yOffset,
    targetPosition: sourcePosition,
  });

  const [path3] = getSmoothStepPath({
    sourceX: Math.min(sourceX, targetX) - xOffset,
    sourceY: Math.min(sourceY, targetY) + yOffset,
    sourcePosition: targetPosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={`${path} ${path2} ${path3}`}
      markerEnd={markerEnd}
      style={style}
    />
  );
}
