"use client";
import useSWR from "swr";
import * as React from "react";
import { toast } from "sonner";
import { bonus, game, member } from "@/lib/api/member";
import { pick, pickStr } from "@/lib/api/shape";
import { toNumber } from "@/lib/format";
import { errorMessage } from "@/lib/api/errors";
import { useAuth } from "@/components/providers/auth";

/** ยอดเครดิต — /member/balance (+ realtime member.balance.refresh) */
export function useBalance() {
  const { authenticated } = useAuth();
  const swr = useSWR(authenticated ? "member/balance" : null, member.balance, { refreshInterval: 30_000 });
  const balance = toNumber(pick(swr.data, ["balance", "credit", "game_balance", "amount", "total", "wallet.balance"], 0));
  const [syncing, setSyncing] = React.useState(false);

  /** ดึงยอดล่าสุดจากเกม (/member/loadbalance) */
  const sync = React.useCallback(async () => {
    setSyncing(true);
    try {
      const d = await member.loadBalance();
      await swr.mutate(d, { revalidate: false });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSyncing(false);
    }
  }, [swr]);

  return { ...swr, balance, sync, syncing };
}

export function useBonusWallet() {
  const { authenticated } = useAuth();
  return useSWR(authenticated ? "bonus/wallet" : null, bonus.wallet);
}

export function useProfile() {
  const { authenticated } = useAuth();
  return useSWR(authenticated ? "member/profile" : null, member.profile);
}

export function useOverview() {
  const { authenticated } = useAuth();
  return useSWR(authenticated ? "member/overview" : null, member.overview);
}

/** เข้าเกม UFA — POST /game/login แล้วเปิด URL ที่ได้ */
export function useGameLaunch() {
  const [launching, setLaunching] = React.useState(false);
  const launch = React.useCallback(async (opts: { newTab?: boolean } = { newTab: true }) => {
    const popup = opts.newTab ? window.open("about:blank", "_blank") : null;
    setLaunching(true);
    try {
      const d = await game.login({});
      const url = pickStr(d, ["url", "game_url", "login_url", "redirect_url", "link", "data.url"]);
      if (!url) throw new Error("NO_URL");
      if (popup) popup.location.href = url;
      else window.location.assign(url);
    } catch (e) {
      popup?.close();
      toast.error(errorMessage(e, "เข้าเกมไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setLaunching(false);
    }
  }, []);
  return { launch, launching };
}
