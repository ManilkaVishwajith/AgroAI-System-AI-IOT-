import express from "express"
import { approveDeviceRequest, getDeviceRequests, getMyDeviceRequests, rejectDeviceRequest, submitDeviceRequest } from "../controllers/deviceRequestController.js"

const deviceRequestRouter = express.Router()

deviceRequestRouter.post("/", submitDeviceRequest)
deviceRequestRouter.get("/", getDeviceRequests)
deviceRequestRouter.get("/my", getMyDeviceRequests)
deviceRequestRouter.patch("/:id/approve", approveDeviceRequest)
deviceRequestRouter.patch("/:id/reject", rejectDeviceRequest)

export default deviceRequestRouter