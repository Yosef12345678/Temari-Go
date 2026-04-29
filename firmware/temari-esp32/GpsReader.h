#pragma once

#include <Arduino.h>

struct GpsFix {
  bool valid = false;
  double lat = 0;
  double lon = 0;
  double speed_kmph = 0;
  bool has_speed = false;
  uint32_t sats = 0;
  String timestamp_iso8601; // UTC
  bool has_timestamp = false;
};

class GpsReader {
 public:
  void begin(HardwareSerial& serial, int rxPin, int txPin, uint32_t baud = 9600);
  void update(); // feed NMEA parser

  const GpsFix& lastFix() const { return _lastFix; }
  bool hasFreshFix(uint32_t maxAgeMs) const;

 private:
  HardwareSerial* _serial = nullptr;
  GpsFix _lastFix;
  uint32_t _lastFixMs = 0;
};

