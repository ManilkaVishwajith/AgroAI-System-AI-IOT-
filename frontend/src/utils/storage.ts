import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveToken(token: string) {
  await AsyncStorage.setItem("token", token);
}
export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem("token");
}
export async function saveUser(user: any) {
  await AsyncStorage.setItem("user", JSON.stringify(user));
}
export async function getUser(): Promise<any> {
  const u = await AsyncStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}
export async function clearStorage() {
  await AsyncStorage.multiRemove(["token", "user"]);
}
