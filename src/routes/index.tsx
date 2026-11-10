import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Heart,
  Minus,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import outerwearImage from "@/assets/atelier-outerwear.jpg";
import {
  SETTINGS,
  categories,
  chestInches,
  discountOf,
  formatPrice,
  productById,
  products,
  reviews,
  sizes,
  type CartItem,
  type Category,
  type Order,
  type Product,
} from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OSVRYN — Everyday Layers" },
      {
        name: "description",
        content: "Explore considered jackets, trackwear, shirts and everyday layers from OSVRYN.",
      },
      { property: "og:title", content: "OSVRYN — Everyday Layers" },
      { property: "og:description", content: "Considered layers. Made for wherever the day goes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Storefront,
});

const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";
const navLink =
  "text-xs font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60";
const control =
  "h-10 border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const field = "mt-1 w-full border border-input bg-background px-3 py-2 text-sm font-normal";

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function Storefront() {
  const [category, setCategory] = useState<Category>("All pieces");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartView, setCartView] = useState<"bag" | "checkout" | "done">("bag");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");
  const [maxPrice, setMaxPrice] = useState(0);
  const [saleOnly, setSaleOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [signupMessage, setSignupMessage] = useState("");
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [formError, setFormError] = useState("");
  const [ready, setReady] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setCart(load("osvryn_cart", []));
    setWishlist(load("osvryn_wishlist", []));
    setOrders(load("osvryn_orders", []));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("osvryn_cart", JSON.stringify(cart));
      localStorage.setItem("osvryn_wishlist", JSON.stringify(wishlist));
      localStorage.setItem("osvryn_orders", JSON.stringify(orders));
    } catch {
      /* storage unavailable */
    }
  }, [cart, wishlist, orders, ready]);

  function notify(text: string, error = false) {
    setToast({ text, error });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const visibleProducts = useMemo(() => {
    const list = products.filter((product) => {
      const categoryMatches = category === "All pieces" || product.category === category;
      const searchMatches =
        `${product.name} ${product.category} ${product.color} ${product.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return (
        categoryMatches &&
        searchMatches &&
        (!saleOnly || discountOf(product) > 0) &&
        (!savedOnly || wishlist.includes(product.id)) &&
        (!maxPrice || product.price <= maxPrice)
      );
    });
    return sort === "low"
      ? list.sort((a, b) => a.price - b.price)
      : sort === "high"
        ? list.sort((a, b) => b.price - a.price)
        : list;
  }, [category, query, sort, saleOnly, savedOnly, maxPrice, wishlist]);

  const cartLines = cart.flatMap((item) => {
    const product = productById(item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartLines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );
  const inCart = (id: number) =>
    cart.filter((item) => item.productId === id).reduce((total, item) => total + item.quantity, 0);
  const sizeOf = (id: number) => selectedSizes[id] ?? "M";

  function addToCart(product: Product, size = sizeOf(product.id), quantity = 1) {
    if (product.stock < 1) return notify("Out of stock", true);
    if (inCart(product.id) + quantity > product.stock)
      return notify(`Only ${product.stock} in stock`, true);
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.size === size);
      if (existing)
        return current.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item,
        );
      return [...current, { productId: product.id, size, quantity }];
    });
    setQuickView(null);
    setCartView("bag");
    setCartOpen(true);
  }

  function changeQuantity(productId: number, size: string, adjustment: number) {
    const product = productById(productId);
    if (product && adjustment > 0 && inCart(productId) + adjustment > product.stock)
      return notify(`Only ${product.stock} in stock`, true);
    setCart((current) =>
      current.flatMap((item) => {
        if (item.productId !== productId || item.size !== size) return [item];
        const nextQuantity = item.quantity + adjustment;
        return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
      }),
    );
  }

  function toggleWishlist(product: Product) {
    const saved = wishlist.includes(product.id);
    setWishlist((current) =>
      saved ? current.filter((id) => id !== product.id) : [...current, product.id],
    );
    notify(saved ? "Removed from wishlist" : "Saved to wishlist");
  }

  function openWhatsApp(text?: string) {
    const number = SETTINGS.whatsapp.replace(/\D/g, "");
    if (number.length < 7)
      return notify("WhatsApp number not set yet. Add it in src/lib/catalog.ts.", true);
    window.open(
      `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
      "_blank",
      "noopener",
    );
  }

  function readCheckout(form: HTMLFormElement) {
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    const missing: string[] = [];
    if (get("name").length < 2) missing.push("full name");
    if (!/^[+\d][\d\s-]{6,}$/.test(get("phone"))) missing.push("a valid phone number");
    if (get("email") && !/^\S+@\S+\.\S+$/.test(get("email"))) missing.push("a valid email");
    if (!get("city")) missing.push("city");
    if (get("address").length < 5) missing.push("delivery address");
    if (missing.length) {
      setFormError(`Please provide: ${missing.join(", ")}.`);
      return null;
    }
    setFormError("");
    return {
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      city: get("city"),
      address: get("address"),
      note: get("note"),
      payment: get("payment"),
    };
  }

  const orderLines = () =>
    cartLines.map((line) => ({
      name: line.product.name,
      size: line.size,
      quantity: line.quantity,
      price: line.product.price,
    }));
  const grandTotal = cartTotal + SETTINGS.deliveryFee;

  function placeOrder(form: HTMLFormElement) {
    const customer = readCheckout(form);
    if (!customer) return;
    if (cartLines.some((line) => inCart(line.productId) > line.product.stock))
      return notify("Stock changed. Please review your bag.", true);
    const order: Order = {
      number: `ORD-${Date.now().toString(36).toUpperCase()}`,
      placedAt: new Date().toLocaleString(),
      lines: orderLines(),
      customer,
      subtotal: cartTotal,
      delivery: SETTINGS.deliveryFee,
      total: grandTotal,
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    setCartView("done");
  }

  function orderViaWhatsApp(form: HTMLFormElement) {
    const customer = readCheckout(form);
    if (!customer) return;
    const lines = orderLines()
      .map((l) => `• ${l.name} (${l.size}) x${l.quantity} = ${formatPrice(l.price * l.quantity)}`)
      .join("\n");
    openWhatsApp(
      `New order — OSVRYN\n\n${lines}\n\nSubtotal: ${formatPrice(cartTotal)}\nDelivery: ${formatPrice(SETTINGS.deliveryFee)}\nTotal: ${formatPrice(grandTotal)}\nPayment: ${customer.payment}\n\nName: ${customer.name}\nPhone: ${customer.phone}\nCity: ${customer.city}\nAddress: ${customer.address}${customer.note ? `\nNote: ${customer.note}` : ""}`,
    );
  }

  function showCollection(next: Category) {
    setCategory(next);
    setSavedOnly(false);
    setSaleOnly(false);
  }

  const lastOrder = orders[0];
  const discounted = products
    .filter((product) => discountOf(product) > 0)
    .sort((a, b) => discountOf(b) - discountOf(a));

  const renderCard = (product: Product, index: number, total: number) => {
    const discount = discountOf(product);
    const saved = wishlist.includes(product.id);
    return (
      <article key={product.id} className="min-w-0">
        <div className="product-photo group relative">
          <img
            src={product.image}
            alt={`${product.name} in ${product.color}`}
            width={1200}
            height={1200}
            loading="lazy"
          />
          <button
            aria-label={
              saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
            }
            aria-pressed={saved}
            onClick={() => toggleWishlist(product)}
            className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-background shadow sm:right-3 sm:top-3"
          >
            <Heart className="size-4" fill={saved ? "currentColor" : "none"} />
          </button>
          <span className="absolute left-2 top-2 bg-background px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] sm:left-3 sm:top-3 sm:text-[9px]">
            {product.label}
          </span>
          {discount > 0 && (
            <span className="absolute left-2 top-9 bg-accent px-2 py-1 text-[9px] font-bold text-accent-foreground sm:left-3 sm:top-11">
              -{discount}%
            </span>
          )}
          <span className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 text-[9px] uppercase tracking-[0.08em] sm:bottom-3 sm:right-3">
            0{index + 1} / 0{total}
          </span>
        </div>
        <div className="flex items-start justify-between gap-1 pt-3">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold sm:text-[15px]">{product.name}</h3>
            <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
              {product.category} · {product.color} · ★ {product.rating}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[11px] font-semibold sm:text-sm">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <s className="block text-[10px] text-muted-foreground">
                {formatPrice(product.oldPrice)}
              </s>
            )}
          </div>
        </div>
        <p
          className={`mt-1 text-[10px] sm:text-xs ${product.stock > 0 && product.stock <= 10 ? "font-semibold text-accent" : "text-muted-foreground"}`}
        >
          {product.stock < 1
            ? "Out of stock"
            : product.stock <= 10
              ? `Only ${product.stock} left`
              : `${product.stock} in stock`}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor={`size-${product.id}`}>
            Choose size for {product.name}
          </label>
          <select
            id={`size-${product.id}`}
            value={sizeOf(product.id)}
            onChange={(event) =>
              setSelectedSizes((current) => ({ ...current, [product.id]: event.target.value }))
            }
            className="h-10 min-w-0 flex-1 border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {sizes.map((size) => (
              <option key={size} value={size}>
                Size {size}
              </option>
            ))}
          </select>
          <Button
            variant="default"
            disabled={product.stock < 1}
            className="h-10 flex-1 rounded-none px-2 text-[9px] uppercase tracking-[0.07em] sm:text-[10px]"
            onClick={() => addToCart(product)}
          >
            <ShoppingBag className="size-3.5" /> Add to bag
          </Button>
        </div>
        <button
          className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => setQuickView(product)}
        >
          View details
        </button>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground sm:text-xs">
        A considered uniform for wherever the day goes · Cash on Delivery · Order on WhatsApp
      </div>

      <div className="border-b ink-rule">
        <header className="shop-shell relative flex h-[68px] items-center justify-between px-4 sm:px-8">
          <nav className="hidden items-center gap-6 md:flex" aria-label="Shop by category">
            <a href="#collection" onClick={() => showCollection("Jackets")} className={navLink}>
              Outerwear
            </a>
            <a href="#collection" onClick={() => showCollection("Trackwear")} className={navLink}>
              Trackwear
            </a>
            <a href="#collection" onClick={() => showCollection("Shirts")} className={navLink}>
              Shirts
            </a>
            <a href="#sale" className={`${navLink} hidden lg:inline`}>
              Sale
            </a>
            <a href="#about" className={`${navLink} hidden lg:inline`}>
              About
            </a>
            <a href="#contact" className={`${navLink} hidden lg:inline`}>
              Contact
            </a>
          </nav>

          <a
            href="#top"
            className="display-type absolute left-1/2 -translate-x-1/2 text-[32px] leading-none tracking-[0.14em]"
          >
            OSVRYN
          </a>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={searchOpen ? "Close search" : "Open search"}
              onClick={() => {
                setSearchOpen(!searchOpen);
                setQuery("");
              }}
            >
              {searchOpen ? <X /> : <Search />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Saved pieces, ${wishlist.length}`}
              onClick={() => {
                setSavedOnly(true);
                setCategory("All pieces");
                document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Heart />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                  {wishlist.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Open bag, ${cartCount} items`}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                {cartCount}
              </span>
            </Button>
          </div>
        </header>
      </div>

      {searchOpen && (
        <div className="border-b ink-rule">
          <div className="shop-shell px-4 py-4 sm:px-8">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <div className="flex items-center gap-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                id="product-search"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find your next layer"
                className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      )}

      <section
        id="top"
        className="shop-shell grid grid-cols-1 gap-6 px-4 pb-12 pt-7 sm:px-8 lg:grid-cols-[0.83fr_1.17fr] lg:gap-10 lg:pb-16 lg:pt-10"
      >
        <div className="flex min-h-[390px] flex-col justify-between py-2 lg:min-h-[560px] lg:py-4">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-2 rounded-full bg-accent" />
            The everyday collection · 01 / 04
          </div>
          <div className="max-w-xl py-10 lg:py-0">
            <h1 className="display-type max-w-[9ch] text-[76px] leading-[0.83] sm:text-[92px] lg:text-[clamp(100px,11.3vw,160px)]">
              MADE FOR
              <br />
              MOVEMENT.
            </h1>
            <p className="mt-7 max-w-[350px] text-[15px] leading-6 text-muted-foreground">
              Thoughtful layers. Clean lines. Everyday pieces that just feel right.
            </p>
            <Button
              asChild
              className="mt-7 h-12 rounded-none px-6 text-xs uppercase tracking-[0.1em]"
            >
              <a href="#collection">
                Explore the collection <ArrowRight />
              </a>
            </Button>
          </div>
          <a
            href="#collection"
            className="flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            A new point of view <ArrowDown className="size-3" />
          </a>
        </div>

        <div className="hero-photo min-h-[420px] lg:min-h-[560px]">
          <img
            src={outerwearImage}
            alt="Model wearing the OSVRYN Form Bomber"
            width={1200}
            height={1200}
            fetchPriority="high"
          />
          <div className="hero-caption absolute bottom-4 left-4 right-4 flex items-end justify-between text-primary-foreground sm:bottom-6 sm:left-6 sm:right-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                01 — Outerwear, reworked
              </p>
              <p className="display-type mt-1 text-4xl leading-none sm:text-5xl">THE FORM BOMBER</p>
            </div>
            <a
              href="#collection"
              aria-label="Explore the Form Bomber"
              className="flex size-11 items-center justify-center rounded-full bg-background text-foreground transition-transform hover:translate-x-1"
            >
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-y bg-secondary/70" aria-label="Store values">
        <div className="shop-shell grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
          {[
            "Made to wear on repeat",
            "Clean, considered fits",
            "Easy everyday layers",
            "The first OSVRYN edit",
          ].map((value, index) => (
            <div
              key={value}
              className="flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]"
            >
              <span className="text-accent">0{index + 1}</span>
              {value}
            </div>
          ))}
        </div>
      </section>

      <section id="collection" className="shop-shell px-4 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b pb-5 ink-rule sm:pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Find your everyday
            </p>
            <h2 className="display-type mt-2 text-6xl leading-[0.9] sm:text-7xl">THE FIRST EDIT</h2>
          </div>
          <span className="pb-1 text-xs text-muted-foreground">
            {visibleProducts.length.toString().padStart(2, "0")} considered pieces
          </span>
        </div>

        <div
          className="flex flex-wrap gap-2 py-5"
          role="group"
          aria-label="Filter by clothing type"
        >
          {categories.map((option) => (
            <Button
              key={option}
              variant={category === option ? "default" : "outline"}
              size="sm"
              className="rounded-none px-4 text-[10px] uppercase tracking-[0.08em]"
              aria-pressed={category === option}
              onClick={() => showCollection(option)}
            >
              {option}
            </Button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className={control}
          >
            <option value="featured">Sort: Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
          <label className="sr-only" htmlFor="max-price">
            Max price
          </label>
          <select
            id="max-price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
            className={control}
          >
            <option value={0}>Any price</option>
            <option value={8000}>Under Rs. 8,000</option>
            <option value={13000}>Under Rs. 13,000</option>
            <option value={16000}>Under Rs. 16,000</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={saleOnly}
              onChange={(e) => setSaleOnly(e.target.checked)}
            />{" "}
            Sale only
          </label>
          {savedOnly && (
            <button
              className="border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ink-rule"
              onClick={() => setSavedOnly(false)}
            >
              Showing saved pieces · Show all ✕
            </button>
          )}
        </div>

        {visibleProducts.length ? (
          <div className="shop-grid">
            {visibleProducts.map((product, index) =>
              renderCard(product, index, visibleProducts.length),
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {savedOnly
              ? "Nothing saved yet. Tap the heart on any piece."
              : "No pieces found. Try another search or filter."}
          </div>
        )}
      </section>

      <section className="border-y bg-secondary/70" aria-label="How to order">
        <div className="shop-shell grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
          {[
            "Cash on Delivery",
            "Order via WhatsApp",
            "Bank transfer option",
            "Live stock count",
          ].map((value, index) => (
            <div
              key={value}
              className="flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]"
            >
              <span className="text-accent">0{index + 1}</span>
              {value}
            </div>
          ))}
        </div>
      </section>

      <section id="sale" className="shop-shell px-4 py-12 sm:px-8 sm:py-16">
        <div className="border-b pb-5 ink-rule sm:pb-6">
          <p className={eyebrow}>Biggest discounts right now</p>
          <h2 className="display-type mt-2 text-6xl leading-[0.9] sm:text-7xl">SPECIAL OFFERS</h2>
        </div>
        <div className="shop-grid mt-6">
          {discounted.map((product, index) => renderCard(product, index, discounted.length))}
        </div>
      </section>

      <section className="shop-shell px-4 pb-12 sm:px-8 sm:pb-16" aria-labelledby="reviews-title">
        <div className="border-b pb-5 ink-rule sm:pb-6">
          <p className={eyebrow}>Sample reviews. Replace with real feedback</p>
          <h2 id="reviews-title" className="display-type mt-2 text-6xl leading-[0.9] sm:text-7xl">
            WHAT CUSTOMERS SAY
          </h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <blockquote key={review.name} className="border bg-secondary/70 p-6 ink-rule">
              <span className="text-accent">★★★★★</span>
              <p className="mt-3 text-[15px] leading-6">{review.text}</p>
              <footer className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                — {review.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-primary-foreground">
        <div className="shop-shell grid gap-6 px-4 py-10 sm:px-8 sm:py-14 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-65">
              A note from OSVRYN
            </p>
            <h2 className="display-type mt-2 text-5xl leading-[0.9] sm:text-6xl">
              LESS NOISE.
              <br />
              MORE WEAR.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 opacity-75">
              Getting dressed should feel simple. Start with a good layer, add the rest as you go.
            </p>
          </div>
          <a
            href="#collection"
            className="flex w-fit items-center gap-2 border-b border-primary-foreground/40 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            Shop the first edit <ArrowRight className="size-3.5" />
          </a>
        </div>
      </section>

      <section id="about" className="shop-shell px-4 py-12 sm:px-8 sm:py-16">
        <div className="border-b pb-5 ink-rule sm:pb-6">
          <p className={eyebrow}>About OSVRYN</p>
          <h2 className="display-type mt-2 text-6xl leading-[0.9] sm:text-7xl">WHY OSVRYN</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Our store",
              "A small studio making jackets, trackwear and shirts for everyday wear. (Sample text, edit it.)",
            ],
            ["Our mission", "Well-cut everyday clothing with honest pricing and friendly service."],
            [
              "Our products",
              "Jackets, track sets and heavyweight shirts, chosen for comfort, durability and value.",
            ],
            [
              "Why shop with us",
              "Simple ordering, clear prices, cash on delivery and direct WhatsApp support.",
            ],
          ].map(([title, text]) => (
            <div key={title} className="border p-5 ink-rule">
              <h3 className="display-type text-3xl leading-none">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="shop-shell px-4 pb-12 sm:px-8 sm:pb-16">
        <div className="border-b pb-5 ink-rule sm:pb-6">
          <p className={eyebrow}>We reply fast</p>
          <h2 className="display-type mt-2 text-6xl leading-[0.9] sm:text-7xl">CONTACT US</h2>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3 border p-6 text-sm ink-rule">
            <p>
              Email:{" "}
              <a className="underline" href={`mailto:${SETTINGS.email}`}>
                {SETTINGS.email}
              </a>
            </p>
            <p>Phone: {SETTINGS.phone}</p>
            <p>Address: {SETTINGS.address}</p>
            <Button
              className="rounded-none text-xs uppercase tracking-[0.1em]"
              onClick={() => openWhatsApp()}
            >
              <MessageCircle /> Chat on WhatsApp
            </Button>
          </div>
          <form
            className="space-y-3 border p-6 ink-rule"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              location.href = `mailto:${SETTINGS.email}?subject=${encodeURIComponent(`Message from ${data.get("name")}`)}&body=${encodeURIComponent(`${data.get("message")}\n\n${data.get("name")} (${data.get("email")})`)}`;
            }}
          >
            <p className="text-xs text-muted-foreground">
              This opens your email app with the message ready to send.
            </p>
            <label className="block text-sm font-semibold">
              Name
              <input name="name" required className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Email
              <input name="email" type="email" required className={field} />
            </label>
            <label className="block text-sm font-semibold">
              Message
              <textarea name="message" required rows={3} className={field} />
            </label>
            <Button type="submit" className="rounded-none text-xs uppercase tracking-[0.1em]">
              Send message
            </Button>
          </form>
        </div>
      </section>

      <footer className="shop-shell grid gap-8 px-4 py-10 sm:px-8 sm:py-12 md:grid-cols-2">
        <div>
          <a href="#top" className="display-type text-4xl tracking-[0.14em]">
            OSVRYN
          </a>
          <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
            Considered layers for wherever the day goes.
          </p>
        </div>
        <form
          className="md:justify-self-end md:text-right"
          onSubmit={(event) => {
            event.preventDefault();
            setSignupMessage("You're on the list. Look out for the next OSVRYN edit.");
          }}
        >
          <label
            htmlFor="newsletter-email"
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            A little more OSVRYN, now and then
          </label>
          <div className="mt-3 flex max-w-md border-b border-foreground md:ml-auto">
            <input
              id="newsletter-email"
              required
              type="email"
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" variant="ghost" size="icon" aria-label="Join the email list">
              <ArrowRight />
            </Button>
          </div>
          <p aria-live="polite" className="mt-2 min-h-4 text-xs text-muted-foreground">
            {signupMessage}
          </p>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[9px] uppercase tracking-[0.09em] text-muted-foreground ink-rule md:col-span-2">
          <span>© 2026 OSVRYN STUDIO</span>
          <span>We accept: Cash on Delivery · Bank transfer</span>
          <span>Sample collection · Rs. PKR pricing</span>
        </div>
      </footer>

      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <div className="cart-overlay absolute inset-0" />
          <aside
            className="relative flex h-full w-full max-w-[420px] flex-col bg-background shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div className="flex items-center justify-between border-b px-5 py-4 ink-rule">
              <div>
                <h2 id="cart-title" className="display-type text-4xl leading-none">
                  {cartView === "bag"
                    ? "YOUR BAG"
                    : cartView === "checkout"
                      ? "CHECKOUT"
                      : "ORDER SAVED"}{" "}
                  {cartView === "bag" && <span className="font-sans text-sm">({cartCount})</span>}
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {cartView === "bag"
                    ? "Your edit, so far"
                    : cartView === "checkout"
                      ? "Cash on Delivery or bank transfer"
                      : "Thank you"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close bag"
                onClick={() => setCartOpen(false)}
              >
                <X />
              </Button>
            </div>

            {cartView === "done" && lastOrder ? (
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-sm">
                  Order number <b>{lastOrder.number}</b>
                </p>
                <p className="mt-3 border p-3 text-xs leading-5 ink-rule">
                  <b>Important:</b> this order is saved only in this browser. It has <b>not</b> been
                  sent to the store yet. To order for real, use “Order on WhatsApp” at checkout or
                  contact the store directly.
                </p>
                <div className="mt-4 space-y-1">
                  {lastOrder.lines.map((l) => (
                    <div key={`${l.name}-${l.size}`} className="flex justify-between gap-2 text-sm">
                      <span>
                        {l.name} · {l.size} × {l.quantity}
                      </span>
                      <span>{formatPrice(l.price * l.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>{formatPrice(lastOrder.delivery)}</span>
                </div>
                <div className="mt-1 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(lastOrder.total)}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {lastOrder.customer.name} · {lastOrder.customer.phone}
                  <br />
                  {lastOrder.customer.address}, {lastOrder.customer.city}
                  <br />
                  {lastOrder.customer.payment}
                </p>
                <Button
                  className="mt-5 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]"
                  onClick={() => {
                    setCartOpen(false);
                    setCartView("bag");
                  }}
                >
                  Continue shopping
                </Button>
              </div>
            ) : cartLines.length && cartView === "checkout" ? (
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(event) => {
                  event.preventDefault();
                  placeOrder(event.currentTarget);
                }}
              >
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  <label className="block text-sm font-semibold">
                    Full name *<input name="name" autoComplete="name" className={field} />
                  </label>
                  <label className="block text-sm font-semibold">
                    Phone number *
                    <input name="phone" type="tel" autoComplete="tel" className={field} />
                  </label>
                  <label className="block text-sm font-semibold">
                    Email (optional)
                    <input name="email" type="email" autoComplete="email" className={field} />
                  </label>
                  <label className="block text-sm font-semibold">
                    City *<input name="city" autoComplete="address-level2" className={field} />
                  </label>
                  <label className="block text-sm font-semibold">
                    Complete delivery address *
                    <textarea name="address" rows={2} className={field} />
                  </label>
                  <label className="block text-sm font-semibold">
                    Additional instructions
                    <textarea name="note" rows={2} className={field} />
                  </label>
                  <fieldset>
                    <legend className="text-sm font-semibold">Payment</legend>
                    <label className="mt-1 block text-sm">
                      <input type="radio" name="payment" value="Cash on Delivery" defaultChecked />{" "}
                      Cash on Delivery
                    </label>
                    <label className="block text-sm">
                      <input
                        type="radio"
                        name="payment"
                        value="Bank transfer (arranged manually)"
                      />{" "}
                      Bank transfer (arranged manually)
                    </label>
                  </fieldset>
                  <p role="alert" className="min-h-4 text-xs text-accent">
                    {formError}
                  </p>
                </div>
                <div className="border-t p-5 ink-rule">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>{formatPrice(SETTINGS.deliveryFee)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                  <Button
                    type="submit"
                    className="mt-4 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]"
                  >
                    Place order
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 h-11 w-full rounded-none text-xs uppercase tracking-[0.1em]"
                    onClick={(event) => orderViaWhatsApp(event.currentTarget.form!)}
                  >
                    Order on WhatsApp
                  </Button>
                  <button
                    type="button"
                    className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground underline underline-offset-4"
                    onClick={() => setCartView("bag")}
                  >
                    ← Back to bag
                  </button>
                </div>
              </form>
            ) : cartLines.length ? (
              <>
                <div className="flex-1 overflow-y-auto px-5">
                  {cartLines.map(({ product, size, quantity }) => (
                    <div
                      key={`${product.id}-${size}`}
                      className="flex gap-4 border-b py-4 ink-rule"
                    >
                      <img
                        src={product.image}
                        alt=""
                        width={120}
                        height={120}
                        className="size-24 object-cover"
                      />
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                        <div>
                          <h3 className="text-sm font-semibold">{product.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {product.color} · Size {size}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Remove one ${product.name}`}
                              onClick={() => changeQuantity(product.id, size, -1)}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-5 text-center text-xs">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Add one ${product.name}`}
                              onClick={() => changeQuantity(product.id, size, 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                          <span className="text-xs font-semibold">
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-5 ink-rule">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span>{formatPrice(SETTINGS.deliveryFee)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                  <Button
                    className="mt-4 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]"
                    onClick={() => setCartView("checkout")}
                  >
                    Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-2 h-11 w-full rounded-none text-xs uppercase tracking-[0.1em]"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue shopping
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <ShoppingBag className="size-8 text-muted-foreground" strokeWidth={1} />
                <p className="display-type mt-4 text-4xl">NOTHING IN HERE. YET.</p>
                <p className="mt-2 max-w-[220px] text-xs leading-5 text-muted-foreground">
                  Good pieces have a way of finding their place.
                </p>
                <Button
                  className="mt-5 rounded-none px-6 text-xs uppercase tracking-[0.1em]"
                  onClick={() => setCartOpen(false)}
                >
                  Browse the edit
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      <Dialog
        open={quickView !== null}
        onOpenChange={(open) => {
          if (!open) setQuickView(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-none p-0 sm:rounded-none">
          {quickView && (
            <QuickView
              product={quickView}
              saved={wishlist.includes(quickView.id)}
              inBag={inCart(quickView.id)}
              onAdd={addToCart}
              onSave={toggleWishlist}
              onWhatsApp={(size, qty) =>
                openWhatsApp(
                  `Hi! I want to order:\n${quickView.name} (${size}) x${qty} = ${formatPrice(quickView.price * qty)}\nPlease confirm availability and delivery.`,
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <button
        aria-label="Chat on WhatsApp"
        onClick={() => openWhatsApp()}
        className="fixed bottom-5 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-foreground text-primary-foreground shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle />
      </button>
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 px-4 py-2 text-xs font-semibold ${toast.error ? "bg-accent text-accent-foreground" : "bg-foreground text-primary-foreground"}`}
        >
          {toast.text}
        </div>
      )}
    </main>
  );
}

function QuickView({
  product,
  saved,
  inBag,
  onAdd,
  onSave,
  onWhatsApp,
}: {
  product: Product;
  saved: boolean;
  inBag: number;
  onAdd: (p: Product, size: string, qty: number) => void;
  onSave: (p: Product) => void;
  onWhatsApp: (size: string, qty: number) => void;
}) {
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const discount = discountOf(product);
  const left = Math.max(0, product.stock - inBag);
  return (
    <div className="grid md:grid-cols-2">
      <div className="product-photo">
        <img
          src={product.image}
          alt={`${product.name} in ${product.color}`}
          width={1200}
          height={1200}
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className={eyebrow}>
          {product.category} · {product.color}
        </p>
        <DialogTitle className="display-type mt-1 text-5xl font-normal leading-none">
          {product.name.toUpperCase()}
        </DialogTitle>
        <p className="mt-2 text-xs text-muted-foreground">★ {product.rating} (sample rating)</p>
        <p className="mt-3 flex items-baseline gap-3">
          <b className="text-xl">{formatPrice(product.price)}</b>
          {discount > 0 && (
            <>
              <s className="text-sm text-muted-foreground">{formatPrice(product.oldPrice)}</s>
              <span className="bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                -{discount}%
              </span>
            </>
          )}
        </p>
        <DialogDescription className="mt-3 text-sm leading-6">
          {product.description}
        </DialogDescription>

        <p className="mt-4 text-xs font-semibold">Size</p>
        <div className="mt-2 flex gap-2" role="group" aria-label="Size">
          {sizes.map((s) => (
            <Button
              key={s}
              variant={size === s ? "default" : "outline"}
              aria-pressed={size === s}
              onClick={() => setSize(s)}
              className="h-10 w-12 rounded-none"
            >
              {s}
            </Button>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold">Quantity</p>
        <div className="mt-2 flex items-center gap-3">
          <Button
            variant="outline"
            className="size-10 rounded-none"
            aria-label="Decrease"
            onClick={() => setQty(Math.max(1, qty - 1))}
          >
            <Minus className="size-3" />
          </Button>
          <b className="w-5 text-center text-sm">{qty}</b>
          <Button
            variant="outline"
            className="size-10 rounded-none"
            aria-label="Increase"
            onClick={() => setQty(Math.min(Math.max(1, left), qty + 1))}
          >
            <Plus className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {product.stock < 1 ? "Out of stock" : `${left} available`}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            disabled={left < 1}
            className="h-12 flex-1 rounded-none text-xs uppercase tracking-[0.1em]"
            onClick={() => onAdd(product, size, qty)}
          >
            <ShoppingBag /> Add to bag
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-none px-4"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={() => onSave(product)}
          >
            <Heart fill={saved ? "currentColor" : "none"} />
          </Button>
        </div>
        <Button
          variant="outline"
          className="mt-2 h-11 w-full rounded-none text-xs uppercase tracking-[0.1em]"
          onClick={() => onWhatsApp(size, qty)}
        >
          <MessageCircle /> Order on WhatsApp
        </Button>

        <details className="mt-4 border p-3 text-sm ink-rule">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.1em]">
            Size guide
          </summary>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr>
                <th className="py-1">Size</th>
                <th>Chest (in)</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((s) => (
                <tr key={s}>
                  <td className="py-1">{s}</td>
                  <td>{chestInches[s]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Approximate sample measurements. Replace with your real size chart.
          </p>
        </details>
        <details className="mt-2 border p-3 text-sm ink-rule">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.1em]">
            Delivery &amp; returns
          </summary>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Sample text. Replace with your real delivery times, charges and return policy.
          </p>
        </details>
      </div>
    </div>
  );
}
