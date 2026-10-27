import { readFileSync } from "node:fs";
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
  it("keeps version 1.1.0 in package.json and version.json", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const version = JSON.parse(readFileSync("version.json", "utf8"));
    const published = JSON.parse(readFileSync("public/version.json", "utf8"));
    expect(pkg.version).toBe("1.1.0");
    expect(version.version).toBe("1.1.0");
    expect(published.version).toBe("1.1.0");
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

  it("keeps the live copy, including the lumbing typo, and drops placeholder lorem", () => {
    const blob = JSON.stringify(pages).toLowerCase();
    expect(blob).not.toContain("lorem");
    expect(blob).not.toContain("request lorem");
    expect(blob).not.toContain("bullet text");
    expect(blob).not.toContain("title or question");
    expect(footer.transcript).toContain("and lumbing");
    expect(blob).toContain("professional plumbing services");
    expect(blob).toContain("3099 e pacific coast hwy");
  });

  it("shows the demo notice, home copy, and a working menu", () => {
    renderAt("/");
    expect(screen.getByRole("note")).toHaveTextContent(/demo site/i);
    expect(screen.getByRole("heading", { level: 1, name: homeH1 })).toBeInTheDocument();
    expect(screen.getByText(/and lumbing/)).toBeInTheDocument();
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

  it("builds the home hero from the header rating and keeps the estimate form", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    renderAt("/");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(homeH1);
    expect(
      screen.getByText(
        "Repairs, water heaters, leak detection and drain service from a licensed local team with over 50 years of experience. CA License #277178.",
      ),
    ).toBeInTheDocument();
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
