import { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ | Secured Tampa",
  description: "Frequently asked questions about Secured Tampa — shipping, returns, authenticity, and more.",
};

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 3–5 business days. Orders are processed within 1–2 business days before shipping.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes — free standard shipping on all orders over $200. Orders under $200 ship for a flat $10.",
      },
      {
        q: "Can I pick up my order locally?",
        a: "Yes. We offer free local pickup at our Tampa location. Select \"Store Pickup\" at checkout and we'll notify you when your order is ready.",
      },
      {
        q: "How do I track my order?",
        a: "You'll receive an email with tracking information once your order ships. You can also check your order status anytime on our Track Order page.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently we ship to all 50 US states. International shipping may be available in the future.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 7 days of delivery. Items must be in original, unworn condition with all tags attached.",
      },
      {
        q: "Can I return worn sneakers?",
        a: "No. Sneakers must be unworn and in original condition. Any signs of wear will result in the return being declined.",
      },
      {
        q: "Can I return Pokémon cards?",
        a: "Pokémon cards and sealed collectibles are final sale unless they arrive damaged or not as described.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3–5 business days of receiving your return, issued to the original payment method.",
      },
    ],
  },
  {
    category: "Products & Authenticity",
    questions: [
      {
        q: "Are all your products authentic?",
        a: "Every item we sell is guaranteed 100% authentic. We verify each product before listing. If you ever receive an inauthentic item, we'll provide a full refund — no questions asked.",
      },
      {
        q: "Do you sell used sneakers?",
        a: "Yes. We carry both new and gently used sneakers. Condition is clearly listed on each product.",
      },
      {
        q: "What condition are used sneakers in?",
        a: "All used sneakers are inspected and graded. We only sell pairs in good to excellent condition, and any flaws are noted in the description.",
      },
      {
        q: "What Pokémon products do you carry?",
        a: "Raw singles, graded cards (PSA, BGS, CGC), and sealed product — from modern sets to vintage collectibles.",
      },
    ],
  },
  {
    category: "Account & Payment",
    questions: [
      {
        q: "Do I need an account to purchase?",
        a: "No. You can check out as a guest. Creating an account lets you track orders and save your info for faster checkout.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, Amex, Discover) and Apple Pay / Google Pay through our secure checkout.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed securely through Stripe. We never store your full card details on our servers.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Quick answers to the most common questions.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {faqs.map((section) => (
          <div key={section.category} className="rounded-2xl border bg-card overflow-hidden">
            <div className="border-b bg-muted/30 px-6 py-4">
              <h2 className="text-lg font-semibold">{section.category}</h2>
            </div>
            <div className="divide-y">
              {section.questions.map((faq, i) => (
                <div key={i} className="px-6 py-5">
                  <h3 className="font-medium text-sm">{faq.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold">Still have questions?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We're happy to help. Reach out anytime.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Contact Us
          </Link>
          <a
            href="mailto:securedtampa.llc@gmail.com"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            securedtampa.llc@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
