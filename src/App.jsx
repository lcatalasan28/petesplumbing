import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
    document.title = page?.title || "Pete's Plumbing";
  }, [page, route]);

  let body;
  if (route === "/thank-you/") {
    body = <ThankYou />;
  } else if (!page) {
    body = (
      <article className="page">
        <h1>Page not found</h1>
      </article>
    );
  } else {
    body = <PageView page={page} />;
  }

  return <Layout>{body}</Layout>;
}
