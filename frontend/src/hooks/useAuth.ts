import { router } from "expo-router";
import { useEffect, useState } from "react";
import { clearStorage, getToken, getUser } from "../utils/storage";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = await getToken();
    const userData = await getUser();
    if (token && userData) setUser(userData);
    setLoading(false);
  }

  async function logout() {
    await clearStorage();
    setUser(null);
    router.replace("/(auth)/login");
  }

  return { user, loading, logout, checkAuth };
}
