"use client";

import { Eventcalendar } from "@mobiscroll/react";
import "@mobiscroll/react/dist/css/mobiscroll.scss";
import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export default function TimelinePage() {
  // Sample timeline events
  const events = useMemo(
    () => [
      {
        start: new Date(2026, 1, 10, 8, 0),
        end: new Date(2026, 1, 12, 17, 0),
        title: "Foundation Work",
        resource: "team-1",
        color: "#3b82f6",
      },
      {
        start: new Date(2026, 1, 13, 9, 0),
        end: new Date(2026, 1, 15, 16, 0),
        title: "Framing",
        resource: "team-2",
        color: "#8b5cf6",
      },
      {
        start: new Date(2026, 1, 11, 10, 0),
        end: new Date(2026, 1, 14, 15, 0),
        title: "Electrical Rough-in",
        resource: "team-1",
        color: "#f59e0b",
      },
      {
        start: new Date(2026, 1, 16, 8, 0),
        end: new Date(2026, 1, 18, 17, 0),
        title: "Plumbing Installation",
        resource: "team-3",
        color: "#10b981",
      },
    ],
    [],
  );

  // Resources (teams/rows in timeline)
  const resources = useMemo(
    () => [
      {
        id: "team-1",
        name: "Team Alpha",
        color: "#3b82f6",
      },
      {
        id: "team-2",
        name: "Team Beta",
        color: "#8b5cf6",
      },
      {
        id: "team-3",
        name: "Team Gamma",
        color: "#10b981",
      },
    ],
    [],
  );

  // Timeline view configuration
  const view = useMemo(
    () => ({
      timeline: {
        type: "week" as const,
        startDay: 1,
        endDay: 5,
        rowHeight: "equal" as const,
      },
    }),
    [],
  );

  return (
    <LayoutWrapper>
      <style jsx global>{`
        .mbsc-timeline-row {
          height: 60px !important;
          min-height: 60px !important;
        }
        .mbsc-timeline-row-gutter {
          height: 4px !important;
        }
      `}</style>
      <div className="flex flex-col h-full bg-white dark:bg-[var(--bg-primary)]">
        {/* Timeline Component */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 overflow-hidden p-4"
        >
          <div className="h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <Eventcalendar
              data={events}
              view={view}
              resources={resources}
              theme="ios"
              themeVariant="light"
              dragToMove={true}
              dragToResize={true}
              clickToCreate={true}
              className="h-full"
            />
          </div>
        </motion.div>
      </div>
    </LayoutWrapper>
  );
}
