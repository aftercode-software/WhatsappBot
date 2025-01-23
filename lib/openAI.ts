import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const ASSISTANT_ID = "asst_wRwVrGgfTmFee8Njh2sgqxGH";

interface BotResponse {
  message: any;
  threadId: string;
}

export async function handleBotInteraction(
  message: string,
  threadId: string
): Promise<BotResponse> {
  // Create or use existing thread
  // const threadId =
  //   existingThreadId || (await openai.beta.threads.create({})).id;

  // Add user message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  // Start assistant run
  let run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
  });

  // Poll run status
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const currentRun = await openai.beta.threads.runs.retrieve(
      threadId,
      run.id
    );

    switch (currentRun.status) {
      case "completed":
        const messages = await openai.beta.threads.messages.list(threadId, {
          order: "desc",
          limit: 1,
        });
        return {
          message: messages.data[0].content[0],
          threadId: threadId,
        };

      case "requires_action":
        if (currentRun.required_action?.submit_tool_outputs?.tool_calls) {
          const toolOutputs = await handleToolCalls(
            currentRun.required_action.submit_tool_outputs.tool_calls
          );

          run = await openai.beta.threads.runs.submitToolOutputs(
            threadId,
            run.id,
            { tool_outputs: toolOutputs }
          );
        }
        break;

      case "failed":
        throw new Error("Run failed");

      default:
        continue;
    }
  }
}

async function handleToolCalls(toolCalls: any[]): Promise<any[]> {
  return toolCalls.map((toolCall: any) => {
    if (toolCall.function.name === "obtenerDatosUsuario") {
      return {
        tool_call_id: toolCall.id,
        output:
          "El usuario se llama Walter, tiene 20 años y 0 consultas al médico pendientes.",
      };
    }
    throw new Error(`Unhandled tool call: ${toolCall.function.name}`);
  });
}
