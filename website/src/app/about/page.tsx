import { Metadata } from "next";
import { Shield, Heart, Zap, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Secured Tampa",
  description: "Learn about Secured Tampa - Tampa's premier destination for authentic sneakers and Pokémon cards.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">About Secured Tampa</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Tampa's trusted source for authentic sneakers and collectibles
      </p>

      {/* Values */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <Shield className="h-10 w-10 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">100% Authentic</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Every item is carefully verified before listing. We guarantee authenticity on every sale.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <Heart className="h-10 w-10 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Collector-First</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We're collectors ourselves. We understand the importance of condition and authenticity.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <Zap className="h-10 w-10 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Fast & Secure</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Quick processing, secure packaging, and reliable shipping on every order.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <MapPin className="h-10 w-10 text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Local Tampa Shop</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Based in Tampa, FL. Local pickup available for customers in the area.
          </p>
        </div>
      </div>

      <div className="mt-12 prose prose-neutral dark:prose-invert max-w-none">
        <h2>Our Story</h2>
        <p>
          Secured Tampa started with a simple mission: make it easy for sneaker and card collectors 
          to find authentic products they can trust. As collectors ourselves, we know how frustrating 
          it can be to worry about authenticity when buying online.
        </p>
        <p>
          That's why we personally verify every item we sell. When you shop with Secured Tampa, 
          you can buy with confidence knowing you're getting the real deal.
        </p>

        <h2>What We Sell</h2>
        <ul>
          <li><strong>Sneakers:</strong> Jordan, Nike, Yeezy, New Balance, and more. New and gently used.</li>
          <li><strong>Pokémon Cards:</strong> Singles, sealed product, and graded cards (PSA, BGS, CGC).</li>
        </ul>

        <h2>Our Guarantee</h2>
        <p>
          Every item sold by Secured Tampa is guaranteed 100% authentic. If you ever have concerns 
          about an item's authenticity, contact us and we'll make it right – no questions asked.
        </p>

        <h2>Contact Us</h2>
        <p>
          Have questions? We'd love to hear from you.
        </p>
        <ul>
          <li><strong>Email:</strong> securedtampa.llc@gmail.com</li>
          <li><strong>Location:</strong> Tampa, FL</li>
          <li><strong>Instagram:</strong> @securedtampa</li>
        </ul>
      </div>
    </div>
  );
}
