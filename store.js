// Core backend logic for Discover. Framework-free so it can be unit tested.
// Persistence: profiles.json (seed, read-only) + state.json (swipes + matches).
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PROFILES = path.join(process.cwd(), "data", "profiles.json");
const DEFAULT_STATE = path.join(process.cwd(), "data", "state.json");

export function createStore({ profilesFile = DEFAULT_PROFILES, stateFile = DEFAULT_STATE } = {}) {
  const loadProfiles = () => JSON.parse(fs.readFileSync(profilesFile, "utf8"));

  const loadState = () => {
    try {
      const s = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      return { swipes: s.swipes || {}, matches: s.matches || [] };
    } catch {
      return { swipes: {}, matches: [] };
    }
  };

  // Atomic write (temp file + rename) so a crash never leaves a corrupt file.
  const saveState = (state) => {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    const tmp = `${stateFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, stateFile);
  };

  // PRIVACY: the only fields that ever leave the server. `likesYou` is never included.
  const publicProfile = ({ id, name, age, photo, bio, location, interests }) => ({
    id, name, age, photo, bio, location, interests,
  });

  function getFeed() {
    const { swipes } = loadState();
    return loadProfiles().filter((p) => !(p.id in swipes)).map(publicProfile);
  }

  function swipe(profileId, direction) {
    if (typeof profileId !== "string" || !profileId) {
      return { status: 400, body: { error: "profileId is required" } };
    }
    if (direction !== "like" && direction !== "pass") {
      return { status: 400, body: { error: 'direction must be "like" or "pass"' } };
    }
    const profile = loadProfiles().find((p) => p.id === profileId);
    if (!profile) return { status: 404, body: { error: "Profile not found" } };

    const state = loadState();

    // Idempotent: a profile can only be swiped once, so a repeat (double tap,
    // retry) cannot flip a decision. We report the original outcome.
    if (profileId in state.swipes) {
      const matched = state.matches.some((m) => m.profileId === profileId);
      return {
        status: 200,
        body: {
          recorded: false,
          direction: state.swipes[profileId],
          match: matched,
          profile: matched ? publicProfile(profile) : null,
        },
      };
    }

    state.swipes[profileId] = direction;
    // A match requires BOTH sides: the user liked them AND they already liked the user.
    const isMatch = direction === "like" && profile.likesYou === true;
    if (isMatch) state.matches.push({ profileId, matchedAt: new Date().toISOString() });
    saveState(state);

    return {
      status: 200,
      body: { recorded: true, direction, match: isMatch, profile: isMatch ? publicProfile(profile) : null },
    };
  }

  function getMatches() {
    const { matches } = loadState();
    const byId = new Map(loadProfiles().map((p) => [p.id, p]));
    return matches
      .filter((m) => byId.has(m.profileId))
      .map((m) => ({ ...publicProfile(byId.get(m.profileId)), matchedAt: m.matchedAt }))
      .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
  }

  function reset() {
    saveState({ swipes: {}, matches: [] });
  }

  return { getFeed, swipe, getMatches, reset };
}

// Shared instance for the API routes.
export const store = createStore();
