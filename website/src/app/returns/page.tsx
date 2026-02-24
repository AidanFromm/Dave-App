import { Metadata } from "next";
import { Shield, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Return Policy | Secured Tampa",
  description: "All sales are final at Secured Tampa. Authenticity guaranteed.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "#002244" }}>
          Return Policy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We stand behind the authenticity of every item we sell.
        </p>
      </div>

      {/* All Sales Final */}
      <div
        className="mt-12 rounded-2xl border-2 p-8 sm:p-10 text-center"
        style={{ borderColor: "#FB4F14", backgroundColor: "rgba(251, 79, 20, 0.05)" }}
      >
        <AlertCircle className="mx-auto h-10 w-10" style={{ color: "#FB4F14" }} />
        <h2 className="mt-4 text-2xl font-bold" style={{ color: "#002244" }}>
          All Sales Are Final
        </h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
          Due to the nature of our products, all purchases are final. We do not accept returns, 
          exchanges, or offer refunds on any orders.
        </p>
      </div>

      {/* Authenticity Guarantee */}
      <div
        className="mt-8 rounded-2xl border-2 p-8 sm:p-10"
        style={{ borderColor: "#002244", backgroundColor: "rgba(0, 34, 68, 0.05)" }}
      >
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7" style={{ color: "#002244" }} />
          <h2 className="text-xl font-bold" style={{ color: "#002244" }}>
            Authenticity Guarantee
          </h2>
        </div>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Every item we sell is guaranteed 100% authentic. If you believe you received an 
          inauthentic item, contact us immediately. We will provide a <strong>full refund</strong> — 
          no questions asked.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Authenticity claims must include photos and be submitted within 7 days of delivery.
        </p>
      </div>

      {/* Contact */}
      <div className="mt-12 rounded-2xl border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold" style={{ color: "#002244" }}>
          Questions or Concerns?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Reach out to us anytime and we&apos;ll be happy to help.
        </p>
        <a
          href="mailto:securedtampa.llc@gmail.com"
          className="mt-4 inline-block text-sm font-semibold hover:underline"
          style={{ color: "#FB4F14" }}
        >
          securedtampa.llc@gmail.com
        </a>
      </div>
    </div>
  );
}
