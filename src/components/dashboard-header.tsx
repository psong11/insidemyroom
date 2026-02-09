"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface SerializedStats {
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

function StatCard({
  title,
  value,
  unit,
  subtitle,
  accent,
}: {
  title: string;
  value: string | number;
  unit: string;
  subtitle?: string;
  accent?: "warm" | "cool" | "neutral";
}) {
  const accentColor =
    accent === "warm"
      ? "text-orange-500 dark:text-orange-400"
      : accent === "cool"
        ? "text-blue-500 dark:text-blue-400"
        : "text-foreground";

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
          {title}
        </p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${accentColor}`}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardHeader({ stats }: { stats: SerializedStats | null }) {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Inside My Room
        </h1>
        <p className="text-muted-foreground mt-2">
          No data available yet. Make sure your Google Drive credentials are configured.
        </p>
      </div>
    );
  }

  const lastUpdated = formatDistanceToNow(new Date(stats.lastUpdated), {
    addSuffix: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Inside My Room
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weather station dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdated}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Temperature"
          value={stats.currentTemperature}
          unit="°C"
          subtitle={`Range: ${stats.minTemperature}° — ${stats.maxTemperature}°`}
          accent="warm"
        />
        <StatCard
          title="Humidity"
          value={stats.currentHumidity}
          unit="%"
          subtitle={`Range: ${stats.minHumidity}% — ${stats.maxHumidity}%`}
          accent="cool"
        />
        <StatCard
          title="Avg Temp"
          value={stats.avgTemperature}
          unit="°C"
          accent="neutral"
        />
        <StatCard
          title="Avg Humidity"
          value={stats.avgHumidity}
          unit="%"
          subtitle={`${stats.totalReadings.toLocaleString()} readings`}
          accent="neutral"
        />
      </div>
    </div>
  );
}
