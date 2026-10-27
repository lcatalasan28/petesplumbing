import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitLead } from "../lead.js";

const SUBMIT_LABEL = {
  hero: "Send",
  contact: "Send Message",
  estimate: "Request Estimate",
};

function fieldLabel(field) {
  const label = field.label || "";
  if (field.type === "checkbox" && /^opt-in\s+/i.test(label)) {
    return label.replace(/^opt-in\s+/i, "");
  }
  return label;
}

function isRequired(field) {
  return Boolean(field.required) || /\*\s*$/.test(field.label || "");
}

function fieldPlaceholder(field, variant) {
  if (field.placeholder) return field.placeholder;
  const label = field.label || "";
  if (variant === "hero") {
    if (/name/i.test(label)) return "Full Name*";
    if (/phone/i.test(label)) return "Phone*";
    if (/email/i.test(label)) return "Email*";
  }
  if (variant === "estimate" && field.type !== "select") return label;
  return "";
}

export function LeadForm({ variant = "contact", fields, page }) {
  const navigate = useNavigate();
  const formId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitLabel = SUBMIT_LABEL[variant] || "Send";

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = { page, form: variant };
    for (const [key, value] of data.entries()) {
      const text = String(value).trim();
      if (!text) continue;
      if (payload[key]) {
        payload[key] = Array.isArray(payload[key]) ? [...payload[key], text] : [payload[key], text];
      } else {
        payload[key] = text;
      }
    }

    setPending(true);
    try {
      await submitLead(payload);
      navigate("/thank-you");
    } catch {
      setError("Oops, there was an error sending your message. Please try again later.");
      setPending(false);
    }
  }

  return (
    <form className={`lead-form lead-form-${variant}`} id={variant === "contact" ? "ICcontactform" : undefined} onSubmit={onSubmit}>
      {variant === "hero" ? <h2>Request Estimate</h2> : null}
      {fields.map((field) => {
        const label = fieldLabel(field);
        const required = isRequired(field);
        const name = label.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "field";
        const id = `${formId}-${name}`;
        const legend = field.type === "checkbox" && /^opt-in\s+/i.test(field.label || "") ? "Opt-In" : "";

        if (field.type === "checkboxes") {
          return (
            <fieldset key={label} className="field">
              <legend>{label}</legend>
              {(field.options || []).map((option) => (
                <label key={option} className="check">
                  <input type="checkbox" name={name} value={option} />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          );
        }

        if (field.type === "checkbox") {
          return (
            <fieldset key={label} className="field">
              {legend ? <legend>{legend}</legend> : null}
              <label className="check" htmlFor={id}>
                <input id={id} type="checkbox" name={name} value="yes" required={required} />
                <span>{label}</span>
              </label>
            </fieldset>
          );
        }

        const hideLabel = field.hideLabel || variant === "hero" || (variant === "estimate" && field.type !== "checkboxes" && field.type !== "checkbox");
        const placeholder = fieldPlaceholder(field, variant);

        if (field.type === "select") {
          const options = field.options || [];
          const starred = options[0] && /\*\s*$/.test(options[0]);
          return (
            <label key={label} className="field" htmlFor={id}>
              <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
              <select id={id} name={name} required={required} defaultValue="">
                {starred ? null : (
                  <option value="" disabled>
                    {label}
                  </option>
                )}
                {options.map((option, index) => {
                  const isPlaceholder = index === 0 && /\*\s*$/.test(option);
                  return (
                    <option key={`${option}-${index}`} value={isPlaceholder ? "" : option} disabled={isPlaceholder}>
                      {option}
                    </option>
                  );
                })}
              </select>
            </label>
          );
        }

        if (field.type === "textarea") {
          return (
            <label key={label} className="field" htmlFor={id}>
              <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
              <textarea id={id} name={name} required={required} rows={5} placeholder={placeholder || undefined} />
            </label>
          );
        }

        const inputType = field.type === "email" || field.type === "tel" ? field.type : "text";
        return (
          <label key={label} className="field" htmlFor={id}>
            <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
            <input id={id} name={name} type={inputType} required={required} placeholder={placeholder || undefined} />
          </label>
        );
      })}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-orange" disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}
