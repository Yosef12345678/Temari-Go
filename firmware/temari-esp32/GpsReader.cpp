#include "GpsReader.h"

#include <TinyGPSPlus.h>

namespace {
TinyGPSPlus g_gps;

static String two(int v) {
  if (v < 10) return "0" + String(v);
  return String(v);
}

static String formatIso8601Utc(const TinyGPSDate& d, const TinyGPSTime& t) {
  if (!d.isValid() || !t.isValid()) return "";
  return String(d.year()) + "-" + two(d.month()) + "-" + two(d.day()) + "T" + two(t.hour()) + ":" + two(t.minute()) +
         ":" + two(t.second()) + "Z";
}
} // namespace

void GpsReader::begin(HardwareSerial& serial, int rxPin, int txPin, uint32_t baud) {
  _serial = &serial;
  _serial->begin(baud, SERIAL_8N1, rxPin, txPin);
  _lastFix = {};
  _lastFixMs = 0;
}

void GpsReader::update() {
  if (!_serial) return;
  while (_serial->available()) {
    const char c = static_cast<char>(_serial->read());
    g_gps.encode(c);
  }

  if (g_gps.location.isUpdated()) {
    _lastFix.valid = g_gps.location.isValid();
    _lastFix.lat = g_gps.location.lat();
    _lastFix.lon = g_gps.location.lng();
    _lastFix.sats = g_gps.satellites.isValid() ? g_gps.satellites.value() : 0;

    if (g_gps.speed.isValid()) {
      _lastFix.speed_kmph = g_gps.speed.kmph();
      _lastFix.has_speed = true;
    } else {
      _lastFix.has_speed = false;
    }

    const String ts = formatIso8601Utc(g_gps.date, g_gps.time);
    if (ts.length() > 0) {
      _lastFix.timestamp_iso8601 = ts;
      _lastFix.has_timestamp = true;
    } else {
      _lastFix.has_timestamp = false;
    }

    _lastFixMs = millis();
  }
}

bool GpsReader::hasFreshFix(uint32_t maxAgeMs) const {
  if (!_lastFix.valid) return false;
  return (millis() - _lastFixMs) <= maxAgeMs;
}

