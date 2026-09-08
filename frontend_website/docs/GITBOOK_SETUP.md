# GitBook publishing handoff

The content in `docs/content/` is ready for GitBook Git Sync. The repository-level `.gitbook.yaml` points GitBook to that folder and declares `README.md` plus `SUMMARY.md` as the content structure.

## Git Sync

1. Create or open the OpenGraph AI docs site in GitBook.
2. Choose **Set up Git Sync** and connect this repository and branch.
3. Start the initial sync from **GitHub → GitBook**.
4. Preview the space before publishing.

## OpenGraph AI theme

Apply these values in GitBook’s **Customization** panel:

| Setting | Value |
| --- | --- |
| Theme | Clean |
| Default mode | Dark |
| Show mode toggle | Enabled |
| Light primary / tint | `#343538` / `#F7F6F3` |
| Dark primary / tint | `#DEDED9` / `#1B1B1C` |
| Corner style | Rounded |
| Depth style | Subtle |
| Link style | Accent |
| Icon style | Outline, regular weight |
| Standard font | Instrument Sans, when custom fonts are available |
| Monospace font | Azeret Mono, when custom fonts are available |

Keep semantic colors neutral and reserve stronger contrast for active navigation, links, and code-focused actions.

GitBook applies site branding through its Customization UI rather than repository CSS, so these settings intentionally live in this handoff instead of a stylesheet.
