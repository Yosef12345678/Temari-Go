#pragma once

#include <Arduino.h>

struct Mq3Reading {
  uint16_t raw = 0;           // ADC raw (0..4095)
  float filtered = 0.0f;      // EMA filtered raw
  float normalized = 0.0f;    // 0..1 relative to baseline + sensitivity
  bool has_baseline = false;  // baseline established
};

class Mq3Sensor {
 public:
  void begin(int adcPin, int digitalPinOptional = -1);

  // Call periodically. Uses EMA to smooth, optional baseline calibration.
  void update();

  // Calibrate baseline (clean air). Call after warmup period.
  void calibrateBaseline(uint32_t sampleMs = 5000);

  const Mq3Reading& reading() const { return _reading; }
  bool digitalTriggered() const { return _digitalPin >= 0 ? digitalRead(_digitalPin) == HIGH : false; }

  // Tuning knobs
  void setEmaAlpha(float alpha) { _alpha = constrain(alpha, 0.01f, 0.99f); }
  void setSensitivity(float s) { _sensitivity = max(0.01f, s); } // higher => less sensitive

 private:
  int _adcPin = -1;
  int _digitalPin = -1;

  float _alpha = 0.12f;
  float _sensitivity = 600.0f;

  Mq3Reading _reading;
  uint32_t _calibUntilMs = 0;
  float _calibSum = 0.0f;
  uint32_t _calibCount = 0;
  float _baseline = 0.0f;
};

