import { createFileRoute } from "@tanstack/react-router";
import { CategoryCards, Page } from "@/components/storefront";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "Categories — OSVRYN" }] }),
  component: () => (
    <Page title="Categories">
      <CategoryCards />
    </Page>
  ),
});
