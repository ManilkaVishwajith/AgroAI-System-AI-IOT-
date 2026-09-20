import axios from "axios";
import Prediction from "../models/PredictionHistory.js";

export async function predictDisease(req, res) {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: "Image URL required" });
        }

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Call ML service
        const mlResponse = await axios.post(
            process.env.PYTHON_PREDICTION_URL,
            { imageUrl }
        );

        console.log("ML RESPONSE:", mlResponse.data);
        console.log("USER:", req.user);

        const prediction = new Prediction({
            imageUrl,
            diseaseName: mlResponse.data.disease_name,
            description: mlResponse.data.description,
            solution: mlResponse.data.solution,
            confidence: Number(mlResponse.data.confidence),
            userId: req.user.id
        });

        await prediction.save();

        res.status(201).json(prediction);

    } catch (err) {
        // console.error(err);

        res.status(500).json({
            message: "Prediction failed",
            error: err.message
        });
    }
}



export async function getMyPredictions(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Unauthrized"
            })
        }

        const history = await Prediction.find({
            userId: req.user.id
        }).sort({ predictedAt: -1 })

        res.json(history)
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch history"
        })
    }
}


// Admin panel — returns ALL predictions from every user
export async function getAllPredictions(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please login first" })
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden. Admin access only" })
        }

        const predictions = await Prediction.find()
            .sort({ predictedAt: -1 })
            .populate("userId", "firstName lastName email")

        res.json(predictions)

    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch all predictions",
            error: err.message
        })
    }
}