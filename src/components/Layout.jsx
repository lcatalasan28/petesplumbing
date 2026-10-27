import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import footer from "../data/footer.json";
import nav from "../data/nav.json";
import reviews from "../data/reviews.json";
import { asset, routePath } from "../assets.js";

function DemoNotice() {
  return (
    <p className="demo-notice" role="note">
      Demo site. This is an unofficial preview rebuild and is not the live Pete's Plumbing website.
    </p>
  );
}

function SiteNav({ open, onNavigate }) {
  return (
    <nav id="site-menu" className={open ? "site-nav open" : "site-nav"} aria-label="Primary">
      <ul className="nav-list">
        {nav.map((item) => (
          <li key={item.href} className="nav-item">
            <NavLink to={routePath(item.href)} onClick={onNavigate}>
              {item.text}
            </NavLink>
            {item.children?.length ? (
              <ul className="submenu">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <NavLink to={routePath(child.href)} onClick={onNavigate}>
                      {child.text}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
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
      <header className="site-header">
        <div className="topbar">
          <p>
            Proudly Serving <strong>Greater Long Beach &amp; Lakewood, CA</strong>
          </p>
          <p>
            <a href={footer.phoneHref}>{footer.phone}</a>
          </p>
          <Link className="btn btn-orange" to="/request-estimate">
            Request Estimate
          </Link>
        </div>
        <div className="header-bar">
          <Link to="/" className="logo-link">
            <img src={asset(footer.logo.src)} alt={footer.logo.alt} />
          </Link>
          <Link className="rating-link" to="/reviews">
            <span className="rating-score">{reviews.summary.average}</span>
            <span>{reviews.summary.count.toLocaleString("en-US")} ratings</span>
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
          <SiteNav open={open} onNavigate={() => setOpen(false)} />
        </div>
      </header>
      <main id="content">{children}</main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-video">
        <h2>Learn more about Pete's Plumbing</h2>
        <video controls preload="none" poster={asset(footer.poster)}>
          <source src={footer.video} type="video/mp4" />
        </video>
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
    </footer>
  );
}

export function ThankYou() {
  return (
    <article className="page thank-you">
      <h1>Thank you for contacting us.</h1>
      <p>We will get back to you as soon as possible.</p>
      <p>We appreciate you contacting us. One of our colleagues will get back in touch with you soon! Have a great day!</p>
    </article>
  );
}
