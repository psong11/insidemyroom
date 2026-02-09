import { Suspense } from "react";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { DashboardHeader } from "@/components/dashboard-header";
import { WeatherCharts } from "@/components/weather-charts";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getWeatherData } from "@/lib/weather-data";

// Revalidate at the page level too (30 min)
export const revalidate = 1800;

function ChartSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-14 rounded-md" />
        ))}
      </div>
      {[1, 2].map((i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function DashboardContent() {
  const { readings, stats } = await getWeatherData();

  return (
    <>
      <DashboardHeader stats={stats} />
      <Separator className="my-6 sm:my-8 opacity-50" />
      <WeatherCharts readings={readings} />
    </>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-foreground">
              insidemyroom
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        {/* Architecture diagram - first thing on the page */}
        <ArchitectureDiagram />

        <Separator className="my-2 sm:my-4 opacity-50" />

        {/* Dashboard content with suspense boundary */}
        <section className="py-6 sm:py-8">
          <Suspense fallback={<ChartSkeleton />}>
            <DashboardContent />
          </Suspense>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs text-muted-foreground text-center">
            Data collected via Arduino Uno + DHT11 sensor, transmitted over Bluetooth to Raspberry Pi 5, synced to Google Drive every 6 hours.
          </p>
        </div>
      </footer>
    </div>
  );
}
