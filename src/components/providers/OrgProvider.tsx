"use client";

import { createContext, useContext, type ReactNode } from "react";

interface OrgContextValue {
  orgId: string;
  orgSlug: string;
  orgName: string;
  memberRole: string;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: OrgContextValue;
}) {
  return (
    <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
  );
}

export function useOrgContext(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within OrgProvider");
  }
  return context;
}
