import pages from "./pages.json";
import sitemapPaths from "./sitemap-paths.json";

export const pageRoutes = pages.map((page) => ({
  route: page.route,
  title: page.title,
  source: page.source,
  sourceFile: page.sourceFile || "",
}));

export const thankYouRoute = {
  route: "/thank-you/",
  title: "Thank you for contacting us.",
  source: "https://www.petes-plumbing.com/contact",
  sourceFile: "contact.html",
  note: "Success copy from the contact and request-estimate forms.",
};

export const routes = [...pageRoutes, thankYouRoute];

export const pagesByRoute = Object.fromEntries(pages.map((page) => [page.route, page]));

export { pages, sitemapPaths };
