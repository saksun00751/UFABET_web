"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/api/member";
import { errorMessage, fieldError } from "@/lib/api/errors";
import { useAuth } from "@/components/providers/auth";
import { Field } from "@/components/form/field";
import { PasswordInput } from "@/components/form/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { digitsOnly } from "@/lib/format";
import { site } from "@/lib/site";
import * as v from "@/lib/validate";
import { useTouched } from "@/hooks/use-touched";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh, authenticated } = useAuth();
  const [userName, setUserName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<unknown>(null);
  const { touch, show } = useTouched();
  const errors = { user_name: v.phone(userName, false), password: v.password(password, 1) };

  const next = params.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  React.useEffect(() => {
    if (authenticated) router.replace(dest);
  }, [authenticated, dest, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    touch("user_name", "password");
    if (v.firstError(errors)) return;
    setBusy(true);
    setErr(null);
    try {
      await auth.login(userName, password);
      await refresh();
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.replace(dest);
    } catch (e) {
      setErr(e);
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-5" noValidate>
      <h1 className="font-deco text-3xl font-black tracking-[0.08em] text-brand">SIGN IN</h1>

      <Field id="user_name" label="เบอร์โทรศัพท์ (ชื่อผู้ใช้)" error={show("user_name", errors.user_name) ?? fieldError(err, "user_name")}>
        <div className="relative">
          <Phone className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user_name"
            name="user_name"
            inputMode="numeric"
            autoComplete="username"
            placeholder="0812345678"
            maxLength={10}
            value={userName}
            onChange={(e) => setUserName(digitsOnly(e.target.value))}
            onBlur={() => touch("user_name")}
            aria-invalid={show("user_name", errors.user_name) ? true : undefined}
            className="pl-12"
          />
        </div>
      </Field>

      <Field id="password" label="รหัสผ่าน" error={show("password", errors.password) ?? fieldError(err, "password")}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="กรอกรหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => touch("password")}
          aria-invalid={show("password", errors.password) ? true : undefined}
        />
      </Field>

      <Button type="submit" size="lg" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        เข้าสู่ระบบ
      </Button>

      {site.registration && (
        <p className="text-center text-[15px] text-muted-foreground">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-semibold text-brand">
            สมัครสมาชิก
          </Link>
        </p>
      )}
    </form>
  );
}
