"use client";
import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { referralCheck, register, type BankNameResult, type RegisterPayload, type RegisterResult } from "@/lib/api/member";
import { ApiError } from "@/lib/api/client";
import { errorMessage, fieldError } from "@/lib/api/errors";
import { useAuth } from "@/components/providers/auth";
import { Field } from "@/components/form/field";
import { PasswordInput } from "@/components/form/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BankChip } from "@/components/bank-chip";
import { digitsOnly } from "@/lib/format";
import * as v from "@/lib/validate";
import { useTouched } from "@/hooks/use-touched";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh, authenticated } = useAuth();

  const banksSWR = useSWR("register/banks", register.banks, { revalidateOnFocus: false });
  const banks = banksSWR.data?.banks ?? [];

  const [step, setStep] = React.useState<Step>(1);
  const [bank, setBank] = React.useState<number | null>(null);
  const [accNo, setAccNo] = React.useState("");
  const [lookup, setLookup] = React.useState<{ state: "idle" | "loading" | "ok" | "manual"; result?: BankNameResult; msg?: string }>({ state: "idle" });
  const [firstname, setFirstname] = React.useState("");
  const [lastname, setLastname] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const initialRef = params.get("referral_code") || params.get("invite_code") || params.get("recommend_code") || "";
  const [ref, setRef] = React.useState(initialRef);
  const [refState, setRefState] = React.useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [accept, setAccept] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<unknown>(null);
  const [done, setDone] = React.useState<RegisterResult | null>(null);
  const { touch, show } = useTouched();

  React.useEffect(() => {
    if (authenticated && !done) router.replace("/");
  }, [authenticated, done, router]);

  // ตรวจชื่อบัญชีอัตโนมัติ
  const doLookup = React.useCallback(async () => {
    if (!bank || accNo.length < 10) return;
    setLookup({ state: "loading" });
    try {
      const r = await register.bankName(bank, accNo);
      if (r.lookup_succeeded && r.can_prefill) {
        setFirstname(r.firstname);
        setLastname(r.lastname);
        setLookup({ state: "ok", result: r });
      } else {
        setLookup({ state: "manual", msg: "ไม่พบชื่อบัญชีอัตโนมัติ กรุณากรอกชื่อ-นามสกุลตามบัญชี" });
      }
    } catch (e) {
      setLookup({ state: "manual", msg: errorMessage(e) });
    }
  }, [bank, accNo]);

  React.useEffect(() => {
    setLookup({ state: "idle" });
    if (bank && accNo.length >= 10) {
      const t = setTimeout(doLookup, 500);
      return () => clearTimeout(t);
    }
  }, [bank, accNo, doLookup]);

  // ตรวจรหัสแนะนำ
  React.useEffect(() => {
    if (!ref) return setRefState("idle");
    setRefState("checking");
    const t = setTimeout(async () => {
      try {
        const r = await referralCheck(ref);
        setRefState(r.valid ? "valid" : "invalid");
      } catch {
        setRefState("invalid");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [ref]);

  const payload: RegisterPayload = {
    user_name: userName,
    firstname: firstname.trim(),
    lastname: lastname.trim(),
    bank: bank ?? 0,
    acc_no: accNo,
    password,
    password_confirmation: password2,
    ...(ref ? { referral_code: ref } : {}),
  };

  const e1 = {
    bank: bank ? undefined : "กรุณาเลือกธนาคาร",
    acc_no: v.accountNo(accNo),
    firstname: v.personName(firstname, "ชื่อ"),
    lastname: v.personName(lastname, "นามสกุล"),
  };
  const e2 = {
    user_name: v.phone(userName),
    password: v.password(password),
    password_confirmation: v.passwordMatch(password, password2),
    referral_code: refState === "invalid" ? "รหัสผู้แนะนำไม่ถูกต้อง" : refState === "checking" ? "กำลังตรวจสอบรหัสผู้แนะนำ" : undefined,
  };

  function next1() {
    touch(...Object.keys(e1));
    if (!v.firstError(e1) && lookup.state !== "loading") setStep(2);
  }

  async function goReview() {
    touch(...Object.keys(e2));
    if (v.firstError(e2)) return;
    setBusy(true);
    setErr(null);
    try {
      await register.preflight(payload);
      setStep(3);
    } catch (e) {
      setErr(e);
      toast.error(errorMessage(e));
      if (e instanceof ApiError && (e.fields.bank || e.fields.acc_no || e.fields.firstname || e.fields.lastname)) setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const r = await register.submit(payload);
      setDone(r);
      await refresh();
      if (r.game_account_status === "READY") {
        toast.success("สมัครสมาชิกสำเร็จ");
        router.replace("/");
      }
    } catch (e) {
      setErr(e);
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (done && done.game_account_status === "REQUIRES_REVIEW") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-warning/15 text-warning">
          <AlertTriangle className="size-8" />
        </span>
        <h2 className="text-2xl font-semibold">สมัครสมาชิกสำเร็จ</h2>
        <p className="text-muted-foreground">
          บัญชีเกมของคุณอยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่ คุณสามารถใช้งานเว็บไซต์ได้ตามปกติ และเข้าเกมได้เมื่อได้รับการยืนยัน
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/">ไปหน้าแรก</Link>
        </Button>
      </div>
    );
  }

  const selectedBank = banks.find((b) => b.code === bank);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <h1 className="font-deco text-3xl font-black tracking-[0.08em] text-brand">REGISTER</h1>

      <ol className="grid grid-cols-3 gap-2" aria-label="ขั้นตอนการสมัคร">
        {["บัญชีธนาคาร", "เบอร์ & รหัสผ่าน", "ตรวจสอบ & ยืนยัน"].map((l, i) => (
          <li key={l} className="flex flex-col items-center gap-1 text-center" aria-current={step === i + 1 ? "step" : undefined}>
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full border border-gold-2 font-deco text-sm font-black",
                step >= i + 1 ? "bg-foil text-primary-foreground" : "text-brand",
              )}
            >
              {["I", "II", "III"][i]}
            </span>
            <span className={cn("text-xs leading-tight font-semibold", step >= i + 1 ? "text-brand" : "text-muted-foreground")}>{l}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="bank" className="text-sm font-semibold">ธนาคาร</label>
            {banksSWR.isLoading ? (
              <Skeleton className="h-13 rounded-2xl" />
            ) : banksSWR.error ? (
              <p className="text-sm text-destructive">{errorMessage(banksSWR.error)}</p>
            ) : (
              <Select
                value={bank ? String(bank) : ""}
                onValueChange={(v) => {
                  setBank(Number(v));
                  touch("bank");
                }}
              >
                <SelectTrigger id="bank" aria-label="ธนาคาร" aria-invalid={show("bank", e1.bank) ? true : undefined}>
                  <SelectValue placeholder="เลือกธนาคาร" className="min-w-0 flex-1 truncate" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.code} value={String(b.code)}>
                      <span className="flex min-w-0 items-center gap-3">
                        <BankChip shortcode={b.shortcode} className="size-10 rounded-full" />
                        <span className="truncate">{b.name_th}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(show("bank", e1.bank) ?? fieldError(err, "bank")) && (
              <p role="alert" className="text-sm text-destructive">
                {show("bank", e1.bank) ?? fieldError(err, "bank")}
              </p>
            )}
          </div>

          <Field id="acc_no" label="เลขบัญชี" error={show("acc_no", e1.acc_no) ?? fieldError(err, "acc_no")}>
            <Input
              id="acc_no"
              inputMode="numeric"
              placeholder="ตัวเลขเท่านั้น"
              maxLength={15}
              value={accNo}
              onChange={(e) => setAccNo(digitsOnly(e.target.value))}
              onBlur={() => touch("acc_no")}
              aria-invalid={show("acc_no", e1.acc_no) ? true : undefined}
              className="tracking-wider"
            />
          </Field>

          {lookup.state === "loading" && (
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> กำลังตรวจสอบชื่อบัญชี…
            </div>
          )}
          {lookup.state === "ok" && lookup.result && (
            <div className="flex items-center gap-3 rounded-2xl border border-success bg-success/10 p-4">
              <CheckCircle2 className="size-6 text-success" />
              <div>
                <div className="text-xs text-muted-foreground">พบชื่อบัญชี (กรอกให้อัตโนมัติ)</div>
                <div className="font-semibold">{lookup.result.account_name}</div>
              </div>
            </div>
          )}
          {lookup.state === "manual" && (
            <div className="flex items-start gap-3 rounded-2xl border border-warning bg-warning/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <span>{lookup.msg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field id="firstname" label="ชื่อ" error={show("firstname", e1.firstname) ?? fieldError(err, "firstname")}>
              <Input id="firstname" autoComplete="given-name" maxLength={50} value={firstname} onChange={(e) => setFirstname(e.target.value)} onBlur={() => touch("firstname")} aria-invalid={show("firstname", e1.firstname) ? true : undefined} />
            </Field>
            <Field id="lastname" label="นามสกุล" error={show("lastname", e1.lastname) ?? fieldError(err, "lastname")}>
              <Input id="lastname" autoComplete="family-name" maxLength={50} value={lastname} onChange={(e) => setLastname(e.target.value)} onBlur={() => touch("lastname")} aria-invalid={show("lastname", e1.lastname) ? true : undefined} />
            </Field>
          </div>
          <p className="-mt-2 text-sm text-muted-foreground">ชื่อ-นามสกุลต้องตรงกับบัญชีธนาคาร ใช้สำหรับการถอนเงิน</p>

          <div className="flex gap-3">
            {lookup.state === "idle" && bank && accNo.length >= 10 && (
              <Button type="button" variant="secondary" onClick={doLookup}>
                <Search /> ตรวจชื่อ
              </Button>
            )}
            <Button type="button" size="lg" className="flex-1" disabled={lookup.state === "loading"} onClick={next1}>
              ถัดไป
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-5">
          <Field id="reg_user" label="เบอร์โทรศัพท์ (ใช้เป็นชื่อผู้ใช้)" hint="ใช้เบอร์นี้ในการเข้าสู่ระบบ" error={show("user_name", e2.user_name) ?? fieldError(err, "user_name")}>
            <Input
              id="reg_user"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0812345678"
              maxLength={10}
              value={userName}
              onChange={(e) => setUserName(digitsOnly(e.target.value))}
              onBlur={() => touch("user_name")}
              aria-invalid={show("user_name", e2.user_name) ? true : undefined}
            />
          </Field>
          <Field id="reg_pw" label="รหัสผ่าน" hint="อย่างน้อย 8 ตัวอักษร" error={show("password", e2.password) ?? fieldError(err, "password")}>
            <PasswordInput
              id="reg_pw"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => touch("password")}
              aria-invalid={show("password", e2.password) ? true : undefined}
            />
          </Field>
          <Field id="reg_pw2" label="ยืนยันรหัสผ่าน" error={(password2 || show("password_confirmation", true) ? e2.password_confirmation : undefined) ?? fieldError(err, "password_confirmation")}>
            <PasswordInput
              id="reg_pw2"
              autoComplete="new-password"
              value={password2}
              aria-invalid={(password2 || show("password_confirmation", true)) && e2.password_confirmation ? true : undefined}
              onChange={(e) => setPassword2(e.target.value)}
              onBlur={() => touch("password_confirmation")}
            />
          </Field>
          <Field
            id="reg_ref"
            label={
              <>
                รหัสผู้แนะนำ <span className="font-normal text-muted-foreground">(ถ้ามี)</span>
              </>
            }
            error={refState === "invalid" ? "รหัสผู้แนะนำไม่ถูกต้อง" : fieldError(err, "referral_code")}
            hint={refState === "valid" ? "✓ รหัสผู้แนะนำใช้ได้" : undefined}
          >
            <div className="relative">
              <Input
                id="reg_ref"
                value={ref}
                maxLength={16}
                onChange={(e) => setRef(e.target.value.trim().toUpperCase())}
                className="pr-12 tracking-widest uppercase"
                aria-invalid={refState === "invalid" || undefined}
              />
              {refState === "checking" && <Loader2 className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-muted-foreground" />}
              {refState === "valid" && <CheckCircle2 className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-success" />}
            </div>
          </Field>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)}>
              <ChevronLeft /> กลับ
            </Button>
            <Button type="button" size="lg" className="flex-1" disabled={busy} onClick={goReview}>
              {busy && <Loader2 className="animate-spin" />}
              ตรวจสอบข้อมูล
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-5">
          <dl className="divide-y divide-border rounded-3xl border border-border bg-secondary/60">
            {[
              ["ธนาคาร", selectedBank ? `${selectedBank.name_th} (${selectedBank.shortcode})` : "—"],
              ["เลขบัญชี", accNo],
              ["ชื่อ-นามสกุล", `${firstname} ${lastname}`],
              ["เบอร์โทร (ชื่อผู้ใช้)", userName],
              ...(ref ? [["รหัสผู้แนะนำ", ref]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <Checkbox checked={accept} onCheckedChange={(v) => setAccept(v === true)} className="mt-0.5" />
            <span>
              ฉันมีอายุ 18 ปีขึ้นไป และยอมรับ{" "}
              <Link href="/terms" className="font-semibold text-brand">
                เงื่อนไขการใช้งาน
              </Link>
            </span>
          </label>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep(2)} disabled={busy}>
              <ChevronLeft /> แก้ไข
            </Button>
            <Button type="button" size="lg" className="flex-1" disabled={!accept || busy} onClick={submit}>
              {busy && <Loader2 className="animate-spin" />}
              ยืนยันการสมัคร
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">สมัครสำเร็จระบบจะเข้าสู่ระบบให้ทันที</p>
        </section>
      )}

      <p className="text-center text-[15px] text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
