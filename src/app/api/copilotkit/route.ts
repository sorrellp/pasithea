import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkitnext/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest } from "next/server";

const github = createOpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

const agent = new BuiltInAgent({
  model: github.chat("gpt-4o-mini"),
  prompt: `You are a project management assistant for the Pasithea board.
You help users manage issues on a Kanban board with four columns: Backlog, To Do, In Progress, and Done.
You have frontend tools to create, update, delete, and move issues.
When the user asks about the board, use the available tools to help them.
Always be concise and helpful.`,
  maxSteps: 5,
  temperature: 0.7,
});

const runtime = new CopilotRuntime({
  agents: { my_agent: agent },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new ExperimentalEmptyAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
