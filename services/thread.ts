import { db } from "@/lib/firebase/db";
import { openai } from "@/lib/openAI";

export async function getUserThreadId(waid: string) {
  const snapshot = await db
    .collection("clientes")
    .where("waid", "==", waid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return undefined;
  }
}

export async function setUserThreadId(waid: string) {
  const snapshot = await db
    .collection("clientes")
    .where("waid", "==", waid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return undefined;
  }
}

export async function createThread() {
  return (await openai.beta.threads.create({})).id;
}
