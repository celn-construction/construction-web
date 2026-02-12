import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrganizationStore {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
}

const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),
    }),
    {
      name: "organization-storage",
    }
  )
);

export const useActiveOrganizationId = () =>
  useOrganizationStore((state) => state.activeOrganizationId);

export const useSetActiveOrganization = () =>
  useOrganizationStore((state) => state.setActiveOrganizationId);

export default useOrganizationStore;
