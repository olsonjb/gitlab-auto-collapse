# GitLab Auto Collapse

<img src="icons/icon-128.png" alt="GitLab Auto Collapse icon" width="64" />

A Chrome extension that collapses files in a GitLab merge request when their path matches a pattern.
Use it to hide translation files, tests, snapshots, lock files, and other files that you do not review line by line.

## Features

- Collapses each file that matches one of your patterns.
- Collapses a directory in the file tree when all files in that directory match.
- Collapses each file and each directory one time only. If you open it again, it stays open.
- Applies a new pattern immediately to the open merge request.
- Saves the patterns with Chrome sync.

## Install

The extension is not in the Chrome Web Store.

1. Clone this repository.
2. Open `chrome://extensions`.
3. Turn on "Developer mode".
4. Click "Load unpacked".
5. Select the repository folder.

To update, pull the changes and click the reload button on `chrome://extensions`.

## Use

1. Click the extension icon.
2. Type a pattern and press Enter. The pattern shows as a tag.
3. Click the "×" on a tag to remove it.

## Pattern rules

| Pattern                 | Matches                                                  |
| ----------------------- | -------------------------------------------------------- |
| `myproject/i18n/*.json` | JSON files directly in `myproject/i18n` at the root      |
| `**/i18n/*.json`        | JSON files directly in each `i18n` directory             |
| `docs/**`               | All files below `docs` at the root                       |
| `package-lock.json`     | Each file with that name, in all directories             |
| `.spec.ts`              | Each file with a name that ends in `.spec.ts`            |
| `.spec.*`               | Each file with `.spec.` in its name, such as `a.spec.tsx` |

- `*` matches all characters except `/`.
- `**` matches all characters, `/` included.
- `?` matches one character.
- A pattern with a `/` starts at the repository root.
- A pattern without a `/` matches the file name in all directories.
- A pattern that starts with `.` matches the end of the file name.

## Compatibility

- The extension runs on each HTTPS URL that contains `/-/merge_requests/`. Thus it works on gitlab.com and on self-hosted GitLab.
- It is tested on the "rapid diffs" view of gitlab.com.
- It also has selectors for the older diff view, but that view is not tested.
- The file tree must be in "Tree view" for the directory collapse.

## License

[MIT](LICENSE)
