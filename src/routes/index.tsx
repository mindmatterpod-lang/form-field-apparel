import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Heart,
  Landmark,
  Menu,
  Minus,
  MessageCircle,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import outerwearImage from "@/assets/atelier-outerwear.jpg";
import {
  SETTINGS,
  categories,
  chestInches,
  discountOf,
  formatPrice,
  productById,
  products,
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

const pick = (id: number) => productById(id) as Product;

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
  const [mega, setMega] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const delivery =
    cartTotal === 0 || cartTotal >= SETTINGS.freeDeliveryOver ? 0 : SETTINGS.deliveryFee;
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
  const grandTotal = cartTotal + delivery;

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
      delivery: delivery,
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
      `New order — OSVRYN\n\n${lines}\n\nSubtotal: ${formatPrice(cartTotal)}\nDelivery: ${formatPrice(delivery)}\nTotal: ${formatPrice(grandTotal)}\nPayment: ${customer.payment}\n\nName: ${customer.name}\nPhone: ${customer.phone}\nCity: ${customer.city}\nAddress: ${customer.address}${customer.note ? `\nNote: ${customer.note}` : ""}`,
    );
  }

  function showCollection(next: Category) {
    setCategory(next);
    setSavedOnly(false);
    setSaleOnly(false);
  }

  const lastOrder = orders[0];

  const badgeOf = (p: Product) =>
    discountOf(p) > 0
      ? `-${discountOf(p)}%`
      : p.id === 4
        ? "New"
        : p.sold >= 150
          ? "Bestseller"
          : "";
  const maxDiscount = Math.max(...products.map(discountOf));
  const goShop = (next: Category) => {
    showCollection(next);
    setMega(false);
    setMenuOpen(false);
  };

  const renderCard = (product: Product) => {
    const saved = wishlist.includes(product.id);
    const discount = discountOf(product);
    const badge = badgeOf(product);
    return (
      <article key={product.id} className="group min-w-0">
        <div className="product-photo relative overflow-hidden">
          <button
            className="block h-full w-full"
            aria-label={`View ${product.name}`}
            onClick={() => setQuickView(product)}
          >
            <img
              src={product.image}
              alt={`${product.name} in ${product.color}`}
              width={1200}
              height={1200}
              loading="lazy"
              className="transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
          {badge && (
            <span
              className={`absolute left-2 top-2 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${discount > 0 ? "bg-accent text-accent-foreground" : "bg-background"}`}
            >
              {badge}
            </span>
          )}
          <button
            aria-label={
              saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
            }
            aria-pressed={saved}
            onClick={() => toggleWishlist(product)}
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-background/90 transition-colors hover:bg-background"
          >
            <Heart className="size-4" fill={saved ? "currentColor" : "none"} />
          </button>
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-background/95 p-3 transition-transform duration-300 group-focus-within:translate-y-0 group-hover:translate-y-0 md:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {product.stock < 1 ? "Out of stock" : "Quick add"}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {sizes.map((size) => (
                <button
                  key={size}
                  disabled={product.stock < 1}
                  onClick={() => addToCart(product, size)}
                  className="h-9 border text-xs font-semibold transition-colors ink-rule hover:bg-foreground hover:text-primary-foreground disabled:opacity-40"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <button
            aria-label={`Quick add ${product.name}`}
            onClick={() => setQuickView(product)}
            className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-background shadow md:hidden"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-tight">{product.name}</h3>
            <div className="shrink-0 text-right text-sm">
              <b className="font-semibold">{formatPrice(product.price)}</b>
              {discount > 0 && (
                <s className="block text-xs text-muted-foreground">
                  {formatPrice(product.oldPrice)}
                </s>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.category} · {product.color}
          </p>
          {product.stock > 0 && product.stock <= 10 && (
            <p className="mt-1 text-xs font-semibold text-accent">Only {product.stock} left</p>
          )}
        </div>
      </article>
    );
  };

  const navItems: [string, () => void][] = [
    ["Jackets", () => goShop("Jackets")],
    ["Trackwear", () => goShop("Trackwear")],
    ["Shirts", () => goShop("Shirts")],
  ];
  const tile = (category: Exclude<Category, "All pieces">) => {
    const p = products.find((x) => x.category === category)!;
    return {
      category,
      image: p.image,
      count: products.filter((x) => x.category === category).length,
    };
  };
  const tiles = (["Jackets", "Trackwear", "Shirts"] as const).map(tile);
  const trust = [
    [Truck, "Cash on Delivery"],
    [MessageCircle, "Order via WhatsApp"],
    [Landmark, "Bank transfer option"],
    [PackageCheck, "Live stock count"],
  ] as const;
  const faqs = [
    [
      "How do I pay?",
      "Choose Cash on Delivery at checkout, or select bank transfer and we will arrange the details with you.",
    ],
    [
      "How much is delivery?",
      `Delivery is ${formatPrice(SETTINGS.deliveryFee)}, and free on orders over ${formatPrice(SETTINGS.freeDeliveryOver)}. You see the exact total before you place your order.`,
    ],
    [
      "How do I find my size?",
      "Every piece comes in S to XL. Open any product and use the size guide for chest measurements.",
    ],
    [
      "Need to change a size?",
      "Message us on WhatsApp or email and we will help you sort the right size.",
    ],
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground sm:text-[11px]">
        Cash on Delivery · Order directly on WhatsApp · Free delivery over{" "}
        {formatPrice(SETTINGS.freeDeliveryOver)}
      </div>

      <div className="sticky top-0 z-40 bg-background" onMouseLeave={() => setMega(false)}>
        <header className="border-b ink-rule">
          <div className="shop-shell flex h-16 items-center gap-2 px-4 sm:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </Button>
            <a
              href="#top"
              className="display-type text-[28px] leading-none tracking-[0.14em] sm:text-[30px]"
            >
              OSVRYN
            </a>
            <nav className="ml-10 hidden items-center gap-7 lg:flex" aria-label="Main">
              <button
                aria-expanded={mega}
                aria-controls="mega-menu"
                onMouseEnter={() => setMega(true)}
                onClick={() => setMega(!mega)}
                className={navLink}
              >
                Shop
              </button>
              <a href="#shop" onClick={() => showCollection("All pieces")} className={navLink}>
                New in
              </a>
              <a href="#sale" className={navLink}>
                Sale
              </a>
              <a href="#about" className={navLink}>
                About
              </a>
              <a href="#help" className={navLink}>
                Help
              </a>
            </nav>
            <div className="ml-auto flex items-center gap-0.5">
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
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Heart />
                {wishlist.length > 0 && (
                  <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                    {wishlist.length}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={`Open bag, ${cartCount} items`}
                onClick={() => {
                  setCartView("bag");
                  setCartOpen(true);
                }}
              >
                <ShoppingBag />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>
        {searchOpen && (
          <div className="border-b ink-rule">
            <div className="shop-shell flex items-center gap-3 px-4 py-3 sm:px-8">
              <Search className="size-4 text-muted-foreground" />
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
                placeholder="Search jackets, trackwear, shirts"
                className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
        {mega && (
          <div
            id="mega-menu"
            className="absolute inset-x-0 top-full border-b bg-background shadow-lg ink-rule"
            onKeyDown={(e) => {
              if (e.key === "Escape") setMega(false);
            }}
          >
            <div className="shop-shell grid grid-cols-[1fr_2fr] gap-10 px-8 py-8">
              <div className="flex flex-col gap-3">
                <p className={eyebrow}>Shop</p>
                <a
                  href="#shop"
                  onClick={() => goShop("All pieces")}
                  className="text-sm font-semibold hover:underline"
                >
                  All pieces
                </a>
                {navItems.map(([label, go]) => (
                  <a key={label} href="#shop" onClick={go} className="text-sm hover:underline">
                    {label}
                  </a>
                ))}
                <a
                  href="#sale"
                  onClick={() => setMega(false)}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  Sale
                </a>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {tiles.map((t) => (
                  <a
                    key={t.category}
                    href="#shop"
                    onClick={() => goShop(t.category)}
                    className="group block"
                  >
                    <div className="product-photo overflow-hidden">
                      <img
                        src={t.image}
                        alt=""
                        width={400}
                        height={400}
                        className="transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]">
                      {t.category}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto p-0">
          <SheetTitle className="display-type border-b px-5 py-4 text-3xl font-normal tracking-[0.14em] ink-rule">
            OSVRYN
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <nav className="flex flex-col px-5 py-4" aria-label="Mobile">
            {[["All pieces", () => goShop("All pieces")], ...navItems].map(([label, go]) => (
              <a
                key={label as string}
                href="#shop"
                onClick={go as () => void}
                className="border-b py-3 text-sm font-semibold uppercase tracking-[0.1em] ink-rule"
              >
                {label as string}
              </a>
            ))}
            {[
              ["Sale", "#sale"],
              ["About", "#about"],
              ["Help & contact", "#help"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="border-b py-3 text-sm font-semibold uppercase tracking-[0.1em] ink-rule"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="grid grid-cols-3 gap-2 px-5 pb-6">
            {tiles.map((t) => (
              <a key={t.category} href="#shop" onClick={() => goShop(t.category)}>
                <div className="product-photo">
                  <img src={t.image} alt="" width={300} height={300} />
                </div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em]">
                  {t.category}
                </p>
              </a>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <section id="top" className="grid md:grid-cols-2" aria-label="Featured collection">
        {[
          {
            product: pick(1),
            eyebrow: "The everyday collection · AW26",
            cta: "Shop jackets",
            go: () => goShop("Jackets"),
            main: true,
          },
          {
            product: pick(2),
            eyebrow: "Trackwear",
            cta: "Shop trackwear",
            go: () => goShop("Trackwear"),
            main: false,
          },
        ].map(({ product, eyebrow: kicker, cta, go, main }) => (
          <div
            key={product.id}
            className="hero-photo relative aspect-[4/5] min-h-[420px] md:aspect-auto md:h-[min(86vh,760px)]"
          >
            <img
              src={product.image}
              alt={`${product.name} in ${product.color}`}
              width={1200}
              height={1200}
              fetchPriority={main ? "high" : "auto"}
            />
            <div className="hero-caption absolute inset-x-0 bottom-0 p-6 text-primary-foreground sm:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{kicker}</p>
              {main ? (
                <h1 className="display-type mt-2 text-[64px] leading-[0.88] sm:text-[88px]">
                  MADE FOR
                  <br />
                  MOVEMENT.
                </h1>
              ) : (
                <p className="display-type mt-2 text-[64px] leading-[0.88] sm:text-[88px]">
                  {product.name.toUpperCase()}
                </p>
              )}
              <a
                href="#shop"
                onClick={go}
                className="mt-5 inline-flex items-center gap-2 border-b border-primary-foreground pb-1 text-xs font-semibold uppercase tracking-[0.14em]"
              >
                {cta} <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        ))}
      </section>

      <section className="border-b ink-rule" aria-label="How to order">
        <div className="shop-shell grid grid-cols-2 gap-y-4 px-4 py-5 sm:px-8 md:grid-cols-4">
          {trust.map(([Icon, text]) => (
            <div
              key={text}
              className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
            >
              <Icon className="size-4 text-accent" strokeWidth={1.5} />
              {text}
            </div>
          ))}
        </div>
      </section>

      <section className="shop-shell px-4 pb-4 pt-12 sm:px-8 sm:pt-16" aria-labelledby="cat-title">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="cat-title" className="text-sm font-semibold uppercase tracking-[0.16em]">
            Shop by category
          </h2>
          <a
            href="#shop"
            onClick={() => showCollection("All pieces")}
            className="text-xs font-semibold uppercase tracking-[0.12em] underline underline-offset-4"
          >
            View all
          </a>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {tiles.map((t) => (
            <a
              key={t.category}
              href="#shop"
              onClick={() => goShop(t.category)}
              className="group relative block overflow-hidden"
            >
              <div className="product-photo aspect-[4/5]">
                <img
                  src={t.image}
                  alt=""
                  width={800}
                  height={800}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 text-primary-foreground sm:p-5">
                <p className="display-type text-2xl leading-none sm:text-4xl">
                  {t.category.toUpperCase()}
                </p>
                <p className="mt-1 hidden text-[11px] uppercase tracking-[0.12em] sm:block">
                  {t.count} {t.count === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="sale" className="shop-shell px-4 pt-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-accent px-5 py-4 text-accent-foreground">
          <p className="text-sm font-semibold uppercase tracking-[0.1em]">
            Up to {maxDiscount}% off selected pieces
          </p>
          <a
            href="#shop"
            onClick={() => {
              showCollection("All pieces");
              setSaleOnly(true);
            }}
            className="text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
          >
            Shop sale
          </a>
        </div>
      </section>

      <section id="shop" className="shop-shell scroll-mt-16 px-4 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mb-2 flex items-end justify-between gap-4">
          <h2 className="display-type text-5xl leading-none sm:text-6xl">THE FIRST EDIT</h2>
          <span className="pb-1 text-xs text-muted-foreground">
            {visibleProducts.length} {visibleProducts.length === 1 ? "piece" : "pieces"}
          </span>
        </div>
        <div
          className="sticky top-16 z-30 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur ink-rule sm:-mx-8 sm:px-8"
          role="group"
          aria-label="Filter and sort"
        >
          {categories.map((option) => (
            <Button
              key={option}
              variant={category === option && !savedOnly ? "default" : "outline"}
              size="sm"
              className="rounded-full px-4 text-xs"
              aria-pressed={category === option && !savedOnly}
              onClick={() => showCollection(option)}
            >
              {option}
            </Button>
          ))}
          <Button
            variant={saleOnly ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4 text-xs"
            aria-pressed={saleOnly}
            onClick={() => setSaleOnly(!saleOnly)}
          >
            Sale
          </Button>
          {savedOnly && (
            <Button
              variant="default"
              size="sm"
              className="rounded-full px-4 text-xs"
              onClick={() => setSavedOnly(false)}
            >
              Saved ✕
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <label className="sr-only" htmlFor="max-price">
              Price
            </label>
            <select
              id="max-price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              className={`${control} hidden sm:block`}
            >
              <option value={0}>Any price</option>
              <option value={8000}>Under Rs. 8,000</option>
              <option value={13000}>Under Rs. 13,000</option>
              <option value={16000}>Under Rs. 16,000</option>
            </select>
            <label className="sr-only" htmlFor="sort">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className={control}
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
        </div>
        {visibleProducts.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-4">
            {visibleProducts.map(renderCard)}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {savedOnly
              ? "Nothing saved yet. Tap the heart on any piece."
              : "No pieces match. Try another search or filter."}
          </div>
        )}
      </section>

      {[
        {
          product: pick(4),
          kicker: "Weather Study Shell",
          title: "BUILT FOR\nCHANGING DAYS.",
          flip: false,
        },
        {
          product: pick(2),
          kicker: "Motion Track Set",
          title: "ONE SET.\nEVERY DAY.",
          flip: true,
        },
      ].map(({ product, kicker, title, flip }) => (
        <section key={product.id} className="bg-secondary/70">
          <div className="shop-shell grid items-center md:grid-cols-2">
            <div className={`product-photo ${flip ? "md:order-2" : ""}`}>
              <img
                src={product.image}
                alt={`${product.name} in ${product.color}`}
                width={1200}
                height={1200}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className={`px-6 py-12 sm:px-12 md:py-16 lg:px-20 ${flip ? "md:order-1" : ""}`}>
              <p className={eyebrow}>{kicker}</p>
              <h2 className="display-type mt-3 whitespace-pre-line text-6xl leading-[0.88] sm:text-7xl">
                {title}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-4 text-sm font-semibold">{formatPrice(product.price)}</p>
              <Button
                className="mt-6 h-12 rounded-none px-8 text-xs uppercase tracking-[0.12em]"
                onClick={() => setQuickView(product)}
              >
                Shop {product.category === "Trackwear" ? "the set" : "the shell"} <ArrowRight />
              </Button>
            </div>
          </div>
        </section>
      ))}

      <section id="about" className="bg-foreground text-primary-foreground">
        <div className="shop-shell grid gap-6 px-4 py-14 sm:px-8 sm:py-20 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-65">
              A note from OSVRYN
            </p>
            <h2 className="display-type mt-3 text-6xl leading-[0.88] sm:text-7xl">
              LESS NOISE.
              <br />
              MORE WEAR.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 opacity-75">
              Getting dressed should feel simple. Start with a good layer, add the rest as you go. A
              small range of well-cut essentials, made to be worn on repeat.
            </p>
          </div>
          <a
            href="#shop"
            onClick={() => showCollection("All pieces")}
            className="flex w-fit items-center gap-2 border-b border-primary-foreground/50 pb-2 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            Shop the first edit <ArrowRight className="size-3.5" />
          </a>
        </div>
      </section>

      <section
        id="help"
        className="shop-shell grid scroll-mt-16 gap-10 px-4 py-14 sm:px-8 sm:py-20 md:grid-cols-[0.8fr_1.2fr]"
        aria-labelledby="help-title"
      >
        <div>
          <p className={eyebrow}>Help & contact</p>
          <h2 id="help-title" className="display-type mt-3 text-5xl leading-none sm:text-6xl">
            HOW CAN WE HELP?
          </h2>
          <div className="mt-6 space-y-1 text-sm text-muted-foreground">
            <p>
              Email:{" "}
              <a className="text-foreground underline" href={`mailto:${SETTINGS.email}`}>
                {SETTINGS.email}
              </a>
            </p>
            <p>Phone: {SETTINGS.phone}</p>
            <p>Address: {SETTINGS.address}</p>
          </div>
          <Button
            className="mt-6 h-12 rounded-none px-6 text-xs uppercase tracking-[0.12em]"
            onClick={() => openWhatsApp()}
          >
            <MessageCircle /> Chat on WhatsApp
          </Button>
        </div>
        <Accordion type="single" collapsible>
          {faqs.map(([q, a], i) => (
            <AccordionItem key={q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold uppercase tracking-[0.08em]">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="border-t bg-secondary/70 ink-rule">
        <div className="shop-shell grid items-center gap-6 px-4 py-12 sm:px-8 md:grid-cols-2">
          <div>
            <h2 className="display-type text-4xl leading-none sm:text-5xl">FIRST TO KNOW.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New drops and restocks, straight to your inbox.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSignupMessage("You're on the list. Look out for the next OSVRYN edit.");
              e.currentTarget.reset();
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex border-b border-foreground">
              <input
                id="newsletter-email"
                required
                type="email"
                placeholder="Your email address"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" variant="ghost" className="text-xs uppercase tracking-[0.12em]">
                Subscribe <ArrowRight />
              </Button>
            </div>
            <p aria-live="polite" className="mt-2 min-h-4 text-xs text-muted-foreground">
              {signupMessage}
            </p>
          </form>
        </div>
      </section>

      <footer className="border-t ink-rule">
        <div className="shop-shell grid gap-10 px-4 py-12 sm:px-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href="#top" className="display-type text-4xl tracking-[0.14em]">
              OSVRYN
            </a>
            <p className="mt-3 max-w-[240px] text-sm leading-6 text-muted-foreground">
              Considered layers for wherever the day goes.
            </p>
          </div>
          <nav aria-label="Shop" className="flex flex-col gap-2 text-sm">
            <p className={eyebrow}>Shop</p>
            <a
              href="#shop"
              onClick={() => showCollection("All pieces")}
              className="hover:underline"
            >
              All pieces
            </a>
            {navItems.map(([label, go]) => (
              <a key={label} href="#shop" onClick={go} className="hover:underline">
                {label}
              </a>
            ))}
            <a href="#sale" className="hover:underline">
              Sale
            </a>
          </nav>
          <nav aria-label="Help" className="flex flex-col gap-2 text-sm">
            <p className={eyebrow}>Help</p>
            <a href="#help" className="hover:underline">
              FAQ
            </a>
            <a href="#help" className="hover:underline">
              Contact us
            </a>
            <a href="#about" className="hover:underline">
              About OSVRYN
            </a>
          </nav>
          <div className="text-sm">
            <p className={eyebrow}>We accept</p>
            <p className="mt-2 text-muted-foreground">
              Cash on Delivery
              <br />
              Bank transfer
            </p>
          </div>
        </div>
        <div className="shop-shell flex flex-wrap items-center justify-between gap-2 border-t px-4 py-5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground ink-rule sm:px-8">
          <span>© 2026 OSVRYN Studio</span>
          <span>All prices in PKR</span>
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
                  <span>{lastOrder.delivery === 0 ? "Free" : formatPrice(lastOrder.delivery)}</span>
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
                    <span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span>
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
                  <div className="border-b py-4 ink-rule">
                    <p className="text-xs">
                      {delivery === 0
                        ? "You have free delivery"
                        : `Add ${formatPrice(SETTINGS.freeDeliveryOver - cartTotal)} more for free delivery`}
                    </p>
                    <div className="mt-2 h-1 bg-secondary">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{
                          width: `${Math.min(100, (cartTotal / SETTINGS.freeDeliveryOver) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
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
                    <span>{delivery === 0 ? "Free" : formatPrice(delivery)}</span>
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
