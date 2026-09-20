import mongoose from "mongoose"

const userDeviceSchema = mongoose.Schema({
    deviceId: { 
        type: String, 
        required: true 
    },
    deviceEmail: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        default: "" 
    },
    greenHouseLocation: { 
        type: String, 
        default: "" 
    },
    activatedAt: { 
        type: Date,
        default: Date.now
    }
})

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"
    },
    role: {
        type: String,
        default: "user"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    devices: [userDeviceSchema]
})

const User = mongoose.model("users", userSchema)

export default User