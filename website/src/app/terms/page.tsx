import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: February 10, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
          <p className="mt-2">
            These Terms of Service ("Terms") govern your use of the Secured Tampa website and online store
            operated by Secured Tampa, located in Tampa, Florida. By accessing or purchasing from our site,
            you agree to be bound by these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Products</h2>
          <p className="mt-2">
            Secured Tampa sells premium sneakers, streetwear, Pokémon cards, and related collectibles.
            All products are described as accurately as possible; however, we do not warrant that product
            descriptions, images, or pricing are error-free. We reserve the right to correct errors and
            cancel orders placed at incorrect prices.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Orders &amp; Payment</h2>
          <p className="mt-2">
            All payments are processed securely via Stripe. By placing an order you represent that you are
            authorized to use the payment method provided. We reserve the right to refuse or cancel any order
            for any reason, including suspected fraud.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Shipping &amp; Pickup</h2>
          <p className="mt-2">
            We offer standard shipping (3–5 business days) and local store pickup in Tampa, FL.
            Shipping costs and delivery estimates are provided at checkout. Risk of loss passes to the
            buyer upon delivery to the carrier.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Returns &amp; Exchanges</h2>
          <p className="mt-2">
            Items may be returned within 14 days of delivery in their original, unworn condition with tags
            attached. Pokémon cards and sealed collectibles are final sale unless received damaged. Refunds
            are issued to the original payment method within 5–7 business days of receiving the return.
            Shipping costs are non-refundable.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Authenticity Guarantee</h2>
          <p className="mt-2">
            All sneakers sold by Secured Tampa are guaranteed authentic. If you believe you have received
            a non-authentic item, contact us within 7 days and we will investigate and provide a full refund
            if verified.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Intellectual Property</h2>
          <p className="mt-2">
            All content on this site, including logos, text, graphics, and software, is the property of
            Secured Tampa or its licensors and is protected by copyright and trademark laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, Secured Tampa shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the site or purchase of products.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Governing Law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the State of Florida. Any disputes shall be resolved
            in the courts of Hillsborough County, Florida.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
          <p className="mt-2">
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:support@securedtampa.com" className="text-primary hover:underline">
              support@securedtampa.com
            </a>{" "}
            or visit us in Tampa, FL.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t pt-6">
        <Link href="/privacy" className="text-sm text-primary hover:underline">
          Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
