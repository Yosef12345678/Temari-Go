#include "Mq3Sensor.h"

void Mq3Sensor::begin(int adcPin, int digitalPinOptional) {
  _adcPin = adcPin;
  _digitalPin = digitalPinOptional;

  pinMode(_adcPin, INPUT);
  if (_digitalPin >= 0) pinMode(_digitalPin, INPUT);

  // ESP32 ADC defaults; if you want better scaling, tune attenuation.
  analogReadResolution(12);

  _reading = {};
  _baseline = 0.0f;
  _calibUntilMs = 0;
  _calibSum = 0.0f;
  _calibCount = 0;
}

void Mq3Sensor::calibrateBaseline(uint32_t sampleMs) {
  _calibUntilMs = millis() + sampleMs;
  _calibSum = 0.0f;
  _calibCount = 0;
}

void Mq3Sensor::update() {
  if (_adcPin < 0) return;
  const uint16_t raw = static_cast<uint16_t>(analogRead(_adcPin));
  _reading.raw = raw;

  if (_reading.filtered <= 0.1f) {
    _reading.filtered = static_cast<float>(raw);
  } else {
    _reading.filtered = _alpha * static_cast<float>(raw) + (1.0f - _alpha) * _reading.filtered;
  }

  // Calibration window: average filtered signal.
  if (_calibUntilMs != 0) {
    if (millis() <= _calibUntilMs) {
      _calibSum += _reading.filtered;
      _calibCount++;
    } else {
      if (_calibCount > 0) {
        _baseline = _calibSum / static_cast<float>(_calibCount);
        _reading.has_baseline = true;
      }
      _calibUntilMs = 0;
    }
  }

  if (_reading.has_baseline) {
    const float delta = _reading.filtered - _baseline;
    // Normalize relative to sensitivity; clamp to 0..1
    _reading.normalized = constrain(delta / _sensitivity, 0.0f, 1.0f);
  } else {
    _reading.normalized = 0.0f;
  }
}

