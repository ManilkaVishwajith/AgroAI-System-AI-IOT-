
import crypto from "crypto"
import admin from "firebase-admin"
import DeviceRequest from "../models/deviceRequest.js"
import Device from "../models/device.js"

// User submits device request
export async function submitDeviceRequest(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        const { username, address, phoneNumber } = req.body

        if (!username || !address || !phoneNumber) {
            return res.status(400).json({ message: "username, address and phoneNumber are required" })
        }

        const existingRequest = await DeviceRequest.findOne({
            userId: req.user.id,
            status: "pending"
        })

        if (existingRequest) {
            return res.status(400).json({ message: "You already have a pending device request" })
        }

        const request = new DeviceRequest({
            userId: req.user.id,
            userEmail: req.user.email,
            username,
            address,
            phoneNumber
        })

        await request.save()
        res.status(201).json({ message: "Device request submitted successfully" })
    } catch (err) {
        res.status(500).json({ message: "Error submitting request", error: err.message })
    }
}

// User: get MY requests only
export async function getMyDeviceRequests(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        const requests = await DeviceRequest.find({ userId: req.user.id }).sort({ createdAt: -1 })
        res.json(requests)
    } catch (err) {
        res.status(500).json({ message: "Error fetching your requests", error: err.message })
    }
}


// Admin gets all requests
export async function getDeviceRequests(req, res) {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Admins only" })
        }

        const requests = await DeviceRequest.find().sort({ createdAt: -1 })
        res.json(requests)
    } catch (err) {
        res.status(500).json({ message: "Error fetching requests", error: err.message })
    }
}

// Admin approves > creates device with its own email + secret
export async function approveDeviceRequest(req, res) {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Admins only" })
        }

        const request = await DeviceRequest.findById(req.params.id)

        if (!request) {
            return res.status(404).json({ message: "Request not found" })
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request already processed" })
        }

        // Generate deviceId, deviceEmail, raw secret
        const deviceId = "esp-" + crypto.randomBytes(4).toString("hex")        // esp-a1b2c3d4
        const deviceEmail = `${deviceId}@agroai.com`                             // esp-a1b2c3d4@agrix.com
        const rawSecret = crypto.randomBytes(8).toString("hex")                 // 16 char hex
        
        // Create Firebase Auth user for this device
        await admin.auth().createUser({
            email: deviceEmail,
            password: rawSecret
        })

        // Save device to MongoDB
        const device = new Device({
            deviceId,
            deviceEmail,
            secret: rawSecret,
            isActivated: false,
            assignedUserId: null
        })

        await device.save()

        // Update request
        request.status = "approved"
        request.deviceId = deviceId
        request.deviceEmail = deviceEmail
        request.deviceSecret = rawSecret
        await request.save()

        // Return credentials — admin prints these on device label
        res.status(201).json({
            message: "Device created successfully",
            deviceId,
            deviceEmail,
            secret: rawSecret,       // shown ONCE — print on device label
            shippingAddress: request.address,
            forUser: request.userEmail
        })
    } catch (err) {
        res.status(500).json({ message: "Error approving request", error: err.message })
    }
}

// Admin rejects request
export async function rejectDeviceRequest(req, res) {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Admins only" })
        }

        const request = await DeviceRequest.findById(req.params.id)

        if (!request) {
            return res.status(404).json({ message: "Request not found" })
        }

        request.status = "rejected"
        await request.save()

        res.json({ message: "Request rejected" })
    } catch (err) {
        res.status(500).json({ message: "Error rejecting request", error: err.message })
    }
}