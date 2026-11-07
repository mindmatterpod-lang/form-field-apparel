import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Page, Section } from "@/components/storefront";
import { discount, findProduct, money, products, useStore } from "@/lib/store";

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => ({
    meta: [{ title: `${findProduct(params.id)?.name ?? "Product"} — OSVRYN` }],
  }),
  component: () => {
    const { id } = Route.useParams();
    return <ProductPage key={id} id={id} />;
  },
});

const chest: Record<string, string> = { S: "36–38", M: "38–40", L: "40–42", XL: "42–44" };

function ProductPage({ id }: { id: string }) {
  const p = findProduct(id);
  const { add, wish, toggleWish, whatsapp, notify } = useStore();
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  if (!p)
    return (
      <Page>
        <p>
          Product not found.{" "}
          <Link className="underline" to="/shop" search={{ q: "", cat: "All" }}>
            Back to shop
          </Link>
        </p>
      </Page>
    );
  const d = discount(p);
  const orderOnWhatsApp = () =>
    whatsapp(
      `Hi! I want to order:\n${p.name} (${size}) x${qty} = ${money(p.price * qty)}\nPlease confirm availability and delivery.`,
    );
  return (
    <Page>
      <Link to="/shop" search={{ q: "", cat: "All" }} className="text-sm text-muted-foreground">
        ← Back to shop
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="product-photo">
          <img
            src={p.image}
            alt={`${p.name} in ${p.color}`}
            width={1200}
            height={1200}
            fetchPriority="high"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {p.category} · {p.color}
          </p>
          <h1 className="display-type mt-1 text-5xl leading-none sm:text-6xl">{p.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">★ {p.rating} (sample rating)</p>
          <p className="mt-3 flex items-baseline gap-3">
            <b className="text-2xl">{money(p.price)}</b>
            {d > 0 && (
              <>
                <s className="text-muted-foreground">{money(p.old)}</s>
                <span className="bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                  -{d}%
                </span>
              </>
            )}
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-6 text-muted-foreground">{p.desc}</p>

          <p className="mt-5 text-sm font-semibold">Size</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Size">
            {p.sizes.map((s) => (
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
          <p className="mt-5 text-sm font-semibold">Quantity</p>
          <div className="mt-2 flex items-center gap-3">
            <Button
              variant="outline"
              className="size-10 rounded-none"
              aria-label="Decrease"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              −
            </Button>
            <b className="w-6 text-center">{qty}</b>
            <Button
              variant="outline"
              className="size-10 rounded-none"
              aria-label="Increase"
              onClick={() => setQty(Math.min(p.stock, qty + 1))}
            >
              +
            </Button>
          </div>
          <p className={`mt-3 text-sm ${p.stock > 0 ? "" : "text-destructive"}`}>
            {p.stock > 0 ? `✔ ${p.stock} in stock` : "Out of stock"}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              className="h-12 rounded-none px-7 text-xs uppercase tracking-[0.1em]"
              disabled={p.stock < 1}
              onClick={() => add(p.id, qty, size)}
            >
              Add to cart
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-none px-5 text-xs uppercase tracking-[0.1em]"
              onClick={orderOnWhatsApp}
            >
              Order on WhatsApp
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-none px-4"
              aria-label="Wishlist"
              onClick={() => toggleWish(p.id)}
            >
              <Heart fill={wish.includes(p.id) ? "currentColor" : "none"} />
            </Button>
          </div>

          <details className="mt-6 border bg-card p-3 text-sm ink-rule">
            <summary className="cursor-pointer font-semibold">Size guide</summary>
            <table className="mt-2 w-full text-left">
              <thead>
                <tr>
                  <th className="py-1">Size</th>
                  <th>Chest (in)</th>
                </tr>
              </thead>
              <tbody>
                {p.sizes.map((s) => (
                  <tr key={s}>
                    <td className="py-1">{s}</td>
                    <td>{chest[s]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Approximate sample measurements. Replace with your real size chart.
            </p>
          </details>
          <details className="mt-3 border bg-card p-3 text-sm ink-rule">
            <summary className="cursor-pointer font-semibold">Delivery &amp; returns</summary>
            <p className="mt-2 text-muted-foreground">
              Sample text. Replace with your real delivery times, charges and return policy.
            </p>
          </details>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 ink-rule md:hidden">
        <b className="flex-1 self-center">{money(p.price)}</b>
        <Button
          className="h-11 flex-[2] rounded-none text-xs uppercase tracking-[0.1em]"
          disabled={p.stock < 1}
          onClick={() => {
            add(p.id, qty, size);
            notify(`${p.name} added to cart`);
          }}
        >
          Add to cart
        </Button>
      </div>
      <Section
        title="Related products"
        items={products
          .filter((x) => x.id !== p.id && x.category === p.category)
          .concat(products.filter((x) => x.id !== p.id && x.category !== p.category))
          .slice(0, 4)}
      />
    </Page>
  );
}
