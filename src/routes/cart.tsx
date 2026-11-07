import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/storefront";
import { SETTINGS, findProduct, money, useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — OSVRYN" }] }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, remove, subtotal } = useStore();
  if (!cart.length)
    return (
      <Page>
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground" strokeWidth={1} />
          <h1 className="display-type mt-3 text-5xl">YOUR CART IS EMPTY</h1>
          <Button asChild className="mt-5 rounded-none px-7 text-xs uppercase tracking-[0.1em]">
            <Link to="/shop" search={{ q: "", cat: "All" }}>
              Continue shopping
            </Link>
          </Button>
        </div>
      </Page>
    );
  return (
    <Page title="Shopping cart">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          {cart.map((l, i) => {
            const p = findProduct(l.id);
            if (!p) return null;
            return (
              <div
                key={`${l.id}-${l.size}`}
                className="flex items-center gap-4 border bg-card p-3 ink-rule"
              >
                <Link
                  to="/product/$id"
                  params={{ id: p.id }}
                  className="size-20 shrink-0 overflow-hidden"
                >
                  <img
                    src={p.image}
                    alt=""
                    width={160}
                    height={160}
                    className="size-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{p.name}</b>
                  <span className="text-xs text-muted-foreground">
                    {p.color} · Size {l.size}
                  </span>
                  <p className="text-sm">{money(p.price)} each</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="size-8 rounded-none p-0"
                      aria-label={`Remove one ${p.name}`}
                      onClick={() => setQty(i, -1)}
                    >
                      −
                    </Button>
                    <b className="w-5 text-center text-sm">{l.qty}</b>
                    <Button
                      variant="outline"
                      className="size-8 rounded-none p-0"
                      aria-label={`Add one ${p.name}`}
                      onClick={() => setQty(i, 1)}
                    >
                      +
                    </Button>
                    <button
                      className="ml-3 text-xs text-destructive underline"
                      onClick={() => remove(i)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <b className="text-sm">{money(p.price * l.qty)}</b>
              </div>
            );
          })}
        </div>
        <aside className="h-fit border bg-card p-5 ink-rule">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span>Delivery</span>
            <span>{money(SETTINGS.deliveryFee)}</span>
          </div>
          <div className="mt-3 flex justify-between text-lg">
            <b>Total</b>
            <b>{money(subtotal + SETTINGS.deliveryFee)}</b>
          </div>
          <Button
            asChild
            className="mt-4 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]"
          >
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="mt-2 h-11 w-full rounded-none text-xs uppercase tracking-[0.1em]"
          >
            <Link to="/shop" search={{ q: "", cat: "All" }}>
              Continue shopping
            </Link>
          </Button>
        </aside>
      </div>
    </Page>
  );
}
