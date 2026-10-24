import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@/lib/site";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default function RegisterPage() {
  if (!site.registration) redirect("/login");
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
