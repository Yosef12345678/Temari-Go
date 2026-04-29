#pragma once

#include <Arduino.h>

class LcdUi {
 public:
  void begin(uint8_t i2cAddr = 0x27, uint8_t cols = 16, uint8_t rows = 2);
  void showBoot();
  void showWifiStatus(bool connected, const String& ip);
  void showGpsStatus(bool fix, uint32_t sats);
  void showLastCard(const String& uidHex);
  void showMsg(const String& line1, const String& line2);

  void update(); // reserved for future animations

 private:
  uint8_t _addr = 0x27;
  uint8_t _cols = 16;
  uint8_t _rows = 2;
};

