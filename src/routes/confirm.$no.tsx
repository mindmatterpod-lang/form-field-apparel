import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/storefront";
import { money, useStore } from "@/lib/store";

export const Route = createFileRoute("/confirm/$no")({
  head: () => ({ meta: [{ title: "Order saved — OSVRYN" }] }),
  component: Confirm,
});

function Confirm() {
  const { no } = Route.useParams();
  const { getOrder } = useStore();
  const o = getOrder(no);
  if (!o)
    return (
      <Page>
        <p>
          Order not found in this browser.{" "}
          <Link className="underline" to="/shop" search={{ q: "", cat: "All" }}>
            Shop
          </Link>
        </p>
      </Page>
    );
  return (
    <Page>
      <div className="mx-auto max-w-xl border bg-card p-6 ink-rule">
        <Check className="mx-auto size-10" />
        <h1 className="display-type mt-2 text-center text-5xl">ORDER SAVED</h1>
        <p className="text-center text-sm text-muted-foreground">
          Order number <b className="text-foreground">{o.no}</b>
        </p>
        <p className="mt-4 border p-3 text-sm ink-rule">
          <b>Important:</b> this order is saved only in this browser. It has <b>not</b> been sent to
          the store. To order for real, use “Order on WhatsApp” at checkout or contact the store
          directly.
        </p>
        <div className="mt-4 space-y-1">
          {o.lines.map((l) => (
            <div key={`${l.name}-${l.size}`} className="flex justify-between gap-2 text-sm">
              <span>
                {l.name} · {l.size} × {l.qty}
              </span>
              <span>{money(l.price * l.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span>Delivery</span>
          <span>{money(o.fee)}</span>
        </div>
        <div className="flex justify-between text-lg">
          <b>Total</b>
          <b>{money(o.total)}</b>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {o.customer.name} · {o.customer.phone}
          <br />
          {o.customer.address}, {o.customer.city}
          <br />
          {o.customer.payment}
        </p>
        <Button
          asChild
          className="mt-5 h-12 w-full rounded-none text-xs uppercase tracking-[0.1em]"
        >
          <Link to="/shop" search={{ q: "", cat: "All" }}>
            Continue shopping
          </Link>
        </Button>
      </div>
    </Page>
  );
}
