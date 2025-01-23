import { db } from "@/lib/firebase/db";
import { FieldValue } from "firebase-admin/firestore";

export async function newMessageExists(waid: string, date: string) {
  const snapshot = await db
    .collection("mensajes")
    .where("waid", "==", waid)
    .where("date", ">", date)
    .get();
  return !snapshot.empty;
}

export async function addMessageToClient(
  waid: string,
  message: string,
  date: string
) {
  try {
    const clienteRef = db.collection("clientes").doc(waid);
    const clienteUpdated = await clienteRef.update({
      mensajes: FieldValue.arrayUnion({ message }),
      updatedAt: date,
    });

    console.log("Message added to client", clienteUpdated);
  } catch (error) {
    console.error("Error in addMessageToClient:", error);
    throw error;
  }
}
