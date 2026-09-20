# AgroAI Admin Panel — React

Admin web application for the AgriX Smart Farm system.

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx       # Global auth state (JWT)
├── services/
│   └── api.js                # Axios instance + all API calls
├── components/
│   ├── Layout.jsx            # Sidebar + topbar shell
│   ├── Layout.module.css
│   ├── UI.jsx                # All reusable UI components
│   └── UI.module.css
├── pages/
│   ├── Login.jsx             # Admin login
│   ├── Login.module.css
│   ├── Dashboard.jsx         # Overview & stats
│   ├── Users.jsx             # User management (create, edit, block)
│   ├── Devices.jsx           # Registered devices
│   ├── DeviceRequests.jsx    # Approve / reject device requests
│   ├── Predictions.jsx       # Disease prediction history + charts
│   └── Chats.jsx             # Chat log viewer
├── styles/
│   ├── global.css            # CSS variables + body reset
│   └── pages.module.css      # Shared page layout helpers
├── App.jsx                   # Router setup
└── index.js                  # Entry point
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure API URL
Edit `.env` in the project root:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run
```bash
npm start
```

### 4. Build for production
```bash
npm run build
```

## Login
Sign in with an admin account (`role: "admin"`) from your MongoDB users collection.
Non-admin accounts are rejected at login.

## Features
- **Dashboard** — Live stats, recent users, pending requests, latest predictions
- **Users** — List, search, filter, create, edit, block/unblock
- **Devices** — View all devices across all users
- **Device Requests** — Approve (auto-generates credentials) or reject
- **Predictions** — History with disease frequency + confidence charts
- **Chat Logs** — View all bot conversations
