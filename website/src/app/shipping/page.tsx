import { Metadata } from "next";
import { Truck, Clock, MapPin, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping Policy | Secured Tampa",
  description: "Learn about Secured Tampa's shipping options, delivery times, and costs.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Shipping Policy</h1>
      <p className="mt-2 text-muted-foreground">
        Fast, secure shipping on all orders
      </p>

      {/* Quick Info Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <Truck className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Free Shipping</h3>
          <p className="text-sm text-muted-foreground">On orders over $150</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Clock className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Processing Time</h3>
          <p className="text-sm text-muted-foreground">1-2 business days</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Package className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Secure Packaging</h3>
          <p className="text-sm text-muted-foreground">Double-boxed protection</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <MapPin className="h-8 w-8 text-primary" />
          <h3 className="mt-2 font-semibold">Local Pickup</h3>
          <p className="text-sm text-muted-foreground">Available in Tampa, FL</p>
        </div>
      </div>

      <div className="mt-10 prose prose-neutral dark:prose-invert max-w-none">
        <h2>Shipping Options</h2>
        
        <h3>Standard Shipping</h3>
        <ul>
          <li><strong>Cost:</strong> $10 flat rate (FREE on orders over $150)</li>
          <li><strong>Delivery Time:</strong> 3-5 business days</li>
          <li><strong>Carrier:</strong> USPS Priority Mail or UPS Ground</li>
        </ul>

        <h3>Local Pickup (Tampa, FL)</h3>
        <ul>
          <li><strong>Cost:</strong> FREE</li>
          <li><strong>Availability:</strong> Same-day or next-day pickup</li>
          <li>Select "Store Pickup" at checkout</li>
          <li>You'll receive a notification when your order is ready</li>
        </ul>

        <h2>Processing Time</h2>
        <p>
          Orders are processed within 1-2 business days (Monday-Friday, excluding holidays). 
          Orders placed after 2 PM EST may be processed the next business day.
        </p>

        <h2>Order Tracking</h2>
        <p>
          Once your order ships, you'll receive an email with tracking information. You can also 
          track your order anytime at <a href="/orders/lookup" className="text-primary hover:underline">Track Order</a>.
        </p>

        <h2>Shipping Destinations</h2>
        <p>
          We currently ship to all 50 US states. International shipping is not available at this time.
        </p>

        <h2>Packaging</h2>
        <p>
          All sneakers are double-boxed to ensure they arrive in perfect condition. Pokémon cards 
          are shipped in protective sleeves with cardboard backing.
        </p>

        <h2>Delivery Issues</h2>
        <p>
          If your package is lost, damaged, or significantly delayed, please contact us within 
          7 days of the expected delivery date at securedtampa.llc@gmail.com and we'll work to 
          resolve the issue.
        </p>

        <h2>Questions?</h2>
        <p>
          Contact us at securedtampa.llc@gmail.com for any shipping-related questions.
        </p>
      </div>
    </div>
  );
}
