export const STATUSES = ["backlog", "todo", "in-progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Issue = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
};

export type BoardState = {
  issues: Issue[];
  projectName: string;
};
