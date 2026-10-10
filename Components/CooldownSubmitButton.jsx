"use client";
import { useEffect, useState } from "react";
import SubmitButton from "./SubmitButton";

// A submit button that stays locked for the seconds left on the code cooldown,
// with the count in the label so people wait instead of cancelling their code.
export default function CooldownSubmitButton({ seconds = 0, children, pendingLabel, className }) {
  const [left, setLeft] = useState(seconds);
  const [started, setStarted] = useState(seconds);
  // a fresh send re-renders the page with a new count; restart from it
  if (started !== seconds) { setStarted(seconds); setLeft(seconds); }

  useEffect(() => {
    if (seconds <= 0) return;
    const until = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLeft(next);
      if (next === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  return <SubmitButton className={className} pendingLabel={pendingLabel} disabled={left > 0}>
    {left > 0 ? `You can request another code in ${left}s` : children}
  </SubmitButton>;
}
