"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutProgressProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { number: 1, label: "Shipping" },
  { number: 2, label: "Payment" },
  { number: 3, label: "Confirmation" },
];

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;

        return (
          <div key={step.number} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium hidden sm:inline",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {isCurrent && (
                <span className="text-xs font-medium text-foreground sm:hidden">
                  {step.label}
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  step.number < currentStep ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
