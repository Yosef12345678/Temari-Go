#pragma once

#include <Arduino.h>

struct DeviceConfig {
  String wifiSsid;
  String wifiPassword;
  String backendBaseUrl; // ex: https://api.example.com
  String deviceKey;      // x-device-key raw value
  int busId = 0;
  String serverRootCaPem;

  bool isValid() const {
    return wifiSsid.length() > 0 && wifiPassword.length() > 0 && backendBaseUrl.length() > 0 && deviceKey.length() > 0 &&
           busId > 0 && serverRootCaPem.length() > 0;
  }
};

class DeviceConfigStore {
 public:
  bool begin(const char* nvsNamespace = "temari");
  bool load(DeviceConfig* out);
  bool save(const DeviceConfig& cfg);
  void erase();

 private:
  String _ns;
};

class SerialProvisioning {
 public:
  // Returns true if config was modified and saved.
  bool maybeRun(DeviceConfigStore& store, DeviceConfig* cfg, uint32_t windowMs = 12000);

 private:
  String readLine(uint32_t timeoutMs);
  void printPrompt(const char* label, const String& current, bool secret = false);
};

