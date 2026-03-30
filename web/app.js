const form = document.getElementById("formatterForm");
const resultText = document.getElementById("resultText");
const resultJson = document.getElementById("resultJson");
const resultMarkdown = document.getElementById("resultMarkdown");
const statusPill = document.getElementById("statusPill");
const submitBtn = document.getElementById("submitBtn");
const viewTextBtn = document.getElementById("viewTextBtn");
const viewMarkdownBtn = document.getElementById("viewMarkdownBtn");
const viewJsonBtn = document.getElementById("viewJsonBtn");
const copyTextBtn = document.getElementById("copyTextBtn");
const copyMarkdownBtn = document.getElementById("copyMarkdownBtn");

let latestMarkdownText = "";

function setView(mode) {
  const textActive = mode === "text";
  const markdownActive = mode === "markdown";
  const jsonActive = mode === "json";
  resultText.classList.toggle("hidden", !textActive);
  resultMarkdown.classList.toggle("hidden", !markdownActive);
  resultJson.classList.toggle("hidden", !jsonActive);
  viewTextBtn.classList.toggle("active", textActive);
  viewMarkdownBtn.classList.toggle("active", markdownActive);
  viewJsonBtn.classList.toggle("active", jsonActive);
}

viewTextBtn.addEventListener("click", () => setView("text"));
viewMarkdownBtn.addEventListener("click", () => setView("markdown"));
viewJsonBtn.addEventListener("click", () => setView("json"));

copyTextBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultText.textContent || "");
    copyTextBtn.textContent = "Copiat";
    setTimeout(() => {
      copyTextBtn.textContent = "Copiaza Text";
    }, 1200);
  } catch (error) {
    copyTextBtn.textContent = "Copy esuat";
    setTimeout(() => {
      copyTextBtn.textContent = "Copiaza Text";
    }, 1200);
  }
});

copyMarkdownBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(latestMarkdownText || "");
    copyMarkdownBtn.textContent = "Copiat";
    setTimeout(() => {
      copyMarkdownBtn.textContent = "Copiaza Markdown";
    }, 1200);
  } catch (error) {
    copyMarkdownBtn.textContent = "Copy esuat";
    setTimeout(() => {
      copyMarkdownBtn.textContent = "Copiaza Markdown";
    }, 1200);
  }
});

function setStatus(type, text) {
  statusPill.className = `pill ${type}`;
  statusPill.textContent = text;
}

function escapeHtml(value) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function renderMarkdownToHtml(markdownText) {
  const escaped = escapeHtml(markdownText || "");
  const lines = escaped.split("\n");
  const htmlParts = [];
  let inList = false;
  let inCode = false;
  let codeBuffer = [];

  function closeList() {
    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }
  }

  function closeCode() {
    if (inCode) {
      htmlParts.push(`<pre><code>${codeBuffer.join("\n")}</code></pre>`);
      inCode = false;
      codeBuffer = [];
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        closeCode();
      } else {
        closeList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      closeList();
      return;
    }

    if (trimmed === "---") {
      closeList();
      htmlParts.push("<hr />");
      return;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      htmlParts.push(`<h3>${formatInlineMarkdown(trimmed.slice(4))}</h3>`);
      return;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      htmlParts.push(`<h2>${formatInlineMarkdown(trimmed.slice(3))}</h2>`);
      return;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      htmlParts.push(`<h1>${formatInlineMarkdown(trimmed.slice(2))}</h1>`);
      return;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      htmlParts.push(`<li>${formatInlineMarkdown(trimmed.slice(2))}</li>`);
      return;
    }

    closeList();
    htmlParts.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
  });

  closeCode();
  closeList();

  if (!htmlParts.length) {
    return "<p>Nu exista continut Markdown.</p>";
  }

  return htmlParts.join("\n");
}

function setMarkdownResult(markdownText) {
  latestMarkdownText = markdownText || "";
  resultMarkdown.innerHTML = renderMarkdownToHtml(markdownText);
}

function compactText(value, maxLength = 360) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
}

function formatHashtags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => compactText(String(tag || ""), 60))
      .filter(Boolean)
      .join(" ");
  }

  return compactText(String(value || ""), 220);
}

function decodeJsonLikeString(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonLikeStringField(line, key, maxLength = 360) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `\"${escapedKey}\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"`,
    "i",
  );
  const match = line.match(regex);

  if (!match || !match[1]) {
    return "";
  }

  return compactText(decodeJsonLikeString(match[1]), maxLength);
}

function extractJsonLikeHashtags(line) {
  const match = line.match(/\"hashtags\"\s*:\s*\[([^\]]*)\]/i);
  if (!match || !match[1]) {
    return "";
  }

  const tags = match[1]
    .split(",")
    .map((item) => decodeJsonLikeString(item.replace(/^\s*\"|\"\s*$/g, "")))
    .filter(Boolean);

  return formatHashtags(tags);
}

function extractVariantLines(variant, label) {
  if (!variant || typeof variant !== "object") {
    return [];
  }

  const lines = [];
  const caption = compactText(
    variant.caption || variant.text || variant.copy || variant.message,
    520,
  );
  const hashtags = formatHashtags(variant.hashtags);
  const cta = compactText(variant.cta || variant.callToAction, 220);
  const visual = compactText(
    variant.visualIdea || variant.visual || variant.imageIdea,
    220,
  );

  if (caption) {
    lines.push(`- **${label} caption:** ${caption}`);
  }

  if (hashtags) {
    lines.push(`- **${label} hashtags:** ${hashtags}`);
  }

  if (cta) {
    lines.push(`- **${label} CTA:** ${cta}`);
  }

  if (visual) {
    lines.push(`- **${label} vizual:** ${visual}`);
  }

  return lines;
}

function extractReadableLinesFromJson(line) {
  try {
    const parsed = JSON.parse(line);
    const lines = [];
    const summary = compactText(parsed?.summary, 420);

    if (summary) {
      lines.push(`- **Summary:** ${summary}`);
    }

    if (Array.isArray(parsed?.posts) && parsed.posts.length) {
      parsed.posts.slice(0, 2).forEach((post) => {
        const platform = compactText(post?.platform, 80);
        if (platform) {
          lines.push(`- **Platforma:** ${platform}`);
        }

        lines.push(...extractVariantLines(post?.variantA, "Varianta A"));
        lines.push(...extractVariantLines(post?.variantB, "Varianta B"));
      });

      if (parsed.posts.length > 2) {
        lines.push(
          `- **Nota:** ${parsed.posts.length - 2} postari suplimentare au fost ascunse in preview.`,
        );
      }
    } else {
      const platform = compactText(parsed?.platform, 80);
      const caption = compactText(parsed?.caption, 520);
      const hashtags = formatHashtags(parsed?.hashtags);
      const cta = compactText(parsed?.cta || parsed?.callToAction, 220);
      const visual = compactText(parsed?.visualIdea || parsed?.visual, 220);

      if (platform) {
        lines.push(`- **Platforma:** ${platform}`);
      }

      if (caption) {
        lines.push(`- **Caption:** ${caption}`);
      }

      if (hashtags) {
        lines.push(`- **Hashtags:** ${hashtags}`);
      }

      if (cta) {
        lines.push(`- **CTA:** ${cta}`);
      }

      if (visual) {
        lines.push(`- **Vizual:** ${visual}`);
      }

      lines.push(...extractVariantLines(parsed?.variantA, "Varianta A"));
      lines.push(...extractVariantLines(parsed?.variantB, "Varianta B"));
    }

    return lines.length ? lines : null;
  } catch (_error) {
    const lines = [];
    const summary = extractJsonLikeStringField(line, "summary", 420);
    const platform = extractJsonLikeStringField(line, "platform", 80);
    const caption = extractJsonLikeStringField(line, "caption", 520);
    const cta =
      extractJsonLikeStringField(line, "cta", 220) ||
      extractJsonLikeStringField(line, "callToAction", 220);
    const visual =
      extractJsonLikeStringField(line, "visualIdea", 220) ||
      extractJsonLikeStringField(line, "visual", 220) ||
      extractJsonLikeStringField(line, "imageIdea", 220);
    const hashtags = extractJsonLikeHashtags(line);

    if (summary) {
      lines.push(`- **Summary:** ${summary}`);
    }

    if (platform) {
      lines.push(`- **Platforma:** ${platform}`);
    }

    if (caption) {
      lines.push(`- **Caption:** ${caption}`);
    }

    if (hashtags) {
      lines.push(`- **Hashtags:** ${hashtags}`);
    }

    if (cta) {
      lines.push(`- **CTA:** ${cta}`);
    }

    if (visual) {
      lines.push(`- **Vizual:** ${visual}`);
    }

    return lines.length ? lines : null;
  }
}

function convertPlainTextToMarkdown(text) {
  if (!text) {
    return "";
  }

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const output = [];
  let hiddenJsonBlockCount = 0;

  function pushLine(value) {
    if (!value && output[output.length - 1] === "") {
      return;
    }

    output.push(value);
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      pushLine("");
      return;
    }

    const titleMatch = trimmed.match(/^=+\s*(.+?)\s*=+$/);
    if (titleMatch) {
      pushLine(`# ${titleMatch[1]}`);
      pushLine("");
      return;
    }

    if (/^-{3,}$/.test(trimmed)) {
      pushLine("");
      pushLine("---");
      pushLine("");
      return;
    }

    if (/^REZUMAT STRATEGIC$/i.test(trimmed)) {
      pushLine("## Rezumat strategic");
      return;
    }

    const platformMatch = trimmed.match(/^PLATFORMA\s*:\s*(.+)$/i);
    if (platformMatch) {
      pushLine(`## Platforma: ${platformMatch[1]}`);
      return;
    }

    const variantMatch = trimmed.match(/^Varianta\s+([ab])$/i);
    if (variantMatch) {
      pushLine(`### Varianta ${variantMatch[1].toUpperCase()}`);
      return;
    }

    const infoMatch = trimmed.match(
      /^(Ton|Limba|Audienta|Platforme|Model|Limita caption|Hashtags|CTA|Vizual)\s*:\s*(.+)$/i,
    );
    if (infoMatch) {
      pushLine(`- **${infoMatch[1]}:** ${infoMatch[2]}`);
      return;
    }

    if (/^[\[{]/.test(trimmed)) {
      const extractedLines = extractReadableLinesFromJson(trimmed);
      if (extractedLines) {
        extractedLines.forEach((item) => pushLine(item));
        pushLine("");
      } else {
        hiddenJsonBlockCount += 1;
      }
      return;
    }

    pushLine(trimmed);
  });

  if (hiddenJsonBlockCount > 0) {
    pushLine("");
    pushLine(
      `- **Nota:** ${hiddenJsonBlockCount} fragmente JSON brute au fost ascunse automat din preview-ul Markdown.`,
    );
  }

  return output.join("\n").trim();
}

function parseResponse(payload) {
  const plainText = payload?.exports?.plainText;
  const markdown = payload?.exports?.markdown;
  const formatted = payload?.formatted;
  const resolvedPlainText =
    plainText ||
    payload?.copyPasteText ||
    payload?.rawText ||
    "Nu exista export text in raspuns.";

  return {
    plainText: resolvedPlainText,
    markdownText:
      markdown ||
      payload?.markdown ||
      convertPlainTextToMarkdown(resolvedPlainText),
    jsonText: JSON.stringify(formatted || payload || {}, null, 2),
  };
}

function setResultMessage(message) {
  resultText.textContent = message;
  setMarkdownResult(message);
  resultJson.textContent = message;
}

function showParsedResult(payload) {
  const parsed = parseResponse(payload);
  resultText.textContent = parsed.plainText;
  setMarkdownResult(parsed.markdownText);
  resultJson.textContent = parsed.jsonText;
  setView("text");
}

function showErrorMessage(message) {
  setStatus("error", "Eroare");
  setResultMessage(`Nu am putut procesa cererea: ${message}`);
  setView("text");
}

function validateFormInput(webhookUrl, files) {
  if (!webhookUrl) {
    showErrorMessage("Completeaza webhook URL.");
    return false;
  }

  if (!files.length) {
    showErrorMessage("Selecteaza cel putin un fisier.");
    return false;
  }

  return true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const webhookUrl = document.getElementById("webhookUrl").value.trim();
  const files = document.getElementById("documents").files;

  if (!validateFormInput(webhookUrl, files)) {
    return;
  }

  const formData = new FormData();
  formData.append("tone", form.tone.value);
  formData.append("language", form.language.value);
  formData.append("model", form.model.value || "qwen2.5:7b");
  formData.append("audience", form.audience.value || "public general");

  const selectedPlatforms = [
    ...form.querySelectorAll('input[name="platform"]:checked'),
  ]
    .map((input) => input.value)
    .join(", ");

  formData.append("platforms", selectedPlatforms || "Instagram, Facebook");

  [...files].forEach((file, index) => {
    formData.append(`file${index}`, file, file.name);
  });

  setStatus("loading", "Procesez...");
  submitBtn.disabled = true;
  setResultMessage("Upload in progres si analiza AI...");
  setView("text");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { rawText: await response.text() };

    if (!response.ok) {
      throw new Error(
        payload.message || payload.error || `HTTP ${response.status}`,
      );
    }

    setStatus("ok", "Gata");
    showParsedResult(payload);
  } catch (error) {
    showErrorMessage(error.message);
  } finally {
    submitBtn.disabled = false;
  }
});
