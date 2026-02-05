import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  })
}

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig)
}

export const db = admin.firestore()
export const auth = admin.auth()
export default admin
