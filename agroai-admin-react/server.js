import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import "./services/firebaseService.js"   // initialize firebase on startup
import userRouter from "./routes/userRoute.js"
import deviceRouter from "./routes/deviceRoute.js"
import deviceRequestRouter from "./routes/deviceRequestRoute.js"
import chatRouter from "./routes/chatRoute.js"
import predictionRouter from "./routes/predictionRoutes.js"

dotenv.config()
const app = express()

// CORS
// Allow requests from the React admin panel (and any localhost port in dev)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps, curl)
        if (!origin) return callback(null, true)
        // Allow any localhost origin in development
        if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
            return callback(null, true)
        }
        // In production, replace with your actual admin domain:
        // e.g. "https://admin.agroAi.com"
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",")
            : []
        if (allowedOrigins.includes(origin)) return callback(null, true)
        callback(new Error("CORS: Origin not allowed — " + origin))
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))

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
    .catch(() => console.log("Failed to connect to database"))

// Routes
app.use("/api/users", userRouter)
app.use("/api/devices", deviceRouter)
app.use("/api/device-requests", deviceRequestRouter)
app.use("/api/chat", chatRouter)
app.use("/api/prediction", predictionRouter)

app.listen(5000, () => {
    console.log("Server is running on port 5000")
})