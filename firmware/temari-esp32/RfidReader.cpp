#include "RfidReader.h"

#include <MFRC522.h>
#include <SPI.h>

namespace {
MFRC522* g_mfrc = nullptr;

static String uidToHex(const MFRC522::Uid& uid) {
  String out;
  out.reserve(uid.size * 2);
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) out += '0';
    out += String(uid.uidByte[i], HEX);
  }
  out.toUpperCase();
  return out;
}
} // namespace

void RfidReader::begin(int ssPin, int rstPin) {
  _ssPin = ssPin;
  _rstPin = rstPin;

  SPI.begin(); // SCK=18 MOSI=23 MISO=19 default on many ESP32 devkits
  if (g_mfrc) delete g_mfrc;
  g_mfrc = new MFRC522(_ssPin, _rstPin);
  g_mfrc->PCD_Init();

  _hasTag = false;
  _uidHex = "";
  _lastReadMs = 0;
}

void RfidReader::update() {
  if (!g_mfrc) return;
  const uint32_t now = millis();
  if (now - _lastReadMs < _debounceMs) return;

  if (!g_mfrc->PICC_IsNewCardPresent()) return;
  if (!g_mfrc->PICC_ReadCardSerial()) return;

  _uidHex = uidToHex(g_mfrc->uid);
  _hasTag = true;
  _lastReadMs = now;

  g_mfrc->PICC_HaltA();
  g_mfrc->PCD_StopCrypto1();
}

String RfidReader::takeTagUidHex() {
  if (!_hasTag) return "";
  _hasTag = false;
  String out = _uidHex;
  _uidHex = "";
  return out;
}

