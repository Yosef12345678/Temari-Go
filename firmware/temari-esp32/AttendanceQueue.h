#pragma once

#include <Arduino.h>

#include "BackendClient.h"

class AttendanceQueue {
 public:
  bool begin(const char* path = "/attendance_queue.jsonl");

  bool enqueue(const AttendanceSyncRecord& rec);

  // Reads up to maxRecords from queue into outRecords (caller allocates).
  // Returns actual count read.
  size_t peekBatch(AttendanceSyncRecord* outRecords, size_t maxRecords);

  // Remove first n records from queue (after successful sync).
  bool dropBatch(size_t n);

  size_t approxCount() const { return _approxCount; }

 private:
  String _path;
  size_t _approxCount = 0;

  bool recount();
  static bool parseLine(const String& line, AttendanceSyncRecord* out);
  static String toLine(const AttendanceSyncRecord& rec);
};

