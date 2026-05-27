#include <WiFi.h>
#include <esp_system.h>
#include <time.h>

#include "DeviceConfig.h"
#include "DeviceSecrets.h"
#include "BackendClient.h"
#include "AttendanceQueue.h"
#include "Buzzer.h"
#include "GpsReader.h"
#include "LcdUi.h"
#include "Mq3Sensor.h"
#include "RfidReader.h"
#include "TimeSync.h"

DeviceConfig config;
TimeSync timeSync;

BackendClient backend;
AttendanceQueue attendanceQueue;
RfidReader rfid;
GpsReader gps;
Mq3Sensor mq3;
LcdUi lcd;
Buzzer buzzer;

// Pin map (matches your attached wiring)
static constexpr int PIN_RFID_SS = 5;
static constexpr int PIN_RFID_RST = 4;
static constexpr int PIN_BUZZER = 13;
static constexpr int PIN_MQ3_A0 = 34; // ADC1 to avoid WiFi ADC2 conflicts
static constexpr int PIN_MQ3_D0 = 27; // optional
static constexpr int PIN_GPS_RX = 16; // RX2
static constexpr int PIN_GPS_TX = 17; // TX2

// Scheduling intervals
static constexpr uint32_t WIFI_RETRY_MS = 15000;
static constexpr uint32_t LOCATION_POST_MS = 60000; // 1 minute
static constexpr uint32_t LCD_REFRESH_MS = 500;
static constexpr uint32_t ATTENDANCE_SYNC_MS = 20000;
static constexpr uint32_t ALCOHOL_CHECK_POLL_MS = 10000; // 10 seconds
static constexpr uint32_t MQ3_CALIBRATE_AFTER_BOOT_MS = 30000; // MQ sensors need warm-up
static constexpr size_t ATTENDANCE_SYNC_BATCH_MAX = 20;
static constexpr float MQ3_TO_MG_L_SCALE = 0.10f; // normalized 0..1 => 0..0.10 mg/L
static constexpr float BREATH_NORMALIZED_THRESHOLD = 0.12f;
static constexpr uint32_t BREATH_COOLDOWN_MS = 8000;

// East Africa Time (UTC+3): 06:00–07:00 and 15:00–16:00
static bool isAlcoholCheckWindowActive() {
  if (!timeSync.isSane()) return false;

  time_t now = time(nullptr);
  const time_t eatSec = now + (3 * 3600);
  struct tm eat {};
  gmtime_r(&eatSec, &eat);

  const int minutes = eat.tm_hour * 60 + eat.tm_min;
  const bool morning = minutes >= (6 * 60) && minutes < (7 * 60);
  const bool afternoon = minutes >= (15 * 60) && minutes < (16 * 60);
  return morning || afternoon;
}

static bool breathSampleDetected(const Mq3Sensor& sensor) {
  if (sensor.digitalTriggered()) return true;
  const Mq3Reading& r = sensor.reading();
  return r.has_baseline && r.normalized >= BREATH_NORMALIZED_THRESHOLD;
}

static bool submitAlcoholReadingIfPending(int* submittedCheckId) {
  AlcoholCheckStatus check{};
  String checkResp;
  const bool checkOk = backend.getAlcoholCheckDevice(&check, &checkResp);
  if (!checkOk) {
    Serial.print("Alcohol check lookup failed status=");
    Serial.print(backend.lastHttpStatus());
    Serial.print(" err=");
    Serial.println(backend.lastError());
    return false;
  }
  if (!check.active || check.status != "pending") {
    if (submittedCheckId) *submittedCheckId = 0;
    return false;
  }
  if (submittedCheckId && check.id == *submittedCheckId) {
    return false;
  }

  const Mq3Reading& r = mq3.reading();
  if (!r.has_baseline) {
    Serial.println("Breath detected but MQ3 baseline is not ready.");
    return false;
  }

  const GpsFix& fix = gps.lastFix();
  AlcoholTestPayload p{};
  p.alcohol_level = static_cast<double>(r.normalized * MQ3_TO_MG_L_SCALE);
  p.has_bus_id = true;
  p.bus_id = config.busId;
  p.has_vehicle_id = false;
  p.has_latitude = fix.valid;
  p.latitude = fix.lat;
  p.has_longitude = fix.valid;
  p.longitude = fix.lon;
  p.has_timestamp = fix.has_timestamp;
  p.timestamp_iso8601 = fix.timestamp_iso8601;

  String resp;
  const bool ok = backend.postAlcoholTestDevice(p, &resp);
  Serial.println(resp);
  if (ok && submittedCheckId) {
    *submittedCheckId = check.id;
  } else if (!ok) {
    Serial.print("Alcohol post failed status=");
    Serial.print(backend.lastHttpStatus());
    Serial.print(" err=");
    Serial.println(backend.lastError());
  }
  return ok;
}

static void applySecretsToConfig(DeviceConfig* cfg) {
  if (!cfg) return;
  cfg->wifiSsid = kWifiSsid;
  cfg->wifiPassword = kWifiPassword;
  cfg->backendBaseUrl = kBackendBaseUrl;
  cfg->deviceKey = kDeviceKey;
  cfg->busId = kBusId;
}

static void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(config.wifiSsid.c_str(), config.wifiPassword.c_str());

  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    if (millis() - start > 20000) break;
  }
  // Avoid modem sleep during TLS; wakes help save power but often cause mbedTLS EOF (-29312) on tunnels.
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.setSleep(false);
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);

  applySecretsToConfig(&config);
  if (!config.isValid()) {
    Serial.println("Invalid config: edit firmware/temari-esp32/DeviceSecrets.h "
                   "(WiFi, backend URL, device key, bus ID > 0, root CA PEM).");
  }

  lcd.begin(0x27, 16, 2);
  lcd.showBoot();

  connectWifi();

  if (WiFi.status() == WL_CONNECTED) {
    timeSync.syncNtp(15000);
  }

  backend.setBaseUrl(config.backendBaseUrl);
  backend.setDeviceKey(config.deviceKey);

  Serial.print("Backend URL ");
  Serial.println(config.backendBaseUrl);

  buzzer.begin(PIN_BUZZER, 0);
  rfid.begin(PIN_RFID_SS, PIN_RFID_RST);
  gps.begin(Serial2, PIN_GPS_RX, PIN_GPS_TX, 9600);
  mq3.begin(PIN_MQ3_A0, PIN_MQ3_D0);
  attendanceQueue.begin();

  lcd.showWifiStatus(WiFi.status() == WL_CONNECTED, WiFi.localIP().toString());
}

void loop() {
  static uint32_t lastWifiAttemptMs = 0;
  static uint32_t lastLocationPostMs = 0;
  static uint32_t lastLcdRefreshMs = 0;
  static uint32_t lastAttendanceSyncMs = 0;
  static uint32_t lastAlcoholCheckPollMs = 0;
  static int lastSubmittedAlcoholCheckId = 0;
  static uint32_t lastBreathAttemptMs = 0;
  static bool breathArmed = true;
  static bool mq3Calibrated = false;
  static bool alcoholCheckPending = false;

  const uint32_t now = millis();

  // Always keep hardware drivers responsive
  gps.update();
  rfid.update();
  mq3.update();
  buzzer.update();
  lcd.update();

  // MQ3 baseline calibration after warmup
  if (!mq3Calibrated && now > MQ3_CALIBRATE_AFTER_BOOT_MS) {
    mq3.calibrateBaseline(5000);
    mq3Calibrated = true;
  }

  // WiFi keepalive (simple retry loop)
  if (WiFi.status() != WL_CONNECTED && (now - lastWifiAttemptMs) >= WIFI_RETRY_MS) {
    lastWifiAttemptMs = now;
    connectWifi();
    if (WiFi.status() == WL_CONNECTED && !timeSync.isSane()) {
      timeSync.syncNtp(15000);
    }
  }

  // LCD status refresh
  if ((now - lastLcdRefreshMs) >= LCD_REFRESH_MS) {
    lastLcdRefreshMs = now;
    const GpsFix& fix = gps.lastFix();
    if (WiFi.status() == WL_CONNECTED) {
      lcd.showWifiStatus(true, WiFi.localIP().toString());
    } else {
      lcd.showWifiStatus(false, "");
    }
    // Show GPS fix state briefly (you can swap screens later)
    if (fix.valid) {
      lcd.showGpsStatus(true, fix.sats);
    } else {
      lcd.showGpsStatus(false, fix.sats);
    }
  }

  // Event-driven RFID attendance scan
  if (rfid.hasTag()) {
    const String uid = rfid.takeTagUidHex();
    buzzer.beepCard();
    lcd.showLastCard(uid);

    // Block attendance if alcohol check is pending
    if (alcoholCheckPending) {
      Serial.println("Alcohol check pending - blocking attendance scan");
      lcd.showMsg("Breath Test", "In Progress");
      buzzer.beepError();
      delay(2000);
      lcd.showLastCard(uid);
    } else {
      const GpsFix& fix = gps.lastFix();
      if (WiFi.status() == WL_CONNECTED && fix.valid) {
        AttendanceScanPayload scan{};
        scan.rfid_tag = uid;
        scan.latitude = fix.lat;
        scan.longitude = fix.lon;
        scan.has_bus_id = true;
        scan.bus_id = config.busId;
        scan.has_vehicle_id = false;
        scan.has_timestamp = fix.has_timestamp;
        scan.timestamp_iso8601 = fix.timestamp_iso8601;
        scan.has_event_id = false;

        String resp;
        const bool ok = backend.postAttendanceScan(scan, &resp);
        Serial.println(resp);
        if (ok) {
          buzzer.beepOk();
        } else {
          buzzer.beepError();
          Serial.print("Attendance scan failed status=");
          Serial.print(backend.lastHttpStatus());
          Serial.print(" err=");
          Serial.println(backend.lastError());
          AttendanceSyncRecord rec{};
          rec.rfid_tag = uid;
          rec.latitude = fix.lat;
          rec.longitude = fix.lon;
          rec.has_bus_id = true;
          rec.bus_id = config.busId;
          rec.has_vehicle_id = false;
          rec.has_timestamp = fix.has_timestamp;
          rec.timestamp_iso8601 = fix.timestamp_iso8601;
          rec.has_event_id = true;
          rec.event_id = String((uint32_t)ESP.getEfuseMac(), HEX) + "-" + String(now) + "-" + String(esp_random(), HEX);
          attendanceQueue.enqueue(rec);
        }
      } else {
        buzzer.beepError();
        // Policy: if no GPS fix, we still enqueue with 0/0 coords; backend requires coords, so you may want
        // to block scan until fix is available or enrich later before sync.
        AttendanceSyncRecord rec{};
        rec.rfid_tag = uid;
        rec.latitude = fix.valid ? fix.lat : 0.0;
        rec.longitude = fix.valid ? fix.lon : 0.0;
        rec.has_bus_id = true;
        rec.bus_id = config.busId;
        rec.has_vehicle_id = false;
        rec.has_timestamp = fix.has_timestamp;
        rec.timestamp_iso8601 = fix.timestamp_iso8601;
        rec.has_event_id = true;
        rec.event_id = String((uint32_t)ESP.getEfuseMac(), HEX) + "-" + String(now) + "-" + String(esp_random(), HEX);
        attendanceQueue.enqueue(rec);
      }
    }
  }

  // Periodic GPS location updates
  if (WiFi.status() == WL_CONNECTED && (now - lastLocationPostMs) >= LOCATION_POST_MS) {
    lastLocationPostMs = now;
    const GpsFix& fix = gps.lastFix();
    if (fix.valid) {
      LocationPayload loc{};
      loc.bus_id = config.busId;
      loc.latitude = fix.lat;
      loc.longitude = fix.lon;
      loc.has_speed = fix.has_speed;
      loc.speed_kmph = fix.speed_kmph;
      loc.has_timestamp = fix.has_timestamp;
      loc.timestamp_iso8601 = fix.timestamp_iso8601;

      String resp;
      const bool ok = backend.postLocation(loc, &resp);
      Serial.println(resp);
      if (!ok) {
        Serial.print("Location post failed status=");
        Serial.print(backend.lastHttpStatus());
        Serial.print(" err=");
        Serial.println(backend.lastError());
      }
    }
  }

  // Periodic alcohol check status polling (every 10 seconds during test window)
  if (WiFi.status() == WL_CONNECTED && isAlcoholCheckWindowActive() && (now - lastAlcoholCheckPollMs) >= ALCOHOL_CHECK_POLL_MS) {
    lastAlcoholCheckPollMs = now;
    Serial.println("Polling alcohol check status...");
    AlcoholCheckStatus check{};
    String checkResp;
    const bool checkOk = backend.getAlcoholCheckDevice(&check, &checkResp);
    Serial.print("Alcohol check response: ");
    Serial.println(checkResp);
    if (!checkOk) {
      Serial.print("Alcohol check API failed status=");
      Serial.print(backend.lastHttpStatus());
      Serial.print(" err=");
      Serial.println(backend.lastError());
      // Keep previous pending state on transient network/API errors.
      // If we already know a check is pending, continue requiring a blow.
    } else {
      alcoholCheckPending = check.active && check.status == "pending";
      Serial.print("Alcohol check pending: ");
      Serial.println(alcoholCheckPending ? "YES" : "NO");
    }
  }

  // When backend says a check is pending, actively wait for a breath sample and submit on blow.
  if (WiFi.status() == WL_CONNECTED && mq3Calibrated && alcoholCheckPending) {
    lcd.showMsg("Breath Test", "Blow now");
    if (breathSampleDetected(mq3) && breathArmed && (now - lastBreathAttemptMs) >= BREATH_COOLDOWN_MS) {
      breathArmed = false;
      lastBreathAttemptMs = now;
      lcd.showMsg("Breath", "Sending...");
      const bool submitted = submitAlcoholReadingIfPending(&lastSubmittedAlcoholCheckId);
      if (submitted) {
        Serial.println("Breath sample submitted for pending alcohol check.");
      }
      breathArmed = true;
    }
  }

  // Periodic offline attendance sync
  if (WiFi.status() == WL_CONNECTED && (now - lastAttendanceSyncMs) >= ATTENDANCE_SYNC_MS) {
    lastAttendanceSyncMs = now;
    AttendanceSyncRecord batch[ATTENDANCE_SYNC_BATCH_MAX];
    const size_t n = attendanceQueue.peekBatch(batch, ATTENDANCE_SYNC_BATCH_MAX);
    if (n > 0) {
      String resp;
      const bool ok = backend.postAttendanceSync(batch, n, &resp);
      Serial.println(resp);
      if (ok) {
        attendanceQueue.dropBatch(n);
      } else {
        Serial.print("Attendance sync failed status=");
        Serial.print(backend.lastHttpStatus());
        Serial.print(" err=");
        Serial.println(backend.lastError());
      }
    }
  }
}

