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
    if (route === "/thank-you/") {
      document.title = "Thank you for contacting us.";
      return;
    }
    document.title = page?.title || "Page not found";
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
