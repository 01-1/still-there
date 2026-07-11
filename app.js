const documents = {
  "sol-prose": {
    number: "01",
    type: "Prose version · GPT 5.6 Sol",
    path: "./sol-ss-climax.md"
  },
  "fable-prose": {
    number: "02",
    type: "Prose version · Claude Fable 5",
    path: "./fable-ss-climax.md"
  },
  "sol-game": {
    number: "03",
    type: "Game scene · GPT 5.6 Sol",
    path: "./sol-vn-climax.md"
  },
  "fable-game": {
    number: "04",
    type: "Game scene · Claude Fable 5",
    path: "./fable-vn-climax.md"
  }
};

const documentAliases = {
  "sol-ss": "sol-prose",
  "fable-ss": "fable-prose",
  "sol-vn": "sol-game",
  "fable-vn": "fable-game"
};

const documentList = document.querySelector("[data-document-list]");
const choices = [...documentList.querySelectorAll("[data-document]")]
  .sort((left, right) => documents[left.dataset.document].number.localeCompare(documents[right.dataset.document].number));
choices.forEach((choice) => documentList.append(choice));
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
  const readDelimitedBlock = () => {
    index += 1;
    const content = [];
    let depth = 1;
    while (index < lines.length && depth > 0) {
      const current = lines[index++];
      if (current === ":::") {
        depth -= 1;
        if (depth > 0) content.push(current);
        continue;
      }
      if (/^:::\s+\w+/.test(current)) depth += 1;
      content.push(current);
    }
    return content;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line === "##### Edit (view original)") {
      index += 1;
      while (index < lines.length && !lines[index].trim()) index += 1;

      if (lines[index] === "::: original") {
        const original = readDelimitedBlock();
        while (index < lines.length && !lines[index].trim()) index += 1;
        const edited = lines[index] === "::: edit" ? readDelimitedBlock() : [];

        output.push(`
          <section class="version-switch" data-version-switch>
            <button class="version-toggle" type="button" data-version-toggle aria-expanded="false" aria-controls="original-sol-prose">
              Edited (view original/edit prompt)
            </button>
            <div class="original-version" id="original-sol-prose" data-version-panel>
              <p class="version-label">Original:</p>
              ${markdownToHtml(original.join("\n"))}
            </div>
            <div class="edited-version" data-edited-version>
              ${markdownToHtml(edited.join("\n"))}
            </div>
          </section>
        `);
        continue;
      }

      output.push(`<p>${inline(line.replace(/^#####\s+/, ""))}</p>`);
      continue;
    }

    if (line === "::: prompt") {
      const prompt = readDelimitedBlock();
      output.push(`
        <section class="prompt-section" data-prompt-section>
          <p class="version-label">Prompt used for the edit:</p>
          <div class="prompt-panel">
            ${markdownToHtml(prompt.join("\n"))}
          </div>
        </section>
        <hr class="prompt-divider" />
      `);
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
    const response = await fetch(documentInfo.path, { cache: "no-store" });
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
  toggle.textContent = showingOriginal ? "Original/Edit Prompt (view edited)" : "Edited (view original/edit prompt)";
});

const requestedId = window.location.hash.slice(1);
const initialId = documentAliases[requestedId] || requestedId;
openDocument(documents[initialId] ? initialId : "sol-prose");
