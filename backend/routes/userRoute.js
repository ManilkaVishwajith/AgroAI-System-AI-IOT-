import express from "express"
import { createUser, editUser, getUsers, userLogin } from "../controllers/userContoller.js"

const userRouter = express.Router()

userRouter.get("/", getUsers)
userRouter.post("/", createUser)
userRouter.post("/login", userLogin)
userRouter.put("/:email", editUser)

export default userRouter