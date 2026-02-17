"use client";

import { useState, useEffect, useCallback } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Issue, Status, Priority, BoardState } from "@/lib/types";
import { STATUSES } from "@/lib/types";
import { BoardColumn } from "./board-column";
import { IssueModal } from "./issue-modal";

type ModalState =
  | { mode: "closed" }
  | { mode: "create"; defaultStatus: Status }
  | { mode: "edit"; issue: Issue };

const statusLabels: Record<Status, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

type BoardProps = {
  state: BoardState;
  onCreateIssue: (data: {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    assignee: string;
    labels: string[];
  }) => void;
  onUpdateIssue: (id: string, data: Partial<Issue>) => void;
  onDeleteIssue: (id: string) => void;
};

export function Board({
  state,
  onCreateIssue,
  onUpdateIssue,
  onDeleteIssue,
}: BoardProps) {
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });
  const [mobileTab, setMobileTab] = useState<Status>("todo");
  const [newIssueId, setNewIssueId] = useState<string | null>(null);

  const issues = state.issues ?? [];
  const totalCount = issues.length;

  const issuesByStatus = useCallback(
    (status: Status): Issue[] => issues.filter((i) => i.status === status),
    [issues]
  );

  // Monitor drag-and-drop events for cross-column moves
  useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const issueId = source.data.issueId as string;
        const newStatus = target.data.status as Status;

        if (issueId && newStatus) {
          onUpdateIssue(issueId, { status: newStatus });
        }
      },
    });
  }, [onUpdateIssue]);

  // Clear new issue highlight after animation
  useEffect(() => {
    if (!newIssueId) return;
    const timer = setTimeout(() => setNewIssueId(null), 1000);
    return () => clearTimeout(timer);
  }, [newIssueId]);

  function handleCreateIssue(data: {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    assignee: string;
    labels: string[];
  }) {
    onCreateIssue(data);
    // Find the newly created issue by checking what's new after state updates
    // We use a timestamp-based ID so the newest issue will be the one just created
    setTimeout(() => {
      const newest = state.issues?.[state.issues.length];
      if (newest) setNewIssueId(newest.id);
    }, 50);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="navbar bg-base-100 border-b border-base-300 px-4 sm:px-6 min-h-0 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">{state.projectName}</h1>
          {totalCount > 0 && (
            <span className="badge badge-sm badge-neutral">{totalCount}</span>
          )}
        </div>
      </div>

      {/* Mobile tab bar - visible only on small screens */}
      <div className="sm:hidden border-b border-base-300 px-4 py-2 overflow-x-auto">
        <div role="tablist" className="tabs tabs-boxed">
          {STATUSES.map((status) => (
            <button
              key={status}
              role="tab"
              className={`tab tab-sm ${mobileTab === status ? "tab-active" : ""}`}
              onClick={() => setMobileTab(status)}
            >
              {statusLabels[status]}
              <span className="badge badge-xs ml-1.5">{issuesByStatus(status).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Mobile: single column */}
        <div className="sm:hidden h-full">
          <BoardColumn
            status={mobileTab}
            issues={issuesByStatus(mobileTab)}
            onIssueClick={(issue) => setModal({ mode: "edit", issue })}
            onAddClick={() => setModal({ mode: "create", defaultStatus: mobileTab })}
            newIssueId={newIssueId}
          />
        </div>

        {/* Tablet: 2-col grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:hidden gap-4 h-full">
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={issuesByStatus(status)}
              onIssueClick={(issue) => setModal({ mode: "edit", issue })}
              onAddClick={() => setModal({ mode: "create", defaultStatus: status })}
              newIssueId={newIssueId}
            />
          ))}
        </div>

        {/* Desktop: horizontal flex */}
        <div className="hidden lg:flex gap-4 h-full min-h-0">
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={issuesByStatus(status)}
              onIssueClick={(issue) => setModal({ mode: "edit", issue })}
              onAddClick={() => setModal({ mode: "create", defaultStatus: status })}
              newIssueId={newIssueId}
            />
          ))}
        </div>
      </div>

      {modal.mode === "create" && (
        <IssueModal
          defaultStatus={modal.defaultStatus}
          onSave={(data) => {
            handleCreateIssue(data);
            setModal({ mode: "closed" });
          }}
          onClose={() => setModal({ mode: "closed" })}
        />
      )}

      {modal.mode === "edit" && (
        <IssueModal
          issue={modal.issue}
          onSave={(data) => {
            onUpdateIssue(modal.issue.id, data);
            setModal({ mode: "closed" });
          }}
          onDelete={() => {
            onDeleteIssue(modal.issue.id);
            setModal({ mode: "closed" });
          }}
          onClose={() => setModal({ mode: "closed" })}
        />
      )}
    </div>
  );
}
