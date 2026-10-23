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
        if (!key || !channelName || disposed) return;
        const { default: Pusher } = await import("pusher-js");
        const host = pickStr(cfg, ["ws_host", "host", "wsHost"]);
        const port = Number(pick(cfg, ["ws_port", "port", "wsPort"], 443));
        const forceTLS = Boolean(pick(cfg, ["force_tls", "forceTLS", "encrypted"], true));
        const client = new Pusher(key, {
          cluster: pickStr(cfg, ["cluster"], "mt1"),
          ...(host ? { wsHost: host, wsPort: port, wssPort: Number(pick(cfg, ["wss_port", "wssPort"], port)), enabledTransports: ["ws", "wss"] } : {}),
          forceTLS,
          channelAuthorization: {
            transport: "ajax",
            endpoint: "/api/member/v1/realtime/auth",
            customHandler: async ({ socketId, channelName: ch }, callback) => {
              try {
                const res = await realtime.auth(socketId, ch);
                callback(null, res as { auth: string; channel_data?: string });
              } catch (e) {
                callback(e as Error, null);
              }
            },
          },
        });
        const channel = client.subscribe(channelName);
        const eventName = pickStr(cfg, ["event", "balance_event"], "member.balance.refresh");
        const onRefresh = () => {
          mutate("member/balance");
          mutate("bonus/wallet");
        };
        channel.bind(eventName, onRefresh);
        channel.bind(`.${eventName}`, onRefresh); // Laravel Echo style
        cleanup = () => {
          channel.unbind_all();
          client.unsubscribe(channelName);
          client.disconnect();
        };
      } catch {
        // realtime ไม่พร้อม → ใช้ polling ของ SWR แทน
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [authenticated, mutate]);

  return null;
}
