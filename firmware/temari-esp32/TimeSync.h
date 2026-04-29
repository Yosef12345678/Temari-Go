#pragma once

#include <Arduino.h>

class TimeSync {
 public:
  void begin();

  // Call after WiFi connected; returns true if time looks sane.
  bool syncNtp(uint32_t timeoutMs = 15000);

  bool isSane() const;
};

