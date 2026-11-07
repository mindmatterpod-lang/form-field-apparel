import { createFileRoute } from "@tanstack/react-router";
import { Grid, Page } from "@/components/storefront";
import { discount, products } from "@/lib/store";

export const Route = createFileRoute("/sale")({
  head: () => ({ meta: [{ title: "Sale — OSVRYN" }] }),
  component: () => (
    <Page title="Sale">
      <Grid items={products.filter((p) => discount(p) > 0)} />
    </Page>
  ),
});
