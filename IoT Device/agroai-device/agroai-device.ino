#include <WiFi.h>
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>
#include "DHT.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>

// FIREBASE 
#define API_KEY "AIzaSyBIXniRcZEooSM7j2aee6A7zPbbnhnYgVY"
#define DATABASE_URL "https://agroai-eeb2a-default-rtdb.asia-southeast1.firebasedatabase.app"

// Device Credentials (Set per device before flashing)
#define DEVICE_ID "esp-df4f60b0"
#define USER_EMAIL "esp-df4f60b0@agroai.com"
#define USER_PASSWORD "68728dd8322e2017"

// SENSORS
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34

#define SOIL_DRY 2725  
#define SOIL_WET 1160  

DHT dht(DHTPIN, DHTTYPE);

// OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// FIREBASE OBJECTS
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

WiFiManager wifiManager;

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin(21, 22);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("OLED not found");
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Smart Farm");
  display.println("Setting up Wi-Fi...");
  display.println("");
  display.println("Please wait 30sec to active WiFI AP Mode");
  display.println("SSID: AgroAI");
  display.println("Browser: 192.168.4.1");
  display.display();

  wifiManager.setConnectTimeout(30);
  wifiManager.setConfigPortalTimeout(180);

  if (!wifiManager.autoConnect("AgroAI")) {
    Serial.println("Failed to connect and hit timeout");
    display.println("Wi-Fi setup failed!");
    display.display();
    delay(3000);
    ESP.restart();
  }

  display.println("Wi-Fi Connected!");
  display.display();
  delay(1000);

  // Sync time via NTP (needed for lastSeen timestamp)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Waiting for NTP time sync");
  time_t now = time(nullptr);
  while (now < 1000000000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nTime synced!");

  // FIREBASE
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  while (auth.token.uid == "") {
    delay(500);
    Serial.print(".");
  }

  display.println("Firebase Ready!");
  display.display();
  delay(1000);
}

void loop() {
  // WIFI CHECK
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi lost! Trying to reconnect...");
    WiFi.reconnect();
    unsigned long startAttemptTime = millis();

    while (WiFi.status() != WL_CONNECTED &&
           millis() - startAttemptTime < 10000) {
      delay(200);
      Serial.print(".");
    }

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("\nReconnect failed. Starting AP mode...");

      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("WiFi LOST!");
      display.println("");
      display.println("Connect to:");
      display.println("AgroAI");
      display.println("");
      display.println("Open browser:");
      display.println("192.168.4.1");
      display.display();

      delay(2000);
      wifiManager.startConfigPortal("AgroAI");

      Serial.println("WiFi configured!");
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("WiFi Connected!");
      display.display();
      delay(1500);
    } else {
      Serial.println("\nReconnected successfully!");
    }
  }

  // SENSOR READINGS
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  int soilRaw       = analogRead(SOIL_PIN);
  int soilPercent   = map(soilRaw, SOIL_DRY, SOIL_WET, 0, 100);
  soilPercent       = constrain(soilPercent, 0, 100);

  // FIREBASE UPLOAD
  if (!isnan(temperature) && !isnan(humidity) && Firebase.ready()) {
    String basePath = "/devices/" + String(DEVICE_ID);

    Firebase.RTDB.setFloat(&fbdo, basePath + "/temperature", temperature);
    Firebase.RTDB.setFloat(&fbdo, basePath + "/humidity",    humidity);
    Firebase.RTDB.setInt(&fbdo,   basePath + "/soil",        soilPercent);

    // ── lastSeen: Unix timestamp in seconds ─────────────────────────────
    // The app reads this to detect if device is offline (no update > 5 min)
    Firebase.RTDB.setInt(&fbdo, basePath + "/lastSeen", (int)time(nullptr));
  }

  // OLED DISPLAY
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("AgroAI - Smart Farm");
  display.println("----------------");
  display.printf("Temp: %.1f C\n",     temperature);
  display.printf("Humidity: %.1f %%\n", humidity);
  display.printf("Soil raw: %d\n",     soilRaw);
  display.printf("Soil: %d %%\n",      soilPercent);
  display.println(WiFi.status() == WL_CONNECTED ? "Wi-Fi: Connected" : "Wi-Fi: Disconnected");
  display.display();

  delay(1000);
}