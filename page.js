"use client";

import { useState } from "react";
import Discover from "../components/Discover.js";

export default function Page() {
  const [tab, setTab] = useState("discover");

  return (
    <div className="shell">
      <main className="content">
        {/* Home stays blank on purpose (placeholder for Coy's existing experience). */}
        {tab === "home" && <div className="home-blank" aria-label="Home (placeholder)" />}
        {/* Discover stays mounted so swipe state survives tab switches. */}
        <div className="tab-pane" hidden={tab !== "discover"}>
          <Discover />
        </div>
      </main>

      <nav className="tabbar" role="tablist" aria-label="Main tabs">
        <button role="tab" aria-selected={tab === "home"} className={tab === "home" ? "tab active" : "tab"} onClick={() => setTab("home")}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
          <span>Home</span>
        </button>
        <button role="tab" aria-selected={tab === "discover"} className={tab === "discover" ? "tab active" : "tab"} onClick={() => setTab("discover")}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.6-9.3-9.1C1.1 8.7 3 5 6.5 5c2 0 3.5 1.1 5.5 3.3C14 6.1 15.500 5 17.500 5 21 5 22.900 8.700 21.300 11.900 19 16.400 12 21 12 21z" /></svg>
          <span>Discover</span>
        </button>
      </nav>
    </div>
  );
}
