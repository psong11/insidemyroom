import { unstable_cache } from "next/cache";
import { fetchAllCSVData } from "./google-drive";
import { parseCSV, mergeReadings, computeStats } from "./csv-parser";

/** Serialized reading (cache-safe — no Date objects). */
export interface SerializedReading {
  timestamp: string;
  temperature: number;
  humidity: number;
}

/** Serialized stats (cache-safe — no Date objects). */
export interface SerializedStats {
  currentTemperature: number;
  currentHumidity: number;
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  totalReadings: number;
  lastUpdated: string;
}

/**
 * Fetch, parse, and cache all weather data from Google Drive.
 * Returns already-serialized data (ISO strings for dates) so it
 * survives the JSON round-trip through unstable_cache.
 * Revalidates every 30 minutes (1800 seconds).
 */
export const getWeatherData = unstable_cache(
  async (): Promise<{
    readings: SerializedReading[];
    stats: SerializedStats | null;
  }> => {
    try {
      const csvContents = await fetchAllCSVData();
      const parsed = csvContents.map((csv) => parseCSV(csv));
      const readings = mergeReadings(parsed);
      const stats = computeStats(readings);

      // Serialize immediately — Date objects don't survive JSON caching
      const serializedReadings: SerializedReading[] = readings.map((r) => ({
        timestamp: r.timestamp.toISOString(),
        temperature: r.temperature,
        humidity: r.humidity,
      }));

      const serializedStats: SerializedStats | null = stats
        ? {
            ...stats,
            lastUpdated: stats.lastUpdated.toISOString(),
          }
        : null;

      return { readings: serializedReadings, stats: serializedStats };
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      return { readings: [], stats: null };
    }
  },
  ["weather-data"],
  { revalidate: 1800 } // 30 minutes
);
