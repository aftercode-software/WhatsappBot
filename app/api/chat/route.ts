import { handleBotInteraction } from "@/lib/openAI";
import { addMessageToClient, newMessageExists } from "@/services/mensajes";
import { createThread } from "@/services/thread";
import { createUser, getUser } from "@/services/user";

interface WhatsAppMessage {
  waid: string;
  message: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { waid, message }: WhatsAppMessage = await req.json();
    console.log("waid", waid);
    console.log("message", message);
    if (!waid || !message) {
      return new Response(JSON.stringify({ error: "Invalid request data" }), {
        status: 400,
      });
    }

    const now = new Date().toISOString();

    let currentUser = await getUser(waid);
    console.log("currentUser", currentUser);

    if (!currentUser) {
      const threadId = await createThread();
      console.log("threadId", threadId);
      await createUser(waid, threadId);
      currentUser = await getUser(waid);
      console.log("currentUser", currentUser);
    }

    await addMessageToClient(waid, message, now);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const foundNewMessages = await newMessageExists(waid, now);
    console.log("foundNewMessages", foundNewMessages);

    if (!foundNewMessages) {
      if (!currentUser?.threadId) {
        return new Response(
          JSON.stringify({ error: "Thread ID not found for user" }),
          { status: 500 }
        );
      }

      const botResponse = await handleBotInteraction(
        message,
        currentUser.threadId
      );

      if (botResponse && botResponse.message?.text?.value) {
        const botMessage = botResponse.message.text.value;

        return new Response(JSON.stringify({ botMessage }), { status: 200 });
      } else {
        return new Response(
          JSON.stringify({ error: "Bot interaction failed" }),
          { status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: "New messages detected, no bot interaction needed",
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing POST request:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

// export async function POST(req: Request) {
//   const {
//     waid,
//     message,
//   }: {
//     waid: string;
//     message: string;
//   } = await req.json();

//   const now = new Date().toISOString();

//   const addedMessage = await db.collection("mensajes").add({
//     waid,
//     message,
//     date: now,
//   });

//   await new Promise((resolve) => setTimeout(resolve, 5000));

//   const foundNewMessages = await newMessageExists(waid, now);

//   if (!foundNewMessages) {
//     const currentUser = await getUser(waid);

//     let botResponse;
//     if (currentUser?.threadId) {
//       botResponse = await handleBotInteraction(message, currentUser.threadId);
//     } else {
//       botResponse = await handleBotInteraction(message);
//     }

//     // Add a message to the thread

//     const botMessage = botResponse.message.text.value;
//     const threadId = botResponse.threadId;

//     // if doesnt exist threadId then add it

//     return new Response(JSON.stringify(botMessage), { status: 200 });
//   }

//   return new Response(JSON.stringify(""), { status: 200 });
//   // return AssistantResponse(
//   //   { threadId, messageId: createdMessage.id },
//   //   async ({ forwardStream, sendDataMessage }) => {
//   //     // Run the assistant on the thread
//   //     const runStream = openai.beta.threads.runs.stream(threadId, {
//   //       assistant_id:
//   //         //   process.env.ASSISTANT_ID ??
//   //         ASSISTANT_ID ??
//   //         (() => {
//   //           throw new Error("ASSISTANT_ID is not set");
//   //         })(),
//   //     });

//   //     // forward run status would stream message deltas
//   //     let runResult = await forwardStream(runStream);

//   //     // status can be: queued, in_progress, requires_action, cancelling, cancelled, failed, completed, or expired
//   //     while (
//   //       runResult?.status === "requires_action" &&
//   //       runResult.required_action?.type === "submit_tool_outputs"
//   //     ) {
//   //       const tool_outputs =
//   //         runResult.required_action.submit_tool_outputs.tool_calls.map(
//   //           (toolCall: any) => {
//   //             const parameters = JSON.parse(toolCall.function.arguments);

//   //             switch (toolCall.function.name) {
//   //               // configure your tool calls here

//   //               default:
//   //                 throw new Error(
//   //                   `Unknown tool call function: ${toolCall.function.name}`
//   //                 );
//   //             }
//   //           }
//   //         );

//   //       runResult = await forwardStream(
//   //         openai.beta.threads.runs.submitToolOutputsStream(
//   //           threadId,
//   //           runResult.id,
//   //           { tool_outputs }
//   //         )
//   //       );
//   //     }
//   //   }
//   // );
// }
