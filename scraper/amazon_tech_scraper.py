"""
Amazon Computers & Accessories Scraper
=======================================
Discovers sub-categories from Amazon's Computers hub page (node=541966),
then scrapes products from each category via search. Outputs structured JSON.

Modes:
    --discover    List discovered categories only (no product scraping)
    --scrape      Discover + scrape products (default)

Usage:
    python amazon_tech_scraper.py --discover
    python amazon_tech_scraper.py --discover --visible
    python amazon_tech_scraper.py --limit 50
    python amazon_tech_scraper.py --categories laptops,desktops,monitors
"""

import argparse
import json
import logging
import os
import random
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = "https://www.amazon.com"
HUB_NODE_ID = "541966"
HUB_URL = f"{BASE_URL}/b?node={HUB_NODE_ID}"
ROBOTS_TXT_URL = f"{BASE_URL}/robots.txt"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

DEFAULT_MAX_PRODUCTS_PER_CATEGORY = 100
REQUEST_DELAY_RANGE = (3.0, 6.0)
PAGE_LOAD_TIMEOUT = 20
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")

BLOCKED_NODE_IDS = {"7454917011", "7454927011", "7454939011", "7454898011", "9052533011"}

FALLBACK_CATEGORIES = {
    "laptops": {"name": "Laptops", "node_id": "565108"},
    "desktops": {"name": "Desktops", "node_id": "565098"},
    "monitors": {"name": "Monitors", "node_id": "1292115011"},
    "tablets": {"name": "Tablets", "node_id": "1232597011"},
    "computer_accessories": {"name": "Computer Accessories & Peripherals", "node_id": "318813011"},
    "computer_components": {"name": "Computer Components", "node_id": "572508"},
    "networking": {"name": "Networking Products", "node_id": "402052011"},
    "drives_storage": {"name": "Drives & Storage", "node_id": "1292110011"},
    "pc_gaming": {"name": "PC Gaming", "node_id": "14742644011"},
}


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------


@dataclass
class CategoryInfo:
    name: str
    slug: str
    node_id: str
    url: str
    parent_node_id: str = HUB_NODE_ID


@dataclass
class ProductPrice:
    current: str = "N/A"
    original: str = "N/A"
    currency: str = "USD"


@dataclass
class ProductRating:
    score: float | None = None
    review_count: int = 0


@dataclass
class ProductData:
    asin: str = ""
    title: str = ""
    brand: str = "N/A"
    price: ProductPrice = field(default_factory=ProductPrice)
    rating: ProductRating = field(default_factory=ProductRating)
    url: str = ""
    image_url: str = "N/A"
    scraped_at: str = ""


# ---------------------------------------------------------------------------
# Robots.txt compliance
# ---------------------------------------------------------------------------


class RobotsComplianceChecker:
    """Validates URLs against Amazon's robots.txt before fetching."""

    DISALLOWED_PATH_PREFIXES = [
        "/exec/obidos/",
        "/gp/cart",
        "/gp/sign-in",
        "/gp/history",
        "/gp/offer-listing/",
        "/gp/customer-reviews/write",
        "/gp/vote",
        "/gp/profile/",
        "/ap/signin",
        "/dp/shipping/",
        "/dp/twister-update/",
        "/dp/e-mail-friend/",
        "/dp/rate-this-item/",
        "/dp/product-availability/",
        "/dp/manual-submit/",
    ]

    def __init__(self, user_agent: str):
        self.parser = RobotFileParser()
        self.parser.set_url(ROBOTS_TXT_URL)
        self.user_agent = user_agent
        self.loaded = False

    def load(self):
        try:
            self.parser.read()
            self.loaded = True
            logging.info("robots.txt loaded and parsed successfully")
        except Exception as error:
            logging.warning("Failed to load robots.txt: %s — using built-in rules", error)
            self.loaded = False

    def is_url_allowed(self, url: str) -> bool:
        if self.loaded:
            return self.parser.can_fetch(self.user_agent, url)

        path = urlparse(url).path
        for prefix in self.DISALLOWED_PATH_PREFIXES:
            if path.startswith(prefix):
                return False
        return True

    def is_node_allowed(self, node_id: str) -> bool:
        return node_id not in BLOCKED_NODE_IDS


# ---------------------------------------------------------------------------
# Scraper
# ---------------------------------------------------------------------------


class AmazonCategoryScraper:
    def __init__(self, headless: bool = True, max_per_category: int = DEFAULT_MAX_PRODUCTS_PER_CATEGORY):
        self.headless = headless
        self.max_per_category = max_per_category
        self.driver: webdriver.Chrome | None = None
        self.robots = RobotsComplianceChecker(USER_AGENT)
        self._setup_logging()

    @staticmethod
    def _setup_logging():
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s  %(levelname)-8s  %(message)s",
            datefmt="%H:%M:%S",
        )

    # --- Browser lifecycle ---------------------------------------------------

    def _create_driver(self) -> webdriver.Chrome:
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")

        chrome_options.add_argument(f"--user-agent={USER_AGENT}")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--lang=en-US")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option("useAutomationExtension", False)

        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument",
            {"source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"},
        )
        driver.set_page_load_timeout(30)
        return driver

    def _ensure_driver(self):
        if self.driver is None:
            self.driver = self._create_driver()

    def shutdown(self):
        if self.driver:
            self.driver.quit()
            self.driver = None
            logging.info("Browser session closed.")

    # --- Navigation ----------------------------------------------------------

    @staticmethod
    def _polite_delay():
        delay = random.uniform(*REQUEST_DELAY_RANGE)
        logging.debug("Sleeping %.1fs…", delay)
        time.sleep(delay)

    def _navigate(self, url: str) -> bool:
        if not self.robots.is_url_allowed(url):
            logging.warning("BLOCKED by robots.txt → %s", url)
            return False

        self._polite_delay()

        try:
            self.driver.get(url)
            WebDriverWait(self.driver, PAGE_LOAD_TIMEOUT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "body"))
            )
            return True
        except TimeoutException:
            logging.error("Page load timeout → %s", url)
            return False
        except WebDriverException as error:
            logging.error("WebDriver error → %s: %s", url, error)
            return False

    def _is_captcha_page(self) -> bool:
        try:
            source_lower = self.driver.page_source.lower()
            captcha_signals = [
                "captcha", "robot check", "type the characters you see",
                "sorry, we just need to make sure", "enter the characters you see below",
            ]
            return any(signal in source_lower for signal in captcha_signals)
        except WebDriverException:
            return False

    def _handle_captcha(self, retry_url: str) -> bool:
        logging.warning("CAPTCHA detected — pausing 45s before retry…")
        time.sleep(45)
        if not self._navigate(retry_url):
            return False
        if self._is_captcha_page():
            logging.error("CAPTCHA persists after retry. Skipping.")
            return False
        return True

    def _has_next_page(self) -> bool:
        try:
            next_buttons = self.driver.find_elements(
                By.CSS_SELECTOR, "a.s-pagination-next:not(.s-pagination-disabled)"
            )
            return len(next_buttons) > 0
        except WebDriverException:
            return False

    # --- Element helpers -----------------------------------------------------

    @staticmethod
    def _text_from(element, css_selector: str, fallback: str = "N/A") -> str:
        try:
            return element.find_element(By.CSS_SELECTOR, css_selector).text.strip()
        except (NoSuchElementException, StaleElementReferenceException):
            return fallback

    @staticmethod
    def _attr_from(element, css_selector: str, attribute: str, fallback: str = "N/A") -> str:
        try:
            value = element.find_element(By.CSS_SELECTOR, css_selector).get_attribute(attribute)
            return value.strip() if value else fallback
        except (NoSuchElementException, StaleElementReferenceException):
            return fallback

    # --- Phase 1: Category Discovery -----------------------------------------

    def _slugify(self, text: str) -> str:
        slug = text.lower().strip()
        slug = re.sub(r"[^a-z0-9]+", "_", slug)
        return slug.strip("_")

    def _extract_node_id_from_href(self, href: str) -> str | None:
        """Extract browse node ID from an Amazon link."""
        if not href:
            return None

        node_match = re.search(r"[?&]node=(\d+)", href)
        if node_match:
            return node_match.group(1)

        rh_match = re.search(r"rh=n(?:%3A|:)(\d+)", href)
        if rh_match:
            return rh_match.group(1)

        return None

    def discover_categories(self) -> list[CategoryInfo]:
        """Navigate to the hub page and extract sub-category links."""
        logging.info("=" * 64)
        logging.info("PHASE 1: Category Discovery")
        logging.info("Hub URL: %s", HUB_URL)
        logging.info("=" * 64)

        self._ensure_driver()

        if not self._navigate(HUB_URL):
            logging.warning("Failed to load hub page. Using fallback categories.")
            return self._build_fallback_categories()

        if self._is_captcha_page():
            if not self._handle_captcha(HUB_URL):
                logging.warning("CAPTCHA on hub page. Using fallback categories.")
                return self._build_fallback_categories()

        discovered: dict[str, CategoryInfo] = {}

        link_selectors = [
            "#zg_browseRoot a",
            "div[class*='browse'] a[href*='node=']",
            "div._p13n-zg-nav-tree-all_style_zg-browse-group__88fbz a",
            "#departments a[href*='node=']",
            "a[href*='/b?'][href*='node=']",
            "a[href*='/s?'][href*='rh=n']",
            "div.acsUxWidget a[href*='node=']",
            "div.s-navigation a[href*='node=']",
            "#nav-subnav a[href*='node=']",
            "ul.a-unordered-list a[href*='node=']",
        ]

        for selector in link_selectors:
            try:
                links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for link in links:
                    self._process_category_link(link, discovered)
            except WebDriverException:
                continue

        all_links_with_node = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='node=']")
        for link in all_links_with_node:
            self._process_category_link(link, discovered)

        if not discovered:
            logging.warning("No categories discovered from page. Using fallback.")
            return self._build_fallback_categories()

        categories = list(discovered.values())
        logging.info("Discovered %d categories:", len(categories))
        for category in categories:
            logging.info("  • %-35s  node=%s", category.name, category.node_id)

        return categories

    def _process_category_link(self, link, discovered: dict):
        try:
            href = link.get_attribute("href") or ""
            text = link.text.strip()

            if not text or len(text) < 2 or len(text) > 80:
                return

            skip_patterns = [
                "see more", "shop all", "deals", "best seller", "back to top",
                "sign in", "cart", "account", "help", "sell on", "registry",
                "prime", "fresh", "gift card", "whole foods", "amazon",
                "new releases", "customer service", "today's deals",
            ]
            text_lower = text.lower()
            if any(pattern in text_lower for pattern in skip_patterns):
                return

            node_id = self._extract_node_id_from_href(href)
            if not node_id:
                return

            if node_id == HUB_NODE_ID:
                return

            if not self.robots.is_node_allowed(node_id):
                logging.debug("Skipping blocked node %s (%s)", node_id, text)
                return

            if node_id not in discovered:
                slug = self._slugify(text)
                search_url = f"{BASE_URL}/s?rh=n%3A{node_id}&fs=true&ref=lp_{node_id}_sar"
                discovered[node_id] = CategoryInfo(
                    name=text,
                    slug=slug,
                    node_id=node_id,
                    url=search_url,
                )
        except (StaleElementReferenceException, WebDriverException):
            pass

    def _build_fallback_categories(self) -> list[CategoryInfo]:
        categories = []
        for slug, info in FALLBACK_CATEGORIES.items():
            node_id = info["node_id"]
            search_url = f"{BASE_URL}/s?rh=n%3A{node_id}&fs=true&ref=lp_{node_id}_sar"
            categories.append(CategoryInfo(
                name=info["name"],
                slug=slug,
                node_id=node_id,
                url=search_url,
            ))
        return categories

    # --- Phase 2: Product Scraping -------------------------------------------

    def _extract_price(self, card) -> ProductPrice:
        current = self._text_from(card, "span.a-price:not([data-a-strike]) span.a-offscreen")
        if current == "N/A":
            whole = self._text_from(card, "span.a-price:not([data-a-strike]) span.a-price-whole", "")
            fraction = self._text_from(card, "span.a-price:not([data-a-strike]) span.a-price-fraction", "00")
            if whole:
                whole_clean = whole.replace(",", "").rstrip(".")
                current = f"${whole_clean}.{fraction}"

        original = self._text_from(card, "span.a-price[data-a-strike] span.a-offscreen")

        return ProductPrice(current=current, original=original)

    def _extract_rating(self, card) -> ProductRating:
        rating_text = self._attr_from(card, "i.a-icon-star-small span.a-icon-alt", "textContent")
        if rating_text == "N/A":
            rating_text = self._text_from(card, "i.a-icon-star-small span.a-icon-alt")

        rating_match = re.search(r"([\d.]+)", rating_text)
        score = float(rating_match.group(1)) if rating_match else None

        review_raw = self._text_from(
            card,
            "a[href*='customerReviews'] span.a-size-base, span.a-size-base.s-underline-text",
            "0",
        )
        review_digits = re.sub(r"[^\d]", "", review_raw) or "0"

        return ProductRating(score=score, review_count=int(review_digits))

    def _parse_product_card(self, card) -> ProductData | None:
        asin = card.get_attribute("data-asin")
        if not asin or not asin.strip():
            return None

        title = self._text_from(card, "h2 a span, h2 span.a-text-normal")
        if title == "N/A":
            return None

        brand = self._text_from(card, "span.a-size-base-plus.a-color-base")
        if brand == "N/A":
            brand = self._text_from(card, "h5 span.a-color-base")

        return ProductData(
            asin=asin.strip(),
            title=title,
            brand=brand,
            price=self._extract_price(card),
            rating=self._extract_rating(card),
            url=f"{BASE_URL}/dp/{asin.strip()}",
            image_url=self._attr_from(card, "img.s-image", "src"),
            scraped_at=datetime.now().isoformat(),
        )

    def _parse_search_page(self) -> list[ProductData]:
        cards = self.driver.find_elements(
            By.CSS_SELECTOR, 'div[data-component-type="s-search-result"]'
        )
        products: list[ProductData] = []
        for card in cards:
            try:
                product = self._parse_product_card(card)
                if product:
                    products.append(product)
            except Exception as error:
                logging.debug("Skipping card: %s", error)
        return products

    def scrape_category(self, category: CategoryInfo) -> list[ProductData]:
        logging.info("-" * 60)
        logging.info("SCRAPING  %s  (node=%s)", category.name, category.node_id)
        logging.info("Limit: %d products", self.max_per_category)
        logging.info("-" * 60)

        collected: list[ProductData] = []
        seen_asins: set[str] = set()
        page_number = 1

        while len(collected) < self.max_per_category:
            page_url = f"{category.url}&page={page_number}"

            logging.info(
                "  [page %d]  %d / %d collected  →  %s",
                page_number, len(collected), self.max_per_category, page_url,
            )

            if not self._navigate(page_url):
                break

            if self._is_captcha_page():
                if not self._handle_captcha(page_url):
                    break

            page_products = self._parse_search_page()
            if not page_products:
                logging.info("  No products on page %d — done.", page_number)
                break

            new_count = 0
            for product in page_products:
                if len(collected) >= self.max_per_category:
                    break
                if product.asin not in seen_asins:
                    seen_asins.add(product.asin)
                    collected.append(product)
                    new_count += 1

            logging.info("  Parsed %d → %d new  |  total %d", len(page_products), new_count, len(collected))

            if new_count == 0:
                break

            if not self._has_next_page():
                logging.info("  No next page.")
                break

            page_number += 1

        logging.info("  ✓ %s — %d products\n", category.name, len(collected))
        return collected

    # --- JSON export ---------------------------------------------------------

    @staticmethod
    def _build_output_json(
        categories_with_products: list[tuple[CategoryInfo, list[ProductData]]],
    ) -> dict:
        total_products = sum(len(products) for _, products in categories_with_products)

        category_entries = []
        for category, products in categories_with_products:
            rated_products = [p for p in products if p.rating.score is not None]
            average_rating = (
                round(sum(p.rating.score for p in rated_products) / len(rated_products), 2)
                if rated_products
                else None
            )

            priced_products = [p for p in products if p.price.current != "N/A"]
            price_values = []
            for p in priced_products:
                cleaned = re.sub(r"[^\d.]", "", p.price.current)
                try:
                    price_values.append(float(cleaned))
                except ValueError:
                    continue

            price_stats = None
            if price_values:
                price_stats = {
                    "min": f"${min(price_values):.2f}",
                    "max": f"${max(price_values):.2f}",
                    "median": f"${sorted(price_values)[len(price_values) // 2]:.2f}",
                }

            category_entries.append({
                "name": category.name,
                "slug": category.slug,
                "node_id": category.node_id,
                "url": category.url,
                "stats": {
                    "product_count": len(products),
                    "with_price": len(priced_products),
                    "with_rating": len(rated_products),
                    "average_rating": average_rating,
                    "price_range": price_stats,
                },
                "products": [asdict(p) for p in products],
            })

        return {
            "metadata": {
                "source": "Amazon — Computers & Accessories",
                "source_url": HUB_URL,
                "scraped_at": datetime.now().isoformat(),
                "total_products": total_products,
                "total_categories": len(categories_with_products),
                "max_per_category": DEFAULT_MAX_PRODUCTS_PER_CATEGORY,
                "robots_txt_respected": True,
            },
            "categories": category_entries,
        }

    @staticmethod
    def _save_json(data: dict, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file, indent=2, ensure_ascii=False)
        logging.info("JSON saved → %s", filepath)

    # --- Public entry points -------------------------------------------------

    def run_discover(self) -> list[CategoryInfo]:
        """Discover categories and print them. No product scraping."""
        logging.info("Amazon Category Discovery — starting")
        self.robots.load()
        self._ensure_driver()

        try:
            categories = self.discover_categories()

            discovery_output = {
                "metadata": {
                    "source_url": HUB_URL,
                    "discovered_at": datetime.now().isoformat(),
                    "robots_txt_respected": True,
                },
                "categories": [
                    {
                        "name": c.name,
                        "slug": c.slug,
                        "node_id": c.node_id,
                        "url": c.url,
                    }
                    for c in categories
                ],
            }

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(OUTPUT_DIR, f"discovered_categories_{timestamp}.json")
            self._save_json(discovery_output, filepath)

            print(json.dumps(discovery_output, indent=2, ensure_ascii=False))
            return categories

        finally:
            self.shutdown()

    def run_scrape(self, category_filter: list[str] | None = None):
        """Full pipeline: discover categories → scrape products → export JSON."""
        logging.info("Amazon Tech Scraper — full pipeline")
        logging.info("Max products/category: %d", self.max_per_category)
        self.robots.load()
        self._ensure_driver()

        try:
            categories = self.discover_categories()

            if category_filter:
                filter_lower = {f.strip().lower() for f in category_filter}
                categories = [
                    c for c in categories
                    if c.slug in filter_lower
                    or c.node_id in filter_lower
                    or c.name.lower() in filter_lower
                ]
                if not categories:
                    logging.error(
                        "No categories matched filter %s. Available: %s",
                        category_filter,
                        [c.slug for c in self.discover_categories()],
                    )
                    return

            logging.info("Will scrape %d categories", len(categories))

            results: list[tuple[CategoryInfo, list[ProductData]]] = []
            for category in categories:
                products = self.scrape_category(category)
                results.append((category, products))

                per_cat_path = os.path.join(
                    OUTPUT_DIR,
                    f"amazon_{category.slug}_{datetime.now().strftime('%Y%m%d')}.json",
                )
                per_cat_json = self._build_output_json([(category, products)])
                self._save_json(per_cat_json, per_cat_path)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            combined_json = self._build_output_json(results)
            combined_path = os.path.join(OUTPUT_DIR, f"amazon_tech_all_{timestamp}.json")
            self._save_json(combined_json, combined_path)

            total = sum(len(prods) for _, prods in results)
            logging.info("=" * 64)
            logging.info("SCRAPE COMPLETE")
            logging.info("Total products: %d across %d categories", total, len(results))
            logging.info("Combined JSON:  %s", combined_path)
            logging.info("=" * 64)

        finally:
            self.shutdown()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape Amazon Computers & Accessories into structured JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Fallback category slugs (used if discovery fails):\n"
            + "\n".join(f"  {k:25s}  node={v['node_id']}" for k, v in FALLBACK_CATEGORIES.items())
        ),
    )

    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument(
        "--discover",
        action="store_true",
        help="Only discover and list categories (no product scraping)",
    )
    mode_group.add_argument(
        "--scrape",
        action="store_true",
        default=True,
        help="Discover categories then scrape products (default)",
    )

    parser.add_argument("--visible", action="store_true", help="Show browser window (non-headless)")
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_MAX_PRODUCTS_PER_CATEGORY,
        help=f"Max products per category (default: {DEFAULT_MAX_PRODUCTS_PER_CATEGORY})",
    )
    parser.add_argument(
        "--categories",
        type=str,
        default=None,
        help="Comma-separated category slugs or node IDs to scrape (default: all discovered)",
    )
    return parser.parse_args()


def main():
    args = parse_arguments()

    scraper = AmazonCategoryScraper(
        headless=not args.visible,
        max_per_category=args.limit,
    )

    if args.discover:
        scraper.run_discover()
    else:
        category_filter = None
        if args.categories:
            category_filter = [key.strip() for key in args.categories.split(",")]
        scraper.run_scrape(category_filter=category_filter)


if __name__ == "__main__":
    main()
