#pragma once

#include <Arduino.h>

class RfidReader {
 public:
  void begin(int ssPin, int rstPin);
  void update(); // poll; non-blocking

  bool hasTag() const { return _hasTag; }
  String takeTagUidHex(); // returns and clears

 private:
  int _ssPin = -1;
  int _rstPin = -1;

  bool _hasTag = false;
  String _uidHex;

  uint32_t _lastReadMs = 0;
  uint32_t _debounceMs = 700;
};

