#include "AttendanceQueue.h"

#include <ArduinoJson.h>
#include <LittleFS.h>

namespace {
constexpr size_t kLineDocSize = 384;
} // namespace

bool AttendanceQueue::begin(const char* path) {
  _path = String(path);
  if (!LittleFS.begin(true)) return false;

  if (!LittleFS.exists(_path)) {
    File f = LittleFS.open(_path, FILE_WRITE);
    if (!f) return false;
    f.close();
  }

  return recount();
}

bool AttendanceQueue::enqueue(const AttendanceSyncRecord& rec) {
  File f = LittleFS.open(_path, FILE_APPEND);
  if (!f) return false;

  const String line = toLine(rec);
  const size_t n = f.println(line);
  f.close();
  if (n == 0) return false;

  _approxCount++;
  return true;
}

size_t AttendanceQueue::peekBatch(AttendanceSyncRecord* outRecords, size_t maxRecords) {
  if (!outRecords || maxRecords == 0) return 0;

  File f = LittleFS.open(_path, FILE_READ);
  if (!f) return 0;

  size_t count = 0;
  while (f.available() && count < maxRecords) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    AttendanceSyncRecord rec{};
    if (!parseLine(line, &rec)) continue;

    outRecords[count++] = rec;
  }

  f.close();
  return count;
}

bool AttendanceQueue::dropBatch(size_t n) {
  if (n == 0) return true;

  File in = LittleFS.open(_path, FILE_READ);
  if (!in) return false;

  const String tmpPath = _path + ".tmp";
  File out = LittleFS.open(tmpPath, FILE_WRITE);
  if (!out) {
    in.close();
    return false;
  }

  size_t dropped = 0;
  while (in.available()) {
    String line = in.readStringUntil('\n');
    if (dropped < n) {
      dropped++;
      continue;
    }
    out.println(line);
  }

  in.close();
  out.close();

  LittleFS.remove(_path);
  const bool renamed = LittleFS.rename(tmpPath, _path);
  if (!renamed) return false;

  return recount();
}

bool AttendanceQueue::recount() {
  File f = LittleFS.open(_path, FILE_READ);
  if (!f) return false;

  size_t count = 0;
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;
    count++;
  }
  f.close();
  _approxCount = count;
  return true;
}

bool AttendanceQueue::parseLine(const String& line, AttendanceSyncRecord* out) {
  if (!out) return false;

  StaticJsonDocument<kLineDocSize> doc;
  const DeserializationError err = deserializeJson(doc, line);
  if (err) return false;

  const char* rfid = doc["rfid_tag"] | nullptr;
  if (!rfid) return false;
  out->rfid_tag = String(rfid);

  out->latitude = doc["latitude"] | 0.0;
  out->longitude = doc["longitude"] | 0.0;

  if (doc.containsKey("bus_id")) {
    out->has_bus_id = true;
    out->bus_id = doc["bus_id"].as<int>();
  } else {
    out->has_bus_id = false;
  }

  const char* vehicle = doc["vehicle_id"] | nullptr;
  if (vehicle) {
    out->has_vehicle_id = true;
    out->vehicle_id = String(vehicle);
  } else {
    out->has_vehicle_id = false;
  }

  const char* ts = doc["timestamp"] | nullptr;
  if (ts) {
    out->has_timestamp = true;
    out->timestamp_iso8601 = String(ts);
  } else {
    out->has_timestamp = false;
  }

  const char* eid = doc["event_id"] | nullptr;
  if (eid) {
    out->has_event_id = true;
    out->event_id = String(eid);
  } else {
    out->has_event_id = false;
  }

  return true;
}

String AttendanceQueue::toLine(const AttendanceSyncRecord& rec) {
  StaticJsonDocument<kLineDocSize> doc;
  doc["rfid_tag"] = rec.rfid_tag;
  doc["latitude"] = rec.latitude;
  doc["longitude"] = rec.longitude;
  if (rec.has_bus_id) doc["bus_id"] = rec.bus_id;
  if (rec.has_vehicle_id) doc["vehicle_id"] = rec.vehicle_id;
  if (rec.has_timestamp) doc["timestamp"] = rec.timestamp_iso8601;
  if (rec.has_event_id) doc["event_id"] = rec.event_id;

  String out;
  serializeJson(doc, out);
  return out;
}

