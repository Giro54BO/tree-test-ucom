// Deletes expired tests and results from Firestore.
// Runs daily from GitHub Actions. Uses only the public web API key:
// the security rules allow anyone to find and delete documents whose
// expireAt has passed, and nothing else.
const PROJECT = process.env.FIREBASE_PROJECT || "tree-test-ucom";
const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAR6aS7Ib4bXOWdwxZ7IiXyYnB2B63DU7g";
const ROOT = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function findExpired(from) {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const res = await fetch(`${ROOT}:runQuery?key=${API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [from],
        select: { fields: [{ fieldPath: "__name__" }] },
        where: { fieldFilter: { field: { fieldPath: "expireAt" }, op: "LESS_THAN", value: { timestampValue: cutoff } } },
        limit: 200,
      },
    }),
  });
  if (!res.ok) throw new Error(`runQuery ${res.status}: ${await res.text()}`);
  return (await res.json()).filter((row) => row.document).map((row) => row.document.name);
}

async function remove(name) {
  const res = await fetch(`https://firestore.googleapis.com/v1/${name}?key=${API_KEY}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete ${res.status}: ${await res.text()}`);
}

async function purge(label, from) {
  let total = 0;
  for (let round = 0; round < 50; round++) {
    const names = await findExpired(from);
    if (!names.length) break;
    for (const name of names) await remove(name);
    total += names.length;
  }
  console.log(`${label}: ${total} expired document(s) deleted`);
}

let failed = false;
for (const [label, from] of [["results", { collectionId: "results", allDescendants: true }], ["tests", { collectionId: "tests" }]]) {
  try { await purge(label, from); }
  catch (err) { failed = true; console.error(`${label}: ${err.message}`); }
}
if (failed) process.exitCode = 1;
