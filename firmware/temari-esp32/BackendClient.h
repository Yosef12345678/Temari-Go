#pragma once

#include <Arduino.h>

struct LocationPayload {
  int bus_id;
  double latitude;
  double longitude;
  double speed_kmph;
  bool has_speed;
  String timestamp_iso8601;
  bool has_timestamp;
};

struct AttendanceScanPayload {
  String rfid_tag;
  double latitude;
  double longitude;
  int bus_id;
  bool has_bus_id;
  String vehicle_id;
  bool has_vehicle_id;
  String timestamp_iso8601;
  bool has_timestamp;
  String event_id;
  bool has_event_id;
};

struct AttendanceSyncRecord {
  String rfid_tag;
  double latitude;
  double longitude;
  int bus_id;
  bool has_bus_id;
  String vehicle_id;
  bool has_vehicle_id;
  String timestamp_iso8601;
  bool has_timestamp;
  String event_id;
  bool has_event_id;
};

struct AlcoholTestPayload {
  double alcohol_level;
  int bus_id;
  bool has_bus_id;
  String vehicle_id;
  bool has_vehicle_id;
  double latitude;
  bool has_latitude;
  double longitude;
  bool has_longitude;
  String timestamp_iso8601;
  bool has_timestamp;
};

struct AlcoholCheckStatus {
  bool active = false;
  int id = 0;
  int route_run_id = 0;
  int bus_id = 0;
  String status;
  String expires_at;
};

class BackendClient {
 public:
  BackendClient();

  void setBaseUrl(const String& baseUrl);     // ex: https://api.example.com
  void setDeviceKey(const String& deviceKey); // raw key; sent as x-device-key

  bool postLocation(const LocationPayload& payload, String* responseOut);
  bool postAttendanceScan(const AttendanceScanPayload& payload, String* responseOut);
  bool postAttendanceSync(const AttendanceSyncRecord* records, size_t recordCount, String* responseOut);
  bool postAlcoholTestDevice(const AlcoholTestPayload& payload, String* responseOut);
  bool getAlcoholCheckDevice(AlcoholCheckStatus* statusOut, String* responseOut);

  int lastHttpStatus() const { return _lastHttpStatus; }
  const String& lastError() const { return _lastError; }

 private:
  String _baseUrl;
  String _deviceKey;

  int _lastHttpStatus = 0;
  String _lastError;

  bool postJson(const String& path, const String& jsonBody, String* responseOut);
  bool getJson(const String& path, String* responseOut);
  void clearLastError();
};

