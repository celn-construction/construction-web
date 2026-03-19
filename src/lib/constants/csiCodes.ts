export interface CsiDivision {
  code: string;
  name: string;
}

export const CSI_DIVISIONS: CsiDivision[] = [
  { code: "00", name: "Procurement and Contracting Requirements" },
  { code: "01", name: "General Requirements" },
  { code: "02", name: "Existing Conditions" },
  { code: "03", name: "Concrete" },
  { code: "04", name: "Masonry" },
  { code: "05", name: "Metals" },
  { code: "06", name: "Wood, Plastics, and Composites" },
  { code: "07", name: "Thermal and Moisture Protection" },
  { code: "08", name: "Openings" },
  { code: "09", name: "Finishes" },
  { code: "10", name: "Specialties" },
  { code: "11", name: "Equipment" },
  { code: "12", name: "Furnishings" },
  { code: "13", name: "Special Construction" },
  { code: "14", name: "Conveying Equipment" },
  { code: "21", name: "Fire Suppression" },
  { code: "22", name: "Plumbing" },
  { code: "23", name: "Heating, Ventilating, and Air Conditioning (HVAC)" },
  { code: "25", name: "Integrated Automation" },
  { code: "26", name: "Electrical" },
  { code: "27", name: "Communications" },
  { code: "28", name: "Electronic Safety and Security" },
  { code: "31", name: "Earthwork" },
  { code: "32", name: "Exterior Improvements" },
  { code: "33", name: "Utilities" },
  { code: "34", name: "Transportation" },
  { code: "35", name: "Waterway and Marine Construction" },
  { code: "40", name: "Process Interconnections" },
  { code: "41", name: "Material Processing and Handling Equipment" },
  { code: "42", name: "Process Heating, Cooling, and Drying Equipment" },
  { code: "43", name: "Process Gas and Liquid Handling, Purification, and Storage Equipment" },
  { code: "44", name: "Pollution and Waste Control Equipment" },
  { code: "45", name: "Industry-Specific Manufacturing Equipment" },
  { code: "46", name: "Water and Wastewater Equipment" },
  { code: "48", name: "Electrical Power Generation" },
];

export const CSI_DIVISION_MAP = new Map(
  CSI_DIVISIONS.map((d) => [d.code, d]),
);

export function formatCsiCode(code: string): string {
  const division = CSI_DIVISION_MAP.get(code);
  return division ? `${code} - ${division.name}` : code;
}
