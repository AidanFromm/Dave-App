import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Secured Tampa",
  description: "Terms and conditions for using Secured Tampa's website and services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>

      <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Welcome to Secured Tampa. By accessing or using our website (securedtampa.com), you agree 
          to be bound by these Terms of Service. Please read them carefully.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using our website or making a purchase, you agree to these Terms of Service and our 
          Privacy Policy. If you do not agree, please do not use our services.
        </p>

        <h2>2. Products and Authenticity</h2>
        <p>
          All sneakers and collectibles sold by Secured Tampa are guaranteed 100% authentic. We 
          carefully verify every item before listing. If you believe you have received an 
          inauthentic item, contact us immediately for a full refund.
        </p>

        <h2>3. Pricing and Payment</h2>
        <ul>
          <li>All prices are in USD and subject to change without notice</li>
          <li>Prices do not include shipping unless stated otherwise</li>
          <li>Payment is processed securely through Stripe</li>
          <li>Orders are confirmed only after successful payment</li>
        </ul>

        <h2>4. Orders and Availability</h2>
        <ul>
          <li>All orders are subject to product availability</li>
          <li>We reserve the right to limit quantities or refuse orders</li>
          <li>Order confirmation emails do not guarantee fulfillment</li>
          <li>If an item is unavailable, we will notify you and issue a full refund</li>
        </ul>

        <h2>5. Shipping</h2>
        <p>
          Please refer to our <a href="/shipping" className="text-primary hover:underline">Shipping Policy</a> for 
          detailed information about shipping methods, timeframes, and costs.
        </p>

        <h2>6. Returns and Refunds</h2>
        <p>
          Please refer to our <a href="/returns" className="text-primary hover:underline">Return Policy</a> for 
          detailed information about returns, exchanges, and refunds.
        </p>

        <h2>7. User Accounts</h2>
        <ul>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You must provide accurate and complete information</li>
          <li>You are responsible for all activity under your account</li>
          <li>We reserve the right to suspend or terminate accounts for violations</li>
        </ul>

        <h2>8. Intellectual Property</h2>
        <p>
          All content on this website, including images, text, logos, and design, is owned by 
          Secured Tampa LLC or its licensors. You may not copy, reproduce, or distribute our 
          content without written permission.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          Secured Tampa LLC shall not be liable for any indirect, incidental, special, or 
          consequential damages arising from the use of our website or products. Our total 
          liability shall not exceed the amount you paid for the product in question.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Secured Tampa LLC from any claims, damages, 
          or expenses arising from your use of our website or violation of these terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms shall be governed by the laws of the State of Florida, without regard to 
          conflict of law principles.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Changes will be posted on this 
          page. Continued use of our website after changes constitutes acceptance.
        </p>

        <h2>13. Contact</h2>
        <p>
          For questions about these Terms, contact us at:
        </p>
        <ul>
          <li>Email: securedtampa.llc@gmail.com</li>
          <li>Location: Tampa, FL</li>
        </ul>
      </div>
    </div>
  );
}
