"use client";

import Image from "next/image";

const components = [
  {
    id: "dht11",
    label: "DHT11 Sensor",
    sublabel: "Temp & Humidity",
    image: "/images/dht11.png",
  },
  {
    id: "arduino",
    label: "Arduino Uno",
    sublabel: "Microcontroller",
    image: "/images/arduino-uno.png",
  },
  {
    id: "hc05",
    label: "HC-05",
    sublabel: "Bluetooth Module",
    image: "/images/hc05.png",
  },
  {
    id: "pi",
    label: "Raspberry Pi 5",
    sublabel: "Data Logger",
    image: "/images/raspberry-pi.png",
  },
  {
    id: "drive",
    label: "Google Drive",
    sublabel: "Cloud Storage",
    image: "/images/google-drive.png",
  },
  {
    id: "app",
    label: "Dashboard",
    sublabel: "This Web App",
    image: "/images/web-server.png",
  },
];

const connectionLabels = [
  "Analog Signal",
  "Serial Data",
  "Bluetooth",
  "rclone (every 6h)",
  "Drive API",
];

function Arrow() {
  return (
    <div className="flex flex-col items-center justify-center px-1 sm:px-2">
      <div className="hidden sm:block h-[2px] w-8 md:w-12 lg:w-16 bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/70 relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-muted-foreground/70 border-y-[4px] border-y-transparent" />
      </div>
      {/* Vertical arrow for mobile */}
      <div className="sm:hidden h-8 w-[2px] bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/70 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-t-[6px] border-t-muted-foreground/70 border-x-[4px] border-x-transparent" />
      </div>
    </div>
  );
}

function ComponentCard({
  label,
  sublabel,
  image,
  index,
}: {
  label: string;
  sublabel: string;
  image: string;
  index: number;
}) {
  return (
    <div
      className="group flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center p-3 transition-all duration-300 group-hover:shadow-md group-hover:border-border group-hover:scale-105">
        <Image
          src={image}
          alt={label}
          width={100}
          height={100}
          className="object-contain w-full h-full"
        />
      </div>
      <div className="text-center">
        <p className="text-xs sm:text-sm font-medium text-foreground">
          {label}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {sublabel}
        </p>
      </div>
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <section className="w-full py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
          System Architecture
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          End-to-end data pipeline from sensor to dashboard
        </p>
      </div>

      {/* Desktop: horizontal flow */}
      <div className="hidden sm:flex items-start justify-center gap-0">
        {components.map((comp, i) => (
          <div key={comp.id} className="flex items-start">
            <ComponentCard
              label={comp.label}
              sublabel={comp.sublabel}
              image={comp.image}
              index={i}
            />
            {i < components.length - 1 && (
              <div className="flex flex-col items-center mt-10 md:mt-12">
                <Arrow />
                <span className="text-[9px] md:text-[10px] text-muted-foreground/70 mt-1 whitespace-nowrap">
                  {connectionLabels[i]}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical flow */}
      <div className="flex sm:hidden flex-col items-center gap-0">
        {components.map((comp, i) => (
          <div key={comp.id} className="flex flex-col items-center">
            <ComponentCard
              label={comp.label}
              sublabel={comp.sublabel}
              image={comp.image}
              index={i}
            />
            {i < components.length - 1 && (
              <div className="flex flex-col items-center my-1">
                <Arrow />
                <span className="text-[10px] text-muted-foreground/70">
                  {connectionLabels[i]}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
