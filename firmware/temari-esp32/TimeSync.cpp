#include "TimeSync.h"

#include <time.h>
#include <WiFi.h>

void TimeSync::begin() {}

bool TimeSync::isSane() const {
  time_t now = time(nullptr);
  // ~2021-01-01
  return now > 1609459200;
}

bool TimeSync::syncNtp(uint32_t timeoutMs) {
  if (WiFi.status() != WL_CONNECTED) return false;

  configTime(0, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");

  const uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    if (isSane()) return true;
    delay(250);
  }
  return isSane();
}

