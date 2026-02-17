"use client";

import { useState, useEffect, useRef } from "react";
import type { Issue, Status, Priority } from "@/lib/types";
import { STATUSES, PRIORITIES } from "@/lib/types";

type IssueModalProps = {
  issue?: Issue;
  defaultStatus?: Status;
  onSave: (data: {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    assignee: string;
    labels: string[];
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

const statusLabels: Record<Status, string> = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

export function IssueModal({
  issue,
  defaultStatus,
  onSave,
  onDelete,
  onClose,
}: IssueModalProps) {
  const [title, setTitle] = useState(issue?.title ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [status, setStatus] = useState<Status>(
    issue?.status ?? defaultStatus ?? "todo"
  );
  const [priority, setPriority] = useState<Priority>(
    issue?.priority ?? "medium"
  );
  const [assignee, setAssignee] = useState(issue?.assignee ?? "");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>(issue?.labels ?? []);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, status, priority, assignee, labels });
  }

  function addLabel() {
    const l = labelInput.trim();
    if (l && !labels.includes(l)) {
      setLabels([...labels, l]);
    }
    setLabelInput("");
  }

  function removeLabel(label: string) {
    setLabels(labels.filter((l) => l !== label));
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box w-full max-w-lg max-sm:h-full max-sm:max-h-full max-sm:rounded-none">
        <h3 className="font-bold text-lg mb-4">
          {issue ? "Edit Issue" : "New Issue"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="input input-bordered w-full"
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="textarea textarea-bordered w-full"
            placeholder="Describe the issue..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select
                id="status"
                className="select select-bordered w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="priority">Priority</label>
              <select
                id="priority"
                className="select select-bordered w-full"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="label" htmlFor="assignee">Assignee</label>
          <input
            id="assignee"
            type="text"
            className="input input-bordered w-full"
            placeholder="Assignee name"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />

          <label className="label">Labels</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Add label"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLabel();
                }
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={addLabel}>
              Add
            </button>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {labels.map((label) => (
                <span key={label} className="badge badge-ghost gap-1">
                  {label}
                  <button
                    type="button"
                    className="text-xs opacity-60 hover:opacity-100"
                    onClick={() => removeLabel(label)}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="modal-action">
            {issue && onDelete && (
              <button
                type="button"
                className="btn btn-error btn-outline mr-auto"
                onClick={onDelete}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {issue ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
