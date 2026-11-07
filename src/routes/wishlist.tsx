import { createFileRoute } from "@tanstack/react-router";
import { Grid, Page } from "@/components/storefront";
import { products, useStore } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — OSVRYN" }] }),
  component: Wishlist,
});

function Wishlist() {
  const { wish } = useStore();
  return (
    <Page title="Wishlist">
      {wish.length ? (
        <Grid items={products.filter((p) => wish.includes(p.id))} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No saved items yet. Tap the heart on any product.
        </p>
      )}
    </Page>
  );
}
