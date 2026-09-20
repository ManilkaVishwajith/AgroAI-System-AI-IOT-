import express from "express"
import { getAllChats, getUserChats, sendMessageToBot } from "../controllers/chatController.js"

const chatRouter = express.Router()

chatRouter.post("/", sendMessageToBot)
chatRouter.get("/", getUserChats)
chatRouter.get("/all", getAllChats)

export default chatRouter;