import { Cliente } from "@/models/cliente";
import { getUser, updateUser } from "@/services/user";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const ASSISTANT_ID = "asst_wRwVrGgfTmFee8Njh2sgqxGH";

interface BotResponse {
  message: any;
  waid: string;
  threadId: string;
}

export async function handleBotInteraction(
  message: string,
  waid: string,
  threadId: string
): Promise<BotResponse> {
  await openai.beta.threads.messages.create(threadId, {
    role: "assistant",
    content: `Si necesitas la hora actual en Argentina es ${new Date().toLocaleDateString(
      "es-AR",
      {
        timeZone: "America/Argentina/Buenos_Aires",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )}`,
  });
  console.log(
    new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );
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
          waid,
          threadId: threadId,
        };

      case "requires_action":
        if (currentRun.required_action?.submit_tool_outputs?.tool_calls) {
          const toolOutputs = await handleToolCalls(
            waid,
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

async function handleToolCalls(waid: string, toolCalls: any[]): Promise<any[]> {
  return toolCalls.map((toolCall: any) => {
    const { name, arguments: args } = toolCall.function;

    if (name === "obtenerDatosUsuario") {
      let cliente = getUser(waid);
      return {
        tool_call_id: toolCall.id,
        output: JSON.stringify({
          success: true,
          output: cliente,
        }),
      };
    }
    if (name === "actualizarDatosUsuario") {
      const updatedClient: Partial<Cliente> = {
        waid,
      };

      const convertedArgs = JSON.parse(args);

      if (convertedArgs.nombre) updatedClient.nombre = convertedArgs.nombre;
      if (convertedArgs.apellido)
        updatedClient.apellido = convertedArgs.apellido;
      if (convertedArgs.obraSocial)
        updatedClient.obraSocial = convertedArgs.obraSocial;
      console.log("Nombre: ", args.nombre, typeof args.nombre);
      console.log("Apellido: ", args.apellido, typeof args.apellido);
      console.log("ObraSocial: ", args.obraSocial, typeof args.obraSocial);
      console.log("Actualizando datos del usuario por: ", args);

      const update = updateUser(updatedClient);

      return {
        tool_call_id: toolCall.id,
        output: JSON.stringify({
          success: true,
          output: "Los datos del usuario han sido actualizados correctamente.",
        }),
      };
    }
    if (name === "pedirTurno") {
      console.log(args);

      return {
        tool_call_id: toolCall.id,
        output: JSON.stringify({
          success: true,
          output: "Turno pedido correctamente.",
        }),
      };
    }
    throw new Error(`Unhandled tool call: ${toolCall.function.name}`);
  });
}
