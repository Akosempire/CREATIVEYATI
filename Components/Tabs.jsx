import Link from "next/link";

// Tabs-as-filters, server-rendered. Each tab is a link carrying the filter in the
// query string, so the active tab survives a refresh, is shareable, and needs no
// client state. Counts are passed in because only the caller knows what it counted.
export default function Tabs({ basePath, param = "status", current = "", items = [], keep = {} }) {
  function hrefFor(value) {
    const params = new URLSearchParams();
    Object.entries(keep).forEach(([key, value2]) => { if (value2) params.set(key, value2); });
    if (value) params.set(param, value);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return <nav className="fm-tabs" aria-label="Filter">
    {items.map((item) => {
      const active = String(current) === String(item.value);
      return <Link
        key={item.value || "all"}
        href={hrefFor(item.value)}
        className={`fm-tab${active ? " is-active" : ""}`}
        aria-current={active ? "true" : undefined}
      >
        {item.label}
        {typeof item.count === "number" ? <span className="fm-tab-count">{item.count}</span> : null}
      </Link>;
    })}
  </nav>;
}
