import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
    imageUrl : {
        type: String,
        required: true
    },
    diseaseName : {
        type: String,
        required: true
    },
    description : {
        type: String
    },
    solution : {
        type: String
    },
    confidence : {
        type: Number,
        required: true
    },
    predictedAt : {
        type: Date,
        default: Date.now,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
})

const Prediction = mongoose.model("predictions", predictionSchema)

export default Prediction