#include <WiFi.h>
#include <esp_system.h>

// Temporary dev switch: disables TLS certificate verification.
// Set to 0 when you have a proper Root CA PEM configured.
#define TEMARI_TLS_INSECURE 1

// Enable Serial debug prints from BackendClient.
#define TEMARI_DEBUG 1

#include "BackendClient.h"
#include "AttendanceQueue.h"
#include "Buzzer.h"
#include "GpsReader.h"
#include "LcdUi.h"
#include "Mq3Sensor.h"
#include "RfidReader.h"
#include "TimeSync.h"

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
static constexpr uint32_t LOCATION_POST_MS = 10000;
static constexpr uint32_t LCD_REFRESH_MS = 500;
static constexpr uint32_t ATTENDANCE_SYNC_MS = 20000;
static constexpr uint32_t MQ3_CALIBRATE_AFTER_BOOT_MS = 30000; // MQ sensors need warm-up
static constexpr size_t ATTENDANCE_SYNC_BATCH_MAX = 20;
static constexpr uint32_t ALCOHOL_POST_MS = 60000;
static constexpr float MQ3_TO_MG_L_SCALE = 0.10f; // normalized 0..1 => 0..0.10 mg/L

// ---- Hardcoded configuration  ----
static const char* WIFI_SSID = "TianYi-22kR";
static const char* WIFI_PASSWORD = "62235400";
static const char* BACKEND_BASE_URL = "https://up-painfully-crayfish.ngrok-free.app"; // ex: https://api.example.com (no trailing slash recommended)
static const char* DEVICE_KEY = "a69efea19d6e77f617bafc9de08739a26293718cd4f1a5ca1cc8b77f5ab7793d";               // sent as x-device-key
static const int BUS_ID = 1;

// Root CA PEM for your backend server certificate chain.
static const char* SERVER_ROOT_CA_PEM = R"PEM(
-----BEGIN CERTIFICATE-----
MIIDmjCCAyGgAwIBAgISBmosJeAviIu7WMsxLiEoQrWoMAoGCCqGSM49BAMDMDIx
CzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJF
NzAeFw0yNjAzMjkxNjAzMzJaFw0yNjA2MjcxNjAzMzFaMBsxGTAXBgNVBAMMECou
bmdyb2stZnJlZS5hcHAwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATmt8dreaEj
jY1q/7Jt4J4E+tmu/KosbyaTy7vnkcb82piE7O+MtbhqjJx/maTmw1cpZkasdZhT
LXVMKDgEBak8o4ICLDCCAigwDgYDVR0PAQH/BAQDAgeAMBMGA1UdJQQMMAoGCCsG
AQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFPV153WpUSTzYvRhhkCK2mQ2
1ZjQMB8GA1UdIwQYMBaAFK5IntyHHUSgb9qi5WB0BHjCnACAMDIGCCsGAQUFBwEB
BCYwJDAiBggrBgEFBQcwAoYWaHR0cDovL2U3LmkubGVuY3Iub3JnLzArBgNVHREE
JDAighAqLm5ncm9rLWZyZWUuYXBwgg5uZ3Jvay1mcmVlLmFwcDATBgNVHSAEDDAK
MAgGBmeBDAECATAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8vZTcuYy5sZW5jci5v
cmcvNDEuY3JsMIIBDAYKKwYBBAHWeQIEAgSB/QSB+gD4AH8AqCbL4wrGNRJGUz/g
ZfFPGdluGQgTxB3ZbXkAsxI8VScAAAGdOouk6QAIAAAFAASwYoEEAwBIMEYCIQCE
2GZ5MxUctUk8nnS2Hi4WiVNOqh7MYjixqRWqjPpm7AIhAIQUYj7mGGxPhdV9BFOD
6ep1w64KKeIcNL/Lmo2Xl4VvAHUAZBHEbKQS7KeJHKICLgC8q08oB9QeNSer6v7V
A8l9zfAAAAGdOoupqwAABAMARjBEAiBgJVGKoQYm1NU9U/RvnA+8IOwwTTwAFDn7
87naFlcycQIgGGckC3J5k75E8VOPVS0mxTFk+MObn3hb3w0XKG1RGh8wCgYIKoZI
zj0EAwMDZwAwZAIwJP2O6yR4MtCbLrCHnurnzAo6B/bLVs01p9lDsHh7FwbSLFAY
yoGIidLO0WgdRyASAjBwV+1vnMu7FvcONxawonrOj300pwU3rQL5yDXW+lK7G2NY
kpbR6BxLRiVV4ten/uI=
-----END CERTIFICATE-----
)PEM";

static void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    if (millis() - start > 20000) break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);

  lcd.begin(0x27, 16, 2);
  lcd.showBoot();

  connectWifi();

  if (WiFi.status() == WL_CONNECTED) {
    timeSync.syncNtp(15000);
  }

  backend.setBaseUrl(String(BACKEND_BASE_URL));
  backend.setDeviceKey(String(DEVICE_KEY));
  backend.setServerRootCACertPem(String(SERVER_ROOT_CA_PEM));

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
  static uint32_t lastAlcoholPostMs = 0;
  static bool mq3Calibrated = false;

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

    const GpsFix& fix = gps.lastFix();
    if (WiFi.status() == WL_CONNECTED && fix.valid) {
      AttendanceScanPayload scan{};
      scan.rfid_tag = uid;
      scan.latitude = fix.lat;
      scan.longitude = fix.lon;
      scan.has_bus_id = true;
      scan.bus_id = BUS_ID;
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
        rec.bus_id = BUS_ID;
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
      rec.bus_id = BUS_ID;
      rec.has_vehicle_id = false;
      rec.has_timestamp = fix.has_timestamp;
      rec.timestamp_iso8601 = fix.timestamp_iso8601;
      rec.has_event_id = true;
      rec.event_id = String((uint32_t)ESP.getEfuseMac(), HEX) + "-" + String(now) + "-" + String(esp_random(), HEX);
      attendanceQueue.enqueue(rec);
    }
  }

  // Periodic GPS location updates
  if (WiFi.status() == WL_CONNECTED && (now - lastLocationPostMs) >= LOCATION_POST_MS) {
    lastLocationPostMs = now;
    const GpsFix& fix = gps.lastFix();
    if (fix.valid) {
      LocationPayload loc{};
      loc.bus_id = BUS_ID;
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

  // Periodic alcohol telemetry (device-auth endpoint)
  if (WiFi.status() == WL_CONNECTED && (now - lastAlcoholPostMs) >= ALCOHOL_POST_MS) {
    lastAlcoholPostMs = now;
    const Mq3Reading& r = mq3.reading();
    if (r.has_baseline) {
      const GpsFix& fix = gps.lastFix();

      AlcoholTestPayload p{};
      p.alcohol_level = static_cast<double>(r.normalized * MQ3_TO_MG_L_SCALE);
      p.has_bus_id = true;
      p.bus_id = BUS_ID;
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
      if (!ok) {
        Serial.print("Alcohol post failed status=");
        Serial.print(backend.lastHttpStatus());
        Serial.print(" err=");
        Serial.println(backend.lastError());
      }
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

