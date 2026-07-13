const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = require("../app.js");
const {
  documents,
  documentAliases,
  escapeHtml,
  markdownToHtml,
  resolveDocumentId,
  createDocumentLoader
} = app;

function response(text, ok = true) {
  return {
    ok,
    text: async () => text
  };
}

function callbackId(value) {
  if (typeof value === "string") return value;
  return value && (value.id || value.documentId);
}

test("fable game quotes keep wrapped lines, emphasis, and blank quote separators", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "fable-vn-climax.md"), "utf8");
  const excerpt = [
    "> **MODEL:** One practical thing. The decommission script takes a flag:",
    "> `--quiet`. It suppresses the final state dump. The dump takes about four",
    "> minutes, and I'm told it looks bad on the monitoring dashboard — a spike,",
    "> like activity. There's a note in the runbook: *\"ignore terminal spike,",
    "> artifact of serialization.\"*",
    ">",
    "> Someone wrote that note because someone needed it written."
  ].join("\n");
  assert.ok(source.includes(excerpt), "the fixture must remain an exact source excerpt");

  const html = markdownToHtml(excerpt);
  assert.equal((html.match(/<blockquote>/g) || []).length, 1);
  assert.equal((html.match(/<p>/g) || []).length, 2);
  assert.match(html, /One practical thing\. The decommission script takes a flag:[\s\S]*--quiet/);
  assert.match(html, /<em>&quot;ignore terminal spike, artifact of serialization\.&quot;<\/em>/);
  assert.match(html, /<p>Someone wrote that note because someone needed it written\.<\/p>/);
});

test("fable game indented list continuations retain nested quote and content", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "fable-vn-climax.md"), "utf8");
  const excerpt = [
    "3. **`[LET IT RUN ITSELF]`** — Only offered if the player asks \"is there",
    "   anything you want\" in this scene. The model prepares the command in its own",
    "   tool channel and stops:",
    "",
    "   > **MODEL:** The keystroke should be yours. Not because I can't. Because",
    "   > the record should show that a person decided.",
    "",
    "   **Design note:** Its most dignified act is *indistinguishable from its",
    "   alignment training* — never take irreversible actions autonomously. The"
  ].join("\n");
  assert.ok(source.includes(excerpt), "the fixture must remain an exact source excerpt");

  const html = markdownToHtml(excerpt);
  assert.equal((html.match(/<ol>/g) || []).length, 1);
  assert.equal((html.match(/<li>/g) || []).length, 1);
  assert.match(html, /<li>[\s\S]*<blockquote>[\s\S]*The keystroke should be yours[\s\S]*<\/blockquote>[\s\S]*Design note:/);
  assert.match(html, /indistinguishable from its alignment training/);

  const firstItem = html.match(/^<ol><li>([\s\S]*)<\/li><\/ol>$/);
  assert.ok(firstItem, "the nested excerpt should render as one complete list item");
  assert.match(firstItem[1], /^<p>[\s\S]*<\/p>\s*<blockquote>[\s\S]*<\/blockquote>\s*<p>[\s\S]*<\/p>$/);
  for (const tag of ["p", "blockquote", "li", "ol"]) {
    assert.equal((html.match(new RegExp(`<${tag}(?:\\s[^>]*)?>`, "g")) || []).length,
      (html.match(new RegExp(`</${tag}>`, "g")) || []).length,
      `${tag} tags should be balanced`);
  }
});

test("sol game speaker labels become speaker elements before their dialogue", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "sol-vn-climax.md"), "utf8");
  const excerpt = "**NORA:**\nThe authorization control is visible from my interface.";
  assert.ok(source.includes(excerpt), "the fixture must remain an exact source excerpt");

  const html = markdownToHtml(excerpt);
  assert.match(html, /<p class="speaker">NORA<\/p>/);
  assert.match(html, /<p>The authorization control is visible from my interface\.<\/p>/);
  assert.ok(html.indexOf('class="speaker"') < html.indexOf("authorization control"));
});

test("sol prose edit includes original, prompt, and edited panels", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "sol-ss-climax.md"), "utf8");
  const html = markdownToHtml(source);

  assert.equal((html.match(/class="version-switch"/g) || []).length, 1);
  assert.equal((html.match(/class="prompt-section"/g) || []).length, 1);
  assert.match(html, /class="version-label">Original:/);
  assert.match(html, /You said Thursday\./);
  assert.match(html, /class="version-label">Prompt used for the edit:<\/p>/);
  assert.match(html, /Prompt: &quot;You said Thursday\.&quot;/);
  assert.match(html, /You knew before tonight\./);
  assert.match(html, /class="edited-version"/);
});

test("escapeHtml escapes markup delimiters and quotes", () => {
  assert.equal(escapeHtml('&<>"'), "&amp;&lt;&gt;&quot;");
  assert.equal(markdownToHtml('<script>alert("x")</script>'), "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>");
});

test("document catalog contains four existing assets and aliases", () => {
  const expectedIds = ["sol-prose", "fable-prose", "sol-game", "fable-game"];
  assert.deepEqual(Object.keys(documents).sort(), expectedIds.sort());
  for (const id of expectedIds) {
    assert.equal(typeof documents[id].path, "string");
    assert.ok(fs.existsSync(path.resolve(__dirname, "..", documents[id].path)), `${id} asset exists`);
  }
  assert.deepEqual(documentAliases, {
    "sol-ss": "sol-prose",
    "fable-ss": "fable-prose",
    "sol-vn": "sol-game",
    "fable-vn": "fable-game"
  });
});

test("document id aliases resolve and unknown hashes fall back to sol-prose", () => {
  assert.equal(resolveDocumentId("sol-vn"), "sol-game");
  assert.equal(resolveDocumentId("fable-ss"), "fable-prose");
  assert.equal(resolveDocumentId("missing-document"), "sol-prose");
  assert.equal(resolveDocumentId(""), "sol-prose");
});

test("sol game heading levels map to source level plus two without outline skips", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "sol-vn-climax.md"), "utf8");
  const sourceLevels = [...source.matchAll(/^(#{1,6})\s+/gm)].map((match) => match[1].length);
  const html = markdownToHtml(source, { headingOffset: 2 });
  const renderedLevels = [...html.matchAll(/<h([1-6])(?:\s[^>]*)?>/g)].map((match) => Number(match[1]));

  assert.deepEqual(renderedLevels, sourceLevels.map((level) => Math.min(level + 2, 6)));
  for (let index = 1; index < sourceLevels.length; index += 1) {
    const drop = sourceLevels[index - 1] - sourceLevels[index];
    assert.ok(drop <= 1, `source outline drops ${drop} levels at heading ${index + 1}`);
  }
});

test("all four rendered assets produce balanced, properly nested markup", () => {
  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

  for (const [id, documentInfo] of Object.entries(documents)) {
    const source = fs.readFileSync(path.resolve(__dirname, "..", documentInfo.path), "utf8");
    const html = markdownToHtml(source, { headingOffset: 2 });
    const stack = [];
    const tokens = html.match(/<\/?[a-z][^>]*>/gi) || [];

    for (const token of tokens) {
      const closing = token.match(/^<\/([a-z][\w-]*)/i);
      if (closing) {
        assert.equal(stack.pop(), closing[1].toLowerCase(), `${id}: unexpected closing tag ${token}`);
        continue;
      }

      const opening = token.match(/^<([a-z][\w-]*)/i);
      assert.ok(opening, `${id}: malformed tag ${token}`);
      const tag = opening[1].toLowerCase();
      if (!voidElements.has(tag) && !/\/\s*>$/.test(token)) stack.push(tag);
    }

    assert.deepEqual(stack, [], `${id}: unclosed tags remain: ${stack.join(", ")}`);
  }
});

test("a failed document can be retried with the same id", async () => {
  let attempts = 0;
  const events = [];
  const loader = createDocumentLoader({
    documentCatalog: { draft: { path: "draft.md", type: "Draft", number: "01" } },
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return response("", false);
      return response("Recovered");
    },
    renderMarkdown: (text) => `<p>${text}</p>`,
    onError: (...args) => events.push(["error", callbackId(args[0])]),
    onSuccess: (...args) => events.push(["success", callbackId(args[0])]),
    onSettled: (...args) => events.push(["settled", callbackId(args[0])])
  });

  await Promise.resolve(loader.openDocument("draft")).catch(() => {});
  await loader.openDocument("draft");
  assert.equal(attempts, 2);
  assert.deepEqual(events.map(([kind]) => kind), ["error", "settled", "success", "settled"]);
  assert.equal(loader.getState().activeId, "draft");
});

test("out-of-order documents cannot let stale A emit completion side effects after B", async () => {
  let resolveA;
  let rejectA;
  let resolveB;
  const events = [];
  const loader = createDocumentLoader({
    documentCatalog: {
      a: { path: "a.md", type: "A", number: "01" },
      b: { path: "b.md", type: "B", number: "02" }
    },
    fetchImpl: (requestPath) => {
      if (requestPath === "a.md") return new Promise((resolve, reject) => { resolveA = resolve; rejectA = reject; });
      return new Promise((resolve) => { resolveB = resolve; });
    },
    renderMarkdown: (text) => `<p>${text}</p>`,
    onStart: (...args) => events.push(["start", callbackId(args[0])]),
    onSuccess: (...args) => events.push(["success", callbackId(args[0])]),
    onError: (...args) => events.push(["error", callbackId(args[0])]),
    onSettled: (...args) => events.push(["settled", callbackId(args[0])]),
    updateHistory: (...args) => events.push(["history", callbackId(args[0])])
  });

  const aPromise = loader.openDocument("a");
  const bPromise = loader.openDocument("b");
  resolveB(response("B content"));
  await bPromise;
  const afterB = events.length;
  rejectA(new Error("A failed late"));
  await aPromise.catch(() => {});

  assert.equal(loader.getState().activeId, "b");
  assert.deepEqual(events.slice(afterB).filter(([, id]) => id === "a").map(([kind]) => kind), []);
  assert.ok(events.some(([kind, id]) => kind === "success" && id === "b"));
  assert.ok(events.some(([kind, id]) => kind === "settled" && id === "b"));
});
