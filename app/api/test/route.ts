import { db } from "@/utils/firebase";

export async function POST(req: Request) {
  const { waid, message } = await req.json();

  const currentTimestamp = new Date().toISOString();

  const addedMessage = await db.collection("mensajes").add({
    waid,
    message,
    date: currentTimestamp,
  });

  console.log("Hola :D");

  return new Promise<Response>((resolve, reject) => {
    setTimeout(async () => {
      try {
        const foundNewMessages = await newMessageExists(waid, currentTimestamp);

        console.log("Found new messages: ", foundNewMessages);

        if (!foundNewMessages) {
          throw new Error("Not found msg");
        }

        resolve(
          new Response(undefined, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      } catch (error) {
        // Cualquier error dentro del setTimeout -> rechazamos
        reject(
          new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
    }, 1000);
  });
}

async function newMessageExists(waid: string, date: string) {
  const snapshot = await db
    .collection("mensajes")
    .where("waid", "==", waid)
    .where("date", ">", date)
    .get();

  console.log(snapshot);

  return snapshot.empty;
}
