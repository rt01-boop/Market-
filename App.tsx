import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  PLATFORM_COMMISSION,
  PLATFORM_UPI,
  addProduct,
  addReview,
  addToCart,
  deleteProduct,
  getCart,
  getCartTotal,
  getCategories,
  getOrders,
  getOrdersBySeller,
  getProductById,
  getProductsByCategory,
  getProductsBySeller,
  getReviewsByProduct,
  initDB,
  loginSeller,
  placeOrder,
  registerSeller,
  rejectOrderPayment,
  removeFromCart,
  searchProducts,
  updateCartQuantity,
  updateOrderStatus,
  verifyOrderPayment,
  type CartItem,
  type Order,
  type PaymentStatus,
  type Product,
  type Review,
  type Seller,
} from './backend/db';

type Page = 'shop' | 'product' | 'cart' | 'checkout' | 'order' | 'seller-auth' | 'seller-dashboard' | 'owner';

const OWNER_SESSION_KEY = 'openmarket_owner_unlocked';
const OWNER_ACCESS_KEY = 'owner-8595784629';

const buyerTerms = [
  'This is an open marketplace where sellers independently list their products.',
  'The platform owner is not automatically responsible for fraud, quality issues, delivery delays, or mismatched products caused by a seller.',
  'The platform will still help with dispute support by preserving order details, payment proof, seller information, and communication history available on the site.',
  'Buyers should keep UTR details, screenshots, order IDs, and delivery evidence for dispute handling.',
  'Seller settlement is held until the payment is checked against the platform UPI account.',
];

function money(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

function dateTime(value: string): string {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function isImage(value: string): boolean {
  return value.startsWith('data:image') || value.startsWith('http://') || value.startsWith('https://');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function ProductImage({ image, name, className }: { image: string; name: string; className: string }) {
  if (isImage(image)) {
    return <img src={image} alt={name} className={className} />;
  }

  return <div className={`${className} flex items-center justify-center bg-stone-100 text-4xl`}>{image}</div>;
}

export function App() {
  const [page, setPage] = useState<Page>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ownerPromptOpen, setOwnerPromptOpen] = useState(false);
  const [ownerKeyInput, setOwnerKeyInput] = useState('');
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const ownerTapRef = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });

  const refreshData = useCallback(() => {
    const nextCategories = getCategories();
    const nextProducts = searchQuery.trim()
      ? searchProducts(searchQuery)
      : getProductsByCategory(selectedCategory);

    setCategories(nextCategories);
    setProducts(nextProducts);
    setCart(getCart());
    setCartTotal(getCartTotal());

    if (selectedProductId) {
      const currentProduct = getProductById(selectedProductId) || null;
      setSelectedProduct(currentProduct);
      setSelectedReviews(currentProduct ? getReviewsByProduct(currentProduct.id) : []);
    }
  }, [searchQuery, selectedCategory, selectedProductId]);

  useEffect(() => {
    initDB();
    setOwnerUnlocked(sessionStorage.getItem(OWNER_SESSION_KEY) === 'yes');
    refreshData();
  }, [refreshData]);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (ownerTapRef.current.timer) window.clearTimeout(ownerTapRef.current.timer);
  }, []);

  const notify = (text: string) => {
    setMessage(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setMessage(''), 3200);
  };

  const goHome = () => {
    setPage('shop');
    setSelectedProductId('');
    setSelectedProduct(null);
    setSelectedReviews([]);
  };

  const openProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
    setSelectedReviews(getReviewsByProduct(product.id));
    setPage('product');
  };

  const openHiddenOwnerPrompt = () => {
    ownerTapRef.current.count += 1;

    if (ownerTapRef.current.timer) {
      window.clearTimeout(ownerTapRef.current.timer);
    }

    ownerTapRef.current.timer = window.setTimeout(() => {
      ownerTapRef.current.count = 0;
    }, 2200);

    if (ownerTapRef.current.count >= 5) {
      ownerTapRef.current.count = 0;
      setOwnerPromptOpen(true);
    }
  };

  const unlockOwner = () => {
    if (ownerKeyInput.trim() !== OWNER_ACCESS_KEY) {
      notify('Incorrect owner access key');
      return;
    }

    sessionStorage.setItem(OWNER_SESSION_KEY, 'yes');
    setOwnerUnlocked(true);
    setOwnerKeyInput('');
    setOwnerPromptOpen(false);
    setPage('owner');
    notify('Owner console unlocked');
  };

  const lockOwner = () => {
    sessionStorage.removeItem(OWNER_SESSION_KEY);
    setOwnerUnlocked(false);
    goHome();
    notify('Owner console locked');
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    refreshData();
    notify(`${product.name} added to cart`);
  };

  const productCountLabel = useMemo(() => `${products.length} products`, [products.length]);

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      {message && (
        <div className="fixed right-4 top-4 z-[90] rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">
          {message}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <button onClick={goHome} className="text-left">
              <div className="font-display text-2xl font-semibold tracking-tight text-slate-900">OpenMarket</div>
              <div className="text-xs text-slate-500">Products first. Sellers can join and list.</div>
            </button>

            <div className="hidden max-w-2xl flex-1 md:block">
              <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage('shop');
                  }}
                  placeholder="Search products, stores, or categories"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <nav className="hidden items-center gap-2 md:flex">
              <button onClick={goHome} className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-100">Products</button>
              <button onClick={() => setPage(seller ? 'seller-dashboard' : 'seller-auth')} className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-100">Join to sell</button>
              <button onClick={() => setPage('cart')} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">Cart ({cart.length})</button>
            </nav>

            <button onClick={() => setMobileMenuOpen((current) => !current)} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium md:hidden">
              Menu
            </button>
          </div>

          <div className="mt-4 md:hidden">
            <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3">
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage('shop');
                }}
                placeholder="Search products"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-4 space-y-2 rounded-3xl border border-stone-200 bg-white p-3 md:hidden">
              <button onClick={() => { goHome(); setMobileMenuOpen(false); }} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-stone-100">Products</button>
              <button onClick={() => { setPage(seller ? 'seller-dashboard' : 'seller-auth'); setMobileMenuOpen(false); }} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-stone-100">Join to sell</button>
              <button onClick={() => { setPage('cart'); setMobileMenuOpen(false); }} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium hover:bg-stone-100">Cart ({cart.length})</button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {page === 'shop' && (
          <ShopPage
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setSearchQuery('');
            }}
            products={products}
            productCountLabel={productCountLabel}
            onViewProduct={openProduct}
            onAddToCart={handleAddToCart}
            onJoinSeller={() => setPage(seller ? 'seller-dashboard' : 'seller-auth')}
          />
        )}

        {page === 'product' && selectedProduct && (
          <ProductPage
            product={selectedProduct}
            reviews={selectedReviews}
            onBack={goHome}
            onAddToCart={handleAddToCart}
            onSubmitReview={(payload) => {
              addReview({ productId: selectedProduct.id, ...payload });
              refreshData();
              notify('Review added');
            }}
          />
        )}

        {page === 'cart' && (
          <CartPage
            cart={cart}
            total={cartTotal}
            onBack={goHome}
            onCheckout={() => setPage('checkout')}
            onRemove={(productId) => {
              removeFromCart(productId);
              refreshData();
            }}
            onChangeQuantity={(productId, quantity) => {
              updateCartQuantity(productId, quantity);
              refreshData();
            }}
          />
        )}

        {page === 'checkout' && (
          <CheckoutPage
            cart={cart}
            total={cartTotal}
            onBack={() => setPage('cart')}
            onPlaceOrder={(payload) => {
              try {
                const order = placeOrder(payload);
                setLastOrder(order);
                setPage('order');
                refreshData();
                notify('Order placed. Payment verification is pending.');
              } catch (error) {
                notify(error instanceof Error ? error.message : 'Unable to place order');
              }
            }}
          />
        )}

        {page === 'order' && lastOrder && <OrderSuccessPage order={lastOrder} onContinueShopping={goHome} />}

        {page === 'seller-auth' && (
          <SellerAuthPage
            onLogin={(loggedInSeller) => {
              setSeller(loggedInSeller);
              setPage('seller-dashboard');
              notify(`Welcome back, ${loggedInSeller.storeName}`);
            }}
            onRegister={(newSeller) => {
              setSeller(newSeller);
              setPage('seller-dashboard');
              notify('Seller account created');
            }}
          />
        )}

        {page === 'seller-dashboard' && seller && (
          <SellerDashboard
            seller={seller}
            refreshMarketplace={refreshData}
            notify={notify}
            onLogout={() => {
              setSeller(null);
              goHome();
            }}
          />
        )}

        {page === 'owner' && ownerUnlocked && (
          <OwnerConsole
            onBack={goHome}
            onLock={lockOwner}
            onRefresh={refreshData}
            notify={notify}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <div className="font-display text-xl font-semibold">OpenMarket</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              An open marketplace where buyers see products first and sellers can join to list actual items with real images and reviews.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Buyers</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Browse products</li>
              <li>Pay to platform UPI</li>
              <li>Submit UTR and screenshot</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Sellers</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Join and create a store</li>
              <li>Upload actual product images</li>
              <li>Receive 90% after verification</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Payments</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>UPI: {PLATFORM_UPI}</li>
              <li>Platform fee: {PLATFORM_COMMISSION * 100}%</li>
              <li>Manual payment verification</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 text-xs text-slate-500 md:px-6">
            <span>Open marketplace demo ready to deploy.</span>
            <button onClick={openHiddenOwnerPrompt} className="rounded-full px-3 py-1 transition hover:bg-stone-100">
              build v1
            </button>
          </div>
        </div>
      </footer>

      {ownerPromptOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-semibold text-slate-900">Owner access</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This area is hidden from public visitors. Enter your private owner key to continue.</p>
            <div className="mt-5">
              <input
                type="password"
                value={ownerKeyInput}
                onChange={(event) => setOwnerKeyInput(event.target.value)}
                placeholder="Owner access key"
                className="input"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={unlockOwner} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Unlock</button>
              <button onClick={() => { setOwnerPromptOpen(false); setOwnerKeyInput(''); }} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopPage({
  categories,
  selectedCategory,
  onSelectCategory,
  products,
  productCountLabel,
  onViewProduct,
  onAddToCart,
  onJoinSeller,
}: {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  products: Product[];
  productCountLabel: string;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onJoinSeller: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Marketplace</p>
              <h1 className="font-display mt-2 text-3xl font-semibold text-slate-900 md:text-4xl">Products ready to buy</h1>
              <p className="mt-2 text-sm text-slate-600">Visitors land directly on active listings, compare prices, and place orders with payment proof.</p>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-slate-600">{productCountLabel}</div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === category ? 'bg-slate-900 text-white' : 'border border-stone-200 bg-white text-slate-700 hover:bg-stone-100'}`}
              >
                {category}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <EmptyState title="No products found" text="Try another search or category." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onView={onViewProduct} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Join as seller</p>
            <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900">List your store and products</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Create a seller profile, upload real product photos, set your own prices, and receive payout after payment verification.
            </p>
            <button onClick={onJoinSeller} className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
              Start selling
            </button>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-stone-100 p-6">
            <h3 className="font-display text-xl font-semibold text-slate-900">How payments work</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>1. Buyer places an order and pays to {PLATFORM_UPI}.</li>
              <li>2. Buyer submits UTR and optional screenshot.</li>
              <li>3. Payment is checked before the seller share is released.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ProductCard({
  product,
  onView,
  onAddToCart,
}: {
  product: Product;
  onView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}) {
  const savings = Math.max(product.originalPrice - product.price, 0);

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <button onClick={() => onView(product)} className="block w-full text-left">
        <ProductImage image={product.image} name={product.name} className="h-60 w-full object-cover" />
      </button>
      <div className="p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{product.category}</div>
        <button onClick={() => onView(product)} className="mt-2 line-clamp-2 text-left font-display text-xl font-semibold text-slate-900 hover:text-slate-700">
          {product.name}
        </button>
        <div className="mt-2 text-sm text-slate-500">{product.storeName}</div>
        <div className="mt-4 flex items-end gap-3">
          <span className="text-xl font-semibold text-slate-900">{money(product.price)}</span>
          <span className="text-sm text-slate-400 line-through">{money(product.originalPrice)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
          <span>{product.rating.toFixed(1)} / 5 ({product.reviews})</span>
          <span>Save {money(savings)}</span>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={() => onView(product)} className="flex-1 rounded-full border border-stone-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-stone-100">
            View
          </button>
          <button onClick={() => onAddToCart(product)} className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductPage({
  product,
  reviews,
  onBack,
  onAddToCart,
  onSubmitReview,
}: {
  product: Product;
  reviews: Review[];
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onSubmitReview: (payload: { customerName: string; rating: number; comment: string }) => void;
}) {
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: '5', comment: '' });

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
        Back to products
      </button>

      <section className="grid gap-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:grid-cols-[1.05fr_0.95fr] md:p-8">
        <ProductImage image={product.image} name={product.name} className="h-[420px] w-full rounded-[1.5rem] object-cover" />
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{product.category}</div>
          <h1 className="font-display mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">{product.name}</h1>
          <p className="mt-3 text-sm text-slate-500">Sold by {product.storeName}</p>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-semibold text-slate-900">{money(product.price)}</span>
            <span className="text-lg text-slate-400 line-through">{money(product.originalPrice)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>{product.rating.toFixed(1)} / 5 rating</span>
            <span>{product.reviews} reviews</span>
            <span>{product.stock} in stock</span>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">{product.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onAddToCart(product)} className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
              Add to cart
            </button>
            <div className="rounded-full border border-stone-200 px-5 py-3 text-sm text-slate-600">Payment goes first to {PLATFORM_UPI}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-slate-900">Customer reviews</h2>
              <p className="mt-1 text-sm text-slate-500">Feedback from buyers on this listing.</p>
            </div>
            <div className="rounded-full bg-stone-100 px-4 py-2 text-sm text-slate-600">{reviews.length} total</div>
          </div>

          <div className="mt-6 space-y-4">
            {reviews.length === 0 && <EmptyState title="No reviews yet" text="Be the first buyer to leave feedback." compact />}
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[1.5rem] bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{review.customerName}</div>
                    <div className="mt-1 text-sm text-slate-500">{dateTime(review.createdAt)}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">{review.rating} / 5</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Leave a review</h2>
          <p className="mt-1 text-sm text-slate-500">Customers can share their experience after purchase.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!reviewForm.customerName.trim() || !reviewForm.comment.trim()) return;
              onSubmitReview({
                customerName: reviewForm.customerName.trim(),
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment.trim(),
              });
              setReviewForm({ customerName: '', rating: '5', comment: '' });
            }}
            className="mt-5 space-y-4"
          >
            <Field label="Your name">
              <input value={reviewForm.customerName} onChange={(event) => setReviewForm({ ...reviewForm, customerName: event.target.value })} className="input" placeholder="Name" />
            </Field>
            <Field label="Rating">
              <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })} className="input">
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
              </select>
            </Field>
            <Field label="Comment">
              <textarea value={reviewForm.comment} onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })} rows={5} className="input min-h-[140px]" placeholder="Tell other buyers what arrived and how the experience was" />
            </Field>
            <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Submit review</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function CartPage({
  cart,
  total,
  onBack,
  onCheckout,
  onRemove,
  onChangeQuantity,
}: {
  cart: CartItem[];
  total: number;
  onBack: () => void;
  onCheckout: () => void;
  onRemove: (productId: string) => void;
  onChangeQuantity: (productId: string, quantity: number) => void;
}) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
        Continue shopping
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-900">Your cart</h1>
            <p className="mt-2 text-sm text-slate-500">Review selected items before checkout.</p>
          </div>

          {cart.length === 0 && <EmptyState title="Your cart is empty" text="Add products from the marketplace to continue." />}

          {cart.map((item) => (
            <div key={item.product.id} className="flex flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm sm:flex-row">
              <ProductImage image={item.product.image} name={item.product.name} className="h-36 w-full rounded-[1.25rem] object-cover sm:w-36" />
              <div className="flex-1">
                <div className="font-display text-xl font-semibold text-slate-900">{item.product.name}</div>
                <div className="mt-1 text-sm text-slate-500">{item.product.storeName}</div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button onClick={() => onChangeQuantity(item.product.id, item.quantity - 1)} className="rounded-full border border-stone-200 px-3 py-1 text-sm">-</button>
                  <span className="text-sm font-medium text-slate-700">{item.quantity}</span>
                  <button onClick={() => onChangeQuantity(item.product.id, item.quantity + 1)} className="rounded-full border border-stone-200 px-3 py-1 text-sm">+</button>
                  <button onClick={() => onRemove(item.product.id)} className="text-sm font-medium text-rose-600">Remove</button>
                </div>
              </div>
              <div className="text-lg font-semibold text-slate-900">{money(item.product.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-slate-900">Summary</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <InfoLine label="Items" value={`${cart.reduce((sum, item) => sum + item.quantity, 0)}`} />
              <InfoLine label="Total" value={money(total)} />
              <InfoLine label="Pay to" value={PLATFORM_UPI} />
            </div>
            <button disabled={!cart.length} onClick={onCheckout} className="mt-6 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              Proceed to checkout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckoutPage({
  cart,
  total,
  onBack,
  onPlaceOrder,
}: {
  cart: CartItem[];
  total: number;
  onBack: () => void;
  onPlaceOrder: (payload: {
    name: string;
    email: string;
    phone: string;
    address: string;
    paymentReference: string;
    paymentScreenshot: string;
    termsAccepted: boolean;
  }) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentReference: '',
    paymentScreenshot: '',
    termsAccepted: false,
  });

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
        Back to cart
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="font-display text-3xl font-semibold text-slate-900">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">Fill delivery details, pay on UPI, then submit the payment proof.</p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onPlaceOrder(form);
            }}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <Field label="Full name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Buyer name" /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input" placeholder="buyer@email.com" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input" placeholder="Phone number" /></Field>
            <Field label="UTR / transaction reference"><input value={form.paymentReference} onChange={(event) => setForm({ ...form, paymentReference: event.target.value })} className="input" placeholder="Enter UTR after payment" /></Field>
            <Field label="Address" className="sm:col-span-2"><textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={4} className="input min-h-[120px]" placeholder="Full delivery address" /></Field>
            <Field label="Payment screenshot" className="sm:col-span-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const image = await readFileAsDataUrl(file);
                  setForm((current) => ({ ...current, paymentScreenshot: image }));
                }}
                className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-slate-600"
              />
            </Field>

            <div className="sm:col-span-2 rounded-[1.5rem] bg-stone-100 p-5">
              <h2 className="font-display text-xl font-semibold text-slate-900">Terms before buying</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {buyerTerms.map((term) => (
                  <li key={term}>- {term}</li>
                ))}
              </ul>
              <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.termsAccepted} onChange={(event) => setForm({ ...form, termsAccepted: event.target.checked })} className="mt-1 h-4 w-4 rounded border-stone-300" />
                <span>I have read and accept these marketplace buying terms.</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <button type="submit" disabled={!cart.length} className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                Submit order
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-semibold text-slate-900">Payment details</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <InfoLine label="Pay to UPI" value={PLATFORM_UPI} />
              <InfoLine label="Order total" value={money(total)} />
              <InfoLine label="Platform fee" value={money(Math.round(total * PLATFORM_COMMISSION))} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-slate-900">Items in order</h3>
            <div className="mt-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 rounded-[1.25rem] bg-stone-50 p-3">
                  <ProductImage image={item.product.image} name={item.product.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{item.product.name}</div>
                    <div className="text-xs text-slate-500">Qty {item.quantity}</div>
                  </div>
                  <div className="text-sm font-medium text-slate-800">{money(item.product.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OrderSuccessPage({ order, onContinueShopping }: { order: Order; onContinueShopping: () => void }) {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-2xl">OK</div>
      <h1 className="font-display mt-6 text-3xl font-semibold text-slate-900">Order submitted</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Your order has been recorded and is waiting for payment verification. Keep your UTR and payment screenshot until the order is confirmed.
      </p>

      <div className="mt-8 rounded-[1.5rem] bg-stone-100 p-5 text-left">
        <InfoLine label="Order ID" value={order.id} />
        <InfoLine label="Amount" value={money(order.totalAmount)} />
        <InfoLine label="Payment status" value={labelForPaymentStatus(order.paymentStatus)} />
        <InfoLine label="Submitted" value={dateTime(order.createdAt)} />
      </div>

      <button onClick={onContinueShopping} className="mt-8 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white">
        Continue shopping
      </button>
    </div>
  );
}

function SellerAuthPage({
  onLogin,
  onRegister,
}: {
  onLogin: (seller: Seller) => void;
  onRegister: (seller: Seller) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    storeName: '',
    storeDescription: '',
    upiId: '',
    password: '',
  });
  const [error, setError] = useState('');

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[2rem] border border-stone-200 bg-stone-100 p-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Seller access</p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-slate-900">Join the marketplace</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Sellers can create a store, upload actual product images, manage listings, and track orders after payment verification.
        </p>
        <div className="mt-8 space-y-3">
          <SoftCard title="Create your store" text="Add your business name, UPI ID, and seller profile in a few steps." />
          <SoftCard title="Upload real images" text="List actual product photos instead of placeholders." />
          <SoftCard title="Track payments" text="Orders move forward after manual payment verification." />
        </div>
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex gap-3">
          <button onClick={() => setMode('register')} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'register' ? 'bg-slate-900 text-white' : 'border border-stone-200 text-slate-700'}`}>
            Register
          </button>
          <button onClick={() => setMode('login')} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'login' ? 'bg-slate-900 text-white' : 'border border-stone-200 text-slate-700'}`}>
            Login
          </button>
        </div>

        {error && <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {mode === 'login' ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const seller = loginSeller(loginForm.email.trim(), loginForm.password);
              if (!seller) {
                setError('Invalid seller email or password');
                return;
              }
              setError('');
              onLogin(seller);
            }}
            className="mt-6 space-y-4"
          >
            <Field label="Email"><input value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="input" placeholder="Seller email" /></Field>
            <Field label="Password"><input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="input" placeholder="Password" /></Field>
            <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Login</button>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const seller = registerSeller(registerForm);
                setError('');
                onRegister(seller);
              } catch (error) {
                setError(error instanceof Error ? error.message : 'Unable to register seller');
              }
            }}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <Field label="Your name"><input value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} className="input" placeholder="Owner name" /></Field>
            <Field label="Phone"><input value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} className="input" placeholder="Phone number" /></Field>
            <Field label="Email"><input value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} className="input" placeholder="Store email" /></Field>
            <Field label="UPI ID"><input value={registerForm.upiId} onChange={(event) => setRegisterForm({ ...registerForm, upiId: event.target.value })} className="input" placeholder="yourstore@upi" /></Field>
            <Field label="Store name"><input value={registerForm.storeName} onChange={(event) => setRegisterForm({ ...registerForm, storeName: event.target.value })} className="input" placeholder="Store name" /></Field>
            <Field label="Password"><input type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} className="input" placeholder="Password" /></Field>
            <Field label="Store description" className="sm:col-span-2"><textarea value={registerForm.storeDescription} onChange={(event) => setRegisterForm({ ...registerForm, storeDescription: event.target.value })} rows={4} className="input min-h-[120px]" placeholder="What do you sell?" /></Field>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Create seller account</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SellerDashboard({
  seller,
  refreshMarketplace,
  notify,
  onLogout,
}: {
  seller: Seller;
  refreshMarketplace: () => void;
  notify: (text: string) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'products' | 'add' | 'orders'>('overview');
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'Electronics',
    stock: '',
    image: '',
  });

  const refreshSeller = useCallback(() => {
    setSellerProducts(getProductsBySeller(seller.id));
    setSellerOrders(getOrdersBySeller(seller.id));
  }, [seller.id]);

  useEffect(() => {
    refreshSeller();
  }, [refreshSeller]);

  const payoutReady = sellerOrders
    .filter((order) => order.paymentStatus === 'verified')
    .reduce((sum, order) => {
      const myGross = order.items
        .filter((item) => item.product.sellerId === seller.id)
        .reduce((subtotal, item) => subtotal + item.product.price * item.quantity, 0);
      return sum + (myGross - Math.round(myGross * PLATFORM_COMMISSION));
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Seller dashboard</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-slate-900">{seller.storeName}</h1>
          <p className="mt-2 text-sm text-slate-600">{seller.storeDescription || 'Manage your products, orders, and payouts.'}</p>
        </div>
        <button onClick={onLogout} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700">Logout</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {[
          ['overview', 'Overview'],
          ['products', 'Products'],
          ['add', 'Add product'],
          ['orders', 'Orders'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value as 'overview' | 'products' | 'add' | 'orders')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${tab === value ? 'bg-slate-900 text-white' : 'border border-stone-200 bg-white text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Listed products" value={`${sellerProducts.length}`} />
          <MetricCard label="Orders" value={`${sellerOrders.length}`} />
          <MetricCard label="Lifetime earnings" value={money(seller.totalEarnings)} />
          <MetricCard label="Ready after verification" value={money(payoutReady)} />
        </div>
      )}

      {tab === 'products' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sellerProducts.length === 0 && <EmptyState title="No products listed yet" text="Use the Add product tab to publish your first listing." compact />}
          {sellerProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-sm">
              <ProductImage image={product.image} name={product.name} className="h-56 w-full object-cover" />
              <div className="p-5">
                <div className="font-display text-xl font-semibold text-slate-900">{product.name}</div>
                <div className="mt-2 text-sm text-slate-500">{product.category}</div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                  <span>{money(product.price)}</span>
                  <span>Stock {product.stock}</span>
                </div>
                <button
                  onClick={() => {
                    deleteProduct(product.id);
                    refreshMarketplace();
                    refreshSeller();
                    notify('Product removed');
                  }}
                  className="mt-5 text-sm font-medium text-rose-600"
                >
                  Remove product
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'add' && (
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-display text-3xl font-semibold text-slate-900">Add a product</h2>
          <p className="mt-2 text-sm text-slate-500">Upload an actual image from your device and publish the listing.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!form.name.trim() || !form.price.trim() || !form.stock.trim() || !form.image) {
                notify('Please add the name, price, stock, and product image');
                return;
              }

              addProduct({
                sellerId: seller.id,
                sellerName: seller.name,
                storeName: seller.storeName,
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price),
                originalPrice: Number(form.originalPrice || form.price),
                category: form.category,
                image: form.image,
                stock: Number(form.stock),
              });

              setForm({ name: '', description: '', price: '', originalPrice: '', category: 'Electronics', stock: '', image: '' });
              refreshMarketplace();
              refreshSeller();
              setTab('products');
              notify('Product listed');
            }}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <Field label="Product name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Product name" /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="input">
                {['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Other'].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="Selling price"><input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="input" placeholder="499" /></Field>
            <Field label="Original price"><input type="number" value={form.originalPrice} onChange={(event) => setForm({ ...form, originalPrice: event.target.value })} className="input" placeholder="799" /></Field>
            <Field label="Stock"><input type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="input" placeholder="20" /></Field>
            <Field label="Upload image">
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const image = await readFileAsDataUrl(file);
                  setForm((current) => ({ ...current, image }));
                }}
                className="block w-full rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-slate-600"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} className="input min-h-[140px]" placeholder="Describe the item clearly for buyers" /></Field>
            {form.image && (
              <div className="sm:col-span-2 rounded-[1.5rem] bg-stone-100 p-4">
                <p className="mb-3 text-sm font-medium text-slate-600">Image preview</p>
                <img src={form.image} alt="Upload preview" className="h-72 w-full rounded-[1.25rem] object-cover" />
              </div>
            )}
            {form.price && (
              <div className="sm:col-span-2 rounded-[1.5rem] bg-emerald-50 p-4 text-sm text-emerald-800">
                Platform keeps {money(Math.round(Number(form.price) * PLATFORM_COMMISSION))}. Expected seller share after verification: {money(Number(form.price) - Math.round(Number(form.price) * PLATFORM_COMMISSION))}
              </div>
            )}
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white">Publish product</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          {sellerOrders.length === 0 && <EmptyState title="No orders yet" text="Orders for your products will appear here." compact />}
          {sellerOrders.map((order) => {
            const myItems = order.items.filter((item) => item.product.sellerId === seller.id);
            const myGross = myItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            const myNet = myGross - Math.round(myGross * PLATFORM_COMMISSION);

            return (
              <div key={order.id} className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-2xl font-semibold text-slate-900">Order {order.id}</div>
                    <div className="mt-2 text-sm text-slate-500">Buyer: {order.buyerName}</div>
                    <div className="text-sm text-slate-500">Payment: {labelForPaymentStatus(order.paymentStatus)}</div>
                  </div>
                  <StatusPill status={order.paymentStatus} />
                </div>

                <div className="mt-5 space-y-3">
                  {myItems.map((item) => (
                    <div key={`${order.id}-${item.product.id}`} className="flex items-center gap-3 rounded-[1.25rem] bg-stone-50 p-3">
                      <ProductImage image={item.product.image} name={item.product.name} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">{item.product.name}</div>
                        <div className="text-xs text-slate-500">Qty {item.quantity}</div>
                      </div>
                      <div className="text-sm font-medium text-slate-800">{money(item.product.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <PanelStat label="Your gross" value={money(myGross)} />
                  <PanelStat label="Your share" value={money(myNet)} />
                  <PanelStat label="Order status" value={order.status} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {order.paymentStatus === 'verified' && order.status === 'confirmed' && (
                    <button onClick={() => { updateOrderStatus(order.id, 'shipped'); refreshSeller(); notify('Order marked as shipped'); }} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                      Mark shipped
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button onClick={() => { updateOrderStatus(order.id, 'delivered'); refreshSeller(); notify('Order marked as delivered'); }} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700">
                      Mark delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OwnerConsole({
  onBack,
  onLock,
  onRefresh,
  notify,
}: {
  onBack: () => void;
  onLock: () => void;
  onRefresh: () => void;
  notify: (text: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const refreshOrders = useCallback(() => {
    setOrders(getOrders());
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const pendingCount = orders.filter((order) => order.paymentStatus === 'verification-pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Owner console</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-slate-900">Payment verification</h1>
          <p className="mt-2 text-sm text-slate-600">Check UTR details and screenshots before releasing seller payout.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700">Back to shop</button>
          <button onClick={onLock} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Lock</button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Orders" value={`${orders.length}`} />
        <MetricCard label="Pending checks" value={`${pendingCount}`} />
        <MetricCard label="Platform UPI" value={PLATFORM_UPI} compact />
      </div>

      <div className="space-y-4">
        {orders.length === 0 && <EmptyState title="No orders yet" text="Orders waiting for verification will appear here." compact />}
        {orders.map((order) => (
          <div key={order.id} className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-display text-2xl font-semibold text-slate-900">Order {order.id}</div>
                <div className="mt-2 text-sm text-slate-500">{order.buyerName} - {order.buyerPhone}</div>
                <div className="text-sm text-slate-500">{order.buyerEmail}</div>
              </div>
              <StatusPill status={order.paymentStatus} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[1.5rem] bg-stone-50 p-4">
                <InfoLine label="Total amount" value={money(order.totalAmount)} />
                <InfoLine label="Platform fee" value={money(order.platformFee)} />
                <InfoLine label="Seller payout" value={money(order.sellerPayout)} />
                <InfoLine label="UTR" value={order.paymentReference} />
                <InfoLine label="Terms accepted" value={order.termsAccepted ? 'Yes' : 'No'} />
                <InfoLine label="Created" value={dateTime(order.createdAt)} />
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-stone-200 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment screenshot</div>
                  {order.paymentScreenshot ? (
                    <img src={order.paymentScreenshot} alt={`Payment proof for ${order.id}`} className="mt-3 h-56 w-full rounded-[1.25rem] object-cover" />
                  ) : (
                    <div className="mt-3 rounded-[1.25rem] bg-stone-50 p-6 text-sm text-slate-500">No screenshot uploaded.</div>
                  )}
                </div>
                <div className="rounded-[1.5rem] border border-stone-200 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Owner note</div>
                  <textarea
                    value={notes[order.id] ?? order.ownerNote}
                    onChange={(event) => setNotes((current) => ({ ...current, [order.id]: event.target.value }))}
                    rows={4}
                    className="input mt-3 min-h-[120px]"
                    placeholder="Add a verification note"
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        verifyOrderPayment(order.id, notes[order.id] ?? order.ownerNote);
                        refreshOrders();
                        onRefresh();
                        notify('Payment verified');
                      }}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Verify payment
                    </button>
                    <button
                      onClick={() => {
                        rejectOrderPayment(order.id, notes[order.id] ?? order.ownerNote);
                        refreshOrders();
                        onRefresh();
                        notify('Payment rejected for recheck');
                      }}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700"
                    >
                      Reject / recheck
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] bg-stone-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Items</div>
              <div className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.product.id}`} className="flex items-center gap-3 rounded-[1.25rem] bg-white p-3">
                    <ProductImage image={item.product.image} name={item.product.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{item.product.name}</div>
                      <div className="text-xs text-slate-500">{item.product.storeName} - Qty {item.quantity}</div>
                    </div>
                    <div className="text-sm font-medium text-slate-800">{money(item.product.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SoftCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4">
      <div className="font-display text-xl font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function MetricCard({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`font-display mt-3 font-semibold text-slate-900 ${compact ? 'break-all text-lg' : 'text-3xl'}`}>{value}</div>
    </div>
  );
}

function PanelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-stone-50 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="break-all font-medium text-slate-800">{value}</span>
    </div>
  );
}

function EmptyState({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return (
    <div className={`rounded-[1.75rem] border border-dashed border-stone-300 bg-white text-center shadow-sm ${compact ? 'p-8' : 'p-12'}`}>
      <h2 className="font-display text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const style = status === 'verified'
    ? 'bg-emerald-100 text-emerald-800'
    : status === 'rejected'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-amber-100 text-amber-800';

  return <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${style}`}>{labelForPaymentStatus(status)}</span>;
}

function labelForPaymentStatus(status: PaymentStatus): string {
  if (status === 'verified') return 'Verified';
  if (status === 'rejected') return 'Rejected';
  return 'Verification pending';
}