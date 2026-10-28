import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { pagesByRoute } from "./data/routes.js";
import { normalizePath } from "./assets.js";
import { Layout, ThankYou } from "./components/Layout.jsx";
import { PageView } from "./components/PageView.jsx";

export function App() {
  const location = useLocation();
  const path = normalizePath(location.pathname);
  const route = path === "/" ? "/" : `${path}/`;
  const page = pagesByRoute[route];

  useEffect(() => {
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.appendChild(description);
    }
    let title = "Page not found";
    let summary = "That page is not on this Pete's Plumbing demo.";
    if (route === "/thank-you/") {
      title = "Thank you for contacting us.";
      summary = "Thank you for contacting Pete's Plumbing in Signal Hill. We will get back to you as soon as possible.";
    } else if (page) {
      title = page.title;
      summary = page.description;
    }
    document.title = title;
    if (description && summary) description.setAttribute("content", summary);
  }, [page, route]);

  let body;
  if (route === "/thank-you/") {
    body = <ThankYou />;
  } else if (!page) {
    body = (
      <article className="page not-found">
        <header className="page-banner">
          <h1>Page not found</h1>
        </header>
        <div className="page-body not-found-body">
          <p>That page is not on this demo.</p>
          <p className="not-found-actions">
            <Link className="btn btn-orange" to="/request-estimate">
              Request an Estimate
            </Link>
            <a className="btn btn-outline" href="tel:+15625990106">
              Call (562) 599-0106
            </a>
            <Link className="btn" to="/">
              Home
            </Link>
          </p>
        </div>
      </article>
    );
  } else {
    body = <PageView page={page} />;
  }

  return <Layout>{body}</Layout>;
}
