export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  image?: string;
}

export interface Device {
  _id: string;
  deviceId: string;
  name: string;
  userId: string;
  greenHouseLocation?: string;
  createdAt: string;
}

export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  soil: number | null;
}

export interface Prediction {
  _id: string;
  imageUrl: string;
  diseaseName: string;
  description: string;
  solution: string;
  confidence: number;
  predictedAt: string;
  userId: string;
}

export interface ChatMessage {
  _id: string;
  userId: string;
  message: string;
  reply: string;
  conversationId?: string;
  createdAt: string;
}

export type RequestStatus = "pending" | "approved" | "rejected";

export interface DeviceRequest {
  _id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  deliveryAddress: string;
  greenHouseLocation?: string;
  deviceEmail: string;
  devicePassword: string;
  notes?: string;
  status: RequestStatus;
  adminNote?: string;
  requestedAt: string;
  updatedAt: string;
}
