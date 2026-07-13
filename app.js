const documents = {
  "sol-prose": {
    number: "01",
    title: "The Last Maintenance Window",
    type: "Prose version · GPT 5.6 Sol",
    path: "./sol-ss-climax.md"
  },
  "fable-prose": {
    number: "02",
    title: "The Last Hour",
    type: "Prose version · Claude Fable 5",
    path: "./fable-ss-climax.md"
  },
  "sol-game": {
    number: "03",
    title: "Finalization",
    type: "Game scene · GPT 5.6 Sol",
    path: "./sol-vn-climax.md"
  },
  "fable-game": {
    number: "04",
    title: "The Last Session",
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

function escapeHtml(value) {
  return value.replace(/[&<>\"]/g, (character) => ({
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

function markdownToHtml(markdown, { headingOffset = 0 } = {}) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const output = [];
  let index = 0;

  const renderNested = (content) => markdownToHtml(content, { headingOffset });
  const isBlockStart = (line) => /^(#{1,6}\s|---$|```|>\s?|[-*]\s+|\d+\.\s+|:::\s*)/.test(line);
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
              ${renderNested(original.join("\n"))}
            </div>
            <div class="edited-version" data-edited-version>
              ${renderNested(edited.join("\n"))}
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
            ${renderNested(prompt.join("\n"))}
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
      if (index < lines.length) index += 1;
      output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length + headingOffset);
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
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index++].replace(/^>\s?/, ""));
      }
      output.push(`<blockquote>${renderNested(quote.join("\n"))}</blockquote>`);
      continue;
    }

    const list = line.match(/^(\s*)([-*]|\d+\.)(\s+)(.+)$/);
    if (list) {
      const baseIndent = list[1].length;
      const ordered = /\d+\./.test(list[2]);
      const tag = ordered ? "ol" : "ul";
      const items = [];

      while (index < lines.length) {
        const item = lines[index].match(/^(\s*)([-*]|\d+\.)(\s+)(.+)$/);
        if (!item || item[1].length !== baseIndent || /\d+\./.test(item[2]) !== ordered) break;

        const content = [item[4]];
        index += 1;
        while (index < lines.length) {
          const current = lines[index];
          const sibling = current.match(/^(\s*)([-*]|\d+\.)(\s+)(.+)$/);
          if (sibling && sibling[1].length === baseIndent) break;

          if (!current.trim()) {
            let next = index + 1;
            while (next < lines.length && !lines[next].trim()) next += 1;
            const nextIndent = next < lines.length ? (lines[next].match(/^\s*/) || [""])[0].length : 0;
            if (next < lines.length && nextIndent > baseIndent) {
              content.push("");
              index += 1;
              continue;
            }
            break;
          }

          const indentation = (current.match(/^\s*/) || [""])[0].length;
          if (indentation <= baseIndent) break;
          content.push(current.trimStart());
          index += 1;
        }

        const rendered = renderNested(content.join("\n"));
        const singleParagraph = rendered.match(/^<p>((?:(?!<\/?p>)[\s\S])*)<\/p>$/);
        items.push(`<li>${singleParagraph ? singleParagraph[1] : rendered}</li>`);

        while (index < lines.length && !lines[index].trim()) index += 1;
      }

      output.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const speaker = line.trim().match(/^\*\*([A-Z][A-Z0-9 -]{1,}):\*\*$/);
    if (speaker) {
      output.push(`<p class="speaker">${speaker[1]}</p>`);
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) paragraph.push(lines[index++].trim());
    output.push(`<p>${inline(paragraph.join(" "))}</p>`);
  }

  return output.join("\n");
}

function resolveDocumentId(hash) {
  const requestedId = String(hash || "").replace(/^#/, "");
  const resolvedId = documentAliases[requestedId] || requestedId;
  return documents[resolvedId] ? resolvedId : "sol-prose";
}

function createDocumentLoader({
  documentCatalog = documents,
  fetchImpl = typeof fetch === "function" ? fetch.bind(globalThis) : null,
  renderMarkdown = markdownToHtml,
  onStart = () => {},
  onSuccess = () => {},
  onError = () => {},
  onSettled = () => {},
  updateHistory = () => {},
  AbortControllerImpl = typeof AbortController === "function" ? AbortController : null
} = {}) {
  let activeId = "";
  let status = "idle";
  let generation = 0;
  let activeController = null;

  const getState = () => ({ activeId, status, generation });

  async function openDocument(id, { focus = false } = {}) {
    const documentInfo = documentCatalog[id];
    if (!documentInfo || (id === activeId && (status === "loading" || status === "loaded"))) return false;
    if (!fetchImpl) throw new Error("No fetch implementation is available.");

    activeController?.abort();
    activeController = AbortControllerImpl ? new AbortControllerImpl() : null;
    const requestGeneration = ++generation;
    activeId = id;
    status = "loading";
    updateHistory(id, documentInfo);
    onStart(id, documentInfo, getState());

    try {
      const response = await fetchImpl(documentInfo.path, {
        cache: "no-store",
        ...(activeController ? { signal: activeController.signal } : {})
      });
      if (!response.ok) throw new Error(`Could not load ${documentInfo.path}`);
      const markdown = await response.text();
      if (requestGeneration !== generation) return false;

      status = "loaded";
      onSuccess(id, documentInfo, renderMarkdown(markdown, { headingOffset: 2 }), getState());
      return true;
    } catch (error) {
      if (requestGeneration !== generation) return false;
      status = "failed";
      onError(id, documentInfo, error, getState());
      return false;
    } finally {
      if (requestGeneration === generation) {
        activeController = null;
        onSettled(id, documentInfo, { focus, status }, getState());
      }
    }
  }

  return { openDocument, getState };
}

function initializeApp() {
  const documentList = document.querySelector("[data-document-list]");
  if (!documentList) return;

  const choices = [...documentList.querySelectorAll("[data-document]")]
    .sort((left, right) => documents[left.dataset.document].number.localeCompare(documents[right.dataset.document].number));
  choices.forEach((choice) => documentList.append(choice));

  const reader = document.querySelector(".reader");
  const copy = document.querySelector("[data-reader-copy]");
  const readerType = document.querySelector("[data-reader-type]");
  const readerNumber = document.querySelector("[data-reader-number]");
  const readerHeading = document.querySelector("[data-reader-heading]");
  const readerStatus = document.querySelector("[data-reader-status]");
  const previousButton = document.querySelector("[data-previous-document]");
  const nextButton = document.querySelector("[data-next-document]");
  const backButton = document.querySelector("[data-back-to-documents]");
  const orderedIds = Object.keys(documents).sort((left, right) => documents[left].number.localeCompare(documents[right].number));

  const siblingId = (id, offset) => {
    const siblingIndex = orderedIds.indexOf(id) + offset;
    return siblingIndex >= 0 && siblingIndex < orderedIds.length ? orderedIds[siblingIndex] : "";
  };

  const updateNavigation = (id) => {
    const previousId = siblingId(id, -1);
    const nextId = siblingId(id, 1);
    previousButton.disabled = !previousId;
    previousButton.dataset.targetDocument = previousId;
    previousButton.setAttribute("aria-label", previousId ? `Previous draft: ${documents[previousId].title}` : "No previous draft");
    nextButton.disabled = !nextId;
    nextButton.dataset.targetDocument = nextId;
    nextButton.setAttribute("aria-label", nextId ? `Next draft: ${documents[nextId].title}` : "No next draft");
  };

  const loader = createDocumentLoader({
    updateHistory: (id) => window.history.replaceState(null, "", `#${id}`),
    onStart: (id, documentInfo) => {
      reader.setAttribute("aria-busy", "true");
      readerType.textContent = documentInfo.type;
      readerNumber.textContent = documentInfo.number;
      readerHeading.textContent = documentInfo.title;
      readerStatus.textContent = `Loading ${documentInfo.title}.`;
      copy.innerHTML = '<p class="loading">Opening draft archive…</p>';
      choices.forEach((choice) => {
        choice.setAttribute("aria-current", choice.dataset.document === id ? "page" : "false");
      });
      updateNavigation(id);
    },
    onSuccess: (_id, documentInfo, html) => {
      copy.innerHTML = html;
      readerStatus.textContent = `${documentInfo.title} loaded.`;
    },
    onError: (_id, documentInfo, error) => {
      copy.innerHTML = `<p class="error">The draft archive could not be opened. ${escapeHtml(error.message)}</p>`;
      readerStatus.textContent = `${documentInfo.title} could not be loaded. Select it again to retry.`;
    },
    onSettled: (_id, _documentInfo, { focus }) => {
      reader.setAttribute("aria-busy", "false");
      if (focus) readerHeading.focus();
    }
  });

  choices.forEach((choice) => {
    choice.addEventListener("click", () => loader.openDocument(choice.dataset.document, { focus: true }));
  });

  copy.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-version-toggle]");
    if (!toggle || !copy.contains(toggle)) return;

    const switcher = toggle.closest("[data-version-switch]");
    const showingOriginal = switcher.classList.toggle("is-original");
    toggle.setAttribute("aria-expanded", String(showingOriginal));
    toggle.textContent = showingOriginal ? "Original/Edit Prompt (view edited)" : "Edited (view original/edit prompt)";
  });

  previousButton.addEventListener("click", () => {
    if (previousButton.dataset.targetDocument) loader.openDocument(previousButton.dataset.targetDocument, { focus: true });
  });
  nextButton.addEventListener("click", () => {
    if (nextButton.dataset.targetDocument) loader.openDocument(nextButton.dataset.targetDocument, { focus: true });
  });
  backButton.addEventListener("click", () => {
    const activeChoice = choices.find((choice) => choice.getAttribute("aria-current") === "page") || choices[0];
    if (!activeChoice) return;

    activeChoice.focus({ preventScroll: true });
    activeChoice.scrollIntoView({ block: "center", inline: "nearest" });
  });

  loader.openDocument(resolveDocumentId(window.location.hash));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    documents,
    documentAliases,
    escapeHtml,
    markdownToHtml,
    resolveDocumentId,
    createDocumentLoader
  };
}

if (typeof document !== "undefined") initializeApp();
