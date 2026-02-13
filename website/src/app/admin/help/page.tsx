"use client";

import Link from "next/link";
import {
  ArrowLeft,
  LogIn,
  Package,
  ClipboardList,
  ShoppingCart,
  Users,
  UserCog,
  Monitor,
  Tablet,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SECTIONS = [
  {
    id: "getting-started",
    icon: LogIn,
    title: "Getting Started",
    content: `
### Logging In
1. Navigate to securedtampa.com/admin/login
2. Enter your admin email and password
3. If you are a staff member, use the credentials provided by your manager

### Navigating the Dashboard
- The admin dashboard is your home base. It displays key metrics: today's revenue, pending orders, low-stock alerts, and recent activity.
- Use the sidebar navigation to access different sections: Products, Orders, Customers, Staff, Reports, and Settings.
- The top bar shows notifications and your account menu.

### Quick Actions
- From the dashboard, you can quickly create a new product, process a pending order, or view today's sales.
    `,
  },
  {
    id: "managing-products",
    icon: Package,
    title: "Managing Products",
    content: `
### Adding Sneakers
1. Go to Products > New Product
2. Select category "Sneakers"
3. Fill in: Name, Brand, SKU, Description, Price, Condition (New/Used)
4. Upload product images (up to 8). The first image is the main display image.
5. Add size variants: click "Add Variant" for each available size. Set size, price, condition, and quantity for each.
6. Set status to "Active" to publish, or "Draft" to save without publishing.

### Adding Pokemon Cards
1. Go to Products > New Product or use the dedicated Pokemon section
2. Select the appropriate category:
   - **Raw Cards** — ungraded singles. Enter card name, set, year, condition notes.
   - **Graded Cards** — PSA/BGS/CGC graded. Enter grade, certification number, grading company.
   - **Sealed Product** — booster boxes, ETBs, packs. Enter product type, set name, quantity.
3. Upload clear photos of front and back (for singles) or product packaging (for sealed).

### Barcode Scanning
- On the Products page or when adding a new product, click the barcode icon or go to Admin > Scan.
- Use your device camera to scan UPC/EAN barcodes.
- If the barcode matches an existing product, it will pull up that product for editing.
- If it is a new barcode, it will pre-fill available data and let you complete the listing.

### Editing and Deleting
- Click any product to view its detail page. Click "Edit" to modify.
- To deactivate a product without deleting, change its status to "Draft" or "Archived."
    `,
  },
  {
    id: "processing-orders",
    icon: ClipboardList,
    title: "Processing Orders",
    content: `
### Order Lifecycle
Orders move through the following stages:
1. **New** — Customer has placed the order and payment is confirmed.
2. **Approved** — You have reviewed and confirmed the order. Inventory is reserved.
3. **Shipped** — For delivery orders: you have generated a shipping label and handed the package to the carrier.
4. **Picked Up** — For local pickup orders: the customer has collected the item in-store.
5. **Completed** — The order is finalized.
6. **Cancelled** — The order was cancelled and payment refunded.

### Approving Orders
1. Go to Orders and filter by "New" status.
2. Click an order to review items, customer info, and payment details.
3. Click "Approve Order" to confirm. This reserves inventory.

### Generating Shipping Labels
1. From an approved order, click "Create Shipping Label."
2. Verify the shipping address and package dimensions/weight.
3. Select a carrier and service level (FedEx integration is available).
4. Print the label and attach it to the package.
5. Mark the order as "Shipped." The customer receives a tracking notification.

### Refunds
1. Open the order you need to refund.
2. Click "Refund" and select full or partial refund.
3. For partial refunds, specify the amount and reason.
4. The refund is processed through Stripe and the customer is notified.
    `,
  },
  {
    id: "walk-in-purchases",
    icon: ShoppingCart,
    title: "Walk-in Purchases",
    content: `
### Buying from Customers
When a customer walks in to sell sneakers or cards:
1. Go to Admin > Buy (Walk-in Purchase).
2. Search for or create the customer's profile.
3. Add items they are selling: describe the product, condition, and your agreed purchase price.
4. Upload photos of the items for your records.
5. Select payment method (cash, Venmo, Zelle, store credit).
6. Complete the transaction. The purchase is logged and items are added to your inventory.

### Logging Transactions
- All walk-in purchases appear under Admin > Purchases.
- Each record includes: date, customer, items, price paid, payment method, and photos.
- Use this log for accounting and to track your cost basis on inventory.
    `,
  },
  {
    id: "customer-management",
    icon: Users,
    title: "Customer Management",
    content: `
### Viewing Customers
- Go to Admin > Customers to see all registered customers.
- Click a customer to view their profile, order history, and account status.

### Approving and Blocking
- New customer sign-ups may require approval depending on your settings.
- To approve a customer, find them in the pending list and click "Approve."
- To block a customer (e.g., for fraud or policy violations), open their profile and click "Block." Blocked customers cannot place new orders.

### Order History
- Each customer profile shows their complete order history, total spend, and average order value.
- Use this to identify your best customers and follow up on any issues.
    `,
  },
  {
    id: "staff-management",
    icon: UserCog,
    title: "Staff Management",
    content: `
### Adding Staff
1. Go to Admin > Staff.
2. Click "Add Staff Member."
3. Enter their name, email, phone number, and role.
4. They will receive an email invitation to set up their account.

### Roles and Permissions
- **Admin** — Full access to all features including settings, staff management, and reports.
- **Manager** — Can manage products, orders, customers, and view reports. Cannot modify settings or staff.
- **Staff** — Can process orders, use POS, and view products. Limited access to reports and settings.

### Time Clock
- Staff members can clock in and out from the Staff page.
- View time logs to track hours worked per employee.
- Export time data for payroll processing.
    `,
  },
  {
    id: "pos-system",
    icon: Monitor,
    title: "POS System",
    content: `
### In-Store Checkout
1. Navigate to the POS page (/pos).
2. Scan product barcodes or search by name to add items to the cart.
3. Apply discounts if applicable (percentage or fixed amount).
4. Select payment method: card (via Stripe terminal), cash, or split payment.
5. Complete the sale. A receipt can be printed or sent via email/SMS.

### Managing the POS Cart
- Adjust quantities directly in the cart.
- Remove items by clicking the remove button.
- Apply store-wide or item-specific discounts.
- Add tax automatically based on your configured tax rate.

### End-of-Day
- Review the day's POS transactions under Admin > Reports.
- Reconcile cash drawer against reported cash sales.
    `,
  },
  {
    id: "kiosk-mode",
    icon: Tablet,
    title: "Kiosk Mode",
    content: `
### Setting Up the Kiosk
1. On your iPad or tablet, navigate to securedtampa.com/kiosk.
2. The kiosk displays a browsing-only storefront where customers can view products, check prices, and place orders.
3. Use your browser's "Add to Home Screen" feature for a full-screen app experience.

### PIN Code Access
- The kiosk locks administrative functions behind a PIN code.
- To configure the PIN, go to Admin > Settings > Kiosk.
- Staff can enter the PIN to exit kiosk mode or access admin features from the device.

### Customer Experience
- Customers can browse the catalog, view product details, and check availability.
- Depending on your settings, they can also self-checkout or add items to a wishlist for staff to process.
    `,
  },
  {
    id: "reports-analytics",
    icon: BarChart3,
    title: "Reports and Analytics",
    content: `
### Available Reports
- **Sales Report** — Total revenue, number of orders, average order value. Filter by date range, product category, or payment method.
- **Inventory Report** — Current stock levels, low-stock alerts, inventory value at cost and retail.
- **Customer Report** — New vs. returning customers, top customers by spend, customer acquisition over time.
- **Product Performance** — Best and worst sellers, revenue by product, views vs. purchases.
- **Staff Report** — Sales by staff member, hours worked, time clock logs.

### Viewing Analytics
- Go to Admin > Analytics for visual dashboards with charts and graphs.
- Use date range filters to analyze specific periods.
- Compare periods (e.g., this month vs. last month).

### Exporting Data
- On any report page, click the "Export CSV" button to download the data.
- CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.
- Use exports for accounting, tax preparation, or deeper analysis.
    `,
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    content: `
### Store Information
- Go to Admin > Settings to update your store name, address, contact email, phone number, and business hours.
- Upload or update your store logo.

### Tax Rates
- Configure your sales tax rate (Florida state + county).
- Tax is automatically applied to all orders and POS transactions.
- You can exempt specific products or categories from tax if needed.

### Shipping Configuration
- Set up shipping zones and rates.
- Configure flat-rate, weight-based, or free shipping thresholds.
- Enable local pickup as a delivery option.
- FedEx integration: enter your FedEx API credentials under Settings > Shipping to enable live rates and label generation.

### Integrations
- **Stripe** — Payment processing for online and POS transactions. Manage your Stripe connection and webhook settings.
- **StockX** — Pull market prices for sneaker valuation and pricing guidance.
- **Clover** — If using Clover POS hardware, configure the integration here.
- **Email Notifications** — Configure which events trigger customer and admin email notifications (order confirmation, shipping updates, etc.).
    `,
  },
];

export default function AdminHelpPage() {
  return (
    <div className="min-h-screen bg-[#002244]">
      {/* Top bar */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Guide</h1>
        <p className="mt-2 text-white/60">
          Everything you need to know about managing Secured Tampa.
        </p>
      </div>

      {/* Accordion Sections */}
      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <Accordion type="multiple" className="space-y-2">
          {SECTIONS.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border border-white/10 rounded-xl bg-white/5 overflow-hidden px-0"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-white/5 transition-colors text-white">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FB4F14]/10">
                    <section.icon className="h-4.5 w-4.5 text-[#FB4F14]" />
                  </div>
                  <span className="text-base font-semibold">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white/90 prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-2 prose-p:text-white/70 prose-li:text-white/70 prose-strong:text-white/80 prose-ul:my-2 prose-ol:my-2 first:prose-headings:mt-0">
                  <FormattedContent content={section.content} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ol" | "ul" | null = null;
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <Tag key={key++} className={listType === "ol" ? "list-decimal pl-5" : "list-disc pl-5"}>
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={key++}>{trimmed.slice(4)}</h3>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={key++}>{trimmed.slice(3)}</h2>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed.startsWith("- ")) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      elements.push(
        <p key={key++} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      );
    }
  }
  flushList();

  return <>{elements}</>;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-xs">$1</code>');
}
