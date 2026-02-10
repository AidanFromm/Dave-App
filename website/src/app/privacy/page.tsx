import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: February 10, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <p className="mt-2">
            When you visit or make a purchase on securedtampa.com, we collect the following information:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Name, email address, and phone number</li>
            <li>Shipping and billing address</li>
            <li>Payment information (processed securely by Stripe — we never store card numbers)</li>
            <li>Order history and preferences</li>
            <li>Device and browser information via cookies and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Provide customer support</li>
            <li>Notify you about new drops and promotions (with your consent)</li>
            <li>Improve our website and services</li>
            <li>Prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Cookies</h2>
          <p className="mt-2">
            We use essential cookies to operate the site (e.g., cart, authentication) and analytics
            cookies to understand how visitors use our site. You can disable cookies in your browser
            settings, but some site features may not function properly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Payment Processing</h2>
          <p className="mt-2">
            All payments are processed by Stripe, Inc. Your payment card details are sent directly to
            Stripe's secure servers and are never stored on our systems. Please review{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe's Privacy Policy
            </a>{" "}
            for more information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Data Sharing</h2>
          <p className="mt-2">
            We do not sell your personal information. We share data only with:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Payment processors (Stripe) to complete transactions</li>
            <li>Shipping carriers to deliver your orders</li>
            <li>Analytics providers to improve our services</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Data Security</h2>
          <p className="mt-2">
            We implement industry-standard security measures including SSL encryption, secure
            authentication, and regular security reviews to protect your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your personal data at any time
            by contacting us. Florida residents may have additional rights under applicable state law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Children's Privacy</h2>
          <p className="mt-2">
            Our site is not intended for children under 13. We do not knowingly collect personal
            information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Contact Us</h2>
          <p className="mt-2">
            For privacy-related questions, contact us at{" "}
            <a href="mailto:support@securedtampa.com" className="text-primary hover:underline">
              support@securedtampa.com
            </a>{" "}
            or visit us in Tampa, FL.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t pt-6">
        <Link href="/terms" className="text-sm text-primary hover:underline">
          ← Terms of Service
        </Link>
      </div>
    </div>
  );
}
