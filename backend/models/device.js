import mongoose from "mongoose";

const deviceSchema = mongoose.Schema({
    deviceId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    deviceEmail: { 
        type: String, 
        required: true, 
        unique: true 
    },
    secret: { 
        type: String, 
        required: true 
    },
    isActivated: { 
        type: Boolean, 
        default: false 
    },
    assignedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    createdAt: { type: Date, default: Date.now }
})

const Device = mongoose.model("devices", deviceSchema)

export default Device