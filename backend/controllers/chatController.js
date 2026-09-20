import axios from "axios";
import Chat from "../models/chat.js";


export async function sendMessageToBot(req, res) {
    try {
        const {message, conversationId} = req.body

        if (!message) {
            return res.status(400).json({
                message: "Message is required"
            })
        }

        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized. Please login first"
            })
        }

        const response = await axios.post(
            process.env.PYTHON_CHAT_URL,
            { message : message }
        )

        const reply = response.data

        const chat = new Chat({
            userId: req.user.id,
            message: message,
            reply: reply,
            conversationId: conversationId
        })

        await chat.save()

        res.status(201).json({
            message: "Chat saved successfully",
            data: chat
        })
    } catch (err) {
        res.status(500).json({
            message: "Error Precessing chat",
            error: err.message
        })
    }
}

export async function getUserChats(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized. Please login first"
            })
        }

        const chats = await Chat.find({
            userId: req.user.id
        }).sort({ createdAt: -1 })

        res.json(chats)
    } catch (err) {
        res.status(500).json({
            message: "Error fetching chats"
        })
    }
}

// Admin panel — returns ALL chat messages from every user
export async function getAllChats(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden. Admin access only" })
        }

        const chats = await Chat.find()
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName email")

        res.json(chats)

    } catch (err) {
        res.status(500).json({
            message: "Error fetching all chats",
            error:   err.message
        })
    }
}