import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, afterEach } from "vitest";
import { App } from "../src/App.jsx";
import { pages, routes, sitemapPaths } from "../src/data/routes.js";
import footer from "../src/data/footer.json";
import reviews from "../src/data/reviews.json";

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("demo shell", () => {
  it("keeps version 1.0.0 in package.json and version.json", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const version = JSON.parse(readFileSync("version.json", "utf8"));
    const published = JSON.parse(readFileSync("public/version.json", "utf8"));
    expect(pkg.version).toBe("1.0.0");
    expect(version.version).toBe("1.0.0");
    expect(published.version).toBe("1.0.0");
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
    expect(screen.getByRole("heading", { level: 1, name: "Professional Plumbing Services" })).toBeInTheDocument();
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
});
