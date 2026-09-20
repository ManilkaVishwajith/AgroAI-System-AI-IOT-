import express from "express"
import { addDevice, getDeviceById, getUserDevices, removeDevice } from "../controllers/deviceController.js"

const deviceRouter = express.Router()

deviceRouter.post("/add", addDevice)               // user adds device
deviceRouter.get("/", getUserDevices)              // get all user devices
deviceRouter.get("/:deviceId", getDeviceById)      // get single device
deviceRouter.delete("/:deviceId", removeDevice)    

export default deviceRouter