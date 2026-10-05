function matchesAnyPattern(path, patterns) {
  return patterns.some((pattern) => patternToRegExp(pattern).test(path));
}

const regExpByPattern = new Map();

function patternToRegExp(pattern) {
  const cached = regExpByPattern.get(pattern);
  if (cached) return cached;

  const source = normalizeGlob(pattern)
    .split(/(\*\*\/|\*\*|\*|\?)/)
    .map(globTokenToSource)
    .join("");
  const regExp = new RegExp(`^${source}$`);
  regExpByPattern.set(pattern, regExp);
  return regExp;
}

// Same rule as .gitignore: a pattern with a slash is relative to the repository root,
// and a pattern without a slash matches the file name in any directory.
// A pattern that starts with a dot is a file name suffix, so ".spec.ts" works without "*".
function normalizeGlob(pattern) {
  if (pattern.includes("/")) return pattern.replace(/^\//, "");
  return pattern.startsWith(".") ? `**/*${pattern}` : `**/${pattern}`;
}

function globTokenToSource(token) {
  switch (token) {
    case "**/":
      return "(?:.*/)?";
    case "**":
      return ".*";
    case "*":
      return "[^/]*";
    case "?":
      return "[^/]";
    default:
      return token.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
}
