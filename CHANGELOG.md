# Changelog

## 0.4.0 — 2026-09-27

- Keep only Pixelify Sans and Silkscreen; remove experimental font choices and assets.
- Add Use Obsidian fonts everywhere to disable pixel typography across the theme, including tabs and properties.
- Respect Text, Interface and Monospace font preferences even when pixel note text remains enabled.
- Document the change and recommend trying the two fonts or using personal fonts through Appearance.

## 0.3.1 — 2026-09-27

- Replace Geist Pixel Square and DotGothic16 with Jersey 15 and Tiny5 in the font selector.
- Remove the discarded font files and update the documentation and license notices.
- Keep Pixelify Sans, Silkscreen and VT323, preserving their existing selections.
- A previously selected removed font falls back to Pixelify Sans until another font is chosen.

## 0.3.0 — 2026-09-27

- Add the Pixel font selector with Pixelify Sans, Silkscreen, Geist Pixel Square, VT323 and DotGothic16.
- Apply the selected font throughout pixel UI, properties and optional pixel note text.
- Preserve existing font overrides and keep Pixelify Sans as the default.
- Embed compact Latin WOFF2 subsets and all font licenses; retain the 1 MB CSS budget.

## 0.2.3 — 2026-09-26

- Remove the installation version restriction; Obsidian Early Access is no longer required.
- Set the required `minAppVersion` metadata to `0.0.0` for this release.
- Preserve the existing theme appearance, embedded assets and settings.

## 0.2.2 — 2026-09-20

- Reduce theme.css from 10.45 MB to approximately 0.96 MB to address the directory size warning.
- Embed WebP scenery at the original resolution; retain all source PNGs and all four landscapes.
- Compact pixel SVG geometry without changing its occupied cells.
- Add reproducible asset optimization and a strict 1 MB project CSS budget.
- Preserve offline use and all ten configuration controls.

## 0.2.1 — 2026-09-20

- Translate every Style Settings heading, option, description and landscape choice into English.
- Update the README and UI verification scripts to match the English labels.
- Preserve setting IDs, values and defaults so existing preferences remain intact.

## 0.2.0 — 2026-09-20

- First public GitHub release, including installable ZIP, manifest and theme CSS.
- Documented all ten configuration controls, font choices and fresh-install defaults.
- Added three user-supplied comparisons showing all six light/dark appearances.
- Added a native Style Settings selector for Pixel clásico / Detallado.
- New classic day/night pair: larger pixel clusters, simpler forms and less surface detail.
- Retained the original detailed artwork as an alternative.
- Preserved the translucent backdrop, full editor height, and borderless pixel frontmatter.

## 0.1.0 — 2026-09-20

- First local Lanternwood theme release.
- Dark midnight and light parchment palettes.
- Embedded Pixelify Sans, original 16×16 glyphs and square interface controls.
- Optional translucent forest backdrop with matching night and day artwork, vertical fade and no reserved editor space.
- Native Style Settings forest toggle, height, opacity, brightness, typography and icon controls.
- Reading view, Live Preview, callouts, code, tables, tags, properties and settings styling.
- Pixel typography throughout frontmatter properties, with borderless property names.
- Responsive forest height, desktop sidebar limits, print suppression and keyboard focus indicators.
