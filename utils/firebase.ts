import admin from "firebase-admin";
import { cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export interface Cliente {
  waid: string;
  nombre: string;
  apellido: string;
  obraSocial: string;
  threadId: string;
}

var serviceAccount = require("@/serviceAccount.json");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export async function newMessageExists(waid: string, date: string) {
  const snapshot = await db
    .collection("mensajes")
    .where("waid", "==", waid)
    .where("date", ">", date)
    .get();

  return !snapshot.empty;
}

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

export async function getUser(waid: string) {
  const clienteRef = db.collection("clientes").doc(waid);

  const doc = await clienteRef.get();

  if (!doc.exists) {
    return undefined;
  }

  return doc.data() as Cliente;
}

export async function createUser(waid: string) {
  const clienteRef = await db.collection("clientes").doc(waid).set({
    waid,
  });

  return clienteRef;
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

export { db };
