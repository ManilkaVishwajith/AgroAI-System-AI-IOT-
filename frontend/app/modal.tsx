import { router } from "expo-router";
import { useEffect } from "react";
import { getToken } from "../src/utils/storage";

export default function Index() {
  useEffect(() => {
    checkAndRedirect();
  }, []);

  async function checkAndRedirect() {
    const token = await getToken();
    if (token) {
      router.replace("/(user)");
    } else {
      router.replace("/(auth)/splash");
    }
  }

  return null;
}
