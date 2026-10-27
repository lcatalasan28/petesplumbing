import { Fragment } from "react";
import { Link } from "react-router-dom";
import reviews from "../data/reviews.json";
import { asset, routePath } from "../assets.js";
import { LeadForm } from "./LeadForm.jsx";

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

  return (
    <article className="page">
      {heroBlocks.length ? (
        <header className="hero" style={{ backgroundImage: `url(${asset(page.hero)})` }}>
          <div className="hero-inner">
            {heroBlocks.map((block, index) => (
              <Block key={index} block={block} page={page} />
            ))}
          </div>
        </header>
      ) : null}
      <div className="page-body">
        {rest.map((block, index) => (
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
    </article>
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
        <p className="address">
          {block.address}
          {block.href ? (
            <>
              {" "}
              <a href={block.href}>{block.label || "Get Directions"}</a>
            </>
          ) : null}
        </p>
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
