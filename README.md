# AgroAi – Smart Farm AI + IoT

<div align="center">

![AgroAi Banner](https://img.shields.io/badge/AgroAi-Smart%20Farm%20AI%20%2B%20IoT-2ea44f?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Final%20Year%20Project-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Educational-orange?style=for-the-badge)

**An intelligent agriculture system powered by AI and IoT to support modern farming**

[Features](#features) • [Architecture](#system-architecture) • [Setup](#installation-setup) • [Running](#running-the-full-system) • [Screenshots](#screenshots) • [Demo](#demo)

</div>

---

## Overview

AgroAi is a smart agriculture system developed to support modern farming through **Artificial Intelligence (AI)** and the **Internet of Things (IoT)**. The system helps farmers monitor environmental conditions, detect crop diseases, and receive plant care guidance using a chatbot.

This project was developed as a **final year computing project** and demonstrates how AI, IoT devices, cloud services, and mobile applications can be integrated to improve agricultural productivity and decision-making.

---

## Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | User registration and secure login |
| 📊 Real-time Monitoring | Live greenhouse environmental dashboard |
| 🌡️ IoT Sensors | Temperature, humidity, and soil moisture tracking |
| 🌿 Disease Detection | AI-powered crop disease identification from images |
| 🤖 AI Chatbot | Intelligent plant care assistant |
| 📱 Mobile App | Farmer-friendly React Native application |
| 💻 Web Dashboard | Browser-based management interface |
| 📜 History | Stored prediction history for review |
| 🔧 Device Management | IoT device activation and control |

---

## Technologies Used

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>React Native, React.js</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Node.js, Express.js</td>
</tr>
<tr>
<td><strong>AI / ML</strong></td>
<td>Python, FastAPI, TensorFlow, Keras, Google Colab</td>
</tr>
<tr>
<td><strong>Database & Cloud</strong></td>
<td>MongoDB, Firebase Realtime Database</td>
</tr>
<tr>
<td><strong>IoT Hardware</strong></td>
<td>ESP32, DHT22, Soil Moisture Sensor, OLED Display</td>
</tr>
</table>

---

## System Architecture

<div align="center">
  <img src="screenshots/architecture.png" alt="AgroAi System Architecture" width="800"/>
</div>

The AgroAi platform consists of multiple integrated components:

- **ESP32 IoT Device** collects environmental sensor data (temperature, humidity, soil moisture)
- Sensor data is sent to **Firebase Realtime Database** in real time
- **React Native mobile app** reads live data from Firebase
- **React.js web app** manages the system
- **Express.js backend** manages users, devices, and predictions
- **MongoDB** stores all system data persistently
- **FastAPI services** handle crop disease prediction and plant care chatbot

---


## Project Structure

```
AgroAi/
│
├── backend/              # Express.js backend API
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── server.js
│
├── ml-service/           # FastAPI disease prediction service
│   ├── main.py
│   ├── model/
│   └── requirements.txt
│
├── chat-service/         # FastAPI chatbot service
│   ├── main.py
│   └── requirements.txt
│
├── mobile-app/           # React Native mobile application
│   ├── screens/
│   ├── components/
│   └── App.js
│
├── web-app/              # React.js web dashboard
│   ├── src/
│   └── package.json
│
├── IoT Device/           # ESP32 IoT device code
│   └── agroAI_device.ino
│
└── README.md
```

---

# Installation Setup

Follow the steps below to set up the project locally.

---

## Prerequisites

Make sure the following software is installed before proceeding:

- [Node.js and npm](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)
- [Git](https://git-scm.com/)
- MongoDB Atlas account
- Android Studio or [Expo Go](https://expo.dev/go)
- [Arduino IDE](https://www.arduino.cc/en/software) (for ESP32)
- Firebase project ([Firebase Console](https://console.firebase.google.com/))

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/agroai-smartfarm.git
cd agroai-smartfarm
```

---

## 2. Backend Setup (Express.js)

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend folder and add:

```env
MONGODB_URL=your_mongodb_connection_string
JWT_KEY=your_jwt_secret_key
PYTHON_PREDICTION_URL=http://127.0.0.1:8000/predict
PYTHON_CHAT_URL=http://127.0.0.1:8001/chat
```

Start the backend server:

```bash
npm start
```

> ✅ Backend runs on `http://localhost:5000`

---

## 3. ML Service Setup (FastAPI – Disease Detection)

Open a new terminal and go to the ML service folder:

```bash
cd ml-service
```

Create and activate a Python virtual environment:

```bash
# Create environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

> ✅ ML Service runs on `http://127.0.0.1:8000`

---

## 4. Chatbot Service Setup (FastAPI)

Open another terminal and navigate to the chatbot service folder:

```bash
cd chat-service
```

Create and activate a virtual environment:

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the chatbot service:

```bash
uvicorn main:app --reload --port 8001
```

> ✅ Chat Service runs on `http://127.0.0.1:8001`

---

## 5. Mobile Application Setup (React Native / Expo)

Navigate to the mobile application folder:

```bash
cd mobile-app
```

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npx expo start
```

Run the app by either:
- Scanning the QR code using **Expo Go** on your phone
- Running an **Android emulator** via Android Studio

---

## 6. Web Application Setup (React.js)

Navigate to the web app folder:

```bash
cd web-app
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

> ✅ Web App runs on `http://localhost:5173`

---

## 7. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Realtime Database** under the Build menu
3. Set database rules to allow authenticated access
4. Copy your Firebase configuration and update it inside the mobile app and ESP32 device code

Sensor data including temperature, humidity, and soil moisture will be stored and read from Firebase in real time.

---

## 8. IoT Device Setup (ESP32)

Open the ESP32 code in **Arduino IDE**.

Install the following libraries via Arduino Library Manager:

- `WiFi`
- `WiFiManager`
- `Firebase ESP Client`
- `DHT Sensor Library`
- `Adafruit GFX`
- `Adafruit SSD1306`

Update the configuration in the code:

```cpp
#define API_KEY        "your_firebase_api_key"
#define DATABASE_URL   "your_database_url"
#define USER_EMAIL     "your_email"
#define USER_PASSWORD  "your_password"
#define DEVICE_ID      "your_device_id"
```

Upload the code to the ESP32 board. The device will automatically send sensor data to Firebase.

---

## Screenshots

### Mobile Application

| Home / Dashboard | Disease Detection | AI Chatbot |
|:-:|:-:|:-:|
| ![Home](screenshots/mobile-home.png) | ![Disease](screenshots/mobile-disease.png) | ![Chat](screenshots/mobile-chat.png) |

### Web Dashboard

| Overview Dashboard | Device Management |
|:-:|:-:|
| ![Dashboard](screenshots/web-dashboard.png) | ![Devices](screenshots/web-devices.png) |



---

## Author

**Manilka Shehan**  
Final Year Undergraduate — BSc in Computing and Software Engineering

> Project: **AgroAi – Smart Farm AI + IoT**

---

## License

This project is developed for **educational and research purposes** as part of a final year undergraduate computing project.

---

<div align="center">

Made with ❤️ by Manilka shehan 

</div>
