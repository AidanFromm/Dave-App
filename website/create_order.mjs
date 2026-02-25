import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]
const srk = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]
const sb = createClient(url, srk)

const productId = '38153db1-b2ef-43cb-9756-f43ffc41b61e'
const paymentIntentId = 'pi_3T4n2t3EFBl6jT3k18JyKfMU'

// Check for existing order (idempotency)
const { data: existing } = await sb.from('orders').select('id, order_number').eq('stripe_payment_id', paymentIntentId).single()
if (existing) {
  console.log('Order already exists:', existing.order_number)
  process.exit(0)
}

// Get product details
const { data: product } = await sb.from('products').select('*').eq('id', productId).single()
console.log('Product:', product.name, '| Current qty:', product.quantity)

// Generate order number
const orderNumber = `ST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

// Generate pickup code
const pickupCode = String(Math.floor(100000 + Math.random() * 900000))

const now = new Date().toISOString()
const orderDate = '2026-02-25T18:43:00.000Z' // Feb 25 1:43 PM EST

// Create order
// Insert with only known columns — try progressively
const orderData = {
  order_number: orderNumber,
  customer_email: 'nicholasvuolo@gmail.com',
  subtotal: 85.00,
  tax: 5.95,
  shipping_cost: 0,
  total: 90.95,
  status: 'paid',
  fulfillment_type: 'pickup',
  channel: 'web',
  stripe_payment_id: paymentIntentId,
  stripe_payment_status: 'succeeded',
  items: [{
    product_id: productId,
    variant_id: null,
    name: 'Saucony ProGrid Triumph 4 Jae Tips Flowers Grow Up',
    price: 85.00,
    quantity: 1,
    size: '9',
  }],
  delivery_method: 'pickup',
  customer_phone: '7275053065',
  created_at: orderDate,
  updated_at: now,
}

const { data: order, error: orderError } = await sb.from('orders').insert(orderData).select().single()

if (orderError) {
  console.error('Failed to create order:', orderError.message)
  process.exit(1)
}

console.log('Order created:', order.order_number, '| Pickup code:', pickupCode)

// Decrement inventory
const prevQty = product.quantity
const newQty = Math.max(0, prevQty - 1)

const { error: updateError } = await sb.from('products').update({ 
  quantity: newQty, 
  updated_at: now 
}).eq('id', productId)

if (updateError) {
  console.error('Failed to update inventory:', updateError.message)
} else {
  console.log('Inventory updated:', prevQty, '->', newQty)
}

// Log inventory adjustment
await sb.from('inventory_adjustments').insert({
  product_id: productId,
  quantity_change: -1,
  reason: 'sold_online',
  previous_quantity: prevQty,
  new_quantity: newQty,
  notes: `Stripe order ${orderNumber} (${paymentIntentId}) — manual recovery`,
  adjusted_by: null,
  source: 'web_order',
})

console.log('Inventory adjustment logged')
console.log('\nDone! Order', orderNumber, 'is now in the admin.')
