import { Metadata } from "next";
import { RotateCcw, Shield, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Return Policy | Secured Tampa",
  description: "Learn about Secured Tampa's return and refund policies. 7-day returns on eligible items.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Return Policy</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We stand behind every item we sell.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-5 text-center">
          <Clock className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">7</p>
          <p className="mt-1 text-xs text-muted-foreground">Day Return Window</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 text-center">
          <RotateCcw className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">3–5</p>
          <p className="mt-1 text-xs text-muted-foreground">Days to Refund</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 text-center">
          <Shield className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">100%</p>
          <p className="mt-1 text-xs text-muted-foreground">Auth Guarantee</p>
        </div>
      </div>

      {/* Authenticity Guarantee - prominent */}
      <div className="mt-12 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Authenticity Guarantee</h2>
        </div>
        <p className="mt-3 text-muted-foreground">
          Every item we sell is guaranteed 100% authentic. If you believe you received an 
          inauthentic item, contact us immediately — full refund including shipping, 
          no questions asked.
        </p>
      </div>

      {/* Eligible vs Not Eligible */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Eligible for Return</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              Sneakers in original, unworn condition
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              All original tags and packaging included
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              Returned within 7 days of delivery
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              Items that are not as described
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Not Eligible</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              Worn or tried-on sneakers
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              Missing original tags or packaging
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              Pokémon cards and sealed collectibles
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              Items marked "Final Sale"
            </li>
          </ul>
        </div>
      </div>

      {/* Important Note */}
      <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <p className="font-semibold text-sm">Important: Sneaker Returns</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          All sneaker returns are carefully inspected. Any signs of wear — including 
          sole marks, creasing, or dirt — will result in the return being declined.
        </p>
      </div>

      {/* How It Works */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold">How to Return an Item</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", title: "Contact Us", desc: "Email with your order number and reason" },
            { step: "2", title: "Get Approval", desc: "We'll review and send return instructions" },
            { step: "3", title: "Ship It Back", desc: "Pack securely in original packaging" },
            { step: "4", title: "Get Refunded", desc: "Processed within 3–5 business days" },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border bg-card p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="mt-3 font-semibold text-sm">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refund Details */}
      <div className="mt-12 rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Refund Details</h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
            Refunds are issued to the original payment method within 3–5 business days of receiving the return.
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
            Original shipping costs are non-refundable unless the item was defective or not as described.
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
            Return shipping costs are the customer's responsibility unless the item was defective.
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
            We do not offer direct exchanges — return for a refund and place a new order.
          </div>
        </div>
      </div>

      {/* Damaged Items */}
      <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Damaged or Defective Items</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Received something damaged or defective? Contact us within 48 hours of delivery 
          with photos. We'll provide a full refund including all shipping costs.
        </p>
        <a
          href="mailto:securedtampa.llc@gmail.com"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          securedtampa.llc@gmail.com
        </a>
      </div>
    </div>
  );
}
