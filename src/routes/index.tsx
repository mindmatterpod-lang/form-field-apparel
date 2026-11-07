import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import outerwearImage from "@/assets/atelier-outerwear.jpg";
import tracksuitImage from "@/assets/atelier-tracksuit.jpg";
import shirtImage from "@/assets/atelier-shirt.jpg";
import shellImage from "@/assets/atelier-shell.jpg";

type Category = "All pieces" | "Jackets" | "Trackwear" | "Shirts";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All pieces">;
  price: number;
  image: string;
  color: string;
  label: string;
};

type CartItem = { product: Product; size: string; quantity: number };

const categories: Category[] = ["All pieces", "Jackets", "Trackwear", "Shirts"];
const sizes = ["S", "M", "L", "XL"];
const products: Product[] = [
  { id: 1, name: "The Form Bomber", category: "Jackets", price: 12900, image: outerwearImage, color: "Carbon", label: "THE EVERYDAY ICON" },
  { id: 2, name: "Motion Track Set", category: "Trackwear", price: 15900, image: tracksuitImage, color: "Pine", label: "SET · TOP + BOTTOM" },
  { id: 3, name: "Structure Shirt", category: "Shirts", price: 6900, image: shirtImage, color: "Chalk", label: "HEAVYWEIGHT COTTON" },
  { id: 4, name: "Weather Study Shell", category: "Jackets", price: 14900, image: shellImage, color: "Ember", label: "LIGHTWEIGHT LAYER" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OSVRYN — Everyday Layers" },
      { name: "description", content: "Explore considered jackets, trackwear, shirts and everyday layers from OSVRYN." },
      { property: "og:title", content: "OSVRYN — Everyday Layers" },
      { property: "og:description", content: "Considered layers. Made for wherever the day goes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Storefront,
});

function formatPrice(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function Storefront() {
  const [category, setCategory] = useState<Category>("All pieces");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [signupMessage, setSignupMessage] = useState("");

  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatches = category === "All pieces" || product.category === category;
    const searchMatches = `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatches && searchMatches;
  }), [category, query]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  function addToCart(product: Product) {
    const size = selectedSizes[product.id] ?? "M";
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id && item.size === size);
      if (existing) {
        return current.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { product, size, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(productId: number, size: string, adjustment: number) {
    setCart((current) => current.flatMap((item) => {
      if (item.product.id !== productId || item.size !== size) return [item];
      const nextQuantity = item.quantity + adjustment;
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
    }));
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground sm:text-xs">
        A considered uniform for wherever the day goes
      </div>

      <div className="border-b ink-rule">
      <header className="shop-shell relative flex h-[68px] items-center justify-between px-4 sm:px-8">
        <nav className="hidden items-center gap-7 md:flex" aria-label="Shop by category">
          <a href="#collection" onClick={() => setCategory("Jackets")} className="text-xs font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60">Outerwear</a>
          <a href="#collection" onClick={() => setCategory("Trackwear")} className="text-xs font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60">Trackwear</a>
          <a href="#collection" onClick={() => setCategory("Shirts")} className="text-xs font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60">Shirts</a>
        </nav>

        <a href="#top" className="display-type absolute left-1/2 -translate-x-1/2 text-[32px] leading-none tracking-[0.14em]">OSVRYN</a>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={searchOpen ? "Close search" : "Open search"} onClick={() => { setSearchOpen(!searchOpen); setQuery(""); }}>
            {searchOpen ? <X /> : <Search />}
          </Button>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Open bag, ${cartCount} items`} onClick={() => setCartOpen(true)}>
            <ShoppingBag />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">{cartCount}</span>
          </Button>
        </div>
      </header>
      </div>

      {searchOpen && (
        <div className="border-b ink-rule"><div className="shop-shell px-4 py-4 sm:px-8">
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <div className="flex items-center gap-3">
            <Search className="size-4 text-muted-foreground" />
            <input id="product-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your next layer" className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground" />
          </div>
        </div></div>
      )}

      <section id="top" className="shop-shell grid grid-cols-1 gap-6 px-4 pb-12 pt-7 sm:px-8 lg:grid-cols-[0.83fr_1.17fr] lg:gap-10 lg:pb-16 lg:pt-10">
        <div className="flex min-h-[390px] flex-col justify-between py-2 lg:min-h-[560px] lg:py-4">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-2 rounded-full bg-accent" />
            The everyday collection · 01 / 04
          </div>
          <div className="max-w-xl py-10 lg:py-0">
            <h1 className="display-type max-w-[9ch] text-[76px] leading-[0.83] sm:text-[92px] lg:text-[clamp(100px,11.3vw,160px)]">
              MADE FOR<br />MOVEMENT.
            </h1>
            <p className="mt-7 max-w-[350px] text-[15px] leading-6 text-muted-foreground">
              Thoughtful layers. Clean lines. Everyday pieces that just feel right.
            </p>
            <Button asChild className="mt-7 h-12 rounded-none px-6 text-xs uppercase tracking-[0.1em]">
              <a href="#collection">Explore the collection <ArrowRight /></a>
            </Button>
          </div>
          <a href="#collection" className="flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            A new point of view <ArrowDown className="size-3" />
          </a>
        </div>

        <div className="hero-photo min-h-[420px] lg:min-h-[560px]">
          <img src={outerwearImage} alt="Model wearing the OSVRYN Form Bomber" width={1200} height={1200} fetchPriority="high" />
          <div className="hero-caption absolute bottom-4 left-4 right-4 flex items-end justify-between text-primary-foreground sm:bottom-6 sm:left-6 sm:right-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">01 — Outerwear, reworked</p>
              <p className="display-type mt-1 text-4xl leading-none sm:text-5xl">THE FORM BOMBER</p>
            </div>
            <a href="#collection" aria-label="Explore the Form Bomber" className="flex size-11 items-center justify-center rounded-full bg-background text-foreground transition-transform hover:translate-x-1">
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-y bg-secondary/70" aria-label="Store values">
        <div className="shop-shell grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
          {["Made to wear on repeat", "Clean, considered fits", "Easy everyday layers", "The first OSVRYN edit"].map((value, index) => (
            <div key={value} className="flex min-h-14 items-center justify-center gap-2 px-2 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]">
              <span className="text-accent">0{index + 1}</span>{value}
            </div>
          ))}
        </div>
      </section>

      <section id="collection" className="shop-shell px-4 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b pb-5 ink-rule sm:pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Find your everyday</p>
            <h2 className="display-type mt-2 text-6xl leading-[0.9] sm:text-7xl">THE FIRST EDIT</h2>
          </div>
          <span className="pb-1 text-xs text-muted-foreground">{visibleProducts.length.toString().padStart(2, "0")} considered pieces</span>
        </div>

        <div className="flex flex-wrap gap-2 py-5" role="group" aria-label="Filter by clothing type">
          {categories.map((option) => (
            <Button key={option} variant={category === option ? "default" : "outline"} size="sm" className="rounded-none px-4 text-[10px] uppercase tracking-[0.08em]" aria-pressed={category === option} onClick={() => setCategory(option)}>
              {option}
            </Button>
          ))}
        </div>

        {visibleProducts.length ? (
          <div className="shop-grid">
            {visibleProducts.map((product, index) => (
              <article key={product.id} className="min-w-0">
                <div className="product-photo group relative">
                  <img src={product.image} alt={`${product.name} in ${product.color}`} width={1200} height={1200} loading="lazy" />
                  <span className="absolute left-2 top-2 bg-background px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] sm:left-3 sm:top-3 sm:text-[9px]">{product.label}</span>
                  <span className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 text-[9px] uppercase tracking-[0.08em] sm:bottom-3 sm:right-3">0{index + 1} / 04</span>
                </div>
                <div className="flex items-start justify-between gap-1 pt-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-semibold sm:text-[15px]">{product.name}</h3>
                    <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{product.category} · {product.color}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold sm:text-sm">{formatPrice(product.price)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="sr-only" htmlFor={`size-${product.id}`}>Choose size for {product.name}</label>
                  <select id={`size-${product.id}`} value={selectedSizes[product.id] ?? "M"} onChange={(event) => setSelectedSizes((current) => ({ ...current, [product.id]: event.target.value }))} className="h-10 min-w-0 flex-1 border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    {sizes.map((size) => <option key={size} value={size}>Size {size}</option>)}
                  </select>
                  <Button variant="default" className="h-10 flex-1 rounded-none px-2 text-[9px] uppercase tracking-[0.07em] sm:text-[10px]" onClick={() => addToCart(product)}>
                    <ShoppingBag className="size-3.5" /> Add to bag
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">No pieces found. Try another search.</div>
        )}
      </section>

      <section className="bg-foreground text-primary-foreground">
        <div className="shop-shell grid gap-6 px-4 py-10 sm:px-8 sm:py-14 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-65">A note from OSVRYN</p>
            <h2 className="display-type mt-2 text-5xl leading-[0.9] sm:text-6xl">LESS NOISE.<br />MORE WEAR.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 opacity-75">Getting dressed should feel simple. Start with a good layer, add the rest as you go.</p>
          </div>
          <a href="#collection" className="flex w-fit items-center gap-2 border-b border-primary-foreground/40 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em]">Shop the first edit <ArrowRight className="size-3.5" /></a>
        </div>
      </section>

      <footer className="shop-shell grid gap-8 px-4 py-10 sm:px-8 sm:py-12 md:grid-cols-2">
        <div>
          <a href="#top" className="display-type text-4xl tracking-[0.14em]">OSVRYN</a>
          <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">Considered layers for wherever the day goes.</p>
        </div>
        <form className="md:justify-self-end md:text-right" onSubmit={(event) => { event.preventDefault(); setSignupMessage("You're on the list. Look out for the next OSVRYN edit."); }}>
          <label htmlFor="newsletter-email" className="text-[10px] font-semibold uppercase tracking-[0.12em]">A little more OSVRYN, now and then</label>
          <div className="mt-3 flex max-w-md border-b border-foreground md:ml-auto">
            <input id="newsletter-email" required type="email" placeholder="Your email address" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
            <Button type="submit" variant="ghost" size="icon" aria-label="Join the email list"><ArrowRight /></Button>
          </div>
          <p aria-live="polite" className="mt-2 min-h-4 text-xs text-muted-foreground">{signupMessage}</p>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[9px] uppercase tracking-[0.09em] text-muted-foreground ink-rule md:col-span-2">
          <span>© 2026 OSVRYN STUDIO</span><span>Sample collection · Rs. PKR pricing</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <div className="cart-overlay absolute inset-0" />
          <aside className="relative flex h-full w-full max-w-[420px] flex-col bg-background shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="flex items-center justify-between border-b px-5 py-4 ink-rule">
              <div>
                <h2 id="cart-title" className="display-type text-4xl leading-none">YOUR BAG <span className="font-sans text-sm">({cartCount})</span></h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Your edit, so far</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close bag" onClick={() => setCartOpen(false)}><X /></Button>
            </div>
            {cart.length ? (
              <>
                <div className="flex-1 overflow-y-auto px-5">
                  {cart.map(({ product, size, quantity }) => (
                    <div key={`${product.id}-${size}`} className="flex gap-4 border-b py-4 ink-rule">
                      <img src={product.image} alt="" width={120} height={120} className="size-24 object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                        <div>
                          <h3 className="text-sm font-semibold">{product.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{product.color} · Size {size}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 border">
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, size, -1)}><Minus className="size-3" /></Button>
                            <span className="w-5 text-center text-xs">{quantity}</span>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, size, 1)}><Plus className="size-3" /></Button>
                          </div>
                          <span className="text-xs font-semibold">{formatPrice(product.price * quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-5 ink-rule">
                  <div className="flex justify-between text-sm font-semibold"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Checkout will be available when your store is connected.</p>
                  <Button className="mt-4 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]" onClick={() => setCartOpen(false)}>Continue shopping</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <ShoppingBag className="size-8 text-muted-foreground" strokeWidth={1} />
                <p className="display-type mt-4 text-4xl">NOTHING IN HERE. YET.</p>
                <p className="mt-2 max-w-[220px] text-xs leading-5 text-muted-foreground">Good pieces have a way of finding their place.</p>
                <Button className="mt-5 rounded-none px-6 text-xs uppercase tracking-[0.1em]" onClick={() => setCartOpen(false)}>Browse the edit</Button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}