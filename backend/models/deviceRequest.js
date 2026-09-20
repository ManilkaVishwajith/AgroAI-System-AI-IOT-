import mongoose from "mongoose";

const deviceRequestSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    userEmail: { 
        type: String, 
        required: true 
    },
    username: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    // Filled after admin approves
    deviceId: { type: String, default: null },
    deviceEmail: { type: String, default: null },
    deviceSecret: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
})

const DeviceRequest = mongoose.model("deviceRequests", deviceRequestSchema)
export default DeviceRequest