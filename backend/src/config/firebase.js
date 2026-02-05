import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
}

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig)
}

// Firestore Database
export const db = admin.firestore()

// Firebase Storage
export const storage = admin.storage()
export const bucket = admin.storage().bucket()

export default admin
