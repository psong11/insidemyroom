export interface WeatherReading {
  timestamp: Date;
  temperature: number; // Celsius
  humidity: number; // Percentage
}

export interface DailySummary {
  date: string;
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  readingCount: number;
}

export interface WeatherStats {
  currentTemperature: number;
  currentHumidity: number;
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  totalReadings: number;
  lastUpdated: Date;
}

export type DateRange = "24h" | "7d" | "30d" | "all";
