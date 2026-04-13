export const DEFAULT_CATALOG_LIMIT = 12;
export const MAX_CATALOG_LIMIT = 100;

export type CatalogSortOption =
  | "price-asc"
  | "price-desc"
  | "name"
  | "newest"
  | "rating";

export interface CatalogQueryState {
  search: string;
  category: string | null;
  brands: string[];
  inStockOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
  sortBy: CatalogSortOption;
  page: number;
  limit: number;
}

export interface CatalogQueryParseOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface CatalogQueryInput {
  [key: string]: string | string[] | undefined;
}

export const SORT_OPTIONS: Array<{
  label: string;
  value: CatalogSortOption;
}> = [
  { label: "Mới nhất", value: "newest" },
  { label: "Đánh giá cao", value: "rating" },
  { label: "Giá tăng dần", value: "price-asc" },
  { label: "Giá giảm dần", value: "price-desc" },
  { label: "Tên A-Z", value: "name" },
];

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  maxValue: number
) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, maxValue);
}

function parseOptionalNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

export function parseCatalogSearchParams(
  searchParams: CatalogQueryInput,
  options: CatalogQueryParseOptions = {}
): CatalogQueryState {
  const defaultLimit = options.defaultLimit ?? DEFAULT_CATALOG_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_CATALOG_LIMIT;
  const sortCandidate = getFirstValue(searchParams.sort);
  const brandValues = [
    ...(Array.isArray(searchParams.brand)
      ? searchParams.brand
      : searchParams.brand
        ? [searchParams.brand]
        : []),
    ...(getFirstValue(searchParams.brands)?.split(",") ?? []),
  ]
    .map((brand) => brand.trim())
    .filter(Boolean);

  const sortBy: CatalogSortOption = SORT_OPTIONS.some(
    (option) => option.value === sortCandidate
  )
    ? (sortCandidate as CatalogSortOption)
    : "newest";

  return {
    search: getFirstValue(searchParams.search)?.trim() ?? "",
    category: getFirstValue(searchParams.category)?.trim() || null,
    brands: Array.from(new Set(brandValues)).sort(),
    inStockOnly: getFirstValue(searchParams.inStockOnly) === "true",
    priceMin: parseOptionalNumber(getFirstValue(searchParams.priceMin)),
    priceMax: parseOptionalNumber(getFirstValue(searchParams.priceMax)),
    sortBy,
    page: parsePositiveInt(
      getFirstValue(searchParams.page),
      1,
      Number.MAX_SAFE_INTEGER
    ),
    limit: parsePositiveInt(
      getFirstValue(searchParams.limit),
      defaultLimit,
      maxLimit
    ),
  };
}

export function createCatalogSearchParams(query: Partial<CatalogQueryState>) {
  const params = new URLSearchParams();

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.category?.trim()) {
    params.set("category", query.category.trim());
  }

  if (query.sortBy && query.sortBy !== "newest") {
    params.set("sort", query.sortBy);
  }

  if (query.inStockOnly) {
    params.set("inStockOnly", "true");
  }

  if (typeof query.priceMin === "number" && query.priceMin > 0) {
    params.set("priceMin", String(query.priceMin));
  }

  if (typeof query.priceMax === "number" && query.priceMax > 0) {
    params.set("priceMax", String(query.priceMax));
  }

  if (typeof query.limit === "number" && query.limit !== DEFAULT_CATALOG_LIMIT) {
    params.set("limit", String(query.limit));
  }

  if (typeof query.page === "number" && query.page > 1) {
    params.set("page", String(query.page));
  }

  query.brands
    ?.filter(Boolean)
    .sort()
    .forEach((brand) => params.append("brand", brand));

  return params;
}

export function buildCatalogUrl(
  pathname: string,
  query: Partial<CatalogQueryState>
) {
  const params = createCatalogSearchParams(query);
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
