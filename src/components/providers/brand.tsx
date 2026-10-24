"use client";
import * as React from "react";

export type BrandInfo = { name: string; logo: string | null };

const BrandContext = React.createContext<BrandInfo>({ name: "", logo: null });

/** ชื่อเว็บ + โลโก้จาก /site/branding ที่ server ดึงมาแล้วส่งให้ client component */
export function BrandProvider({ value, children }: { value: BrandInfo; children: React.ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export const useBrand = () => React.useContext(BrandContext);
