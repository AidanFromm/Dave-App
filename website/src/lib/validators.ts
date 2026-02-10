import { z } from "zod";

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(1, "Street address is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z
    .string()
    .min(5, "ZIP code must be at least 5 digits")
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  country: z.string().optional(),
  phone: z.string().optional(),
});

export const shippingFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  fulfillmentType: z.enum(["ship", "pickup"]),
  address: addressSchema.optional(),
  customerNotes: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  size: z.string().optional(),
  colorway: z.string().optional(),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]),
  hasBox: z.boolean(),
  price: z.number().positive("Price must be positive"),
  cost: z.number().optional(),
  compareAtPrice: z.number().optional(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  lowStockThreshold: z.number().int().min(0),
  categoryId: z.string().optional(),
  images: z.array(z.string()),
  isDrop: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  tags: z.array(z.string()),
});

export const scanFormSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  productName: z.string().min(1, "Product name is required"),
  brand: z.string().optional(),
  colorway: z.string().optional(),
  styleId: z.string().optional(),
  size: z.string().optional(),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"]),
  hasBox: z.boolean(),
  cost: z.number().min(0, "Cost must be positive"),
  price: z.number().positive("Price must be positive"),
  images: z.array(z.string()),
  productType: z.enum(["sneaker", "pokemon"]),
  stockxProductId: z.string().optional(),
  stockxVariantId: z.string().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
export type ShippingFormValues = z.infer<typeof shippingFormSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ScanFormValues = z.infer<typeof scanFormSchema>;
