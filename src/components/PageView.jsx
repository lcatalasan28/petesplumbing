import { Fragment } from "react";
import { Link } from "react-router-dom";
import reviews from "../data/reviews.json";
import { asset, routePath } from "../assets.js";
import { LeadForm } from "./LeadForm.jsx";

const DIRECTIONS =
  "https://maps.google.com/maps?q=3099+E+Pacific+Coast+Hwy%2C+Signal+Hill%2C+CA+90755%2C+US(Pete%27s+Plumbing)&sll=33.79013,-118.15591";

const POST_IMAGES = {
  "/what-to-look-for-when-choosing-plumbing-contractors/": "/images/RSshutterstock_74734420-800w.jpg",
  "/4-signs-it-s-time-to-call-a-local-plumber-for-help/": "/images/RSshutterstock_503645938-800w.jpg",
  "/how-local-plumbers-can-save-you-money/": "/images/RSshutterstock_231389278-(2)-800w.jpg",
  "/the-benefits-of-hiring-a-plumbing-contractor/": "/images/RSshutterstock_244879831-(1)-800w.jpg",
  "/why-the-best-local-plumbers-recommend-water-efficient-solutions/": "/images/RSshutterstock_237625252-(7)-800w.jpg",
};

const SERVICE_ICONS = [
  "/images/icon-tools.svg",
  "/images/icon-grill.svg",
  "/images/icon-pipe.svg",
  "/images/icon-faucet.svg",
];

function Rich({ block }) {
  const parts = block.parts?.length ? block.parts : [{ text: block.text }];
  return (
    <p>
      {parts.map((part, index) => {
        const content = part.strong ? <strong>{part.text}</strong> : part.text;
        if (!part.href) return <span key={index}>{content}</span>;
        if (part.href.startsWith("/") && !part.href.startsWith("//")) {
          const [path, hash] = part.href.split("#");
          return (
            <Link key={index} to={`${routePath(path)}${hash ? `#${hash}` : ""}`}>
              {content}
            </Link>
          );
        }
        return (
          <a key={index} href={part.href}>
            {content}
          </a>
        );
      })}
    </p>
  );
}

function formatDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ReviewCards({ items }) {
  return (
    <ul className="review-list">
      {items.map((review, index) => (
        <li key={`${review.name}-${review.date}-${index}`}>
          <p className="review-meta">
            <span>{review.name}</span>
            <span>{review.rating} out of 5</span>
            <time dateTime={review.date}>{review.displayDate || formatDate(review.date)}</time>
          </p>
          <p>{review.comment}</p>
          {review.reply ? (
            <p className="review-reply">
              <span>REPLY FROM THE BUSINESS</span> {review.reply}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ReviewSummary() {
  const { summary } = reviews;
  return (
    <p className="review-summary">
      {summary.average} overall, {summary.count.toLocaleString("en-US")} ratings. Google {summary.googleAverage} /{" "}
      {summary.googleCount.toLocaleString("en-US")} ratings.
    </p>
  );
}

export function PageView({ page }) {
  const heroEnd = page.hero ? page.blocks.findIndex((block) => block.type === "form") : -1;
  const heroBlocks = heroEnd >= 0 ? page.blocks.slice(0, heroEnd + 1) : [];
  const rest = heroEnd >= 0 ? page.blocks.slice(heroEnd + 1) : page.blocks;
  const copy = heroBlocks.filter((block) => block.type !== "form");
  const form = heroBlocks.find((block) => block.type === "form");

  return (
    <article className={page.hero ? "page has-hero" : "page"}>
      {heroBlocks.length ? (
        <header className="hero" style={{ backgroundImage: `url(${asset(page.hero)})` }}>
          <div className="hero-inner">
            <div className="hero-copy">
              {copy.map((block, index) => (
                <Block key={index} block={block} page={page} />
              ))}
            </div>
            {form ? <Block block={form} page={page} /> : null}
          </div>
        </header>
      ) : (
        <InnerPage page={page} />
      )}
      {page.hero ? (page.route === "/" ? <HomeRest blocks={rest} page={page} /> : <BlockList blocks={rest} page={page} />) : null}
    </article>
  );
}

function BlockList({ blocks, page, className = "page-body" }) {
  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <Fragment key={index}>
          <Block block={block} page={page} />
        </Fragment>
      ))}
      {page.route === "/reviews/" ? (
        <>
          <ReviewSummary />
          <ReviewCards items={reviews.reviews} />
        </>
      ) : null}
    </div>
  );
}

function InnerPage({ page }) {
  const banner = [];
  const rest = [];
  let map = null;
  let crumbs = null;
  for (const block of page.blocks) {
    if (block.type === "crumbs" && !crumbs) {
      crumbs = block;
      continue;
    }
    if (page.route === "/contact/" && block.type === "map" && !map) {
      map = block;
      continue;
    }
    if (rest.length === 0 && block.type === "heading" && banner.length < 2) {
      banner.push(block);
      continue;
    }
    rest.push(block);
  }

  const formAt = rest.findIndex((block) => block.type === "form");
  const contact = page.route === "/contact/" && formAt >= 0;
  const estimate = page.route === "/request-estimate/";

  return (
    <>
      <header className="page-banner">
        {banner.map((block, index) => (
          <Block key={index} block={block} page={page} />
        ))}
        {crumbs ? <Block block={crumbs} page={page} /> : null}
      </header>
      {map ? (
        <img className="map-embed" src={asset("/images/map-signal-hill.png")} alt={`Map of ${map.address}`} />
      ) : null}
      {contact ? (
        <div className="contact-grid">
          <div className="contact-form-col">
            {rest.slice(0, formAt + 1).map((block, index) => (
              <Block key={index} block={block} page={page} />
            ))}
          </div>
          <div className="contact-info-col">
            <p className="address">
              {map?.address}{" "}
              <a href={map?.href || DIRECTIONS}>{map?.label || "Get Directions"}</a>
            </p>
            {rest.slice(formAt + 1).map((block, index) => (
              <Block key={index} block={block} page={page} />
            ))}
          </div>
        </div>
      ) : estimate ? (
        <div className="estimate-card">
          {rest.map((block, index) => (
            <Block key={index} block={block} page={page} />
          ))}
        </div>
      ) : (
        <BlockList blocks={rest} page={page} />
      )}
    </>
  );
}

function HomeRest({ blocks, page }) {
  const at = (text) => blocks.findIndex((block) => block.type === "heading" && block.text === text);
  const servicesAt = at("Plumbing Installation and Repair");
  const quoteAt = at("Here's what our satisfied customers are saying...");
  const faqAt = at("Frequently Asked Questions");
  const blogAt = at("Recent Blog Posts");
  if (servicesAt < 0 || quoteAt < 0 || faqAt < 0 || blogAt < 0) {
    return <BlockList blocks={blocks} page={page} />;
  }

  const why = blocks.slice(0, servicesAt);
  const services = blocks.slice(servicesAt, quoteAt);
  const quote = blocks.slice(quoteAt, faqAt);
  const faq = blocks.slice(faqAt, blogAt);
  const blog = blocks.slice(blogAt);
  const groups = [];
  services.forEach((block) => {
    if (block.type === "heading") groups.push([block]);
    else if (groups.length) groups[groups.length - 1].push(block);
  });

  return (
    <>
      <section className="why-section">
        <div className="why-intro">
          {why
            .filter((block) => block.type === "heading" || (block.type === "rich" && (block.text || "").length > 60))
            .map((block, index) => (
              <Block key={index} block={block} page={page} />
            ))}
        </div>
        <div className="why-panel">
          <div className="why-copy">
            <ul className="check-list">
              {why
                .filter((block) => block.type === "rich" && (block.text || "").length <= 60)
                .map((block) => (
                  <li key={block.text}>{block.text}</li>
                ))}
            </ul>
            {why
              .filter((block) => block.type === "button")
              .map((block, index) => (
                <Block key={index} block={block} page={page} />
              ))}
          </div>
          {why
            .filter((block) => block.type === "image")
            .map((block, index) => (
              <Block key={index} block={block} page={page} />
            ))}
        </div>
      </section>
      <section className="service-grid">
        {groups.map((group, index) => (
          <article className="service-card" key={group[0].text}>
            {SERVICE_ICONS[index] ? <img src={asset(SERVICE_ICONS[index])} alt="" /> : null}
            {group.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} page={page} />
            ))}
          </article>
        ))}
      </section>
      <section className="quote-band">
        <div className="quote-card">
          <img src={asset("/images/icon-quote.svg")} alt="" />
          {quote.map((block, index) => (
            <Block key={index} block={block} page={page} />
          ))}
        </div>
      </section>
      <section className="faq-section">
        {faq.map((block, index) => (
          <Block key={index} block={block} page={page} />
        ))}
      </section>
      <section className="blog-section">
        {blog.map((block, index) => (
          <Block key={index} block={block} page={page} />
        ))}
      </section>
    </>
  );
}

function Block({ block, page }) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${Math.min(block.level || 2, 6)}`;
      return <Tag>{block.text}</Tag>;
    }
    case "rich":
      return <Rich block={block} />;
    case "list":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item.text}>
              <Rich block={item} />
            </li>
          ))}
        </ul>
      );
    case "links":
      return (
        <ul className="link-cloud">
          {block.items.map((item) => (
            <li key={`${item.text}-${item.href}`}>
              {item.href ? <Link to={routePath(item.href)}>{item.text}</Link> : item.text}
            </li>
          ))}
        </ul>
      );
    case "button":
      if (block.href?.startsWith("tel:") || block.href?.startsWith("http")) {
        return (
          <a className="btn" href={block.href}>
            {block.text}
          </a>
        );
      }
      return (
        <Link className="btn" to={routePath(block.href || "/")}>
          {block.text}
        </Link>
      );
    case "phone":
      return (
        <a className="btn btn-orange" href={block.href}>
          {block.text}
        </a>
      );
    case "image":
      return <img src={asset(block.src)} alt={block.alt || ""} />;
    case "form":
      return <LeadForm variant={block.variant} fields={block.fields} page={page.route} />;
    case "faq":
      return (
        <div className="faq">
          {block.items.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      );
    case "posts":
      return (
        <ul className="post-list">
          {block.items.map((post) => (
            <li key={post.href || post.title}>
              {POST_IMAGES[post.href] ? <img src={asset(POST_IMAGES[post.href])} alt="" /> : null}
              <h3>
                <Link to={routePath(post.href)}>{post.title}</Link>
              </h3>
              {post.date ? <p className="post-date">{post.date}</p> : null}
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </li>
          ))}
        </ul>
      );
    case "hours":
      return (
        <dl className="hours">
          {block.rows.map((row) => (
            <div key={row.days}>
              <dt>{row.days}</dt>
              <dd>{row.hours}</dd>
            </div>
          ))}
        </dl>
      );
    case "map":
      return (
        <div className="map-block">
          <img className="map-embed" src={asset("/images/map-signal-hill.png")} alt={`Map of ${block.address}`} />
          <p className="address">
            {block.address}{" "}
            <a href={block.href || DIRECTIONS}>{block.label || "Get Directions"}</a>
          </p>
        </div>
      );
    case "crumbs":
      return (
        <p className="crumbs">
          {block.links?.map((link, index) => (
            <span key={`${link.text}-${index}`}>
              {index > 0 ? " / " : null}
              <Link to={routePath(link.href)}>{link.text}</Link>
            </span>
          ))}
        </p>
      );
    case "video":
      return (
        <video controls preload="none" poster={asset(block.poster)}>
          <source src={block.src} type="video/mp4" />
        </video>
      );
    default:
      return null;
  }
}
