import { describe, it, expect } from "vitest";
import {
  parseCSV,
  mergeReadings,
  computeStats,
  filterByDateRange,
  formatForChart,
} from "@/lib/csv-parser";
import { WeatherReading } from "@/lib/types";

// ─── Sample data matching the actual Pi output format ───────────────────────

const SAMPLE_CSV = `2026-02-08 12:00:21,Humidity: 59.00%  Temp: 18.10C\r
2026-02-08 12:05:21,Humidity: 59.00%  Temp: 18.10C\r
2026-02-08 12:10:21,Humidity: 59.00%  Temp: 18.20C\r
2026-02-08 12:15:21,Humidity: 58.00%  Temp: 18.20C`;

const SAMPLE_CSV_2 = `2026-02-08 18:00:21,Humidity: 55.00%  Temp: 19.40C\r
2026-02-08 18:05:21,Humidity: 54.00%  Temp: 19.50C`;

// ─── parseCSV ───────────────────────────────────────────────────────────────

describe("parseCSV", () => {
  it("parses comma-separated CSV with \\r\\n line endings", () => {
    const readings = parseCSV(SAMPLE_CSV);
    expect(readings).toHaveLength(4);
  });

  it("extracts correct temperature values", () => {
    const readings = parseCSV(SAMPLE_CSV);
    expect(readings[0].temperature).toBe(18.1);
    expect(readings[2].temperature).toBe(18.2);
  });

  it("extracts correct humidity values", () => {
    const readings = parseCSV(SAMPLE_CSV);
    expect(readings[0].humidity).toBe(59);
    expect(readings[3].humidity).toBe(58);
  });

  it("parses timestamps into valid Date objects", () => {
    const readings = parseCSV(SAMPLE_CSV);
    expect(readings[0].timestamp).toBeInstanceOf(Date);
    expect(readings[0].timestamp.getFullYear()).toBe(2026);
    expect(readings[0].timestamp.getMonth()).toBe(1); // February = 1
    expect(readings[0].timestamp.getDate()).toBe(8);
  });

  it("skips header rows if present", () => {
    const withHeader = `Timestamp,Raw_Data\n${SAMPLE_CSV}`;
    const readings = parseCSV(withHeader);
    expect(readings).toHaveLength(4);
  });

  it("handles empty input", () => {
    expect(parseCSV("")).toHaveLength(0);
    expect(parseCSV("   ")).toHaveLength(0);
  });

  it("skips malformed lines gracefully", () => {
    const messy = `garbage line with no comma
2026-02-08 12:00:21,Humidity: 59.00%  Temp: 18.10C
not-a-date,Humidity: 59.00%  Temp: 18.10C
2026-02-08 12:05:21,incomplete data here`;
    const readings = parseCSV(messy);
    expect(readings).toHaveLength(1);
    expect(readings[0].temperature).toBe(18.1);
  });

  it("handles pure \\n line endings (Unix)", () => {
    const unixCSV =
      "2026-02-08 12:00:21,Humidity: 59.00%  Temp: 18.10C\n2026-02-08 12:05:21,Humidity: 58.00%  Temp: 18.20C";
    const readings = parseCSV(unixCSV);
    expect(readings).toHaveLength(2);
  });

  it("handles tab-separated format as fallback", () => {
    // If future data switches to tabs, it should still work via first-comma split
    // (tab lines have no comma, so they'd be skipped — this tests the boundary)
    const tabCSV = "2026-02-08 12:00:21\tHumidity: 59.00%  Temp: 18.10C";
    const readings = parseCSV(tabCSV);
    // No comma → skipped
    expect(readings).toHaveLength(0);
  });
});

// ─── mergeReadings ──────────────────────────────────────────────────────────

describe("mergeReadings", () => {
  it("merges multiple arrays into one sorted list", () => {
    const a = parseCSV(SAMPLE_CSV);
    const b = parseCSV(SAMPLE_CSV_2);
    const merged = mergeReadings([a, b]);

    expect(merged).toHaveLength(6);
    // Should be chronological
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        merged[i - 1].timestamp.getTime()
      );
    }
  });

  it("deduplicates by timestamp", () => {
    const a = parseCSV(SAMPLE_CSV);
    const duplicate = parseCSV(SAMPLE_CSV);
    const merged = mergeReadings([a, duplicate]);

    expect(merged).toHaveLength(4); // same 4 timestamps, no duplicates
  });

  it("handles empty arrays", () => {
    expect(mergeReadings([])).toHaveLength(0);
    expect(mergeReadings([[], []])).toHaveLength(0);
  });
});

// ─── computeStats ───────────────────────────────────────────────────────────

describe("computeStats", () => {
  it("returns null for empty readings", () => {
    expect(computeStats([])).toBeNull();
  });

  it("computes correct min/max temperatures", () => {
    const readings = parseCSV(SAMPLE_CSV);
    const stats = computeStats(readings)!;
    expect(stats.minTemperature).toBe(18.1);
    expect(stats.maxTemperature).toBe(18.2);
  });

  it("computes correct min/max humidity", () => {
    const readings = parseCSV(SAMPLE_CSV);
    const stats = computeStats(readings)!;
    expect(stats.minHumidity).toBe(58);
    expect(stats.maxHumidity).toBe(59);
  });

  it("uses the last reading for current values", () => {
    const readings = parseCSV(SAMPLE_CSV);
    const stats = computeStats(readings)!;
    // Last row: Humidity: 58.00%  Temp: 18.20C
    expect(stats.currentTemperature).toBe(18.2);
    expect(stats.currentHumidity).toBe(58);
  });

  it("counts total readings", () => {
    const readings = parseCSV(SAMPLE_CSV);
    const stats = computeStats(readings)!;
    expect(stats.totalReadings).toBe(4);
  });

  it("computes averages correctly", () => {
    const readings = parseCSV(SAMPLE_CSV);
    const stats = computeStats(readings)!;
    // Temps: 18.1, 18.1, 18.2, 18.2 → avg 18.15 → toFixed(1) = 18.2
    expect(stats.avgTemperature).toBe(18.2);
    // Humids: 59, 59, 59, 58 → avg 58.75 → toFixed(1) = 58.8
    expect(stats.avgHumidity).toBe(58.8);
  });
});

// ─── filterByDateRange ──────────────────────────────────────────────────────

describe("filterByDateRange", () => {
  function makeReading(hoursAgo: number): WeatherReading {
    return {
      timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      temperature: 20,
      humidity: 50,
    };
  }

  it("returns all readings for 'all' range", () => {
    const readings = [makeReading(1), makeReading(48), makeReading(720)];
    expect(filterByDateRange(readings, "all")).toHaveLength(3);
  });

  it("filters to last 24 hours", () => {
    const readings = [makeReading(1), makeReading(12), makeReading(48)];
    expect(filterByDateRange(readings, "24h")).toHaveLength(2);
  });

  it("filters to last 7 days", () => {
    const readings = [
      makeReading(1),
      makeReading(100),
      makeReading(200), // ~8.3 days ago
    ];
    expect(filterByDateRange(readings, "7d")).toHaveLength(2);
  });

  it("filters to last 30 days", () => {
    const readings = [
      makeReading(1),
      makeReading(600),
      makeReading(800), // ~33 days ago
    ];
    expect(filterByDateRange(readings, "30d")).toHaveLength(2);
  });
});

// ─── formatForChart ─────────────────────────────────────────────────────────

describe("formatForChart", () => {
  it("converts Date timestamps to display strings", () => {
    const readings = parseCSV(SAMPLE_CSV);
    const formatted = formatForChart(readings);
    expect(formatted).toHaveLength(4);
    expect(typeof formatted[0].time).toBe("string");
    expect(typeof formatted[0].timestamp).toBe("number");
    expect(formatted[0].temperature).toBe(18.1);
    expect(formatted[0].humidity).toBe(59);
  });
});
