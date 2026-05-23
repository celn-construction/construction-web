import type { ProjectTemplate, Prisma } from "../../../../generated/prisma";
import { RESIDENTIAL_TASKS } from "@/lib/templates/residential";

export interface TemplateProjectConfig {
  calendarId: string;
  hoursPerDay: number;
  daysPerWeek: number;
  daysPerMonth: number;
  calendars?: Prisma.JsonValue | null;
}

export interface TemplateTask {
  /** Stable key used to reference this task as a parent of others. */
  key: string;
  /** Display name. */
  name: string;
  /** Key of the parent task, if this is a child. */
  parentKey?: string;
  /** Duration in days. Required for leaf tasks; optional for parents (Bryntum rolls up). */
  duration?: number;
  durationUnit?: string;
  /** Days from project anchor to this task's startDate. Required on leaves. */
  startOffsetDays?: number;
  /** CSI MasterFormat code, e.g. "03 30 00". */
  csiCode?: string;
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

const BLANK_TEMPLATE: TemplateData = {
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

const RESIDENTIAL_TEMPLATE: TemplateData = {
  project: {
    calendarId: "general",
    hoursPerDay: 24,
    daysPerWeek: 5,
    daysPerMonth: 20,
    calendars: null,
  },
  resources: [],
  tasks: RESIDENTIAL_TASKS,
};

/**
 * Get template configuration and seed data for a given project template
 */
export function getTemplateData(template: ProjectTemplate): TemplateData {
  switch (template) {
    case "BLANK":
      return BLANK_TEMPLATE;
    case "RESIDENTIAL":
      return RESIDENTIAL_TEMPLATE;
    default:
      // Fallback to BLANK template
      return BLANK_TEMPLATE;
  }
}
