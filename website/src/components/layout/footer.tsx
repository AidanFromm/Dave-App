import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-primary">SECURED</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Premium sneakers and collectibles. Tampa, FL.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/?filter=drops"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Drops
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Order History
                </Link>
              </li>
              <li>
                <Link
                  href="/orders/lookup"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  securedtampa.llc@gmail.com
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Tampa, FL
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Secured Tampa. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
