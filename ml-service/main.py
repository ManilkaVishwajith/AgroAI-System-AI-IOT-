from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import pandas as pd
import requests
from PIL import Image
from io import BytesIO

app = FastAPI()

model = tf.keras.models.load_model("model/crop_disease_model.h5")
disease_info = pd.read_csv("data/disease_info.csv")

class PredictRequest(BaseModel):
    imageUrl: str

@app.post("/predict")
def predict(req: PredictRequest):
    response = requests.get(req.imageUrl, timeout=10)

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch image")

    content_type = response.headers.get("content-type", "")
    if "image" not in content_type:
        raise HTTPException(
            status_code=400,
            detail=f"URL does not point to an image. Content-Type: {content_type}"
        )

    try:
        image = Image.open(BytesIO(response.content)).convert("RGB").resize((224,224))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image format")

    img = np.array(image) / 255.0
    img = np.expand_dims(img, axis=0)

    preds = model.predict(img)[0]
    index = np.argmax(preds)

    disease = disease_info.iloc[index]

    return {
        "disease_name": disease["disease_name"],
        "description": disease["description"],
        "solution": disease["solution"],
        "confidence": float(preds[index])
    }