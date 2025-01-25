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

    if (!currentUser) {
      const threadId = await createThread();
      await createUser(waid, threadId);
      currentUser = await getUser(waid);
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
        waid,
        currentUser.threadId
      );

      if (botResponse && botResponse.message?.text?.value) {
        const botMessage = botResponse.message.text.value;

        const pattern = /【.*?】/g;
        const cleanedText = botMessage.replace(pattern, "");

        return new Response(JSON.stringify({ cleanedText }), { status: 200 });
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
