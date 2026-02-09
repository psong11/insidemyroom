import { WeatherReading, WeatherStats } from "./types";

/**
 * Parse a single raw CSV string from the Pi weather station.
 *
 * Actual format (comma-separated, no header row):
 *   2026-02-08 12:00:21,Humidity: 59.00%  Temp: 18.10C
 */
export function parseCSV(raw: string): WeatherReading[] {
  // Normalize line endings (\r\n -> \n)
  const lines = raw.replace(/\r\n/g, "\n").trim().split("\n");
  const readings: WeatherReading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row if present
    if (line.toLowerCase().startsWith("timestamp")) continue;

    // Split on the FIRST comma only (timestamp may not contain commas,
    // but the raw data portion shouldn't either)
    const commaIndex = line.indexOf(",");
    if (commaIndex === -1) continue;

    const timestampStr = line.substring(0, commaIndex).trim();
    const rawData = line.substring(commaIndex + 1).trim();

    // Parse timestamp
    const timestamp = new Date(timestampStr);
    if (isNaN(timestamp.getTime())) continue;

    // Extract humidity: "Humidity: 59.00%"
    const humidityMatch = rawData.match(/Humidity:\s*([\d.]+)%/i);
    // Extract temperature: "Temp: 18.10C"
    const tempMatch = rawData.match(/Temp:\s*([\d.]+)C/i);

    if (!humidityMatch || !tempMatch) continue;

    const humidity = parseFloat(humidityMatch[1]);
    const temperature = parseFloat(tempMatch[1]);

    if (isNaN(humidity) || isNaN(temperature)) continue;

    readings.push({ timestamp, temperature, humidity });
  }

  return readings;
}

/**
 * Merge and deduplicate readings from multiple CSV files,
 * sorted chronologically.
 */
export function mergeReadings(
  readingsArrays: WeatherReading[][]
): WeatherReading[] {
  const all = readingsArrays.flat();

  // Deduplicate by timestamp (keep first occurrence)
  const seen = new Set<number>();
  const unique = all.filter((r) => {
    const key = r.timestamp.getTime();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort chronologically
  unique.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return unique;
}

/**
 * Compute summary statistics from a set of readings.
 */
export function computeStats(readings: WeatherReading[]): WeatherStats | null {
  if (readings.length === 0) return null;

  const temps = readings.map((r) => r.temperature);
  const humids = readings.map((r) => r.humidity);

  const latest = readings[readings.length - 1];

  return {
    currentTemperature: latest.temperature,
    currentHumidity: latest.humidity,
    avgTemperature: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(
      1
    ),
    avgHumidity: +(
      humids.reduce((a, b) => a + b, 0) / humids.length
    ).toFixed(1),
    minTemperature: Math.min(...temps),
    maxTemperature: Math.max(...temps),
    minHumidity: Math.min(...humids),
    maxHumidity: Math.max(...humids),
    totalReadings: readings.length,
    lastUpdated: latest.timestamp,
  };
}

/**
 * Filter readings by date range.
 */
export function filterByDateRange(
  readings: WeatherReading[],
  range: "24h" | "7d" | "30d" | "all"
): WeatherReading[] {
  if (range === "all") return readings;

  const now = new Date();
  const msMap = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = new Date(now.getTime() - msMap[range]);
  return readings.filter((r) => r.timestamp >= cutoff);
}

/**
 * Format readings for Recharts (serialize dates to strings).
 */
export function formatForChart(
  readings: WeatherReading[]
): { time: string; timestamp: number; temperature: number; humidity: number }[] {
  return readings.map((r) => ({
    time: r.timestamp.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    timestamp: r.timestamp.getTime(),
    temperature: r.temperature,
    humidity: r.humidity,
  }));
}
