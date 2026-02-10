import { Metadata } from "next";
import { RotateCcw, Shield, Clock, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Return Policy | Secured Tampa",
  description: "Learn about Secured Tampa's return and refund policies.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Return Policy</h1>
      <p className="mt-2 text-muted-foreground">
        We want you to be completely satisfied with your purchase
      </p>

      {/* Quick Info Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <Clock className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">7-Day Returns</h3>
          <p className="text-sm text-muted-foreground">On eligible items</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Shield className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Authenticity Guarantee</h3>
          <p className="text-sm text-muted-foreground">Full refund if not authentic</p>
        </div>
      </div>

      <div className="mt-10 prose prose-neutral dark:prose-invert max-w-none">
        <h2>Return Policy Overview</h2>
        <p>
          We accept returns on most items within <strong>7 days</strong> of delivery. Items must be 
          in original, unworn condition with all tags attached.
        </p>

        <h2>Eligibility</h2>
        <h3>Returnable Items</h3>
        <ul>
          <li>Sneakers in original, unworn condition</li>
          <li>Items with all original tags and packaging</li>
          <li>Items returned within 7 days of delivery</li>
        </ul>

        <h3>Non-Returnable Items</h3>
        <ul>
          <li>Worn or tried-on sneakers (any signs of wear)</li>
          <li>Items without original tags or packaging</li>
          <li>Pokémon cards and sealed collectibles</li>
          <li>Items marked as "Final Sale"</li>
          <li>Items returned after 7 days</li>
        </ul>

        <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 my-6">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5" />
            Important Note on Sneakers
          </div>
          <p className="mt-2 text-sm mb-0">
            Sneakers must be unworn. We inspect all returns carefully. Any signs of wear, 
            including sole marks or creasing, will result in the return being declined.
          </p>
        </div>

        <h2>Authenticity Guarantee</h2>
        <p>
          All items sold by Secured Tampa are guaranteed 100% authentic. If you believe you 
          received an inauthentic item, contact us immediately. We will provide a full refund 
          including shipping costs, no questions asked.
        </p>

        <h2>How to Return</h2>
        <ol>
          <li><strong>Contact Us:</strong> Email securedtampa.llc@gmail.com with your order number and reason for return</li>
          <li><strong>Get Approval:</strong> We'll review your request and provide return instructions</li>
          <li><strong>Ship It Back:</strong> Pack the item securely in its original packaging</li>
          <li><strong>Get Refunded:</strong> Once we receive and inspect the item, we'll process your refund</li>
        </ol>

        <h2>Refund Process</h2>
        <ul>
          <li>Refunds are processed within 3-5 business days of receiving the return</li>
          <li>Refunds are issued to the original payment method</li>
          <li>Original shipping costs are non-refundable (unless the item was defective or not as described)</li>
          <li>Return shipping costs are the customer's responsibility (unless the item was defective)</li>
        </ul>

        <h2>Exchanges</h2>
        <p>
          We do not offer direct exchanges. If you need a different size or item, please return 
          your original purchase for a refund and place a new order.
        </p>

        <h2>Damaged or Defective Items</h2>
        <p>
          If you receive a damaged or defective item, contact us within 48 hours of delivery with 
          photos of the damage. We will provide a full refund including all shipping costs.
        </p>

        <h2>Questions?</h2>
        <p>
          Contact us at securedtampa.llc@gmail.com for any questions about returns or refunds.
        </p>
      </div>
    </div>
  );
}
