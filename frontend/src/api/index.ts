import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

async function getToken() {
  return await AsyncStorage.getItem("token");
}

export async function apiRequest(endpoint: string, method = "GET", body?: any) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// Auth
export const login = (email: string, password: string) =>
  apiRequest("/users/login", "POST", { email, password });

export const register = (data: any) => apiRequest("/users", "POST", data);

export const updateProfile = (email: string, data: any) =>
  apiRequest(`/users/${encodeURIComponent(email)}`, "PUT", data);

// Devices
export const getUserDevices = () => apiRequest("/devices");

export const addDevice = (data: any) =>
  apiRequest("/devices/add", "POST", data);

export const removeDevice = (deviceId: string) =>
  apiRequest(`/devices/${deviceId}`, "DELETE");

// Device Requests
export const submitDeviceRequest = (data: any) =>
  apiRequest("/device-requests", "POST", data);

export const getMyDeviceRequests = () => apiRequest("/device-requests");

export const cancelDeviceRequest = (id: string) =>
  apiRequest(`/device-requests/${id}`, "DELETE");

// Predictions
export const predictDisease = (imageUrl: string) =>
  apiRequest("/prediction", "POST", { imageUrl });

export const getMyPredictions = () => apiRequest("/prediction");

// Chat
export const sendMessage = (message: string, conversationId?: string) =>
  apiRequest("/chat", "POST", { message, conversationId });

export const getUserChats = () => apiRequest("/chat");
