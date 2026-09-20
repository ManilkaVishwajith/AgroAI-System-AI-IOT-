import admin from "firebase-admin"
import fs from "fs"

const serviceAccount = JSON.parse(
    fs.readFileSync("./serviceAccountKey.json", "utf8")
)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://agroai-eeb2a-default-rtdb.asia-southeast1.firebasedatabase.app/"
})

export const db = admin.database()
export const messaging = admin.messaging()