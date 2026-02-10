import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Secured Tampa",
  description: "Learn how Secured Tampa collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>

      <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Secured Tampa LLC ("we," "us," or "our") operates securedtampa.com. This Privacy Policy 
          explains how we collect, use, disclose, and safeguard your information when you visit our 
          website or make a purchase.
        </p>

        <h2>Information We Collect</h2>
        <h3>Personal Information</h3>
        <p>When you make a purchase or create an account, we may collect:</p>
        <ul>
          <li>Name and contact information (email, phone, address)</li>
          <li>Billing and shipping addresses</li>
          <li>Payment information (processed securely via Stripe)</li>
          <li>Order history and preferences</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <p>When you visit our site, we automatically collect:</p>
        <ul>
          <li>Device and browser information</li>
          <li>IP address and location data</li>
          <li>Pages visited and time spent on site</li>
          <li>Referring website information</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Process and fulfill your orders</li>
          <li>Send order confirmations and shipping updates</li>
          <li>Respond to customer service requests</li>
          <li>Send promotional emails (with your consent)</li>
          <li>Improve our website and services</li>
          <li>Prevent fraud and unauthorized transactions</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>We do not sell your personal information. We may share your data with:</p>
        <ul>
          <li><strong>Service Providers:</strong> Payment processors (Stripe), shipping carriers, email services</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your information. All payment 
          data is encrypted and processed through Stripe's secure payment infrastructure. However, 
          no method of transmission over the Internet is 100% secure.
        </p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access, update, or delete your personal information</li>
          <li>Opt-out of marketing communications</li>
          <li>Request a copy of your data</li>
        </ul>
        <p>
          To exercise these rights, contact us at securedtampa.llc@gmail.com
        </p>

        <h2>Cookies</h2>
        <p>
          We use cookies to improve your browsing experience, remember your preferences, and 
          analyze site traffic. You can control cookies through your browser settings.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          Our website is not intended for children under 13. We do not knowingly collect 
          information from children under 13.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this 
          page with an updated revision date.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at:
        </p>
        <ul>
          <li>Email: securedtampa.llc@gmail.com</li>
          <li>Location: Tampa, FL</li>
        </ul>
      </div>
    </div>
  );
}
