import Link from "next/link";
import Drawer from "@/Components/Drawer";
import { EmptyState } from "@/Components/Feedback";
import { activityFacets, filterActivity, getActivity } from "@/lib/data/activity";

export const metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

// The filtered counts are deliberately shown: a filtered admin list that does not
// say how much it is hiding reads as an empty database.
export default async function AdminActivityPage({ searchParams }) {
  const query = await searchParams;
  const { entries, error } = await getActivity();
  const facets = activityFacets(entries);
  const filters = { actor: String(query.actor || ""), title: String(query.title || ""), entity: String(query.entity || "") };
  const filtered = filterActivity(entries, filters);
  const applied = Object.values(filters).filter(Boolean).length;

  return <>
    <div className="admin-title">
      <p>OPERATIONS</p>
      <h1>Activity</h1>
      <p className="admin-lede">What changed, where, and who did it. Entries written before the actor column existed show as unknown rather than being attributed to anyone.</p>
    </div>

    {error ? <p className="form-error">{error}</p> : null}

    <form className="admin-form activity-filters" method="get" action="/admin/activity">
      <label>Actor<select name="actor" defaultValue={filters.actor}>
        <option value="">Anyone</option>
        {facets.actors.map((actor) => <option key={actor} value={actor}>{actor}</option>)}
      </select></label>
      <label>Action<select name="title" defaultValue={filters.title}>
        <option value="">Any action</option>
        {facets.titles.map((title) => <option key={title} value={title}>{title}</option>)}
      </select></label>
      <label>Entity<select name="entity" defaultValue={filters.entity}>
        <option value="">Anything</option>
        {facets.entities.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
      </select></label>
      <div className="activity-filter-actions">
        <button className="button" type="submit">Apply</button>
        {applied > 0 ? <Link className="inline-link" href="/admin/activity">Clear {applied} {applied === 1 ? "filter" : "filters"}</Link> : null}
      </div>
    </form>

    <section className="admin-section-heading">
      <p>LOG</p>
      <h2>{applied > 0 ? `${filtered.length} of ${entries.length} entries` : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}</h2>
    </section>

    {filtered.length ? <div className="admin-table">
      <div><b>When</b><b>What</b><b>Where</b><b>Who</b><b>Detail</b></div>
      {filtered.map((entry) => <div key={entry.id}>
        <span>{when(entry.createdAt)}<small>{entry.entity || "—"}</small></span>
        <span>{entry.title || "—"}{entry.description ? <small>{entry.description}</small> : null}</span>
        <span>{entry.href ? <Link className="inline-link" href={entry.href}>{entry.href}</Link> : "—"}</span>
        <span>{entry.actorEmail || "unknown"}<small>{entry.actorEmail ? entry.actorRole : "before the actor column existed"}</small></span>
        <span>
          <Drawer label={entry.title || "Log entry"}>
            <dl className="activity-detail">
              <div><dt>When</dt><dd>{when(entry.createdAt)}</dd></div>
              <div><dt>Action</dt><dd>{entry.title || "—"}</dd></div>
              <div><dt>Detail</dt><dd>{entry.description || "—"}</dd></div>
              <div><dt>Who</dt><dd>{entry.actorEmail || "unknown (recorded before the actor column existed)"}</dd></div>
              <div><dt>Role</dt><dd>{entry.actorRole || "—"}</dd></div>
              <div><dt>Entity</dt><dd>{entry.entity ? `${entry.entity}${entry.entityId ? ` · ${entry.entityId}` : ""}` : "—"}</dd></div>
              <div><dt>Location</dt><dd>{entry.href ? <Link className="inline-link" href={entry.href}>{entry.href}</Link> : "—"}</dd></div>
              <div><dt>Record id</dt><dd>{entry.id}</dd></div>
            </dl>
          </Drawer>
        </span>
      </div>)}
    </div> : <EmptyState title={applied > 0 ? "Nothing matches those filters" : "Nothing logged yet"}>{applied > 0 ? "Clear the filters to see the whole log." : "Publishing, revoking a certificate, recording a payment and changing settings all write here once they call the log."}</EmptyState>}
  </>;
}

