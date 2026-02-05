import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-primary">SECURED</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Premium sneakers and collectibles. Tampa, FL.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>
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
                  href="/?filter=new"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  New
                </Link>
              </li>
              <li>
                <Link
                  href="/?filter=used"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Used
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/auth/sign-in"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Sign In
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

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold">Help</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  support@securedtampa.com
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

        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Secured Tampa. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
