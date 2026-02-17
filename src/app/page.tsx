"use client";

import { useEffect, useRef, useState } from "react";
import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { Board } from "@/components/board";
import type { BoardState, Issue, Status, Priority } from "@/lib/types";
import {
  createIssueParams,
  updateIssueParams,
  deleteIssueParams,
  moveIssueParams,
} from "@/lib/schemas";

export default function HomePage() {
  return (
    <main className="h-screen">
      <CopilotSidebar
        disableSystemMessage={true}
        clickOutsideToClose={false}
        icons={{
          openIcon: (
            <img
              src="/iris.png"
              alt="Open Pasithea Assistant"
              className="w-20 h-20 rounded-full object-cover"
            />
          ),
        }}
        labels={{
          title: "Pasithea Assistant",
          initial:
            "Hi, I'm Iris! I can help you manage your board. Try asking me to create an issue.",
        }}
        suggestions={[
          {
            title: "Create Issue",
            message:
              "Create a high priority issue called 'Set up CI/CD pipeline'",
          },
          {
            title: "Move Issue",
            message: "Move all backlog issues to todo",
          },
          {
            title: "Board Summary",
            message: "Give me a summary of all issues on the board",
          },
        ]}
      >
        <BoardContent />
      </CopilotSidebar>
    </main>
  );
}

const defaultState: BoardState = {
  issues: [],
  projectName: "Pasithea",
};

function BoardContent() {
  const { state, setState } = useCoAgent<BoardState>({
    name: "my_agent",
    initialState: defaultState,
  });

  // Local issues state — single source of truth, persisted to localStorage
  const [issues, setIssues] = useState<Issue[]>([]);
  const hydrated = useRef(false);

  // Load from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pasithea-issues");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIssues(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
    hydrated.current = true;
  }, []);

  // Persist to localStorage whenever issues change (skip initial empty write)
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem("pasithea-issues", JSON.stringify(issues));
  }, [issues]);

  // Track whether we caused the coagent state change (to avoid loops)
  const localUpdateRef = useRef(false);

  // Sync local issues into coagent state so the agent can see them
  useEffect(() => {
    localUpdateRef.current = true;
    setState((prev = defaultState) => ({ ...prev, issues }));
  }, [issues]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync agent-created issues back into local state
  const agentIssues = state?.issues;
  useEffect(() => {
    if (localUpdateRef.current) {
      localUpdateRef.current = false;
      return;
    }
    if (agentIssues && agentIssues.length > 0) {
      setIssues(agentIssues);
    }
  }, [agentIssues]);

  function createIssue(data: {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    assignee: string;
    labels: string[];
  }) {
    const now = new Date().toISOString();
    const issue: Issue = {
      id: `ISS-${Date.now().toString(36).toUpperCase()}`,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignee: data.assignee || undefined,
      labels: data.labels,
      createdAt: now,
      updatedAt: now,
    };
    setIssues((prev) => [...prev, issue]);
  }

  function updateIssue(id: string, data: Partial<Issue>) {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id
          ? { ...issue, ...data, updatedAt: new Date().toISOString() }
          : issue
      )
    );
  }

  function deleteIssue(id: string) {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
  }

  // CopilotKit Frontend Tools
  useCopilotAction({
    name: "createIssue",
    description: "Create a new issue on the board",
    parameters: createIssueParams,
    handler: async ({ title, description, status, priority, assignee, labels }) => {
      createIssue({
        title,
        description: description ?? "",
        status: (status as Status) ?? "todo",
        priority: (priority as Priority) ?? "medium",
        assignee: assignee ?? "",
        labels: (labels as string[]) ?? [],
      });
      return `Created issue "${title}"`;
    },
  });

  useCopilotAction({
    name: "updateIssue",
    description: "Update an existing issue's fields",
    parameters: updateIssueParams,
    handler: async ({ id, ...fields }) => {
      const cleanFields = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      );
      updateIssue(id, cleanFields);
      return `Updated issue ${id}`;
    },
  });

  useCopilotAction({
    name: "deleteIssue",
    description: "Delete an issue from the board",
    parameters: deleteIssueParams,
    handler: async ({ id }) => {
      deleteIssue(id);
      return `Deleted issue ${id}`;
    },
  });

  useCopilotAction({
    name: "moveIssue",
    description: "Move an issue to a different status column",
    parameters: moveIssueParams,
    handler: async ({ id, status }) => {
      updateIssue(id, { status: status as Status });
      return `Moved issue ${id} to ${status}`;
    },
  });

  const currentState: BoardState = {
    ...(state ?? defaultState),
    issues,
  };

  return (
    <Board
      state={currentState}
      onCreateIssue={createIssue}
      onUpdateIssue={updateIssue}
      onDeleteIssue={deleteIssue}
    />
  );
}
