import { db, getUser, newMessageExists } from "@/utils/firebase";
import { handleBotInteraction } from "@/utils/openai";

export async function POST(req: Request) {
  const {
    waid,
    message,
  }: {
    waid: string;
    message: string;
  } = await req.json();

  const now = new Date().toISOString();

  const addedMessage = await db.collection("mensajes").add({
    waid,
    message,
    date: now,
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const foundNewMessages = await newMessageExists(waid, now);

  if (!foundNewMessages) {
    const currentUser = await getUser(waid);

    let botResponse;
    if (currentUser?.threadId) {
      botResponse = await handleBotInteraction(message, currentUser.threadId);
    } else {
      botResponse = await handleBotInteraction(message);
    }

    // Add a message to the thread

    const botMessage = botResponse.message.text.value;
    const threadId = botResponse.threadId;

    // if doesnt exist threadId then add it

    return new Response(JSON.stringify(botMessage), { status: 200 });
  }

  return new Response(JSON.stringify(""), { status: 200 });
  // return AssistantResponse(
  //   { threadId, messageId: createdMessage.id },
  //   async ({ forwardStream, sendDataMessage }) => {
  //     // Run the assistant on the thread
  //     const runStream = openai.beta.threads.runs.stream(threadId, {
  //       assistant_id:
  //         //   process.env.ASSISTANT_ID ??
  //         ASSISTANT_ID ??
  //         (() => {
  //           throw new Error("ASSISTANT_ID is not set");
  //         })(),
  //     });

  //     // forward run status would stream message deltas
  //     let runResult = await forwardStream(runStream);

  //     // status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
  //     while (
  //       runResult?.status === "requires_action" &&
  //       runResult.required_action?.type === "submit_tool_outputs"
  //     ) {
  //       const tool_outputs =
  //         runResult.required_action.submit_tool_outputs.tool_calls.map(
  //           (toolCall: any) => {
  //             const parameters = JSON.parse(toolCall.function.arguments);

  //             switch (toolCall.function.name) {
  //               // configure your tool calls here

  //               default:
  //                 throw new Error(
  //                   `Unknown tool call function: ${toolCall.function.name}`
  //                 );
  //             }
  //           }
  //         );

  //       runResult = await forwardStream(
  //         openai.beta.threads.runs.submitToolOutputsStream(
  //           threadId,
  //           runResult.id,
  //           { tool_outputs }
  //         )
  //       );
  //     }
  //   }
  // );
}
