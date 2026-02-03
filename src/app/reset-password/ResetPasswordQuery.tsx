"use client";

import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "./ResetPasswordForm";

type ResetSearchParams = {
  token?: string;
  email?: string;
};

export default function ResetPasswordQuery({ searchParams }: { searchParams: ResetSearchParams }) {
  const clientParams = useSearchParams();
  const token = searchParams?.token ?? clientParams.get("token") ?? "";
  const email = searchParams?.email ?? clientParams.get("email") ?? "";

  if (!token || !email) {
    return <p className="text-sm text-rose-700">Enlace no válido. Solicita un nuevo email.</p>;
  }

  return <ResetPasswordForm token={token} email={email} />;
}
