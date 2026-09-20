import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/user.js"

export async function getUsers(req, res) {
    try {
        const users = await User.find()
        res.status(200).json(users)
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err })
    }
}

export async function createUser(req, res) {
    if (req.body.role === "admin") {
        if (!req.user) {
            return res.status(403).json({ message: "Unauthorized. Please login first" })
        } else if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized. You are not an admin" })
        }
    }

    try {
        const existingUser = await User.findOne({ email: req.body.email })

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" })
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const user = new User({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
            profileImage: req.body.profileImage,
            role: req.body.role || "user"
        })

        await user.save()

        res.status(201).json({ message: "User created successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

export async function userLogin(req, res) {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked" })
        }

        const isPasswordCorrect = bcrypt.compareSync(password, user.password)

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid password" })
        }

        const token = jwt.sign({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            image: user.profileImage,
            isBlocked: user.isBlocked
        }, process.env.JWT_KEY)

        res.json({ message: "Login successful", token, role: user.role })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

export async function editUser(req, res) {
    const email = req.params.email
    const updatedData = req.body

    try {
        if (updatedData.password) {
            updatedData.password = await bcrypt.hash(updatedData.password, 10)
        }

        await User.updateOne({ email }, updatedData)
        
        res.json({
            message : "User updated successfully"
        })
    } catch (err) {
        res.status(500).json({
            message : "Internal server error",
            error : err
        })
    }
}