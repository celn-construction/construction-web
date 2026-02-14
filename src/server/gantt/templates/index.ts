import type { ProjectTemplate } from "@prisma/client";

export interface TemplateProjectConfig {
  calendarId: string;
  hoursPerDay: number;
  daysPerWeek: number;
  daysPerMonth: number;
  calendars?: unknown;
}

export interface TemplateTask {
  name: string;
  duration?: number;
  durationUnit?: string;
  percentDone?: number;
  expanded?: boolean;
  orderIndex?: number;
}

export interface TemplateResource {
  name: string;
  city?: string;
  calendar?: string;
}

export interface TemplateData {
  project: TemplateProjectConfig;
  tasks: TemplateTask[];
  resources: TemplateResource[];
}

/**
 * Get template configuration and seed data for a given project template
 */
export function getTemplateData(template: ProjectTemplate): TemplateData {
  switch (template) {
    case "BLANK":
      return {
        project: {
          calendarId: "general",
          hoursPerDay: 24,
          daysPerWeek: 5,
          daysPerMonth: 20,
          calendars: null,
        },
        tasks: [],
        resources: [],
      };

    // Future templates can be added here as new cases
    // Example:
    // case "RESIDENTIAL_CONSTRUCTION":
    //   return {
    //     project: { calendarId: "general", hoursPerDay: 8, ... },
    //     tasks: [
    //       { name: "Site Preparation", duration: 5, ... },
    //       { name: "Foundation", duration: 10, ... },
    //     ],
    //     resources: [
    //       { name: "Foreman", city: "New York" },
    //       { name: "Equipment", city: "New York" },
    //     ],
    //   };

    default:
      // Fallback to BLANK template
      return getTemplateData("BLANK");
  }
}
