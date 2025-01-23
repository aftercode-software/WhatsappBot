import admin from "firebase-admin";
import { cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "@/serviceAccount.json";

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount),
  });
}

export const db = getFirestore();
