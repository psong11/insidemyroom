"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type DateRange } from "@/lib/types";

interface ChartDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
}

interface WeatherChartsProps {
  readings: ChartDataPoint[];
}

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
];

function filterReadings(readings: ChartDataPoint[], range: DateRange) {
  if (range === "all") return readings;

  const now = new Date();
  const msMap: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = new Date(now.getTime() - msMap[range]);
  return readings.filter((r) => new Date(r.timestamp) >= cutoff);
}

function downsampleData(data: ChartDataPoint[], maxPoints: number = 200) {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

function formatTickTime(isoString: string, range: DateRange) {
  const date = new Date(isoString);
  if (range === "24h") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (range === "7d") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      hour: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; color: string; name: string }[];
  label?: string;
}) {
  if (!active || !payload || !label) return null;

  const date = new Date(label);
  const formattedDate = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-sm p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{formattedDate}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold tabular-nums text-foreground">
            {entry.value}
            {entry.name === "Temperature" ? "°C" : "%"}
          </span>
        </div>
      ))}
    </div>
  );
}

// Muted axis color that works on both dark and light backgrounds
const AXIS_COLOR = "#a1a1aa";

export function WeatherCharts({ readings }: WeatherChartsProps) {
  const [range, setRange] = useState<DateRange>("7d");
  const axisColor = AXIS_COLOR;

  const filteredData = useMemo(() => {
    const filtered = filterReadings(readings, range);
    return downsampleData(filtered);
  }, [readings, range]);

  const chartData = useMemo(
    () =>
      filteredData.map((r) => ({
        ...r,
        time: r.timestamp,
      })),
    [filteredData]
  );

  if (readings.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">
            No weather data to display yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Range:</span>
        {DATE_RANGES.map((r) => (
          <Button
            key={r.value}
            variant={range === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r.value)}
            className="h-8 px-3 text-xs"
          >
            {r.label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filteredData.length.toLocaleString()} points
        </span>
      </div>

      {/* Temperature chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            Temperature
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={axisColor}
                  opacity={0.4}
                />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) => formatTickTime(v, range)}
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}°`}
                  domain={["auto", "auto"]}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Humidity chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            Humidity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={axisColor}
                  opacity={0.4}
                />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) => formatTickTime(v, range)}
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={["auto", "auto"]}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Combined chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-5">
          <CardTitle className="text-base font-semibold">
            Combined View
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 pb-4">
          <div className="h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={axisColor}
                  opacity={0.4}
                />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) => formatTickTime(v, range)}
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                />
                <YAxis
                  yAxisId="temp"
                  stroke="#f97316"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}°`}
                  domain={["auto", "auto"]}
                  width={40}
                />
                <YAxis
                  yAxisId="humid"
                  orientation="right"
                  stroke="#3b82f6"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={["auto", "auto"]}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  yAxisId="humid"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
