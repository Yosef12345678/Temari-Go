#include "LcdUi.h"

#include <LiquidCrystal_I2C.h>
#include <Wire.h>

namespace {
LiquidCrystal_I2C* g_lcd = nullptr;

static String fit(const String& s, uint8_t cols) {
  if (s.length() == cols) return s;
  if (s.length() > cols) return s.substring(0, cols);
  String out = s;
  while (out.length() < cols) out += ' ';
  return out;
}
} // namespace

void LcdUi::begin(uint8_t i2cAddr, uint8_t cols, uint8_t rows) {
  _addr = i2cAddr;
  _cols = cols;
  _rows = rows;

  Wire.begin(21, 22); // matches your wiring

  if (g_lcd) delete g_lcd;
  g_lcd = new LiquidCrystal_I2C(_addr, _cols, _rows);
  g_lcd->init();
  g_lcd->backlight();
  showBoot();
}

void LcdUi::showBoot() { showMsg("Temari device", "Booting..."); }

void LcdUi::showWifiStatus(bool connected, const String& ip) {
  if (connected) {
    showMsg("WiFi OK", ip);
  } else {
    showMsg("WiFi...", "Connecting");
  }
}

void LcdUi::showGpsStatus(bool fix, uint32_t sats) {
  if (fix) {
    showMsg("GPS FIX", "Sats " + String(sats));
  } else {
    showMsg("GPS...", "No fix");
  }
}

void LcdUi::showLastCard(const String& uidHex) { showMsg("RFID", uidHex); }

void LcdUi::showMsg(const String& line1, const String& line2) {
  if (!g_lcd) return;
  g_lcd->setCursor(0, 0);
  g_lcd->print(fit(line1, _cols));
  if (_rows >= 2) {
    g_lcd->setCursor(0, 1);
    g_lcd->print(fit(line2, _cols));
  }
}

void LcdUi::update() {}

