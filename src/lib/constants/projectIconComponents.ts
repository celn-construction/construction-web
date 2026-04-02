import {
  Building,
  BuildingApartment,
  BuildingOffice,
  Buildings,
  AirTrafficControl,
  Barn,
  Blueprint,
  City,
  Factory,
  Garage,
  Hospital,
  House,
  HouseLine,
  HouseSimple,
  Lighthouse,
  Storefront,
  Warehouse,
  Windmill,
  Bulldozer,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { ProjectIcon } from './projectIcons';

export const PROJECT_ICON_OPTIONS: { id: ProjectIcon; label: string; Icon: PhosphorIcon }[] = [
  { id: 'building', label: 'Building', Icon: Building },
  { id: 'buildingApartment', label: 'Apartment', Icon: BuildingApartment },
  { id: 'buildingOffice', label: 'Office', Icon: BuildingOffice },
  { id: 'buildings', label: 'Buildings', Icon: Buildings },
  { id: 'airTrafficControl', label: 'Air Traffic Control', Icon: AirTrafficControl },
  { id: 'barn', label: 'Barn', Icon: Barn },
  { id: 'blueprint', label: 'Blueprint', Icon: Blueprint },
  { id: 'city', label: 'City', Icon: City },
  { id: 'factory', label: 'Factory', Icon: Factory },
  { id: 'garage', label: 'Garage', Icon: Garage },
  { id: 'hospital', label: 'Hospital', Icon: Hospital },
  { id: 'house', label: 'House', Icon: House },
  { id: 'houseLine', label: 'House Line', Icon: HouseLine },
  { id: 'houseSimple', label: 'House Simple', Icon: HouseSimple },
  { id: 'lighthouse', label: 'Lighthouse', Icon: Lighthouse },
  { id: 'storefront', label: 'Storefront', Icon: Storefront },
  { id: 'warehouse', label: 'Warehouse', Icon: Warehouse },
  { id: 'windmill', label: 'Windmill', Icon: Windmill },
  { id: 'bulldozer', label: 'Bulldozer', Icon: Bulldozer },
];

const ICON_MAP: Record<string, PhosphorIcon> = Object.fromEntries(
  PROJECT_ICON_OPTIONS.map(({ id, Icon }) => [id, Icon])
);

export function getProjectIcon(iconId?: string | null): PhosphorIcon {
  if (!iconId) return Building;
  return ICON_MAP[iconId] ?? Building;
}
