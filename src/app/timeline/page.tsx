"use client";

import { Eventcalendar } from "@mobiscroll/react";
import "@mobiscroll/react/dist/css/mobiscroll.scss";
import { useMemo } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { events } from "./events";
import { resources } from "./resources";

export default function TimelinePage() {
  // Timeline view configuration
  const view = useMemo(
    () => ({
      timeline: {
        type: "week" as const,
        startDay: 1,
        endDay: 5,
        rowHeight: 48,
      },
    }),
    [],
  );

  return (
    <LayoutWrapper>
      <style jsx global>{`
        .mbsc-timeline-row,
        .mbsc-timeline-resource-row,
        .mbsc-schedule-resource-row {
          height: 48px !important;
          min-height: 48px !important;
          max-height: 48px !important;
        }
        .mbsc-timeline-row-gutter {
          height: 2px !important;
        }
        .mbsc-timeline-resource {
          height: 48px !important;
          line-height: 48px !important;
        }
        .mbsc-schedule-resource {
          padding: 8px !important;
        }
        .mbsc-timeline-event,
        .mbsc-schedule-event {
          margin: 4px 0 !important;
          padding: 6px 8px !important;
        }
      `}</style>
      <div className="flex flex-col h-full bg-white dark:bg-[var(--bg-primary)]">
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
      </div>
    </LayoutWrapper>
  );
}
