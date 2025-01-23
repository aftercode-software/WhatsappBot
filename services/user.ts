import { db } from "@/lib/firebase/db";
import { Cliente } from "@/models/cliente";

export async function getUser(waid: string) {
  const clienteRef = db.collection("clientes").doc(waid);
  const doc = await clienteRef.get();
  if (!doc.exists) return undefined;
  return doc.data() as Cliente;
}

export async function createUser(waid: string, threadId: string) {
  const clienteRef = await db.collection("clientes").doc(waid).set({
    waid,
    threadId,
    mensajes: [],
    createdAt: new Date().toISOString(),
  });
  return clienteRef;
}
