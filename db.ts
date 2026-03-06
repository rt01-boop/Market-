// Simple JSON database using localStorage.
// This allows the marketplace to run as a static site.

export interface Product {
  id: string
  sellerId: string
  sellerName: string
  storeName: string
  name: string
  description: string
  price: number
  originalPrice: number
  category: string
  image: string
  stock: number
  rating: number
  reviews: number
  createdAt: string
}

export interface Review {
  id: string
  productId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

export interface Seller {
  id: string
  name: string
  email: string
  phone: string
  storeName: string
  storeDescription: string
  upiId: string
  password: string
  joinedAt: string
  totalEarnings: number
  totalOrders: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export type OrderStatus =
  | "pending-verification"
  | "confirmed"
  | "shipped"
  | "delivered"

export type PaymentStatus =
  | "verification-pending"
  | "verified"
  | "rejected"

export type PayoutStatus =
  | "held"
  | "scheduled"

export interface Order {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  buyerAddress: string
  items: CartItem[]
  totalAmount: number
  platformFee: number
  sellerPayout: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  payoutStatus: PayoutStatus
  paymentMethod: "upi"
  paymentReference: string
  paymentScreenshot: string
  termsAccepted: boolean
  termsAcceptedAt: string
  ownerNote: string
  createdAt: string
  paymentVerifiedAt: string
  earningsApplied: boolean
}

const PRODUCTS_KEY = "bazaar_products"
const SELLERS_KEY = "bazaar_sellers"
const ORDERS_KEY = "bazaar_orders"
const CART_KEY = "bazaar_cart"
const REVIEWS_KEY = "bazaar_reviews"

export const PLATFORM_UPI = "8595784629@fam"
export const PLATFORM_COMMISSION = 0.1

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function initDB() {
  if (!localStorage.getItem(PRODUCTS_KEY))
    writeJSON(PRODUCTS_KEY, [])

  if (!localStorage.getItem(SELLERS_KEY))
    writeJSON(SELLERS_KEY, [])

  if (!localStorage.getItem(ORDERS_KEY))
    writeJSON(ORDERS_KEY, [])

  if (!localStorage.getItem(CART_KEY))
    writeJSON(CART_KEY, [])

  if (!localStorage.getItem(REVIEWS_KEY))
    writeJSON(REVIEWS_KEY, [])
}

export function getProducts(): Product[] {
  return readJSON(PRODUCTS_KEY, [])
}

export function addProduct(
  product: Omit<Product, "id" | "createdAt" | "rating" | "reviews">
): Product {
  const products = getProducts()

  const newProduct: Product = {
    ...product,
    id: generateId(),
    createdAt: new Date().toISOString(),
    rating: 0,
    reviews: 0
  }

  writeJSON(PRODUCTS_KEY, [newProduct, ...products])

  return newProduct
}

export function deleteProduct(productId: string) {
  const products = getProducts()
  writeJSON(
    PRODUCTS_KEY,
    products.filter(p => p.id !== productId)
  )
}

export function getReviews(): Review[] {
  return readJSON(REVIEWS_KEY, [])
}

export function getReviewsByProduct(productId: string): Review[] {
  return getReviews().filter(r => r.productId === productId)
}

export function addReview(
  review: Omit<Review, "id" | "createdAt">
): Review {
  const reviews = getReviews()

  const newReview: Review = {
    ...review,
    id: generateId(),
    createdAt: new Date().toISOString()
  }

  writeJSON(REVIEWS_KEY, [newReview, ...reviews])

  return newReview
}

export function getSellers(): Seller[] {
  return readJSON(SELLERS_KEY, [])
}

export function registerSeller(
  seller: Omit<Seller, "id" | "joinedAt" | "totalEarnings" | "totalOrders">
): Seller {
  const sellers = getSellers()

  const newSeller: Seller = {
    ...seller,
    id: generateId(),
    joinedAt: new Date().toISOString(),
    totalEarnings: 0,
    totalOrders: 0
  }

  writeJSON(SELLERS_KEY, [newSeller, ...sellers])

  return newSeller
}

export function loginSeller(
  email: string,
  password: string
): Seller | null {
  return (
    getSellers().find(
      s => s.email === email && s.password === password
    ) || null
  )
}

export function getCart(): CartItem[] {
  return readJSON(CART_KEY, [])
}

export function addToCart(product: Product, quantity = 1) {
  const cart = getCart()
  const existing = cart.find(i => i.product.id === product.id)

  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ product, quantity })
  }

  writeJSON(CART_KEY, cart)
}

export function removeFromCart(productId: string) {
  writeJSON(
    CART_KEY,
    getCart().filter(i => i.product.id !== productId)
  )
}

export function clearCart() {
  writeJSON(CART_KEY, [])
}

export function getOrders(): Order[] {
  return readJSON(ORDERS_KEY, [])
}

export function createOrder(
  order: Omit<Order, "id" | "createdAt">
): Order {
  const orders = getOrders()

  const newOrder: Order = {
    ...order,
    id: generateId(),
    createdAt: new Date().toISOString()
  }

  writeJSON(ORDERS_KEY, [newOrder, ...orders])

  clearCart()

  return newOrder
}

export function verifyPayment(orderId: string) {
  const orders = getOrders()

  const next = orders.map(o => {
    if (o.id !== orderId) return o

    return {
      ...o,
      paymentStatus: "verified",
      paymentVerifiedAt: new Date().toISOString(),
      status: "confirmed"
    }
  })

  writeJSON(ORDERS_KEY, next)
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus
) {
  const orders = getOrders()

  writeJSON(
    ORDERS_KEY,
    orders.map(o =>
      o.id === orderId ? { ...o, status } : o
    )
  )
}