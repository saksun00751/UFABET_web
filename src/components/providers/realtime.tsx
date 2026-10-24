"use client";
/**
 * WebSocket (Pusher protocol): GET /realtime/config → POST /realtime/auth
 * ฟัง event "member.balance.refresh" แล้ว revalidate ยอดเงิน
 */
import * as React from "react";
import { useSWRConfig } from "swr";
import { realtime } from "@/lib/api/member";
import { pick, pickStr } from "@/lib/api/shape";
import { useAuth } from "./auth";

const RETRY_AFTER_MS = 60_000;
const API_PREFIX = "/api/member/v1";
const DEFAULT_AUTH_PATH = `${API_PREFIX}/realtime/auth`;

/** auth endpoint จาก config — เติม prefix /api/member/v1 ให้ถ้ามาเป็น path สั้น เช่น /realtime/auth */
function resolveAuthEndpoint(raw: string): string {
  if (!raw) return DEFAULT_AUTH_PATH;
  if (/^https?:\/\//i.test(raw) || raw.startsWith(API_PREFIX)) return raw;
  return `${API_PREFIX}/${raw.replace(/^\/+/, "")}`;
}

const warn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") console.warn("[realtime]", ...args);
};

/** รับ boolean ที่อาจมาเป็น string ("false"/"0") */
function toBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "string") return !["", "0", "false", "off", "no"].includes(v.trim().toLowerCase());
  if (v === undefined || v === null) return fallback;
  return Boolean(v);
}

export function RealtimeBridge() {
  const { authenticated } = useAuth();
  const { mutate } = useSWRConfig();

  React.useEffect(() => {
    if (!authenticated) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const cfg = await realtime.config();
        const key = pickStr(cfg, ["key", "app_key", "public_key", "pusher.key"]);
        const channelName = pickStr(cfg, ["channel", "channel_name", "private_channel", "channels.0"]);
        if (!key || !channelName) {
          warn("config ไม่มี key/channel", cfg);
          return;
        }
        if (disposed) return;
        const { default: Pusher } = await import("pusher-js");
        if (disposed) return;
        const host = pickStr(cfg, ["ws_host", "host", "wsHost"]);
        const port = Number(pick(cfg, ["ws_port", "port", "wsPort"], 443));
        const forceTLS = toBool(pick(cfg, ["force_tls", "forceTLS", "encrypted"], true), true);
        const client = new Pusher(key, {
          cluster: pickStr(cfg, ["cluster"], "mt1"),
          ...(host ? { wsHost: host, wsPort: port, wssPort: Number(pick(cfg, ["wss_port", "wssPort"], port)), enabledTransports: ["ws", "wss"] } : {}),
          forceTLS,
          channelAuthorization: {
            transport: "ajax",
            endpoint: resolveAuthEndpoint(pickStr(cfg, ["auth_endpoint", "authEndpoint", "auth_url", "auth.endpoint"])),
            customHandler: async ({ socketId, channelName: ch }, callback) => {
              try {
                const res = await realtime.auth(socketId, ch);
                callback(null, res as { auth: string; channel_data?: string });
              } catch (e) {
                warn("auth ล้มเหลว", e);
                callback(e as Error, null);
              }
            },
          },
        });
        // เชื่อมไม่ได้/subscribe ไม่ผ่าน → เลิกลองใหม่ ไม่ให้ console ถูกรบกวนซ้ำๆ (ยอดเงินยังอัปเดตด้วย polling ทุก 30 วิ)
        // แต่จะลองเชื่อมใหม่เมื่อกลับมาออนไลน์/เปิดแท็บ และห่างจากครั้งก่อนอย่างน้อย 1 นาที
        let gaveUpAt = 0;
        const giveUp = () => {
          if (gaveUpAt) return;
          gaveUpAt = Date.now();
          client.disconnect();
        };
        const retry = () => {
          if (!gaveUpAt || document.visibilityState === "hidden") return;
          if (Date.now() - gaveUpAt < RETRY_AFTER_MS) return;
          gaveUpAt = 0;
          client.connect();
        };
        client.connection.bind("state_change", ({ current }: { current: string }) => {
          if (current === "connected") gaveUpAt = 0;
          if (current === "unavailable" || current === "failed") giveUp();
        });
        window.addEventListener("online", retry);
        document.addEventListener("visibilitychange", retry);
        const channel = client.subscribe(channelName);
        channel.bind("pusher:subscription_error", (err: unknown) => {
          warn("subscription error", err);
          giveUp();
        });
        const eventName = pickStr(cfg, ["event", "balance_event"], "member.balance.refresh");
        const onRefresh = () => {
          mutate("member/balance");
          mutate("bonus/wallet");
        };
        channel.bind(eventName, onRefresh);
        channel.bind(`.${eventName}`, onRefresh); // Laravel Echo style
        cleanup = () => {
          window.removeEventListener("online", retry);
          document.removeEventListener("visibilitychange", retry);
          channel.unbind_all();
          client.unsubscribe(channelName);
          client.disconnect();
        };
      } catch (e) {
        // realtime ไม่พร้อม → ใช้ polling ของ SWR แทน
        warn("เริ่มไม่สำเร็จ", e);
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [authenticated, mutate]);

  return null;
}
