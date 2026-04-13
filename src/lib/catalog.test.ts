import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCatalogUrl,
  createCatalogSearchParams,
  parseCatalogSearchParams,
} from "./catalog";

test("parseCatalogSearchParams handles defaults and repeated brands", () => {
  const query = parseCatalogSearchParams({
    search: "rtx 4060",
    brand: ["MSI", "ASUS"],
    inStockOnly: "true",
    sort: "price-asc",
  });

  assert.equal(query.search, "rtx 4060");
  assert.deepEqual(query.brands, ["ASUS", "MSI"]);
  assert.equal(query.inStockOnly, true);
  assert.equal(query.sortBy, "price-asc");
  assert.equal(query.page, 1);
});

test("createCatalogSearchParams omits defaults and serializes active filters", () => {
  const params = createCatalogSearchParams({
    brands: ["AMD", "Intel"],
    category: "cpu-processors",
    page: 2,
    search: "ryzen",
    sortBy: "rating",
  });

  assert.equal(params.get("category"), "cpu-processors");
  assert.equal(params.get("search"), "ryzen");
  assert.equal(params.get("sort"), "rating");
  assert.deepEqual(params.getAll("brand"), ["AMD", "Intel"]);
  assert.equal(params.get("page"), "2");
});

test("buildCatalogUrl returns clean paths when no params exist", () => {
  assert.equal(buildCatalogUrl("/products", {}), "/products");
  assert.equal(
    buildCatalogUrl("/products", {
      category: "graphics-cards",
      page: 1,
      search: "",
    }),
    "/products?category=graphics-cards"
  );
});
