const RAPID_DIFF_FILE = "diff-file[data-file-data]";
const LEGACY_DIFF_FILE = ".diff-file[data-path]";

// A file is collapsed one time only, so the user can open it again.
const collapsedFileKeys = new Set();
const rapidFilePaths = new WeakMap();
let patterns = [];
let scanScheduled = false;

function collapseMatchingFiles() {
  scanScheduled = false;
  if (patterns.length === 0) return;

  const pathByFileId = new Map();
  for (const file of document.querySelectorAll(`${RAPID_DIFF_FILE}, ${LEGACY_DIFF_FILE}`)) {
    const path = filePath(file);
    if (!path) continue;
    pathByFileId.set(file.id, path);
    collapseFile(file, path);
  }

  collapseMatchingDirectories(pathByFileId, patterns, mergeRequestPath());
}

function collapseFile(file, path) {
  const key = `${mergeRequestPath()}\n${path}`;
  if (collapsedFileKeys.has(key) || !matchesAnyPattern(path, patterns)) return;

  const toggle = findToggle(file);
  if (!toggle) return;

  collapsedFileKeys.add(key);
  if (!toggle.isCollapsed) {
    toggle.element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
}

function scheduleScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  requestAnimationFrame(collapseMatchingFiles);
}

function mergeRequestPath() {
  const match = location.pathname.match(/^.*\/-\/merge_requests\/\d+/);
  return match ? match[0] : location.pathname;
}

function filePath(file) {
  if (!file.matches(RAPID_DIFF_FILE)) return file.dataset.path;

  const cached = rapidFilePaths.get(file);
  if (cached) return cached;
  try {
    const data = JSON.parse(file.dataset.fileData);
    const path = data.new_path || data.old_path;
    rapidFilePaths.set(file, path);
    return path;
  } catch {
    return undefined;
  }
}

function findToggle(file) {
  return file.matches(RAPID_DIFF_FILE) ? findRapidToggle(file) : findLegacyToggle(file);
}

function findRapidToggle(file) {
  // GitLab ignores clicks until it appends this element.
  if (!file.querySelector(":scope > diff-file-mounted")) return undefined;

  const element = file.querySelector('button[data-click="toggleFile"][data-opened]');
  if (!element) return undefined;
  return { element, isCollapsed: getComputedStyle(element).display === "none" };
}

function findLegacyToggle(file) {
  const header = file.querySelector(".js-file-title, .file-title");
  if (!header) return undefined;

  const expandedIcon = header.querySelector('[data-testid="chevron-down-icon"]');
  if (expandedIcon) {
    return { element: expandedIcon.closest("button") ?? expandedIcon, isCollapsed: false };
  }
  const collapsedIcon = header.querySelector('[data-testid="chevron-right-icon"]');
  if (collapsedIcon) {
    return { element: collapsedIcon.closest("button") ?? collapsedIcon, isCollapsed: true };
  }
  return undefined;
}

chrome.storage.sync.get({ patterns: [] }).then((stored) => {
  patterns = stored.patterns;
  scheduleScan();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.patterns) return;
  patterns = changes.patterns.newValue ?? [];
  scheduleScan();
});

new MutationObserver(scheduleScan).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
