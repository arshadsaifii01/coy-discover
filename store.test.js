import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createStore } from "../lib/store.js";

const profiles = [
  { id: "a", name: "A", age: 20, photo: "/a.svg", bio: "", location: "X", interests: [], likesYou: true },
  { id: "b", name: "B", age: 21, photo: "/b.svg", bio: "", location: "Y", interests: [], likesYou: false },
  { id: "c", name: "C", age: 22, photo: "/c.svg", bio: "", location: "Z", interests: [], likesYou: true },
];

let store, stateFile;

beforeEach(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "coy-"));
  const profilesFile = path.join(dir, "profiles.json");
  stateFile = path.join(dir, "state.json");
  fs.writeFileSync(profilesFile, JSON.stringify(profiles));
  store = createStore({ profilesFile, stateFile });
});

test("feed never leaks the likesYou field", () => {
  for (const p of store.getFeed()) assert.equal("likesYou" in p, false);
});

test("liking someone who liked you creates a match", () => {
  const r = store.swipe("a", "like");
  assert.equal(r.body.match, true);
  assert.equal(r.body.profile.id, "a");
  assert.equal("likesYou" in r.body.profile, false);
});

test("liking someone who has not liked you is not a match", () => {
  const r = store.swipe("b", "like");
  assert.equal(r.body.match, false);
  assert.equal(r.body.profile, null);
});

test("passing on someone who liked you never matches", () => {
  const r = store.swipe("a", "pass");
  assert.equal(r.body.match, false);
  assert.equal(store.getMatches().length, 0);
});

test("swiped profiles never reappear in the feed", () => {
  store.swipe("a", "pass");
  store.swipe("b", "like");
  assert.deepEqual(store.getFeed().map((p) => p.id), ["c"]);
});

test("feed is empty after every profile is swiped", () => {
  for (const p of profiles) store.swipe(p.id, "pass");
  assert.equal(store.getFeed().length, 0);
});

test("swiping the same profile twice is idempotent and cannot flip a pass into a match", () => {
  store.swipe("a", "pass");
  const again = store.swipe("a", "like");
  assert.equal(again.body.recorded, false);
  assert.equal(again.body.match, false);
  assert.equal(store.getMatches().length, 0);
});

test("repeating a matching like does not duplicate the match", () => {
  store.swipe("a", "like");
  const again = store.swipe("a", "like");
  assert.equal(again.body.match, true);
  assert.equal(store.getMatches().length, 1);
});

test("getMatches returns only mutual matches, without private fields", () => {
  store.swipe("a", "like");
  store.swipe("b", "like");
  store.swipe("c", "pass");
  const matches = store.getMatches();
  assert.deepEqual(matches.map((m) => m.id), ["a"]);
  assert.equal("likesYou" in matches[0], false);
});

test("state persists across store instances (page reloads)", () => {
  store.swipe("a", "like");
  const reopened = createStore({
    profilesFile: path.join(path.dirname(stateFile), "profiles.json"),
    stateFile,
  });
  assert.equal(reopened.getMatches().length, 1);
  assert.deepEqual(reopened.getFeed().map((p) => p.id), ["b", "c"]);
});

test("validation: bad direction, missing id, unknown profile", () => {
  assert.equal(store.swipe("a", "super").status, 400);
  assert.equal(store.swipe("", "like").status, 400);
  assert.equal(store.swipe(undefined, "like").status, 400);
  assert.equal(store.swipe("zzz", "like").status, 404);
});

test("reset clears swipes and matches", () => {
  store.swipe("a", "like");
  store.reset();
  assert.equal(store.getMatches().length, 0);
  assert.equal(store.getFeed().length, 3);
});
