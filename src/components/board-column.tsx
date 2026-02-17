"use client";

import { useRef, useState, useEffect } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Issue, Status } from "@/lib/types";
import { IssueCard } from "./issue-card";

const statusLabels: Record<Status, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

type BoardColumnProps = {
  status: Status;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onAddClick: () => void;
  newIssueId?: string | null;
};

export function BoardColumn({
  status,
  issues,
  onIssueClick,
  onAddClick,
  newIssueId,
}: BoardColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ status }),
      canDrop: ({ source }) => source.data.status !== status,
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [status]);

  return (
    <div
      ref={ref}
      className={`flex flex-col min-w-64 w-full rounded-xl p-4 sm:p-3 gap-3 transition-all duration-200 min-h-50 ${
        isOver
          ? "bg-primary/10 ring-2 ring-primary/30 scale-[1.01]"
          : "bg-base-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">{statusLabels[status]}</h2>
          <span className="badge badge-sm badge-ghost">{issues.length}</span>
        </div>
        <button
          className="btn btn-ghost btn-sm sm:btn-xs btn-square"
          onClick={onAddClick}
          aria-label={`Add issue to ${statusLabels[status]}`}
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <button
            onClick={onAddClick}
            className="flex-1 flex items-center justify-center border-2 border-dashed border-base-300 rounded-lg text-base-content/40 text-sm p-6 hover:border-primary/30 hover:text-base-content/60 transition-colors cursor-pointer"
          >
            No issues — click to add
          </button>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
              isNew={issue.id === newIssueId}
            />
          ))
        )}
      </div>
    </div>
  );
}
