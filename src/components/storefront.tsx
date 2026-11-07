import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, MessageCircle, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SETTINGS,
  categories,
  discount,
  money,
  products,
  useStore,
  type Product,
} from "@/lib/store";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact us" },
  { to: "/sale", label: "Sale" },
] as const;
const navClass =
  "text-xs font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60";
export const heading = "display-type text-4xl leading-none sm:text-5xl";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { count, wish, toast, whatsapp } = useStore();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const badge = (n: number) =>
    n > 0 && (
      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
        {n}
      </span>
    );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground sm:text-xs">
        Cash on Delivery · Order directly on WhatsApp
      </div>
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur ink-rule">
        <header className="shop-shell flex h-[68px] items-center gap-3 px-4 sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </Button>
          <Link to="/" className="display-type text-[30px] leading-none tracking-[0.14em]">
            OSVRYN
          </Link>
          <nav className="ml-6 hidden items-center gap-6 md:flex" aria-label="Main">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={navClass}
                activeOptions={{ exact: true }}
                activeProps={{ className: "underline underline-offset-8" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <label className="sr-only" htmlFor="site-search">
              Search products
            </label>
            <div className="mr-1 hidden items-center gap-2 border border-input px-3 sm:flex">
              <Search className="size-4 text-muted-foreground" />
              <input
                id="site-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate({ to: "/shop", search: { q, cat: "All" } });
                }}
                placeholder="Search products…"
                className="h-9 w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground lg:w-52"
              />
            </div>
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/wishlist" aria-label={`Wishlist, ${wish.length} items`}>
                <Heart />
                {badge(wish.length)}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/cart" aria-label={`Cart, ${count} items`}>
                <ShoppingBag />
                {badge(count)}
              </Link>
            </Button>
          </div>
        </header>
        {menu && (
          <nav
            className="flex flex-col gap-4 border-t px-4 py-4 ink-rule md:hidden"
            aria-label="Mobile"
            onClick={() => setMenu(false)}
          >
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className={navClass}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <main className="min-h-[70vh]">{children}</main>

      <footer className="mt-16 border-t bg-secondary ink-rule">
        <div className="shop-shell grid gap-8 px-4 py-12 sm:px-8 md:grid-cols-3">
          <div>
            <p className="display-type text-4xl tracking-[0.14em]">OSVRYN</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Considered layers for wherever the day goes. Simple ordering, clear prices.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">Explore</p>
            <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
              {nav.slice(1, 5).map((n) => (
                <Link key={n.to} to={n.to} className="hover:text-foreground">
                  {n.label.replace(" us", "")}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">Contact</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {SETTINGS.email}
              <br />
              {SETTINGS.phone}
              <br />
              {SETTINGS.address}
            </p>
          </div>
        </div>
        <div className="shop-shell border-t px-4 py-4 text-[10px] uppercase tracking-[0.09em] text-muted-foreground ink-rule sm:px-8">
          <p>We accept: Cash on Delivery · Bank transfer</p>
          <p className="mt-1">© 2026 OSVRYN Studio · Sample collection · Rs. PKR pricing</p>
        </div>
      </footer>

      <button
        aria-label="Chat on WhatsApp"
        onClick={() => whatsapp()}
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-foreground text-primary-foreground shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle />
      </button>
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 px-4 py-2 text-sm font-semibold ${toast.error ? "bg-destructive text-destructive-foreground" : "bg-foreground text-primary-foreground"}`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="shop-shell px-4 py-8 sm:px-8 sm:py-12">
      {title && <h1 className={`${heading} mb-6`}>{title}</h1>}
      {children}
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { wish, toggleWish, add } = useStore();
  const d = discount(p);
  return (
    <article className="relative min-w-0">
      <button
        aria-label={wish.includes(p.id) ? "Remove from wishlist" : "Save to wishlist"}
        onClick={() => toggleWish(p.id)}
        className="absolute right-2 top-2 z-20 flex size-9 items-center justify-center rounded-full bg-background shadow"
      >
        <Heart className="size-4" fill={wish.includes(p.id) ? "currentColor" : "none"} />
      </button>
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        className="product-photo group relative block"
        aria-label={`View ${p.name}`}
      >
        <img
          src={p.image}
          alt={`${p.name} in ${p.color}`}
          width={1200}
          height={1200}
          loading="lazy"
        />
        {d > 0 && (
          <span className="absolute left-2 top-2 bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground">
            -{d}%
          </span>
        )}
        <span className="absolute bottom-2 left-2 bg-background px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] sm:text-[9px]">
          {p.label}
        </span>
      </Link>
      <div className="pt-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {p.category}
        </p>
        <h3 className="truncate text-[15px] font-semibold">{p.name}</h3>
        <p className="text-xs text-muted-foreground">
          ★ {p.rating} · {p.color}
        </p>
        <p className="mt-1 flex items-baseline gap-2">
          <b className="text-sm">{money(p.price)}</b>
          {d > 0 && <s className="text-xs text-muted-foreground">{money(p.old)}</s>}
        </p>
        <p
          className={`text-xs ${p.stock > 0 && p.stock <= 10 ? "font-semibold text-destructive" : "text-muted-foreground"}`}
        >
          {p.stock < 1
            ? "Out of stock"
            : p.stock <= 10
              ? `Only ${p.stock} left`
              : `${p.stock} in stock`}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            className="h-10 flex-1 rounded-none px-2 text-[10px] uppercase tracking-[0.07em]"
            disabled={p.stock < 1}
            onClick={() => add(p.id)}
          >
            Add to cart
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-none px-3 text-[10px] uppercase tracking-[0.07em]"
          >
            <Link to="/product/$id" params={{ id: p.id }}>
              Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function Grid({ items }: { items: Product[] }) {
  return items.length ? (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  ) : (
    <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>
  );
}

export function Section({ title, items }: { title: string; items: Product[] }) {
  return (
    <section className="mt-14">
      <h2 className={`${heading} mb-5`}>{title}</h2>
      <Grid items={items} />
    </section>
  );
}

export const allProducts = products;

export function CategoryCards() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-5">
      {categories.map((c) => {
        const p = products.find((x) => x.category === c);
        return (
          <Link
            key={c}
            to="/shop"
            search={{ q: "", cat: c }}
            className="group block border bg-card p-4 text-center transition-transform hover:-translate-y-1 ink-rule"
          >
            <div className="product-photo">
              {p && <img src={p.image} alt="" width={600} height={750} />}
            </div>
            <b className="mt-3 block text-sm uppercase tracking-[0.1em]">{c}</b>
            <span className="text-xs text-muted-foreground">
              {products.filter((x) => x.category === c).length} products
            </span>
          </Link>
        );
      })}
    </div>
  );
}
