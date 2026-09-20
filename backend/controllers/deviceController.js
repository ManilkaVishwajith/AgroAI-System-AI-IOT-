import Device from "../models/device.js"
import User from "../models/user.js"

// User adds device using deviceId + secret > saves into user.devices[]
export async function addDevice(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        const { deviceId, secret, name, greenHouseLocation } = req.body

        if (!deviceId || !secret) {
            return res.status(400).json({ message: "deviceId and secret are required" })
        }

        // Find device
        const device = await Device.findOne({ deviceId })

        if (!device) {
            return res.status(404).json({ message: "Device not found. Check your device ID." })
        }

        // Check already activated
        if (device.isActivated) {
            return res.status(400).json({ message: "This device is already activated by another account" })
        }

        // Verify secret
        const isSecretCorrect = await (secret === device.secret)
        if (!isSecretCorrect) {
            return res.status(401).json({ message: "Invalid secret. Check the credentials on your device." })
        }

        // Check user doesn't already have this device
        const user = await User.findById(req.user.id)
        const alreadyAdded = user.devices.find(d => d.deviceId === deviceId)
        if (alreadyAdded) {
            return res.status(400).json({ message: "Device already added to your account" })
        }

        // Mark device as activated
        device.isActivated = true
        device.assignedUserId = req.user.id
        await device.save()

        // Save device inside user.devices[]
        await User.updateOne(
            { _id: req.user.id },
            {
                $push: {
                    devices: {
                        deviceId,
                        deviceEmail: device.deviceEmail,
                        name: name || deviceId,
                        greenHouseLocation: greenHouseLocation || "",
                        activatedAt: new Date()
                    }
                }
            }
        )

        res.status(201).json({
            message: "Device added successfully",
            deviceId,
            deviceEmail: device.deviceEmail
        })
    } catch (err) {
        res.status(500).json({ message: "Error adding device", error: err.message })
    }
}

// Get all devices for logged-in user
export async function getUserDevices(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        const user = await User.findById(req.user.id).select("devices")
        res.json(user.devices)
    } catch (err) {
        res.status(500).json({ message: "Error fetching devices", error: err.message })
    }
}

// Get single device
export async function getDeviceById(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        const user = await User.findById(req.user.id).select("devices")
        const device = user.devices.find(d => d.deviceId === req.params.deviceId)

        if (!device) {
            return res.status(404).json({ message: "Device not found in your account" })
        }

        res.json(device)
    } catch (err) {
        res.status(500).json({ message: "Error fetching device", error: err.message })
    }
}

// Remove device from user's devices[]
export async function removeDevice(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        const { deviceId } = req.params

        // Check device exists in user's list
        const user = await User.findById(req.user.id)
        const deviceExists = user.devices.find(d => d.deviceId === deviceId)

        if (!deviceExists) {
            return res.status(404).json({ message: "Device not found in your account" })
        }

        // Remove from user's devices[]
        await User.updateOne(
            { _id: req.user.id },
            { $pull: { devices: { deviceId } } }
        )

        // Mark device as deactivated in Device collection
        await Device.updateOne(
            { deviceId },
            { isActivated: false, assignedUserId: null }
        )

        res.json({ message: "Device removed successfully" })
    } catch (err) {
        res.status(500).json({ message: "Error removing device", error: err.message })
    }
}