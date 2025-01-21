import { AssistantResponse, tool } from "ai";
import Request, { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const ASSISTANT_ID = "asst_wRwVrGgfTmFee8Njh2sgqxGH";

interface CustomRequest extends NextApiRequest {
  threadId: string;
  message: string;
}

interface ResponseData {
  message: string;
}

export async function POST(req: Request) {
  // Parse the request body
  // const { threadId, message } = req.body;

  const input: {
    threadId: string;
    message: string;
  } = await req.json();

  console.log(req);
  console.log(input);
  // Create a thread if needed
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  console.log("Thread id:", threadId);

  // Add a message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: input.message,
  });

  // let run = await openai.beta.threads.runs.createAndPoll(threadId, {
  //   assistant_id: ASSISTANT_ID,
  // });
  let run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: ASSISTANT_ID,
  });

  // handleRunStatus(run, threadId);

  let status = "";
  while (status != "completed") {
    let currentRun = await openai.beta.threads.runs.retrieve(threadId, run.id);

    console.log(currentRun.status);
    status = currentRun.status;

    if (status === "requires_action") {
      const toolOutputs = await handleRequiresAction(currentRun, threadId);
      currentRun = await openai.beta.threads.runs.submitToolOutputs(
        threadId,
        run.id,
        { tool_outputs: toolOutputs }
      );
      console.log(run);
    }

    // if(status === "requires_action"){
    //   await openai.beta.threads.runs.submitToolOutputs(
    //   "thread_123",
    //   "run_123", {
    //     tool_outputs: [{tool_call_id: "", output: ""}]
    //   })
    // }
  }

  const botAnswer = await openai.beta.threads.messages.list(threadId, {
    order: "desc",
    limit: 1,
  });

  const botAnswerMsg: any = botAnswer.data[0].content[0];

  const value = botAnswerMsg.text.value;

  return new Response(JSON.stringify(botAnswerMsg));

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

async function handleRequiresAction(run: any, threadId: string): Promise<any> {
  // Check if there are tools that require outputs
  if (
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    // Loop through each tool in the required action section
    console.log(
      "ACA ES PA: ",
      run.required_action.submit_tool_outputs.tool_calls
    );
    const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
      (tool: any) => {
        if (tool.function.name === "obtenerDatosUsuario") {
          console.log(tool.function);
          const { waNumber } = tool.function.arguments;
          return {
            tool_call_id: tool.id,
            output:
              "El usuario se llama Walter, tienes 20 años y 0 consultas al médico pendientes.",
          };
        }
        // } else if (tool.function.name === "getRainProbability") {
        //   return {
        //     tool_call_id: tool.id,
        //     output: "0.06",
        //   };
        // }
      }
    );

    // Submit all tool outputs at once after collecting them in a list
    if (toolOutputs.length > 0) {
      return toolOutputs;
    } else {
      console.log("No tool outputs to submit.");
      return null;
    }
  }
}
