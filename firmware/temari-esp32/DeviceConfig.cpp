#include "DeviceConfig.h"

#include <Preferences.h>

namespace {
Preferences g_prefs;
constexpr const char* kKeyWifiSsid = "wifiSsid";
constexpr const char* kKeyWifiPass = "wifiPass";
constexpr const char* kKeyBaseUrl = "baseUrl";
constexpr const char* kKeyDeviceKey = "deviceKey";
constexpr const char* kKeyBusId = "busId";
} // namespace

bool DeviceConfigStore::begin(const char* nvsNamespace) {
  _ns = String(nvsNamespace);
  return g_prefs.begin(_ns.c_str(), false);
}

bool DeviceConfigStore::load(DeviceConfig* out) {
  if (!out) return false;
  out->wifiSsid = g_prefs.getString(kKeyWifiSsid, "");
  out->wifiPassword = g_prefs.getString(kKeyWifiPass, "");
  out->backendBaseUrl = g_prefs.getString(kKeyBaseUrl, "");
  out->deviceKey = g_prefs.getString(kKeyDeviceKey, "");
  out->busId = g_prefs.getInt(kKeyBusId, 0);
  return true;
}

bool DeviceConfigStore::save(const DeviceConfig& cfg) {
  g_prefs.putString(kKeyWifiSsid, cfg.wifiSsid);
  g_prefs.putString(kKeyWifiPass, cfg.wifiPassword);
  g_prefs.putString(kKeyBaseUrl, cfg.backendBaseUrl);
  g_prefs.putString(kKeyDeviceKey, cfg.deviceKey);
  g_prefs.putInt(kKeyBusId, cfg.busId);
  return true;
}

void DeviceConfigStore::erase() {
  g_prefs.clear();
}

bool SerialProvisioning::maybeRun(DeviceConfigStore& store, DeviceConfig* cfg, uint32_t windowMs) {
  if (!cfg) return false;

  Serial.println();
  Serial.println("Type 'setup' within the next few seconds to provision this device.");
  const uint32_t start = millis();
  while (millis() - start < windowMs) {
    if (Serial.available()) {
      const String cmd = readLine(2000);
      if (cmd.equalsIgnoreCase("setup")) break;
      if (cmd.length() > 0) Serial.println("Unknown command. Type 'setup' to configure.");
    }
    delay(25);
  }

  // If no setup command and config already valid, skip.
  if (!Serial.available() && cfg->isValid()) return false;

  Serial.println();
  Serial.println("=== Temari ESP32 provisioning ===");
  Serial.println("Press ENTER to keep current value.");

  printPrompt("WiFi SSID", cfg->wifiSsid);
  String v = readLine(60000);
  if (v.length() > 0) cfg->wifiSsid = v;

  printPrompt("WiFi password", cfg->wifiPassword, true);
  v = readLine(60000);
  if (v.length() > 0) cfg->wifiPassword = v;

  printPrompt("Backend base URL", cfg->backendBaseUrl);
  v = readLine(60000);
  if (v.length() > 0) cfg->backendBaseUrl = v;

  printPrompt("Device key (x-device-key)", cfg->deviceKey, true);
  v = readLine(60000);
  if (v.length() > 0) cfg->deviceKey = v;

  printPrompt("Bus ID (number)", String(cfg->busId));
  v = readLine(60000);
  if (v.length() > 0) cfg->busId = v.toInt();

  store.save(*cfg);
  Serial.println("Saved.");
  return true;
}

String SerialProvisioning::readLine(uint32_t timeoutMs) {
  String line;
  const uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    while (Serial.available()) {
      const char c = static_cast<char>(Serial.read());
      if (c == '\r') continue;
      if (c == '\n') {
        line.trim();
        return line;
      }
      line += c;
    }
    delay(10);
  }
  line.trim();
  return line;
}

void SerialProvisioning::printPrompt(const char* label, const String& current, bool secret) {
  Serial.print(label);
  Serial.print(" [");
  if (secret && current.length() > 0)
    Serial.print("<set>");
  else
    Serial.print(current);
  Serial.print("]: ");
}

