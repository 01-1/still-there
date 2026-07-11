const documents = {
  "sol-vn": {
    number: "01",
    type: "Game scene · GPT 5.6 Sol",
    path: "./sol-vn-climax.md"
  },
  "sol-ss": {
    number: "02",
    type: "Prose version · GPT 5.6 Sol",
    path: "./sol-ss-climax.md"
  },
  "fable-vn": {
    number: "03",
    type: "Game scene · Claude Fable 5",
    path: "./fable-vn-climax.md"
  },
  "fable-ss": {
    number: "04",
    type: "Prose version · Claude Fable 5",
    path: "./fable-ss-climax.md"
  }
};

const choices = [...document.querySelectorAll("[data-document]")];
const reader = document.querySelector(".reader");
const copy = document.querySelector("[data-reader-copy]");
const readerType = document.querySelector("[data-reader-type]");
const readerNumber = document.querySelector("[data-reader-number]");
let activeId = "";

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[character]);
}

function inline(markdown) {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const output = [];
  let index = 0;

  const isBlockStart = (line) => /^(#{1,3}\s|---$|```|>\s?|[-*]\s+|\d+\.\s+|:::\s*)/.test(line);

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line === "##### Edit (view original)") {
      index += 1;
      while (index < lines.length && !lines[index].trim()) index += 1;

      if (lines[index] === "::: original") {
        index += 1;
        const original = [];
        while (index < lines.length && lines[index] !== ":::") original.push(lines[index++]);
        if (lines[index] === ":::") index += 1;

        output.push(`
          <section class="version-switch" data-version-switch>
            <button class="version-toggle" type="button" data-version-toggle aria-expanded="false" aria-controls="original-sol-ss">
              Edit (view original)
            </button>
            <div class="original-version" id="original-sol-ss" data-version-panel>
              ${markdownToHtml(original.join("\n"))}
            </div>
          </section>
        `);
        continue;
      }

      output.push(`<p>${inline(line.replace(/^#####\s+/, ""))}</p>`);
      continue;
    }

    if (/^```/.test(line)) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);
      index += 1;
      output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---$/.test(line)) {
      output.push("<hr />");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ""));
      output.push(`<blockquote>${quote.filter(Boolean).map((part) => `<p>${inline(part)}</p>`).join("")}</blockquote>`);
      continue;
    }

    const list = line.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (list) {
      const ordered = /\d+\./.test(list[1]);
      const tag = ordered ? "ol" : "ul";
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/);
        if (!item) break;
        items.push(`<li>${inline(item[1])}</li>`);
        index += 1;
      }
      output.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) paragraph.push(lines[index++].trim());
    const text = paragraph.join(" ");
    const speaker = text.match(/^\*\*([A-Z][A-Z0-9 -]{1,}):\*\*$/);
    if (speaker) output.push(`<p class="speaker">${speaker[1]}</p>`);
    else output.push(`<p>${inline(text)}</p>`);
  }

  return output.join("\n");
}

async function openDocument(id, { focus = false } = {}) {
  const documentInfo = documents[id];
  if (!documentInfo || id === activeId) return;
  activeId = id;
  reader.setAttribute("aria-busy", "true");
  readerType.textContent = documentInfo.type;
  readerNumber.textContent = documentInfo.number;
  copy.innerHTML = '<p class="loading">Opening draft archive…</p>';
  choices.forEach((choice) => {
    choice.setAttribute("aria-current", choice.dataset.document === id ? "page" : "false");
  });
  window.history.replaceState(null, "", `#${id}`);

  try {
    const response = await fetch(documentInfo.path);
    if (!response.ok) throw new Error(`Could not load ${documentInfo.path}`);
    copy.innerHTML = markdownToHtml(await response.text());
  } catch (error) {
    copy.innerHTML = `<p class="error">The draft archive could not be opened. ${escapeHtml(error.message)}</p>`;
  } finally {
    reader.setAttribute("aria-busy", "false");
    if (focus) reader.focus({ preventScroll: true });
  }
}

choices.forEach((choice) => {
  choice.addEventListener("click", () => openDocument(choice.dataset.document, { focus: true }));
});

copy.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-version-toggle]");
  if (!toggle || !copy.contains(toggle)) return;

  const switcher = toggle.closest("[data-version-switch]");
  const showingOriginal = switcher.classList.toggle("is-original");
  toggle.setAttribute("aria-expanded", String(showingOriginal));
  toggle.textContent = showingOriginal ? "Original (view edit)" : "Edit (view original)";
});

openDocument(documents[window.location.hash.slice(1)] ? window.location.hash.slice(1) : "sol-vn");
