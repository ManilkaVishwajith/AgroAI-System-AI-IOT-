import express from "express"
import { getAllPredictions, getMyPredictions, predictDisease } from "../controllers/predictionController.js"

const predictionRouter = express.Router()

predictionRouter.get("/", getMyPredictions)
predictionRouter.post("/", predictDisease)
predictionRouter.get("/all", getAllPredictions) 

export default predictionRouter