"use client";
import * as React from "react";

/** เก็บว่าช่องไหนถูกแตะ/ส่งแล้ว เพื่อแสดง error เมื่อผู้ใช้ทำเสร็จช่องนั้นเท่านั้น */
export function useTouched() {
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const touch = React.useCallback((...keys: string[]) => setTouched((t) => ({ ...t, ...Object.fromEntries(keys.map((k) => [k, true])) })), []);
  const reset = React.useCallback(() => setTouched({}), []);
  return { touched, touch, reset, show: <T,>(key: string, msg: T) => (touched[key] ? msg : undefined) };
}
