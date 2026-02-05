"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validators";
import { sendPasswordResetEmail } from "@/actions/auth";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    setServerError("");
    const result = await sendPasswordResetEmail(data.email);
    if (result.error) {
      setServerError(result.error);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <div className="rounded-2xl shadow-card bg-card p-6 sm:p-8">
          <span className="text-xl font-bold text-primary">SECURED</span>
          <CheckCircle className="mx-auto mt-4 h-12 w-12 text-secured-success" />
          <h1 className="mt-4 text-2xl font-bold">Email Sent</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your email for a password reset link.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/auth/sign-in">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl shadow-card bg-card p-6 sm:p-8">
        <div className="text-center">
          <span className="text-xl font-bold text-primary">SECURED</span>
          <h1 className="mt-2 text-2xl font-bold">Forgot Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/auth/sign-in"
            className="text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
