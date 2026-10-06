"use client";
export default function DashboardError({reset}) {return <section className="fm-empty" role="alert"><h2>This page could not be loaded.</h2><p>Your data has not been replaced. Try again, or return after checking your connection.</p><button className="button" onClick={reset}>Try again</button></section>;}
