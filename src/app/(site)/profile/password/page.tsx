"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { member } from "@/lib/api/member";
import { errorMessage, fieldError } from "@/lib/api/errors";
import { AuthGuard } from "@/components/layout/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { Field } from "@/components/form/field";
import { PasswordInput } from "@/components/form/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as v from "@/lib/validate";
import { useTouched } from "@/hooks/use-touched";

export default function ChangePasswordPage() {
  return (
    <AuthGuard>
      <ChangePassword />
    </AuthGuard>
  );
}

function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<unknown>(null);
  const { touch, show } = useTouched();
  const errors = {
    current_password: v.password(current, 1),
    password: v.password(next) ?? (next === current ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" : undefined),
    password_confirmation: v.passwordMatch(next, confirm),
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    touch("current_password", "password", "password_confirmation");
    if (v.firstError(errors)) return;
    setBusy(true);
    setErr(null);
    try {
      await member.changePassword(current, next, confirm);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      router.replace("/profile");
    } catch (e) {
      setErr(e);
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <PageHeader title="เปลี่ยนรหัสผ่าน" />
      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
            <Field id="current_password" label="รหัสผ่านปัจจุบัน" error={show("current_password", errors.current_password) ?? fieldError(err, "current_password")}>
              <PasswordInput
                id="current_password"
                name="current_password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                onBlur={() => touch("current_password")}
                aria-invalid={show("current_password", errors.current_password) ? true : undefined}
              />
            </Field>
            <Field id="password" label="รหัสผ่านใหม่" error={show("password", errors.password) ?? fieldError(err, "password")}>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                onBlur={() => touch("password")}
                aria-invalid={show("password", errors.password) ? true : undefined}
              />
            </Field>
            <Field id="password_confirmation" label="ยืนยันรหัสผ่านใหม่" error={show("password_confirmation", errors.password_confirmation) ?? fieldError(err, "password_confirmation")}>
              <PasswordInput
                id="password_confirmation"
                name="password_confirmation"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => touch("password_confirmation")}
                aria-invalid={show("password_confirmation", errors.password_confirmation) ? true : undefined}
              />
            </Field>
            <Button type="submit" size="lg" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              เปลี่ยนรหัสผ่าน
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
