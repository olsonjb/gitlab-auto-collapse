const TREE_ROW = '[data-testid="file-row-container"]';

// A directory is collapsed one time only, so the user can open it again.
const collapsedDirectoryKeys = new Set();

function collapseMatchingDirectories(pathByFileId, patterns, mergeRequestPath) {
  const paths = [...pathByFileId.values()];
  if (!areAllFilesLoaded(paths.length)) return;

  const rows = visibleTreeRows();
  let rowDirectories;

  rows.forEach((row, index) => {
    if (!row.button.matches('.folder[aria-expanded="true"]')) return;

    const descendantPath = pathByFileId.get(firstDescendantFileId(rows, index));
    if (!descendantPath) return;

    rowDirectories ??= findRowDirectories(paths);
    const directory = ancestorDirectories(descendantPath).filter((ancestor) =>
      rowDirectories.has(ancestor),
    )[row.level];
    const label = row.button.getAttribute("aria-label");
    if (!directory || !`/${directory}`.endsWith(`/${label}`)) return;

    const keyPrefix = `${mergeRequestPath}\n`;
    const wasCollapsedBefore = [...ancestorDirectories(directory), directory].some((candidate) =>
      collapsedDirectoryKeys.has(keyPrefix + candidate),
    );
    if (wasCollapsedBefore) return;

    const filesInDirectory = paths.filter((path) => path.startsWith(`${directory}/`));
    if (!filesInDirectory.every((path) => matchesAnyPattern(path, patterns))) return;

    collapsedDirectoryKeys.add(keyPrefix + directory);
    row.button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

// GitLab adds the files to the page in batches.
// A directory can look fully matched before its last files arrive.
function areAllFilesLoaded(loadedCount) {
  const badge = document.querySelector('[data-testid="file-count"]');
  return badge !== null && Number(badge.textContent.trim()) === loadedCount;
}

// The tree is a virtual list, so the DOM order is not the display order.
function visibleTreeRows() {
  return [...document.querySelectorAll(TREE_ROW)]
    .filter((container) => {
      const view = container.closest(".vue-recycle-scroller__item-view");
      return !view || !view.style.transform.includes("-9999");
    })
    .map((container) => ({ container, button: container.querySelector(".file-row") }))
    .filter((row) => row.button)
    .map((row) => ({
      button: row.button,
      level: Number(row.button.dataset.level),
      fileId: row.button.dataset.fileRow,
      top: row.container.getBoundingClientRect().top,
    }))
    .sort((first, second) => first.top - second.top);
}

// The directory rows do not contain their full path. The file rows identify their file,
// so a file below the directory row gives the path.
function firstDescendantFileId(rows, directoryIndex) {
  const directoryLevel = rows[directoryIndex].level;
  for (const row of rows.slice(directoryIndex + 1)) {
    if (row.level <= directoryLevel) return undefined;
    if (row.fileId) return row.fileId;
  }
  return undefined;
}

// GitLab shows a directory and its only child directory as one row, for example "a/b".
// Only the directories that have a file or more than one child get a row.
function findRowDirectories(paths) {
  const childrenByDirectory = new Map();
  const directoriesWithFiles = new Set();

  for (const path of paths) {
    const segments = path.split("/");
    segments.forEach((segment, index) => {
      const directory = segments.slice(0, index).join("/");
      const children = childrenByDirectory.get(directory) ?? new Set();
      children.add(segment);
      childrenByDirectory.set(directory, children);
    });
    directoriesWithFiles.add(segments.slice(0, -1).join("/"));
  }

  const rowDirectories = new Set();
  for (const [directory, children] of childrenByDirectory) {
    if (children.size > 1 || directoriesWithFiles.has(directory)) rowDirectories.add(directory);
  }
  return rowDirectories;
}

function ancestorDirectories(path) {
  const segments = path.split("/").slice(0, -1);
  return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}
