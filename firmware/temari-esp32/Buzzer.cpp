#include "Buzzer.h"

void Buzzer::begin(int pin, int pwmChannel) {
  _pin = pin;
  _channel = pwmChannel;
  // ESP32 Arduino 3.x: LEDC uses pin-based API (channel auto-selected or explicit).
  ledcAttachChannel(static_cast<uint8_t>(_pin), 2000, 8, static_cast<uint8_t>(_channel));
  stop();
}

void Buzzer::beepOk() {
  static const Step pattern[] = {{2000, 80}, {0, 40}, {2400, 80}};
  playPattern(pattern, sizeof(pattern) / sizeof(pattern[0]));
}

void Buzzer::beepError() {
  static const Step pattern[] = {{800, 200}, {0, 80}, {800, 200}, {0, 80}, {800, 240}};
  playPattern(pattern, sizeof(pattern) / sizeof(pattern[0]));
}

void Buzzer::beepCard() {
  static const Step pattern[] = {{1800, 60}, {0, 30}, {1800, 60}};
  playPattern(pattern, sizeof(pattern) / sizeof(pattern[0]));
}

void Buzzer::playPattern(const Step* steps, size_t count) {
  if (!steps || count == 0) return;
  if (count > kMaxSteps) count = kMaxSteps;

  for (size_t i = 0; i < count; i++) _steps[i] = steps[i];
  _stepCount = count;
  _stepIdx = 0;
  _active = true;
  _stepStartedMs = millis();
  applyStep(_steps[_stepIdx]);
}

void Buzzer::applyStep(const Step& s) {
  if (s.freq == 0) {
    ledcWrite(static_cast<uint8_t>(_pin), 0);
    return;
  }
  ledcWriteTone(static_cast<uint8_t>(_pin), s.freq);
  ledcWrite(static_cast<uint8_t>(_pin), 128);
}

void Buzzer::stop() {
  ledcWrite(static_cast<uint8_t>(_pin), 0);
  _active = false;
  _stepCount = 0;
  _stepIdx = 0;
}

void Buzzer::update() {
  if (!_active || _stepCount == 0) return;
  const uint32_t now = millis();
  if (now - _stepStartedMs < _steps[_stepIdx].ms) return;

  _stepIdx++;
  if (_stepIdx >= _stepCount) {
    stop();
    return;
  }

  _stepStartedMs = now;
  applyStep(_steps[_stepIdx]);
}

