// Smart-default names suggested when an admin adds a new submittal/inspection
// slot. Used only as a starting value — admins rename freely. Order is the
// natural fill order from the most common to the more specialized.

import type { SlotKind } from "@/lib/validations/gantt";

export const SLOT_NAME_LIBRARY: Record<SlotKind, readonly string[]> = {
  submittal: [
    "Shop Drawing",
    "Product Data",
    "Material Sample",
    "Color Sample",
    "Material Certification",
    "Equipment Cut Sheet",
    "Mockup",
    "Coordination Drawing",
    "Test Report",
    "Safety Data Sheet",
    "Fabrication Drawing",
    "Hardware Schedule",
  ],
  inspection: [
    "Foundation Inspection",
    "Framing Inspection",
    "Rough-in Electrical",
    "Rough-in Plumbing",
    "Insulation Inspection",
    "Fire-stopping Inspection",
    "Drywall Pre-cover",
    "Final Inspection",
  ],
};

/**
 * Returns the next unused suggestion from the library, or `null` when every
 * suggestion is already taken (caller should fall back to "Slot N" or leave
 * the field empty for the admin to fill in).
 */
export function nextSuggestedSlotName(
  kind: SlotKind,
  existingNames: ReadonlyArray<string | null>,
): string | null {
  const taken = new Set(
    existingNames.filter((n): n is string => !!n).map((n) => n.toLowerCase().trim()),
  );
  for (const candidate of SLOT_NAME_LIBRARY[kind]) {
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return null;
}
