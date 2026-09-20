import mongoose from "mongoose"

const chatSchema = mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : "users"
    },
    message : {
        type : String,
        required : true
    },
    reply : {
        type : String,
        required : true
    },
    conversationId : {
        type : String,
        required : false
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

const Chat = mongoose.model("chats", chatSchema)

export default Chat