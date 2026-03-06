// JSON-based backend using localStorage.
// This keeps the app deployable as a static site while still behaving like a small database.

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  storeName: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeName: string;
  storeDescription: string;
  upiId: string;
  password: string;
  joinedAt: string;
  totalEarnings: number;
  totalOrders: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending-verification' | 'confirmed' | 'shipped' | 'delivered';
export type PaymentStatus = 'verification-pending' | 'verified' | 'rejected';
export type PayoutStatus = 'held' | 'scheduled';

export interface Order {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  items: CartItem[];
  totalAmount: number;
  platformFee: number;
  sellerPayout: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  payoutStatus: PayoutStatus;
  paymentMethod: 'upi';
  paymentReference: string;
  paymentScreenshot: string;
  termsAccepted: boolean;
  termsAcceptedAt: string;
  ownerNote: string;
  createdAt: string;
  paymentVerifiedAt: string;
  earningsApplied: boolean;
}

const PRODUCTS_KEY = 'bazaar_products';
const SELLERS_KEY = 'bazaar_sellers';
const ORDERS_KEY = 'bazaar_orders';
const CART_KEY = 'bazaar_cart';
const REVIEWS_KEY = 'bazaar_reviews';

export const PLATFORM_UPI = '8595784629@fam';
export const PLATFORM_COMMISSION = 0.1;

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function makePlaceholderImage(title: string, accent: string, bg: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="56" fill="url(#g)" />
      <circle cx="620" cy="170" r="110" fill="rgba(255,255,255,0.14)" />
      <circle cx="210" cy="650" r="140" fill="rgba(255,255,255,0.08)" />
      <text x="76" y="360" fill="#ffffff" font-size="66" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
      <text x="76" y="438" fill="#ffffff" font-size="28" font-family="Arial, sans-serif" opacity="0.9">Open market seller listing</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const defaultProducts: Product[] = [
  {
    id: 'p1',
    sellerId: 's1',
    sellerName: 'Rahul Sharma',
    storeName: 'TechWorld Electronics',
    name: 'Noise Cancel Earbuds',
    description: 'Low-price wireless earbuds with charging case, touch controls, and all-day battery support.',
    price: 899,
    originalPrice: 2199,
    category: 'Electronics',
    image: makePlaceholderImage('Earbuds', '#0f766e', '#1d4ed8'),
    stock: 34,
    rating: 4.5,
    reviews: 2,
    createdAt: '2024-06-04T10:00:00.000Z',
  },
  {
    id: 'p2',
    sellerId: 's2',
    sellerName: 'Priya Singh',
    storeName: 'FashionHub Trends',
    name: 'Street Runner Sneakers',
    description: 'Breathable casual sneakers for daily wear with lightweight cushioning and anti-slip sole.',
    price: 749,
    originalPrice: 1899,
    category: 'Fashion',
    image: makePlaceholderImage('Sneakers', '#ea580c', '#be123c'),
    stock: 52,
    rating: 4.3,
    reviews: 1,
    createdAt: '2024-06-07T10:00:00.000Z',
  },
  {
    id: 'p3',
    sellerId: 's3',
    sellerName: 'Amit Patel',
    storeName: 'HomeEssentials Store',
    name: 'Insulated Steel Bottle',
    description: '1 litre insulated bottle that keeps water cold for 24 hours and hot for 12 hours.',
    price: 399,
    originalPrice: 999,
    category: 'Home',
    image: makePlaceholderImage('Bottle', '#2563eb', '#0f172a'),
    stock: 68,
    rating: 4.7,
    reviews: 2,
    createdAt: '2024-06-09T10:00:00.000Z',
  },
  {
    id: 'p4',
    sellerId: 's4',
    sellerName: 'Neha Gupta',
    storeName: 'BeautyZone Care',
    name: 'Vitamin C Glow Serum',
    description: 'Daily-use serum made for brightening and hydration with a simple skincare routine.',
    price: 329,
    originalPrice: 899,
    category: 'Beauty',
    image: makePlaceholderImage('Serum', '#f59e0b', '#f97316'),
    stock: 40,
    rating: 4.2,
    reviews: 1,
    createdAt: '2024-06-11T10:00:00.000Z',
  },
  {
    id: 'p5',
    sellerId: 's5',
    sellerName: 'Vikram Joshi',
    storeName: 'SportsFit Gear',
    name: '6mm Yoga Mat',
    description: 'Soft non-slip mat for home workouts, yoga sessions, and stretching practice.',
    price: 549,
    originalPrice: 1299,
    category: 'Sports',
    image: makePlaceholderImage('Yoga Mat', '#15803d', '#065f46'),
    stock: 28,
    rating: 4.6,
    reviews: 1,
    createdAt: '2024-06-14T10:00:00.000Z',
  },
  {
    id: 'p6',
    sellerId: 's1',
    sellerName: 'Rahul Sharma',
    storeName: 'TechWorld Electronics',
    name: 'Fast Charge Power Bank',
    description: 'Pocket-size 10000mAh power bank with two outputs and LED battery indicator.',
    price: 999,
    originalPrice: 2499,
    category: 'Electronics',
    image: makePlaceholderImage('Power Bank', '#7c3aed', '#1e293b'),
    stock: 24,
    rating: 4.4,
    reviews: 1,
    createdAt: '2024-06-15T10:00:00.000Z',
  },
];

const defaultReviews: Review[] = [
  { id: 'r1', productId: 'p1', customerName: 'Maya', rating: 5, comment: 'Sound is clean and the delivery was fast.', createdAt: '2024-06-20T11:00:00.000Z' },
  { id: 'r2', productId: 'p1', customerName: 'Imran', rating: 4, comment: 'Great value for the price. Battery backup is solid.', createdAt: '2024-06-21T12:00:00.000Z' },
  { id: 'r3', productId: 'p2', customerName: 'Asha', rating: 4, comment: 'Looks stylish and feels light on the feet.', createdAt: '2024-06-22T12:00:00.000Z' },
  { id: 'r4', productId: 'p3', customerName: 'Deepak', rating: 5, comment: 'Bottle quality is excellent. Keeps water cool for hours.', createdAt: '2024-06-23T12:00:00.000Z' },
  { id: 'r5', productId: 'p3', customerName: 'Rina', rating: 4, comment: 'Nice finish and no leakage so far.', createdAt: '2024-06-24T12:00:00.000Z' },
  { id: 'r6', productId: 'p4', customerName: 'Kriti', rating: 4, comment: 'Easy to apply and skin feels fresh.', createdAt: '2024-06-24T12:00:00.000Z' },
  { id: 'r7', productId: 'p5', customerName: 'Sahil', rating: 5, comment: 'Grip is very good. Good for everyday home use.', createdAt: '2024-06-25T12:00:00.000Z' },
  { id: 'r8', productId: 'p6', customerName: 'Nitin', rating: 4, comment: 'Compact power bank and charges quickly.', createdAt: '2024-06-26T12:00:00.000Z' },
];

const defaultSellers: Seller[] = [
  { id: 's1', name: 'Rahul Sharma', email: 'rahul@techworld.com', phone: '9876543210', storeName: 'TechWorld Electronics', storeDescription: 'Affordable gadgets and everyday tech deals.', upiId: 'rahul@upi', password: 'tech123', joinedAt: '2024-06-01T10:00:00.000Z', totalEarnings: 45600, totalOrders: 87 },
  { id: 's2', name: 'Priya Singh', email: 'priya@fashionhub.com', phone: '9876543211', storeName: 'FashionHub Trends', storeDescription: 'Budget fashion and lifestyle listings.', upiId: 'priya@upi', password: 'fashion123', joinedAt: '2024-06-01T10:00:00.000Z', totalEarnings: 32400, totalOrders: 64 },
  { id: 's3', name: 'Amit Patel', email: 'amit@homeessentials.com', phone: '9876543212', storeName: 'HomeEssentials Store', storeDescription: 'Useful products for daily home needs.', upiId: 'amit@upi', password: 'home123', joinedAt: '2024-06-01T10:00:00.000Z', totalEarnings: 28900, totalOrders: 52 },
  { id: 's4', name: 'Neha Gupta', email: 'neha@beautyzone.com', phone: '9876543213', storeName: 'BeautyZone Care', storeDescription: 'Beauty and personal care picks.', upiId: 'neha@upi', password: 'beauty123', joinedAt: '2024-06-01T10:00:00.000Z', totalEarnings: 19800, totalOrders: 38 },
  { id: 's5', name: 'Vikram Joshi', email: 'vikram@sportsfit.com', phone: '9876543214', storeName: 'SportsFit Gear', storeDescription: 'Workout and sports products.', upiId: 'vikram@upi', password: 'sports123', joinedAt: '2024-06-01T10:00:00.000Z', totalEarnings: 15600, totalOrders: 29 },
];

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function normalizeProduct(product: Partial<Product>): Product {
  return {
    id: product.id || generateId(),
    sellerId: product.sellerId || 'unknown-seller',
    sellerName: product.sellerName || 'Seller',
    storeName: product.storeName || 'Open Market Store',
    name: product.name || 'Untitled Product',
    description: product.description || 'No description added yet.',
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice || product.price || 0),
    category: product.category || 'Other',
    image: typeof product.image === 'string' && product.image.trim() ? product.image : makePlaceholderImage('Product', '#0f766e', '#1e293b'),
    stock: Number(product.stock || 0),
    rating: Number(product.rating || 0),
    reviews: Number(product.reviews || 0),
    createdAt: product.createdAt || new Date().toISOString(),
  };
}

function normalizeSeller(seller: Partial<Seller>): Seller {
  return {
    id: seller.id || generateId(),
    name: seller.name || 'Seller',
    email: seller.email || '',
    phone: seller.phone || '',
    storeName: seller.storeName || 'Store',
    storeDescription: seller.storeDescription || '',
    upiId: seller.upiId || '',
    password: seller.password || '',
    joinedAt: seller.joinedAt || new Date().toISOString(),
    totalEarnings: Number(seller.totalEarnings || 0),
    totalOrders: Number(seller.totalOrders || 0),
  };
}

function normalizeReview(review: Partial<Review>): Review {
  return {
    id: review.id || generateId(),
    productId: review.productId || '',
    customerName: review.customerName || 'Customer',
    rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
    comment: review.comment || '',
    createdAt: review.createdAt || new Date().toISOString(),
  };
}

function normalizeOrder(order: Partial<Order>): Order {
  return {
    id: order.id || generateId(),
    buyerName: order.buyerName || '',
    buyerEmail: order.buyerEmail || '',
    buyerPhone: order.buyerPhone || '',
    buyerAddress: order.buyerAddress || '',
    items: Array.isArray(order.items) ? order.items : [],
    totalAmount: Number(order.totalAmount || 0),
    platformFee: Number(order.platformFee || 0),
    sellerPayout: Number(order.sellerPayout || 0),
    status: (order.status as OrderStatus) || 'pending-verification',
    paymentStatus: (order.paymentStatus as PaymentStatus) || 'verification-pending',
    payoutStatus: (order.payoutStatus as PayoutStatus) || 'held',
    paymentMethod: 'upi',
    paymentReference: order.paymentReference || '',
    paymentScreenshot: order.paymentScreenshot || '',
    termsAccepted: Boolean(order.termsAccepted),
    termsAcceptedAt: order.termsAcceptedAt || '',
    ownerNote: order.ownerNote || '',
    createdAt: order.createdAt || new Date().toISOString(),
    paymentVerifiedAt: order.paymentVerifiedAt || '',
    earningsApplied: Boolean(order.earningsApplied),
  };
}

function recalculateProductAggregates(productId: string): void {
  const products = getProducts();
  const reviews = getReviewsByProduct(productId);
  const nextProducts = products.map((product) => {
    if (product.id !== productId) return product;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const rating = reviews.length ? Number((total / reviews.length).toFixed(1)) : 0;
    return { ...product, rating, reviews: reviews.length };
  });
  writeJSON(PRODUCTS_KEY, nextProducts);
}

function applySellerEarnings(order: Order): void {
  if (order.earningsApplied) return;

  const sellers = getSellers();
  const earningsBySeller: Record<string, number> = {};
  const orderCountBySeller: Record<string, number> = {};

  order.items.forEach((item) => {
    const gross = item.product.price * item.quantity;
    const net = gross - Math.round(gross * PLATFORM_COMMISSION);
    earningsBySeller[item.product.sellerId] = (earningsBySeller[item.product.sellerId] || 0) + net;
    orderCountBySeller[item.product.sellerId] = (orderCountBySeller[item.product.sellerId] || 0) + 1;
  });

  const nextSellers = sellers.map((seller) => {
    if (!earningsBySeller[seller.id]) return seller;
    return {
      ...seller,
      totalEarnings: seller.totalEarnings + earningsBySeller[seller.id],
      totalOrders: seller.totalOrders + orderCountBySeller[seller.id],
    };
  });

  writeJSON(SELLERS_KEY, nextSellers);

  const orders = getOrders();
  const nextOrders = orders.map((currentOrder) => currentOrder.id === order.id ? { ...currentOrder, earningsApplied: true } : currentOrder);
  writeJSON(ORDERS_KEY, nextOrders);
}

function migrateAndPersist(): void {
  const products = readJSON<Partial<Product>[]>(PRODUCTS_KEY, defaultProducts).map(normalizeProduct);
  const sellers = readJSON<Partial<Seller>[]>(SELLERS_KEY, defaultSellers).map(normalizeSeller);
  const reviews = readJSON<Partial<Review>[]>(REVIEWS_KEY, defaultReviews).map(normalizeReview);
  const orders = readJSON<Partial<Order>[]>(ORDERS_KEY, []).map(normalizeOrder);
  const cart = readJSON<CartItem[]>(CART_KEY, []);

  writeJSON(PRODUCTS_KEY, products);
  writeJSON(SELLERS_KEY, sellers);
  writeJSON(REVIEWS_KEY, reviews);
  writeJSON(ORDERS_KEY, orders);
  writeJSON(CART_KEY, cart);

  products.forEach((product) => recalculateProductAggregates(product.id));
}

export function initDB(): void {
  if (!localStorage.getItem(PRODUCTS_KEY)) writeJSON(PRODUCTS_KEY, defaultProducts);
  if (!localStorage.getItem(SELLERS_KEY)) writeJSON(SELLERS_KEY, defaultSellers);
  if (!localStorage.getItem(REVIEWS_KEY)) writeJSON(REVIEWS_KEY, defaultReviews);
  if (!localStorage.getItem(ORDERS_KEY)) writeJSON(ORDERS_KEY, []);
  if (!localStorage.getItem(CART_KEY)) writeJSON(CART_KEY, []);
  migrateAndPersist();
}

export function getProducts(): Product[] {
  return readJSON<Partial<Product>[]>(PRODUCTS_KEY, []).map(normalizeProduct);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((product) => product.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  const products = getProducts();
  if (category === 'All') return products;
  return products.filter((product) => product.category === category);
}

export function getProductsBySeller(sellerId: string): Product[] {
  return getProducts().filter((product) => product.sellerId === sellerId);
}

export function searchProducts(query: string): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return getProducts();
  return getProducts().filter((product) =>
    product.name.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle) ||
    product.category.toLowerCase().includes(needle) ||
    product.storeName.toLowerCase().includes(needle),
  );
}

export function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviews'>): Product {
  const products = getProducts();
  const nextProduct = normalizeProduct({
    ...product,
    id: generateId(),
    createdAt: new Date().toISOString(),
    rating: 0,
    reviews: 0,
  });
  writeJSON(PRODUCTS_KEY, [nextProduct, ...products]);
  return nextProduct;
}

export function deleteProduct(productId: string): void {
  const nextProducts = getProducts().filter((product) => product.id !== productId);
  const nextReviews = getReviews().filter((review) => review.productId !== productId);
  writeJSON(PRODUCTS_KEY, nextProducts);
  writeJSON(REVIEWS_KEY, nextReviews);
}

export function updateProduct(productId: string, updates: Partial<Product>): void {
  const nextProducts = getProducts().map((product) => product.id === productId ? normalizeProduct({ ...product, ...updates }) : product);
  writeJSON(PRODUCTS_KEY, nextProducts);
}

export function getReviews(): Review[] {
  return readJSON<Partial<Review>[]>(REVIEWS_KEY, []).map(normalizeReview);
}

export function getReviewsByProduct(productId: string): Review[] {
  return getReviews()
    .filter((review) => review.productId === productId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
  const nextReview = normalizeReview({ ...review, id: generateId(), createdAt: new Date().toISOString() });
  writeJSON(REVIEWS_KEY, [nextReview, ...getReviews()]);
  recalculateProductAggregates(review.productId);
  return nextReview;
}

export function getSellers(): Seller[] {
  return readJSON<Partial<Seller>[]>(SELLERS_KEY, []).map(normalizeSeller);
}

export function getSellerById(id: string): Seller | undefined {
  return getSellers().find((seller) => seller.id === id);
}

export function registerSeller(seller: Omit<Seller, 'id' | 'joinedAt' | 'totalEarnings' | 'totalOrders'>): Seller {
  const sellers = getSellers();
  const emailUsed = sellers.some((currentSeller) => currentSeller.email.toLowerCase() === seller.email.toLowerCase());
  if (emailUsed) throw new Error('Email already registered');
  const nextSeller = normalizeSeller({
    ...seller,
    id: generateId(),
    joinedAt: new Date().toISOString(),
    totalEarnings: 0,
    totalOrders: 0,
  });
  writeJSON(SELLERS_KEY, [nextSeller, ...sellers]);
  return nextSeller;
}

export function loginSeller(email: string, password: string): Seller | null {
  return getSellers().find((seller) => seller.email === email && seller.password === password) || null;
}

export function updateSeller(sellerId: string, updates: Partial<Seller>): void {
  const nextSellers = getSellers().map((seller) => seller.id === sellerId ? normalizeSeller({ ...seller, ...updates }) : seller);
  writeJSON(SELLERS_KEY, nextSellers);
}

export function getCart(): CartItem[] {
  return readJSON<CartItem[]>(CART_KEY, []);
}

export function addToCart(product: Product, quantity: number = 1): void {
  const cart = getCart();
  const existing = cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ product, quantity });
  }
  writeJSON(CART_KEY, cart);
}

export function removeFromCart(productId: string): void {
  writeJSON(CART_KEY, getCart().filter((item) => item.product.id !== productId));
}

export function updateCartQuantity(productId: string, quantity: number): void {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const nextCart = getCart().map((item) => item.product.id === productId ? { ...item, quantity } : item);
  writeJSON(CART_KEY, nextCart);
}

export function clearCart(): void {
  writeJSON(CART_KEY, []);
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function getOrders(): Order[] {
  return readJSON<Partial<Order>[]>(ORDERS_KEY, []).map(normalizeOrder).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getOrdersBySeller(sellerId: string): Order[] {
  return getOrders().filter((order) => order.items.some((item) => item.product.sellerId === sellerId));
}

export function placeOrder(buyerInfo: {
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentReference: string;
  paymentScreenshot: string;
  termsAccepted: boolean;
}): Order {
  const cart = getCart();
  if (!cart.length) throw new Error('Cart is empty');
  if (!buyerInfo.termsAccepted) throw new Error('Terms must be accepted');
  if (!buyerInfo.paymentReference.trim()) throw new Error('Payment reference is required');

  const totalAmount = getCartTotal();
  const platformFee = Math.round(totalAmount * PLATFORM_COMMISSION);
  const sellerPayout = totalAmount - platformFee;

  const order = normalizeOrder({
    id: generateId(),
    buyerName: buyerInfo.name,
    buyerEmail: buyerInfo.email,
    buyerPhone: buyerInfo.phone,
    buyerAddress: buyerInfo.address,
    items: cart,
    totalAmount,
    platformFee,
    sellerPayout,
    status: 'pending-verification',
    paymentStatus: 'verification-pending',
    payoutStatus: 'held',
    paymentMethod: 'upi',
    paymentReference: buyerInfo.paymentReference.trim(),
    paymentScreenshot: buyerInfo.paymentScreenshot,
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    ownerNote: 'Waiting for owner payment verification.',
    createdAt: new Date().toISOString(),
    paymentVerifiedAt: '',
    earningsApplied: false,
  });

  writeJSON(ORDERS_KEY, [order, ...getOrders()]);

  const nextProducts = getProducts().map((product) => {
    const cartItem = cart.find((item) => item.product.id === product.id);
    if (!cartItem) return product;
    return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
  });
  writeJSON(PRODUCTS_KEY, nextProducts);

  clearCart();
  return order;
}

export function verifyOrderPayment(orderId: string, ownerNote: string): void {
  const orders = getOrders();
  const target = orders.find((order) => order.id === orderId);
  if (!target) return;
  const verifiedAt = new Date().toISOString();
  const nextOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          paymentStatus: 'verified',
          status: order.status === 'pending-verification' ? 'confirmed' : order.status,
          payoutStatus: 'scheduled',
          ownerNote: ownerNote.trim() || 'Payment matched with incoming UPI credit. Seller settlement can proceed.',
          paymentVerifiedAt: verifiedAt,
        }
      : order,
  );
  writeJSON(ORDERS_KEY, nextOrders);
  applySellerEarnings({
    ...target,
    paymentStatus: 'verified',
    payoutStatus: 'scheduled',
    ownerNote,
    paymentVerifiedAt: verifiedAt,
  });
}

export function rejectOrderPayment(orderId: string, ownerNote: string): void {
  const nextOrders = getOrders().map((order) =>
    order.id === orderId
      ? {
          ...order,
          paymentStatus: 'rejected',
          status: 'pending-verification',
          payoutStatus: 'held',
          ownerNote: ownerNote.trim() || 'Payment not found. Buyer should recheck the UTR or upload a clearer screenshot.',
          paymentVerifiedAt: '',
        }
      : order,
  );
  writeJSON(ORDERS_KEY, nextOrders);
}

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const nextOrders = getOrders().map((order) => order.id === orderId ? { ...order, status } : order);
  writeJSON(ORDERS_KEY, nextOrders);
}

export function getCategories(): string[] {
  const categories = Array.from(new Set(getProducts().map((product) => product.category)));
  return ['All', ...categories.sort((a, b) => a.localeCompare(b))];
}

export function resetDB(): void {
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(SELLERS_KEY);
  localStorage.removeItem(ORDERS_KEY);
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(REVIEWS_KEY);
  initDB();
}