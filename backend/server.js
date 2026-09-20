import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import cors from "cors"
import dotenv from "dotenv"
import "./services/firebaseService.js"   // initialize firebase on startup
import userRouter from "./routes/userRoute.js"
import deviceRouter from "./routes/deviceRoute.js"
import deviceRequestRouter from "./routes/deviceRequestRoute.js"
import chatRouter from "./routes/chatRoute.js"
import predictionRouter from "./routes/predictionRoutes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(bodyParser.json())

// JWT Middleware
app.use((req, res, next) => {
    const tokenString = req.header("Authorization")

    if (tokenString != null) {
        const token = tokenString.replace("Bearer ", "")

        jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
            if (decoded != null) {
                req.user = decoded
                next()
            } else {
                res.status(401).json({ message: "Invalid token" })
            }
        })
    } else {
        next()
    }
})

// MongoDB
mongoose.connect(process.env.MONGODB_URL)
    .then(() => console.log("Connected to database"))
    .catch((error) => console.log("Failed to connect to database", error))

// Routes
app.use("/api/users", userRouter)
app.use("/api/devices", deviceRouter)
app.use("/api/device-requests", deviceRequestRouter)
app.use("/api/chat", chatRouter)
app.use("/api/prediction", predictionRouter)

app.listen(5000, "0.0.0.0", () => {
    console.log("Server is running on port 5000")
})