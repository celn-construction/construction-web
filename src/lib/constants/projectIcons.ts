export const VALID_PROJECT_ICONS = [
  'building',
  'buildingApartment',
  'buildingOffice',
  'buildings',
  'airTrafficControl',
  'barn',
  'blueprint',
  'city',
  'factory',
  'garage',
  'hospital',
  'house',
  'houseLine',
  'houseSimple',
  'lighthouse',
  'storefront',
  'warehouse',
  'windmill',
  'bulldozer',
] as const;

export type ProjectIcon = (typeof VALID_PROJECT_ICONS)[number];
