import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | Secured Tampa",
  description: "Frequently asked questions about Secured Tampa, shipping, returns, and authenticity.",
};

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 3-5 business days. Express shipping is 1-2 business days. Orders are processed within 1-2 business days before shipping.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! Free standard shipping on all orders over $150. Orders under $150 have a flat $10 shipping rate.",
      },
      {
        q: "Can I pick up my order locally?",
        a: "Yes, we offer free local pickup in Tampa, FL. Select 'Store Pickup' at checkout and we'll notify you when your order is ready.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order ships, you'll receive an email with tracking information. You can also track your order anytime on our Track Order page.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we only ship within the United States. International shipping may be available in the future.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 7 days of delivery. Items must be in original, unworn condition with all tags attached. See our full Return Policy for details.",
      },
      {
        q: "Can I return worn sneakers?",
        a: "No, sneakers must be unworn and in original condition. Any signs of wear will result in the return being declined.",
      },
      {
        q: "Can I return Pokémon cards?",
        a: "Pokémon cards and sealed collectibles are final sale and cannot be returned, unless they are damaged or not as described.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3-5 business days of receiving your return. The refund will appear on your original payment method.",
      },
    ],
  },
  {
    category: "Products & Authenticity",
    questions: [
      {
        q: "Are all your products authentic?",
        a: "Yes! Every item we sell is guaranteed 100% authentic. We carefully verify each product before listing. If you ever receive an inauthentic item, we'll provide a full refund.",
      },
      {
        q: "Do you sell used sneakers?",
        a: "Yes, we sell both new and gently used sneakers. Product condition is clearly listed on each item.",
      },
      {
        q: "What condition are 'used' sneakers in?",
        a: "All used sneakers are carefully inspected and graded. We only sell sneakers in good to excellent condition. Any flaws are noted in the product description.",
      },
      {
        q: "Do you sell Pokémon cards?",
        a: "Yes! We sell Pokémon singles, sealed product, and graded cards (PSA, BGS, CGC).",
      },
    ],
  },
  {
    category: "Account & Payment",
    questions: [
      {
        q: "Do I need an account to purchase?",
        a: "No, you can checkout as a guest. However, creating an account allows you to track orders and save your information for faster checkout.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and Apple Pay/Google Pay through our secure checkout.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, all payments are processed securely through Stripe. We never store your full credit card information on our servers.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      <p className="mt-2 text-muted-foreground">
        Find answers to common questions below
      </p>

      <div className="mt-10 space-y-10">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-xl font-semibold border-b pb-2">{section.category}</h2>
            <div className="mt-4 space-y-6">
              {section.questions.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-medium">{faq.q}</h3>
                  <p className="mt-1 text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-muted/50 p-6 text-center">
        <h3 className="font-semibold">Still have questions?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We're here to help. Reach out to us anytime.
        </p>
        <Link 
          href="/contact" 
          className="mt-4 inline-block text-primary font-medium hover:underline"
        >
          Contact Us →
        </Link>
      </div>
    </div>
  );
}
