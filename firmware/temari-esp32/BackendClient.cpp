#include "BackendClient.h"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

namespace {
// Keep ArduinoJson doc sizes conservative; tune if needed.
constexpr size_t kLocationDocSize = 256;
constexpr size_t kAttendanceScanDocSize = 384;
constexpr size_t kAttendanceSyncBaseDocSize = 256;
constexpr size_t kAttendanceSyncPerRecordDocSize = 256;

struct ParsedBaseUrl {
  bool https = true;
  String host;
  uint16_t port = 443;
  String basePath; // usually empty
};

static bool parseBaseUrl(const String& baseUrl, ParsedBaseUrl* out) {
  if (!out) return false;
  *out = {};

  String s = baseUrl;
  s.trim();
  if (s.startsWith("https://")) {
    out->https = true;
    s.remove(0, String("https://").length());
    out->port = 443;
  } else if (s.startsWith("http://")) {
    out->https = false;
    s.remove(0, String("http://").length());
    out->port = 80;
  } else {
    return false;
  }

  // Split host[:port][/basePath]
  int slash = s.indexOf('/');
  String hostPort = (slash >= 0) ? s.substring(0, slash) : s;
  out->basePath = (slash >= 0) ? s.substring(slash) : "";

  int colon = hostPort.indexOf(':');
  if (colon >= 0) {
    out->host = hostPort.substring(0, colon);
    out->port = (uint16_t)hostPort.substring(colon + 1).toInt();
  } else {
    out->host = hostPort;
  }

  out->host.trim();
  if (out->host.length() == 0) return false;
  if (out->port == 0) return false;
  return true;
}
} // namespace

BackendClient::BackendClient() {}

void BackendClient::setBaseUrl(const String& baseUrl) { _baseUrl = baseUrl; }

void BackendClient::setDeviceKey(const String& deviceKey) { _deviceKey = deviceKey; }

void BackendClient::clearLastError() {
  _lastError = "";
  _lastHttpStatus = 0;
}

bool BackendClient::postLocation(const LocationPayload& payload, String* responseOut) {
  clearLastError();

  StaticJsonDocument<kLocationDocSize> doc;
  doc["bus_id"] = payload.bus_id;
  doc["latitude"] = payload.latitude;
  doc["longitude"] = payload.longitude;
  if (payload.has_speed) doc["speed"] = payload.speed_kmph;
  if (payload.has_timestamp) doc["timestamp"] = payload.timestamp_iso8601;

  String body;
  serializeJson(doc, body);
  return postJson("/api/locations", body, responseOut);
}

bool BackendClient::postAttendanceScan(const AttendanceScanPayload& payload, String* responseOut) {
  clearLastError();

  StaticJsonDocument<kAttendanceScanDocSize> doc;
  doc["rfid_tag"] = payload.rfid_tag;
  doc["latitude"] = payload.latitude;
  doc["longitude"] = payload.longitude;
  if (payload.has_bus_id) doc["bus_id"] = payload.bus_id;
  if (payload.has_vehicle_id) doc["vehicle_id"] = payload.vehicle_id;
  if (payload.has_timestamp) doc["timestamp"] = payload.timestamp_iso8601;
  // Note: backend /scan does not accept event_id today; we keep it optional for forward compat.
  if (payload.has_event_id) doc["event_id"] = payload.event_id;

  String body;
  serializeJson(doc, body);
  return postJson("/api/attendance/scan", body, responseOut);
}

bool BackendClient::postAttendanceSync(const AttendanceSyncRecord* records, size_t recordCount, String* responseOut) {
  clearLastError();

  if (!records || recordCount == 0) {
    _lastError = "attendance sync requires non-empty records";
    return false;
  }

  const size_t docSize = kAttendanceSyncBaseDocSize + recordCount * kAttendanceSyncPerRecordDocSize;
  DynamicJsonDocument doc(docSize);
  JsonArray arr = doc.createNestedArray("records");

  for (size_t i = 0; i < recordCount; i++) {
    JsonObject rec = arr.createNestedObject();
    rec["rfid_tag"] = records[i].rfid_tag;
    rec["latitude"] = records[i].latitude;
    rec["longitude"] = records[i].longitude;
    if (records[i].has_bus_id) rec["bus_id"] = records[i].bus_id;
    if (records[i].has_vehicle_id) rec["vehicle_id"] = records[i].vehicle_id;
    if (records[i].has_timestamp) rec["timestamp"] = records[i].timestamp_iso8601;
    if (records[i].has_event_id) rec["event_id"] = records[i].event_id;
  }

  String body;
  serializeJson(doc, body);
  return postJson("/api/attendance/sync", body, responseOut);
}

bool BackendClient::postAlcoholTestDevice(const AlcoholTestPayload& payload, String* responseOut) {
  clearLastError();

  StaticJsonDocument<256> doc;
  doc["alcohol_level"] = payload.alcohol_level;
  if (payload.has_bus_id) doc["bus_id"] = payload.bus_id;
  if (payload.has_vehicle_id) doc["vehicle_id"] = payload.vehicle_id;
  if (payload.has_latitude) doc["latitude"] = payload.latitude;
  if (payload.has_longitude) doc["longitude"] = payload.longitude;
  if (payload.has_timestamp) doc["timestamp"] = payload.timestamp_iso8601;

  String body;
  serializeJson(doc, body);
  return postJson("/api/alcohol-tests/device", body, responseOut);
}

bool BackendClient::postJson(const String& path, const String& jsonBody, String* responseOut) {
  if (_baseUrl.length() == 0) {
    _lastError = "baseUrl not configured";
    return false;
  }
  if (_deviceKey.length() == 0) {
    _lastError = "deviceKey not configured";
    return false;
  }

  ParsedBaseUrl u;
  if (!parseBaseUrl(_baseUrl, &u)) {
    _lastError = "invalid baseUrl (expected http(s)://host[:port])";
    return false;
  }

  WiFiClientSecure client;
  client.setHandshakeTimeout(45000);
  client.setInsecure();

  HTTPClient http;
  const String fullPath = (u.basePath.length() > 0 ? (u.basePath + path) : path);

  // Debug aid: resolve host (also nudges us toward IPv4 A record).
  IPAddress ip;
  const bool dnsOk = WiFi.hostByName(u.host.c_str(), ip);
  if (!dnsOk) {
    _lastError = "dns lookup failed (WiFi.hostByName)";
    return false;
  }
#if defined(TEMARI_DEBUG) && TEMARI_DEBUG
  Serial.printf("Temari DNS %s -> %s:%u https=%d\n", u.host.c_str(), ip.toString().c_str(), u.port, (int)u.https);
#endif

  http.setReuse(false);
  // Use supported overload on ESP32 core 3.3.8: begin(client, host, port, uri, https).
  // We still resolve DNS above for debug visibility.
  if (!http.begin(client, u.host, u.port, fullPath, u.https)) {
    _lastError = "http begin failed (host/port/path)";
    return false;
  }

  http.setReuse(false);
  http.setConnectTimeout(20000);
  http.setTimeout(45000);
  http.setUserAgent("TemariESP32/1.0");

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", _deviceKey);
  // Ngrok free: forward real traffic instead of HTML interstitial pages.
  http.addHeader("ngrok-skip-browser-warning", "true");

  // HTTPClient declares non-const payload; POST does not modify the buffer.
  uint8_t* const payload =
      reinterpret_cast<uint8_t*>(const_cast<char*>(jsonBody.c_str()));
  const int status = http.POST(payload, jsonBody.length());
  _lastHttpStatus = status;

  if (status <= 0) {
    char sslDetail[144];
    const int mbedCode = client.lastError(sslDetail, sizeof(sslDetail));
    _lastError = http.errorToString(status);
    if (mbedCode != 0) {
      _lastError += String(" mbedTLS ") + String(mbedCode) + String(": ") + String(sslDetail);
    }
    http.end();
    return false;
  }

  if (responseOut) *responseOut = http.getString();
  http.end();

  // Backend uses 200/201 for success. Treat any 2xx as success.
  return status >= 200 && status < 300;
}

