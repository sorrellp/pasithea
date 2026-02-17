import type { Parameter } from "@copilotkit/shared";

const statusEnum = ["backlog", "todo", "in-progress", "done"];
const priorityEnum = ["low", "medium", "high", "critical"];

export const createIssueParams = [
  { name: "title", type: "string", description: "Title of the issue", required: true },
  { name: "description", type: "string", description: "Description of the issue", required: false },
  { name: "status", type: "string", enum: statusEnum, description: "Status column", required: false },
  { name: "priority", type: "string", enum: priorityEnum, description: "Priority level", required: false },
  { name: "assignee", type: "string", description: "Person assigned to this issue", required: false },
  { name: "labels", type: "string[]", description: "Labels/tags for the issue", required: false },
] as const satisfies Parameter[];

export const updateIssueParams = [
  { name: "id", type: "string", description: "ID of the issue to update", required: true },
  { name: "title", type: "string", description: "New title", required: false },
  { name: "description", type: "string", description: "New description", required: false },
  { name: "status", type: "string", enum: statusEnum, description: "New status", required: false },
  { name: "priority", type: "string", enum: priorityEnum, description: "New priority", required: false },
  { name: "assignee", type: "string", description: "New assignee", required: false },
  { name: "labels", type: "string[]", description: "New labels", required: false },
] as const satisfies Parameter[];

export const deleteIssueParams = [
  { name: "id", type: "string", description: "ID of the issue to delete", required: true },
] as const satisfies Parameter[];

export const moveIssueParams = [
  { name: "id", type: "string", description: "ID of the issue to move", required: true },
  { name: "status", type: "string", enum: statusEnum, description: "New status column", required: true },
] as const satisfies Parameter[];
