"use client";

import { useState, useEffect } from "react";

export function ActivityBars() {
  return (
    <div className="flex items-center gap-1">
      <div className="activity-bar w-1"></div>
      <div className="activity-bar w-1"></div>
      <div className="activity-bar w-1"></div>
    </div>
  );
}

export function SystemMetadata() {
  const [uptime, setUptime] = useState("00:00:00");

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((elapsed % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((elapsed % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
      UPTIME: {uptime}
    </span>
  );
}

