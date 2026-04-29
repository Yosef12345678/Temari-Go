#pragma once

#include <Arduino.h>

class Buzzer {
 public:
  void begin(int pin, int pwmChannel = 0);

  void beepOk();
  void beepError();
  void beepCard();

  void update(); // call frequently; non-blocking

 private:
  int _pin = -1;
  int _channel = 0;
  bool _active = false;

  struct Step {
    uint16_t freq;
    uint16_t ms;
  };

  static constexpr size_t kMaxSteps = 8;
  Step _steps[kMaxSteps]{};
  size_t _stepCount = 0;
  size_t _stepIdx = 0;
  uint32_t _stepStartedMs = 0;

  void playPattern(const Step* steps, size_t count);
  void applyStep(const Step& s);
  void stop();
};

