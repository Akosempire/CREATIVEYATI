// Loading and empty states. Both were missing entirely: lists rendered blank
// space while loading, and empty states gave no route to fixing them.
export function Skeleton({ width = "100%", height = 14, radius = 6, className = "" }) {
  return <span className={`fm-skeleton ${className}`.trim()} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

// A table-shaped placeholder, so a loading list occupies the space it will need
// rather than collapsing and shoving the page around when data arrives.
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return <div className="fm-skeleton-table" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, row) => <div key={row}>
      {Array.from({ length: columns }).map((_, column) => <Skeleton key={column} width={column === 0 ? "38%" : "18%"} height={12} />)}
    </div>)}
  </div>;
}

export function EmptyState({ title, children, action }) {
  return <div className="fm-empty">
    {/* line illustration, drawn rather than imported: no assets, no emoji */}
    <svg width="56" height="44" viewBox="0 0 56 44" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1" y="7" width="54" height="30" rx="4" />
      <line x1="1" y1="15" x2="55" y2="15" />
      <line x1="10" y1="23" x2="34" y2="23" strokeLinecap="round" />
      <line x1="10" y1="29" x2="26" y2="29" strokeLinecap="round" />
    </svg>
    <h3>{title}</h3>
    <p>{children}</p>
    {action}
  </div>;
}
