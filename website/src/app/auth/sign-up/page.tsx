"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpSchema, type SignUpFormValues } from "@/lib/validators";
import { signUp } from "@/actions/auth";
import { Loader2, CheckCircle, Eye, EyeOff, ArrowRight, Shield, Truck, Sparkles, AlertCircle, Flame, Star, Gift } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SignUpPage() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setLoading(true);
    setServerError("");
    const result = await signUp(
      data.email,
      data.password,
      data.firstName,
      data.lastName
    );
    if (result.error) {
      setServerError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="rounded-2xl border bg-card p-8 shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10"
            >
              <CheckCircle className="h-10 w-10 text-green-500" />
            </motion.div>
            <h1 className="mt-6 text-2xl font-bold">Check Your Email</h1>
            <p className="mt-3 text-muted-foreground">
              We&apos;ve sent a verification link to your email. Click it to verify
              your account, then sign in.
            </p>
            <Button asChild size="lg" className="mt-8 w-full">
              <Link href="/auth/sign-in">
                Continue to Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="w-full max-w-md"
        >
          <motion.div variants={fadeIn} className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-black tracking-tight">
                <span className="text-primary">S</span>
                <span className="text-foreground">ECURED</span>
              </span>
            </Link>
            <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-muted-foreground">
              Join the Secured Tampa community
            </p>
          </motion.div>

          <motion.div
            variants={fadeIn}
            className="rounded-2xl border bg-card p-6 sm:p-8 shadow-lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John"
                    className="h-12"
                    {...register("firstName")} 
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe"
                    className="h-12"
                    {...register("lastName")} 
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    className="h-12 pr-12"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Create Account
                </Button>
              </motion.div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/sign-in" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={fadeIn} className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <span>Order tracking</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Decorative (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-background to-orange-500/10 relative overflow-hidden">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20"
        >
          <Flame className="w-20 h-20 text-orange-500/30" />
        </motion.div>
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-32 right-20 text-7xl"
        >
          ⭐
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-center">
            <p className="text-6xl">🎁</p>
            <p className="mt-4 text-2xl font-bold text-muted-foreground/50">
              Member Benefits
            </p>
            <p className="mt-2 text-muted-foreground/40 max-w-xs">
              Early access to drops, order history, wishlists, and exclusive deals
            </p>
          </div>
        </motion.div>

        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
      </div>
    </div>
  );
}
