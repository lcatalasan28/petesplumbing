import { describe, expect, it, vi, afterEach } from "vitest";
import { LEAD_EMAIL, isStaticDemo, submitLead } from "../src/lead.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitLead", () => {
  it("addresses leads to the demo inbox", () => {
    expect(LEAD_EMAIL).toBe("lito.catalasan@mail.grokbot.com");
  });

  it("skips the send in static demo mode and does not call fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await submitLead({ name: "Ada" }, { VITE_STATIC_DEMO: "1" });
    expect(isStaticDemo({ VITE_STATIC_DEMO: "1" })).toBe(true);
    expect(result.skipped).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the lead when static demo mode is off", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchSpy);
    const result = await submitLead({ name: "Ada", email: "ada@example.com" }, { VITE_STATIC_DEMO: "" });
    expect(result.skipped).toBe(false);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe(`https://formsubmit.co/ajax/${LEAD_EMAIL}`);
    expect(options.method).toBe("POST");
    expect(options.body).toContain("Ada");
  });
});
