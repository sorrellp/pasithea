"use client";

import { useRef, useState, useEffect } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Issue } from "@/lib/types";

const priorityColors: Record<Issue["priority"], string> = {
  low: "badge-info",
  medium: "badge-warning",
  high: "badge-error",
  critical: "badge-error badge-outline",
};

type IssueCardProps = {
  issue: Issue;
  onClick: () => void;
  isNew?: boolean;
};

export function IssueCard({ issue, onClick, isNew }: IssueCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({ issueId: issue.id, status: issue.status }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [issue.id, issue.status]);

  return (
    <div
      ref={ref}
      className={`card card-border bg-base-100 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
        isDragging ? "opacity-40" : ""
      } ${isNew ? "animate-pulse" : ""}`}
      onClick={onClick}
    >
      <div className="card-body p-4 sm:p-3 gap-2">
        <h3 className="card-title text-sm font-medium">{issue.title}</h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`badge badge-xs ${priorityColors[issue.priority]}`}>
            {issue.priority}
          </span>
          {issue.labels.map((label) => (
            <span key={label} className="badge badge-xs badge-ghost">
              {label}
            </span>
          ))}
        </div>

        {issue.assignee && (
          <div className="text-xs text-base-content/60">{issue.assignee}</div>
        )}
      </div>
    </div>
  );
}
