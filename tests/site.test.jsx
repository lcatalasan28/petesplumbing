import { readFileSync, statSync } from "node:fs";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, afterEach } from "vitest";
import { App } from "../src/App.jsx";
import { pages, routes, sitemapPaths } from "../src/data/routes.js";
import footer from "../src/data/footer.json";
import reviews from "../src/data/reviews.json";

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "demo_cookie_notice=; path=/; max-age=0";
});

const homeH1 = `Long Beach's Trusted Plumbers, Rated ${reviews.summary.average} by ${reviews.summary.count.toLocaleString("en-US")} Customers`;

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("demo shell", () => {
  it("keeps version 1.4.0 in package.json and version.json", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const version = JSON.parse(readFileSync("version.json", "utf8"));
    const published = JSON.parse(readFileSync("public/version.json", "utf8"));
    expect(pkg.version).toBe("1.4.0");
    expect(version.version).toBe("1.4.0");
    expect(published.version).toBe("1.4.0");
  });

  it("noindexes every response and disallows crawlers", () => {
    const html = readFileSync("index.html", "utf8");
    const robots = readFileSync("public/robots.txt", "utf8");
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
    expect(html).toMatch(/name="robots"\s+content="noindex"/);
    expect(robots).toMatch(/Disallow:\s*\//);
    expect(vercel.buildCommand).toBe("VITE_STATIC_DEMO=1 VITE_BASE=/ npm run build");
    expect(vercel.headers[0].headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex" });
  });

  it("maps every sitemap path to a page and keeps the thank-you route", () => {
    const routed = new Set(routes.map((route) => route.route));
    for (const path of sitemapPaths) {
      expect(routed.has(path)).toBe(true);
    }
    expect(routed.has("/thank-you/")).toBe(true);
    expect(pages).toHaveLength(sitemapPaths.length);
  });

  it("rewrites only known routes and keeps a real 404 page", () => {
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
    const sources = new Set(vercel.rewrites.map((rule) => rule.source));
    expect(vercel.rewrites.every((rule) => rule.destination === "/index.html")).toBe(true);
    for (const rule of vercel.rewrites) {
      expect(rule.source).not.toMatch(/[()*+?:]/);
    }
    for (const route of routes) {
      if (route.route === "/") continue;
      const bare = route.route.replace(/\/$/, "");
      expect(sources.has(bare)).toBe(true);
      expect(sources.has(`${bare}/`)).toBe(true);
    }
    expect(sources.size).toBe((routes.length - 1) * 2);
    const shell = readFileSync("index.html", "utf8");
    const config = readFileSync("vite.config.js", "utf8");
    expect(shell).toMatch(/name="robots"\s+content="noindex"/);
    expect(config).toContain('copyFileSync(resolve(outDir, "index.html"), resolve(outDir, "404.html"))');
  });

  it("shows the designed not-found page inside the site shell", () => {
    renderAt("/not-a-real-page");
    expect(screen.getByRole("note")).toHaveTextContent(/demo site/i);
    expect(document.querySelector(".site-header")).toBeTruthy();
    expect(document.querySelector(".site-footer")).toBeTruthy();
    const article = screen.getByRole("article");
    const banner = article.querySelector(".page-banner");
    expect(banner).toBeTruthy();
    expect(within(banner).getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(within(article).getByText("That page is not on this demo.")).toBeInTheDocument();
    expect(within(article).getByRole("link", { name: "Request an Estimate" })).toHaveAttribute("href", "/request-estimate");
    expect(within(article).getByRole("link", { name: "Call (562) 599-0106" })).toHaveAttribute("href", "tel:+15625990106");
    expect(within(article).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(document.title).toBe("Page not found");
  });

  it("keeps the live copy, fixes the lumbing typo, and drops placeholder lorem", () => {
    const blob = JSON.stringify(pages).toLowerCase();
    expect(blob).not.toContain("lorem");
    expect(blob).not.toContain("request lorem");
    expect(blob).not.toContain("bullet text");
    expect(blob).not.toContain("title or question");
    expect(blob).not.toMatch(/[^p]lumbing/);
    expect(footer.transcript).toContain("appliance and plumbing installation");
    expect(footer.transcript).not.toMatch(/[^p]lumbing/i);
    expect(blob).toContain("professional plumbing services");
    expect(blob).toContain("3099 e pacific coast hwy");
  });

  it("shows the demo notice, home copy, and a working menu", () => {
    renderAt("/");
    expect(screen.getByRole("note")).toHaveTextContent(/demo site/i);
    expect(screen.getByRole("heading", { level: 1, name: homeH1 })).toBeInTheDocument();
    expect(screen.getByText(/appliance and plumbing installation/)).toBeInTheDocument();
    expect(screen.getByText(/appliance and plumbing installation/).textContent).not.toMatch(/[^p]lumbing/i);
    const menu = screen.getByRole("button", { name: "Menu" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link", { name: "Faucet Repair" }).length).toBeGreaterThan(0);
  });

  it("shows the demo notice on the thank-you page", () => {
    renderAt("/thank-you/");
    expect(screen.getByRole("note")).toHaveTextContent(/demo site/i);
    expect(screen.getByRole("heading", { name: /thank you for contacting us/i })).toBeInTheDocument();
    expect(screen.getByText(/we appreciate you contacting us/i)).toBeInTheDocument();
  });

  it("skips the lead send in static demo mode and opens thank-you", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderAt("/contact");
    fireEvent.change(screen.getByLabelText("Name*"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email*"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone*"), { target: { value: "5625550100" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));
    expect(await screen.findByRole("heading", { name: /thank you for contacting us/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses review text from the live widget without inventing quotes", () => {
    renderAt("/reviews");
    expect(screen.getAllByText(/1,184 ratings/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Juan and his assistant arrived early/)).toBeInTheDocument();
    expect(screen.getByText("Noah H")).toBeInTheDocument();
    expect(screen.queryByText("TONY")).not.toBeInTheDocument();
    expect(reviews.source).toMatch(/merchants\/58254\/reviews\.json/);
    expect(reviews.reviews).toHaveLength(10);
  });

  it("includes the live service FAQ, services menu, and blog teasers", () => {
    const faucet = pages.find((page) => page.route === "/faucet-repair/");
    const faq = faucet.blocks.find((block) => block.type === "faq");
    expect(faq.items).toHaveLength(3);
    expect(faq.items[0].q).toBe("How can I tell if my faucet needs fixing or replacing?");
    const hero = pages.filter((page) =>
      page.blocks.some(
        (block) =>
          block.type === "form" &&
          block.fields?.some((field) =>
            field.options?.includes("Appliance & Plumbing Installation and Repair"),
          ),
      ),
    );
    expect(hero.length).toBe(90);
    const estimate = pages.find((page) => page.route === "/request-estimate/");
    const services = estimate.blocks
      .find((block) => block.type === "form")
      .fields.find((field) => field.label === "Services*");
    expect(services.type).toBe("select");
    expect(services.options).toEqual([
      "Services*",
      "Appliance & Plumbing Installation and Repair",
      "Drains & Pipes",
      "Gas Line Services",
      "Specialized Plumbing Services",
      "Other",
      "Other",
    ]);
    const inspection = pages.find((page) => page.route === "/plumbing-inspection/");
    const inspectionFaq = inspection.blocks.find((block) => block.type === "faq");
    expect(inspectionFaq.items.map((item) => item.q)).toEqual([
      "Why is a plumbing inspection important?",
      "What are the benefits of a plumbing inspection?",
      "Will a plumbing inspection disrupt my daily routine?",
    ]);
    const home = pages.find((page) => page.route === "/");
    const posts = home.blocks.find((block) => block.type === "posts");
    expect(posts.items.every((item) => !item.date)).toBe(true);
    expect(posts.items[0].excerpt).toMatch(/Not sure how to select the best plumbing contractors/);
    renderAt("/faucet-repair");
    expect(screen.getByText("Appliance & Plumbing Installation and Repair")).toBeInTheDocument();
    expect(screen.getByText(faq.items[0].q)).toBeInTheDocument();
  });

  it("starts Contact Method with a blank option", () => {
    renderAt("/request-estimate");
    const method = screen.getByLabelText("Contact Method*");
    expect(method).toHaveValue("");
    expect(method.options[0]).toBeDisabled();
    expect(method.options[0]).toHaveAttribute("hidden");
    expect(method.options[0].text).toBe("");
    expect(method.options[1].text).toBe("Email");
    expect(method.options[2].text).toBe("Phone");
  });

  it("closes the mobile menu when Escape is pressed", () => {
    renderAt("/");
    const menu = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("site-menu")).not.toHaveClass("open");
    expect(menu).toHaveFocus();
  });

  it("closes a desktop dropdown when Escape is pressed", () => {
    renderAt("/");
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    const capability = nav.getByRole("link", { name: "Capability Statement" });
    capability.focus();
    fireEvent.keyDown(capability, { key: "Escape" });
    const about = nav.getByRole("link", { name: (name) => name.trim() === "About" });
    expect(about.closest(".nav-item")).toHaveAttribute("data-closed", "true");
    expect(about).toHaveFocus();
  });

  it("opens desktop dropdowns on the first touch instead of navigating", () => {
    window.innerWidth = 1280;
    renderAt("/");
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    for (const label of ["Services", "About", "Contact"]) {
      const link = nav.getByRole("link", { name: (name) => name.trim() === label });
      fireEvent.touchStart(link);
      fireEvent.click(link);
      expect(link.closest(".nav-item")).toHaveClass("touch-open");
      expect(screen.getByRole("heading", { level: 1, name: homeH1 })).toBeInTheDocument();
    }
    const contact = nav.getByRole("link", { name: (name) => name.trim() === "Contact" });
    fireEvent.touchStart(contact);
    fireEvent.click(contact);
    expect(screen.queryByRole("heading", { level: 1, name: homeH1 })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Contact" })).toBeInTheDocument();
  });

  it("closes a hover-opened dropdown when Escape is pressed", () => {
    renderAt("/");
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    const about = nav.getByRole("link", { name: (name) => name.trim() === "About" });
    const item = about.closest(".nav-item");
    fireEvent.mouseEnter(item);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(item).toHaveAttribute("data-closed", "true");
  });

  it("follows a Services category heading on the first touch", () => {
    window.innerWidth = 1280;
    renderAt("/");
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    const category = nav.getByRole("link", { name: "Plumbing Installation and Repair" });
    fireEvent.touchStart(category);
    fireEvent.click(category);
    expect(screen.getByRole("heading", { level: 1, name: "Plumbing Installation and Repair" })).toBeInTheDocument();
  });

  it("closes an open submenu when the pointer goes outside the menu", () => {
    window.innerWidth = 1280;
    renderAt("/");
    const nav = within(screen.getByRole("navigation", { name: "Primary" }));
    const services = nav.getByRole("link", { name: (name) => name.trim() === "Services" });
    fireEvent.touchStart(services);
    fireEvent.click(services);
    expect(services.closest(".nav-item")).toHaveClass("touch-open");
    fireEvent.pointerDown(document.body);
    expect(services.closest(".nav-item")).not.toHaveClass("touch-open");
    expect(services.closest(".nav-item")).toHaveAttribute("data-closed", "true");
  });

  it("puts the contact subtitle in the banner and the breadcrumb under the map", () => {
    renderAt("/contact");
    const banner = document.querySelector(".page-banner");
    expect(within(banner).getByRole("heading", { level: 1, name: "Contact" })).toBeInTheDocument();
    expect(within(banner).getByRole("heading", { level: 4, name: "Pete's Plumbing" })).toBeInTheDocument();
    const map = document.querySelector(".map-embed");
    const crumbs = document.querySelector(".crumb-bar");
    expect(map.compareDocumentPosition(crumbs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(crumbs).toHaveTextContent("Home");
    expect(crumbs).toHaveTextContent("Contact");
    expect(screen.getByText("© OpenMapTiles © OpenStreetMap © OpenFreeMap")).toBeInTheDocument();
    expect(screen.getAllByText(/OpenStreetMap/)).toHaveLength(1);
  });

  it("keeps city service lists under their headings", () => {
    renderAt("/contact/best-local-plumber-service-area/lakewood-ca");
    const main = document.querySelector(".page-main");
    const text = main.textContent;
    const services = text.indexOf("Our services include:");
    const serviceItem = text.indexOf("24/7 emergency repairs");
    const why = text.indexOf("Here's what sets us apart:");
    const whyItem = text.indexOf("Lifetime warranty on copper re-pipes");
    const contact = text.indexOf("Contact Us");
    expect(services).toBeGreaterThan(-1);
    expect(services).toBeLessThan(serviceItem);
    expect(serviceItem).toBeLessThan(why);
    expect(why).toBeLessThan(whyItem);
    expect(whyItem).toBeLessThan(contact);
    const card = document.querySelector(".rely-card");
    const logo = card.querySelector(".rely-logo");
    const heading = within(card).getByRole("heading", { name: "Professional Plumbing You Can Rely On" });
    expect(logo.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card.querySelector(".rely-cta")).toHaveTextContent("Request an Estimate Today!");
  });

  it("keeps the top affiliation logos and the first blog image eager", () => {
    renderAt("/affiliations-and-credentials");
    for (const name of ["petes-plumbing-logo-phcc01-800w.png", "petes-plumbing-logo-nfib-800w.png"]) {
      const img = document.querySelector(`img[src$="${name}"]`);
      expect(img).toBeTruthy();
      expect(img).not.toHaveAttribute("loading", "lazy");
    }
    const lakewood = document.querySelector('img[src$="petes-plumbing-logo-lakewood-chamber-of-commerce.png"]');
    expect(lakewood).toHaveAttribute("width", "492");
    expect(lakewood).toHaveAttribute("height", "492");
    expect(lakewood).toHaveClass("logo-lakewood");
    const logo = readFileSync("public/images/petes-plumbing-logo-lakewood-chamber-of-commerce.png");
    expect(logo.readUInt32BE(16)).toBeGreaterThanOrEqual(492);
    expect(logo.readUInt32BE(20)).toBeGreaterThanOrEqual(492);
    cleanup();
    renderAt("/blog");
    const blogImages = [...document.querySelectorAll(".post-list img")];
    expect(blogImages.length).toBeGreaterThan(1);
    expect(blogImages[0]).not.toHaveAttribute("loading", "lazy");
    for (const img of blogImages.slice(1)) expect(img).toHaveAttribute("loading", "lazy");
    cleanup();
    renderAt("/");
    expect(document.querySelector(".post-list img")).toHaveAttribute("loading", "lazy");
  });

  it("loads the footer video thumbnail eagerly on the thank-you and 404 pages", () => {
    renderAt("/thank-you/");
    const thankYou = document.querySelector(".watch-thumb img");
    expect(thankYou.getAttribute("src")).toContain("petes-plumbing-video-800w.jpg");
    expect(thankYou).not.toHaveAttribute("loading", "lazy");
    cleanup();
    renderAt("/not-a-real-page");
    const missing = document.querySelector(".watch-thumb img");
    expect(missing.getAttribute("src")).toContain("petes-plumbing-video-800w.jpg");
    expect(missing).not.toHaveAttribute("loading", "lazy");
    cleanup();
    renderAt("/");
    expect(document.querySelector(".watch-thumb img")).toHaveAttribute("loading", "lazy");
  });

  it("lazy-loads images below the fold and keeps the header logo eager", () => {
    renderAt("/");
    expect(document.querySelector(".logo-link img")).toHaveAttribute("loading", "eager");
    expect(document.querySelector(".service-card img")).toHaveAttribute("loading", "lazy");
    expect(document.querySelector(".brand-logos img")).toHaveAttribute("loading", "lazy");
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/googletagmanager|google-analytics|facebook\.net|doubleclick/i);
    expect(statSync("public/images/petes-plumbing-hero-shower-repair-1920w.jpg").size).toBeLessThan(500_000);
    expect(statSync("public/images/petes-plumbing-hero-tankless-water-heater-services-1920w.jpg").size).toBeLessThan(300_000);
  });

  it("publishes Plumber and LocalBusiness details without hours or a rating", () => {
    renderAt("/");
    const data = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    expect(data["@type"]).toEqual(["Plumber", "LocalBusiness"]);
    expect(data.name).toBe("Pete's Plumbing");
    expect(data.url).toBe("https://www.petes-plumbing.com/");
    expect(data.telephone).toBe("(562) 599-0106");
    expect(data.address.streetAddress).toBe("3099 E Pacific Coast Hwy");
    expect(data.address.addressLocality).toBe("Signal Hill");
    expect(data.address.addressRegion).toBe("CA");
    expect(data.address.postalCode).toBe("90755");
    expect(data.identifier).toBe("CSLB #277178");
    expect(data.openingHours).toBeUndefined();
    expect(data.aggregateRating).toBeUndefined();
    expect(JSON.stringify(data)).not.toMatch(/openingHours|aggregateRating|Google|BBB/);
  });

  it("gives every page one H1, a unique title, and a unique description", () => {
    const titles = new Set();
    const descriptions = new Set();
    for (const page of pages) {
      titles.add(page.title);
      descriptions.add(page.description);
      const h1 = page.blocks.filter((block) => block.type === "heading" && block.level === 1);
      expect(h1).toHaveLength(1);
    }
    expect(titles.size).toBe(pages.length);
    expect(descriptions.size).toBe(pages.length);
    const lakewood = pages.find((page) => page.route.endsWith("/lakewood-ca/"));
    expect(lakewood.title).toBe("Best Local Plumber in Lakewood, CA | Pete's Plumbing");
    expect(lakewood.blocks.find((block) => block.type === "heading" && block.level === 1).text).toBe(
      "Best Local Plumber in Lakewood, CA",
    );
    const post = pages.find((page) => page.route === "/how-local-plumbers-can-save-you-money/");
    expect(post.blocks.find((block) => block.type === "heading" && block.level === 1).text).toBe(
      "How Local Plumbers Can Save You Money",
    );
    renderAt("/contact/best-local-plumber-service-area/lakewood-ca");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Best Local Plumber in Lakewood, CA | Pete's Plumbing");
    expect(document.querySelector('meta[name="description"]').getAttribute("content")).toBe(
      "Best local plumber in Lakewood, CA. Pete's Plumbing offers reliable plumbing with a lifetime warranty on copper re-pipes.",
    );
    for (const page of pages) {
      expect(page.title.length).toBeLessThanOrEqual(60);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
    expect(document.querySelector(".footer-locality")).toHaveTextContent("Signal Hill, CA 90755");
    const nap = document.querySelector(".footer-nap");
    expect(nap).toHaveTextContent("Pete's Plumbing");
    expect(nap).toHaveTextContent("3099 E Pacific Coast Hwy, Signal Hill, CA 90755");
    expect(nap).toHaveTextContent("(562) 599-0106");
  });

  it("keeps a single ampersand in the capability statement description", () => {
    const page = pages.find((item) => item.route === "/capability-statement/");
    expect(page.description).toContain("Greater Long Beach & Lakewood");
    expect(page.description).not.toContain("&amp;");
    renderAt("/capability-statement");
    const meta = document.querySelector('meta[name="description"]');
    expect(meta.getAttribute("content")).toBe(page.description);
    expect(meta.getAttribute("content")).not.toContain("&amp;");
    expect(meta.outerHTML).toContain("Long Beach &amp; Lakewood");
    expect(meta.outerHTML).not.toContain("&amp;amp;");
  });

  it("builds the home hero from the header rating and keeps the estimate form", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderAt("/");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(homeH1);
    const subhead = screen.getByText(
      "Repairs, water heaters, leak detection and drain service from a licensed local team with over 50 years of experience. CA License #277178.",
    );
    expect(subhead.textContent).toContain("License\u00A0#277178");
    expect(screen.getByRole("link", { name: "Request an Estimate" })).toHaveAttribute("href", "/request-estimate");
    expect(screen.getByRole("link", { name: "Call (562) 599-0106" })).toHaveAttribute("href", "tel:+15625990106");
    const header = document.querySelector(".rating-link");
    const trust = document.querySelector(".home-hero-trust a");
    expect(header).toHaveTextContent(String(reviews.summary.average));
    expect(header).toHaveTextContent(String(reviews.summary.count));
    expect(trust).toHaveAttribute("href", "/reviews");
    expect(trust).toHaveTextContent(`${reviews.summary.average} · ${reviews.summary.count.toLocaleString("en-US")} Ratings & Reviews`);
    expect(screen.getByText("Licensed · CSLB #277178")).toBeInTheDocument();
    const hero = document.querySelector(".home-hero").textContent;
    for (const word of ["Google", "Yelp", "24/7", "hours", "$", "fee", "BBB"]) {
      expect(hero.toLowerCase()).not.toContain(word.toLowerCase());
    }
    expect(document.querySelector(".home-hero-photo").getAttribute("src")).toContain("petes-plumbing-hero-home-800w.jpg");
    const notice = screen.getByRole("region", { name: "Cookie notice" });
    expect(notice).toBeInTheDocument();
    fireEvent.click(within(notice).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("region", { name: "Cookie notice" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name:"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Phone:"), { target: { value: "5625550100" } });
    fireEvent.change(screen.getByLabelText("Email:"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Services"), { target: { value: "Drains & Pipes" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("heading", { name: /thank you for contacting us/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("restores Home on the breadcrumbs that were missing it", () => {
    renderAt("/4-signs-it-s-time-to-call-a-local-plumber-for-help");
    expect(document.querySelector(".crumb-bar")).toHaveTextContent("Home");
    expect(document.querySelector(".crumb-bar")).toHaveTextContent("4 Signs It's Time to Call a Local Plumber for Help");
    cleanup();
    renderAt("/service-area");
    const crumbs = document.querySelector(".crumb-bar");
    expect(crumbs).toHaveTextContent("Home");
    expect(crumbs).toHaveTextContent("Contact");
    expect(crumbs).toHaveTextContent("Serving Area");
  });
});
