"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 110; // px of horizontal drag needed to commit a swipe
const EXIT_MS = 280;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Discover() {
  const [view, setView] = useState("cards"); // "cards" | "matches"
  const [queue, setQueue] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchProfile, setMatchProfile] = useState(null);

  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState(null); // "like" | "pass" | null
  const busy = useRef(false);
  const start = useRef(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setQueue((await res.json()).profiles);
    } catch {
      setError("Couldn't load profiles. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setMatches((await res.json()).matches);
    } catch {
      setError("Couldn't load matches.");
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadMatches();
  }, [loadFeed, loadMatches]);

  const top = queue[0];

  const commit = useCallback(
    async (direction) => {
      if (busy.current || !queue[0]) return;
      busy.current = true;
      const profile = queue[0];
      setExit(direction);
      setDrag((d) => ({ ...d, active: false }));
      try {
        const [res] = await Promise.all([
          fetch("/api/swipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: profile.id, direction }),
          }),
          sleep(EXIT_MS),
        ]);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setQueue((q) => q.filter((p) => p.id !== profile.id));
        setExit(null);
        setDrag({ x: 0, y: 0, active: false });
        if (data.match && data.profile) {
          setMatchProfile(data.profile);
          loadMatches();
        }
      } catch {
        // Swipe was not saved: bring the card back so nothing is lost.
        setExit(null);
        setDrag({ x: 0, y: 0, active: false });
        setError("Swipe didn't save. Please try again.");
        setTimeout(() => setError(""), 3000);
      } finally {
        busy.current = false;
      }
    },
    [queue, loadMatches]
  );

  // Keyboard shortcuts for desktop: ← pass, → like.
  useEffect(() => {
    const onKey = (e) => {
      if (view !== "cards" || matchProfile) return;
      if (e.key === "ArrowRight") commit("like");
      if (e.key === "ArrowLeft") commit("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, view, matchProfile]);

  const onPointerDown = (e) => {
    if (busy.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };
  const onPointerMove = (e) => {
    if (!start.current || busy.current) return;
    setDrag({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.3, active: true });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (drag.x > THRESHOLD) commit("like");
    else if (drag.x < -THRESHOLD) commit("pass");
    else setDrag({ x: 0, y: 0, active: false }); // snap back
  };

  const resetDemo = async () => {
    await fetch("/api/reset", { method: "POST" });
    setMatchProfile(null);
    await Promise.all([loadFeed(), loadMatches()]);
  };

  const cardStyle = (() => {
    if (exit) {
      const dir = exit === "like" ? 1 : -1;
      return { transform: `translate(${dir * 700}px, ${drag.y}px) rotate(${dir * 28}deg)`, transition: `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms`, opacity: 0 };
    }
    return {
      transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`,
      transition: drag.active ? "none" : "transform 220ms cubic-bezier(.2,.8,.2,1)",
    };
  })();

  const likeOpacity = exit === "like" ? 1 : Math.min(Math.max(drag.x, 0) / THRESHOLD, 1);
  const passOpacity = exit === "pass" ? 1 : Math.min(Math.max(-drag.x, 0) / THRESHOLD, 1);

  return (
    <section className="discover">
      <header className="topbar">
        <h1 className="logo">coy</h1>
        <div className="seg" role="tablist">
          <button className={view === "cards" ? "seg-btn on" : "seg-btn"} onClick={() => setView("cards")}>Swipe</button>
          <button className={view === "matches" ? "seg-btn on" : "seg-btn"} onClick={() => { setView("matches"); loadMatches(); }}>
            Matches{matches.length > 0 && <span className="badge">{matches.length}</span>}
          </button>
        </div>
      </header>

      {error && <div className="toast" role="alert">{error}</div>}

      {view === "cards" && (
        <>
          <div className="stage">
            {loading && <div className="state"><div className="spinner" /><p>Finding people…</p></div>}

            {!loading && !top && !error && (
              <div className="state empty">
                <div className="emoji">✨</div>
                <h2>You're all caught up</h2>
                <p>No more profiles for now. Check your Matches, or come back later for new people.</p>
                <button className="btn primary" onClick={() => setView("matches")}>View matches</button>
                <button className="btn ghost" onClick={resetDemo}>Reset demo data</button>
              </div>
            )}

            {!loading && !top && error && (
              <div className="state empty">
                <p>{error}</p>
                <button className="btn primary" onClick={loadFeed}>Retry</button>
              </div>
            )}

            {queue[1] && (
              <article className="card behind" aria-hidden="true">
                <img src={queue[1].photo} alt="" draggable={false} />
              </article>
            )}

            {top && (
              <article
                key={top.id}
                className="card"
                style={cardStyle}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label={`${top.name}, ${top.age}`}
              >
                <img src={top.photo} alt={`${top.name}'s photo`} draggable={false} />
                <div className="stamp like" style={{ opacity: likeOpacity }}>LIKE</div>
                <div className="stamp nope" style={{ opacity: passOpacity }}>NOPE</div>
                <div className="info">
                  <h2>{top.name}<span className="age">{top.age}</span></h2>
                  <p className="loc">📍 {top.location}</p>
                  <p className="bio">{top.bio}</p>
                  <div className="chips">
                    {top.interests.map((i) => <span key={i} className="chip">{i}</span>)}
                  </div>
                </div>
              </article>
            )}
          </div>

          {top && (
            <div className="actions">
              <button className="round pass" onClick={() => commit("pass")} aria-label="Pass">✕</button>
              <button className="round like" onClick={() => commit("like")} aria-label="Like">♥</button>
            </div>
          )}
        </>
      )}

      {view === "matches" && (
        <div className="matches">
          {matches.length === 0 ? (
            <div className="state empty">
              <div className="emoji">💌</div>
              <h2>No matches yet</h2>
              <p>You only match when you both like each other. Keep swiping!</p>
              <button className="btn primary" onClick={() => setView("cards")}>Start swiping</button>
            </div>
          ) : (
            <ul className="grid">
              {matches.map((m) => (
                <li key={m.id} className="mcard">
                  <img src={m.photo} alt={`${m.name}'s photo`} />
                  <div className="mname">{m.name}, {m.age}</div>
                  <div className="mloc">{m.location}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {matchProfile && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="It's a match">
          <div className="match-box">
            <h2 className="match-title">It's a match!</h2>
            <p>You and {matchProfile.name} like each other.</p>
            <div className="match-photos">
              <div className="you">You</div>
              <img src={matchProfile.photo} alt={matchProfile.name} />
            </div>
            <button className="btn primary" onClick={() => { setMatchProfile(null); setView("matches"); }}>See matches</button>
            <button className="btn ghost light" onClick={() => setMatchProfile(null)}>Keep swiping</button>
          </div>
        </div>
      )}
    </section>
  );
}
