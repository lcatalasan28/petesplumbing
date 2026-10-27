import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import footer from "../data/footer.json";
import nav from "../data/nav.json";
import reviews from "../data/reviews.json";
import { asset, routePath } from "../assets.js";

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

function NavBranch({ items, onNavigate }) {
  return (
    <ul className="submenu">
      {items.map((item) => (
        <li key={`${item.text}-${item.href}`}>
          <NavLink to={routePath(item.href)} onClick={onNavigate}>
            {item.text}
          </NavLink>
          {item.children?.length ? <NavBranch items={item.children} onNavigate={onNavigate} /> : null}
        </li>
      ))}
    </ul>
  );
}

function SiteNav({ open, onNavigate }) {
  return (
    <nav id="site-menu" className={open ? "site-nav open" : "site-nav"} aria-label="Primary">
      <ul className="nav-list">
        {menu.map((item) => (
          <li key={item.text} className="nav-item">
            <NavLink to={routePath(item.href)} onClick={onNavigate}>
              {item.text}
              {item.children?.length ? <span className="caret" aria-hidden="true" /> : null}
            </NavLink>
            {item.children?.length ? <NavBranch items={item.children} onNavigate={onNavigate} /> : null}
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <DemoNotice />
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className="site-frame">
        <header className="site-header">
          <div className="header-main">
            <Link className="rating-link" to="/reviews">
              <Stars />
              <span>({reviews.summary.count} Ratings &amp; Reviews)</span>
            </Link>
            <p className="serving-line">
              Proudly Serving <strong>Greater Long Beach &amp; Lakewood, CA</strong>
            </p>
            <div className="header-call">
              <span>Give Us a Call!</span>
              <a href={footer.phoneHref}>{footer.phone}</a>
            </div>
            <Link to="/" className="logo-link">
              <img src={asset(footer.logo.src)} alt={footer.logo.alt} />
            </Link>
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label="Menu"
              onClick={() => setOpen((value) => !value)}
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
          <SiteNav open={open} onNavigate={() => setOpen(false)} />
        </header>
        <main id="content">{children}</main>
        <Footer />
      </div>
    </>
  );
}

function Footer() {
  const [playing, setPlaying] = useState(false);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-video">
          <h2>Learn more about Pete's Plumbing</h2>
          {playing ? (
            <video controls autoPlay preload="none" poster={asset(footer.poster)}>
              <source src={footer.video} type="video/mp4" />
            </video>
          ) : (
            <button type="button" className="watch-video" onClick={() => setPlaying(true)}>
              <img src={asset(footer.poster)} alt="" />
              <span>Watch Video</span>
            </button>
          )}
          <p>{footer.transcript}</p>
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
            <p>
              <a href={footer.phoneHref}>{footer.phone}</a>
            </p>
            <p>
              <Link to="/contact#ICcontactform">Send a Message</Link>
            </p>
            <p>
              <a href={footer.facebook}>Facebook</a>
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
