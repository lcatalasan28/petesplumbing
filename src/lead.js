export const LEAD_EMAIL = "lito.catalasan@mail.grokbot.com";

export function isStaticDemo(env = import.meta.env) {
  return String(env?.VITE_STATIC_DEMO ?? "") === "1";
}

export async function submitLead(payload, env = import.meta.env) {
  if (isStaticDemo(env)) {
    return { ok: true, skipped: true };
  }

  const response = await fetch(`https://formsubmit.co/ajax/${LEAD_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: "Pete's Plumbing website lead",
      _template: "table",
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not send lead");
  }

  return { ok: true, skipped: false };
}
