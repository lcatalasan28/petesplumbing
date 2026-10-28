import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import footer from "../data/footer.json";
import nav from "../data/nav.json";
import reviews from "../data/reviews.json";
import { pagesByRoute } from "../data/routes.js";
import { asset, normalizePath, routePath } from "../assets.js";

const serviceHrefs = new Set([
  "/plumbing-installation-and-repair/",
  "/drains-and-pipes/",
  "/gas-line-services/",
  "/specialized-plumbing-services/",
]);

const menu = [
  nav.find((item) => item.text === "Home"),
  {
    text: "Services",
    href: "/plumbing-installation-and-repair/",
    children: nav.filter((item) => serviceHrefs.has(item.href)),
  },
  nav.find((item) => item.text === "About"),
  nav.find((item) => item.text === "Contact"),
].filter(Boolean);

function DemoNotice() {
  return (
    <p className="demo-notice" role="note">
      Demo site. This is an unofficial preview rebuild and is not the live Pete's Plumbing website.
    </p>
  );
}

function cookieClosed() {
  return typeof document !== "undefined" && /(?:^|; )demo_cookie_notice=closed(?:;|$)/.test(document.cookie);
}

function CookieBar() {
  const [open, setOpen] = useState(() => !cookieClosed());
  if (!open) return null;
  return (
    <div className="cookie-bar" role="region" aria-label="Cookie notice">
      <p>This demo site uses cookies.</p>
      <button
        type="button"
        onClick={() => {
          document.cookie = "demo_cookie_notice=closed; path=/; max-age=31536000; samesite=lax";
          setOpen(false);
        }}
      >
        Close
      </button>
    </div>
  );
}

function NavBranch({ items, onNavigate, onParentClick, onTouch }) {
  return (
    <ul className="submenu">
      {items.map((item) => (
        <li key={`${item.text}-${item.href}`}>
          <NavLink
            to={routePath(item.href)}
            onTouchStart={onTouch}
            onPointerDown={onTouch}
            onClick={(event) => {
              onParentClick(event, item);
              if (!event.defaultPrevented) onNavigate();
            }}
          >
            {item.text}
            {item.children?.length ? <span className="caret" aria-hidden="true" /> : null}
          </NavLink>
          {item.children?.length ? (
            <NavBranch items={item.children} onNavigate={onNavigate} onParentClick={onParentClick} onTouch={onTouch} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SiteNav({ open, onNavigate, touchOpen, onParentClick, onTouch, onItemEnter, onItemLeave }) {
  return (
    <nav
      id="site-menu"
      className={open ? "site-nav open" : "site-nav"}
      aria-label="Primary"
      onFocus={(event) => {
        const link = event.target instanceof Element ? event.target.closest("a") : null;
        if (!link?.closest(".submenu") || typeof link.scrollIntoView !== "function") return;
        link.scrollIntoView({ block: "nearest", inline: "nearest" });
      }}
    >
      <ul className="nav-list">
        {menu.map((item) => (
          <li
            key={item.text}
            className={[
              "nav-item",
              item.text === "Services" ? "services-menu" : "",
              touchOpen === item.text ? "touch-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onMouseEnter={onItemEnter}
            onMouseLeave={onItemLeave}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) onItemLeave(event);
            }}
          >
            <NavLink
              to={routePath(item.href)}
              aria-expanded={item.children?.length ? touchOpen === item.text : undefined}
              aria-haspopup={item.children?.length ? "true" : undefined}
              onTouchStart={onTouch}
              onPointerDown={onTouch}
              onClick={(event) => {
                onParentClick(event, item);
                if (!event.defaultPrevented) onNavigate();
              }}
            >
              {item.text}
              {item.children?.length ? <span className="caret" aria-hidden="true" /> : null}
            </NavLink>
            {item.children?.length ? (
              <NavBranch items={item.children} onNavigate={onNavigate} onParentClick={onParentClick} onTouch={onTouch} />
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Stars() {
  return (
    <span className="stars" aria-hidden="true">
      ★★★★★
    </span>
  );
}

export function Layout({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [touchOpen, setTouchOpen] = useState(null);
  const touched = useRef(false);
  const menuButton = useRef(null);
  const path = normalizePath(location.pathname);
  const route = path === "/" ? "/" : `${path}/`;
  const solid = !pagesByRoute[route]?.hero;

  useEffect(() => {
    setOpen(false);
    setTouchOpen(null);
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.removeAttribute("data-closed");
      item.removeAttribute("data-open");
      item.removeAttribute("data-hover");
    });
  }, [location.pathname]);

  useEffect(() => {
    function closeDropdowns(event) {
      const items = document.querySelectorAll(
        ".nav-item:hover, .nav-item:focus-within, .nav-item.touch-open, .nav-item[data-open], .nav-item[data-hover]",
      );
      items.forEach((item) => {
        if (!item.querySelector(":scope > .submenu")) return;
        item.removeAttribute("data-open");
        item.setAttribute("data-closed", "true");
      });
      setTouchOpen(null);
      const current = event?.target instanceof Element ? event.target : document.activeElement;
      const item = current instanceof Element ? current.closest(".nav-item") : null;
      if (item?.querySelector(":scope > .submenu")) item.querySelector(":scope > a")?.focus();
    }
    function onKey(event) {
      if (event.key !== "Escape") return;
      if (open) {
        event.preventDefault();
        setOpen(false);
        menuButton.current?.focus();
        return;
      }
      closeDropdowns(event);
    }
    function onPointerDown(event) {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".site-nav") || target?.closest(".menu-toggle")) return;
      closeDropdowns(event);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function noteTouch(event) {
    if (event?.pointerType && event.pointerType !== "touch") return;
    touched.current = true;
    event.currentTarget.closest(".nav-item")?.removeAttribute("data-closed");
  }

  function onParentClick(event, item) {
    const parent = event.currentTarget.closest("li");
    const hasChildren = Boolean(item.children?.length && parent?.querySelector(":scope > .submenu"));
    const fromTouch = touched.current;
    touched.current = false;
    const topLevel = Boolean(parent?.classList.contains("nav-item"));
    if (!hasChildren || !fromTouch || window.innerWidth < 1000 || !topLevel) return;
    if (parent.dataset.open === "true" || touchOpen === item.text) return;
    event.preventDefault();
    parent.setAttribute("data-open", "true");
    setTouchOpen(item.text);
  }

  function onItemEnter(event) {
    event.currentTarget.setAttribute("data-hover", "true");
    event.currentTarget.removeAttribute("data-closed");
  }

  function onItemLeave(event) {
    event.currentTarget.removeAttribute("data-hover");
    event.currentTarget.removeAttribute("data-closed");
  }

  return (
    <>
      <DemoNotice />
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className={solid ? "site-frame header-solid" : "site-frame"}>
        <header className="site-header">
          <div className="header-main">
            <Link className="rating-link" to="/reviews">
              <span className="rating-score">{reviews.summary.average}</span>
              <Stars />
              <span className="rating-count">({reviews.summary.count} Ratings &amp; Reviews)</span>
            </Link>
            <Link className="btn btn-orange header-estimate" to="/request-estimate">
              Request Estimate
            </Link>
            <p className="serving-line">
              <span>Proudly Serving</span>
              <strong>Greater Long Beach &amp; Lakewood, CA</strong>
            </p>
            <div className="header-call">
              <span>Give Us a Call!</span>
              <a href={footer.phoneHref}>{footer.phone}</a>
            </div>
            <Link to="/" className="logo-link">
              <img src={asset(footer.logo.src)} alt={footer.logo.alt} />
            </Link>
            <button
              ref={menuButton}
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label="Menu"
              onClick={() => {
                document.querySelectorAll(".nav-item").forEach((item) => item.removeAttribute("data-closed"));
                setOpen((value) => !value);
              }}
            >
              <span className="burger" aria-hidden="true" />
            </button>
          </div>
          <div className="header-actions">
            <Link className="btn btn-orange" to="/request-estimate">
              Request Estimate
            </Link>
            <a className="btn btn-orange" href={footer.phoneHref}>
              {footer.phone}
            </a>
          </div>
          <SiteNav
            open={open}
            touchOpen={touchOpen}
            onNavigate={() => setOpen(false)}
            onParentClick={onParentClick}
            onTouch={noteTouch}
            onItemEnter={onItemEnter}
            onItemLeave={onItemLeave}
          />
        </header>
        <main id="content">{children}</main>
        <Footer />
      </div>
      <CookieBar />
    </>
  );
}

function Footer() {
  const [playing, setPlaying] = useState(false);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-video">
          <div className="footer-video-copy">
            <h2>Learn more about Pete's Plumbing</h2>
            <p>{footer.transcript}</p>
            <button type="button" className="btn btn-orange" onClick={() => setPlaying(true)}>
              Watch Video
            </button>
          </div>
          {playing ? (
            <video controls autoPlay preload="none" poster={asset(footer.poster)}>
              <source src={footer.video} type="video/mp4" />
            </video>
          ) : (
            <button type="button" className="watch-thumb" onClick={() => setPlaying(true)} aria-label="Play video">
              <img src={asset(footer.poster)} alt="" />
              <span className="play-icon" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="footer-grid">
          <section>
            <h2>SERVING AREA</h2>
            <ul>
              {footer.serving.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>CONTACT US</h2>
            <p className="footer-nap">
              <strong>{footer.name}</strong>
              <br />
              {footer.address.replace(", Signal Hill, CA 90755", ",")}{" "}
              <span className="footer-locality">Signal Hill, CA 90755</span>
              <br />
              <a href={footer.phoneHref}>{footer.phone}</a>
            </p>
            <p>
              <Link className="btn btn-orange footer-message" to="/contact#ICcontactform">
                Send a Message
              </Link>
            </p>
            <p>
              <a className="social-facebook" href={footer.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07C2 17.1 5.66 21.24 10.44 22v-7.03H7.9v-2.9h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22C18.34 21.24 22 17.1 22 12.07z"
                  />
                </svg>
              </a>
            </p>
          </section>
          <section>
            <h2>BUSINESS HOURS</h2>
            <dl className="hours">
              {footer.hours.map((row) => (
                <div key={row.days}>
                  <dt>{row.days}</dt>
                  <dd>{row.hours}</dd>
                </div>
              ))}
            </dl>
            <p>{footer.emergency}</p>
            <p>{footer.license}</p>
          </section>
        </div>
        <section className="site-links">
          <h2>SITE LINKS</h2>
          <ul>
            {footer.siteLinks.map((link) => (
              <li key={`${link.text}-${link.href}`}>
                <Link to={routePath(link.href)}>{link.text}</Link>
              </li>
            ))}
          </ul>
        </section>
        <ul className="brand-logos">
          {footer.logos.map((logo) => (
            <li key={logo.src}>
              <img src={asset(logo.src)} alt={logo.alt} />
            </li>
          ))}
        </ul>
        <p className="legal-links">
          {footer.legal.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " | " : null}
              <a href={link.href}>{link.text}</a>
            </span>
          ))}
        </p>
        <p>
          {footer.copyright} {footer.rights}
        </p>
      </div>
    </footer>
  );
}

export function ThankYou() {
  return (
    <article className="page thank-you">
      <header className="page-banner">
        <h1>Thank you for contacting us.</h1>
      </header>
      <div className="page-body">
        <p>We will get back to you as soon as possible.</p>
        <p>We appreciate you contacting us. One of our colleagues will get back in touch with you soon! Have a great day!</p>
      </div>
    </article>
  );
}
