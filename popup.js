const form = document.querySelector("#add-form");
const input = document.querySelector("#pattern-input");
const list = document.querySelector("#pattern-list");
const emptyMessage = document.querySelector("#empty-message");

let patterns = [];

function renderPatterns() {
  emptyMessage.hidden = patterns.length > 0;
  list.replaceChildren(...patterns.map(createTag));
}

function createTag(pattern) {
  const label = document.createElement("span");
  label.textContent = pattern;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", `Remove ${pattern}`);
  removeButton.addEventListener("click", () => {
    savePatterns(patterns.filter((existing) => existing !== pattern));
  });

  const tag = document.createElement("li");
  tag.className = "tag";
  tag.append(label, removeButton);
  return tag;
}

function savePatterns(nextPatterns) {
  patterns = nextPatterns;
  renderPatterns();
  return chrome.storage.sync.set({ patterns });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const pattern = input.value.trim();
  input.value = "";
  if (pattern === "" || patterns.includes(pattern)) return;
  savePatterns([...patterns, pattern]);
});

chrome.storage.sync.get({ patterns: [] }).then((stored) => {
  patterns = stored.patterns;
  renderPatterns();
});
