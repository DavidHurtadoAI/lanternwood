# Validation — Lanternwood 0.2.0

## 0.2.0 additional verification

- CSS source and full generated theme pass the official Stylelint configuration.
- Twelve Style Settings entries parse correctly, including the new class selector.
- Manifest/package/lockfile/versions map updated to 0.2.0.
- All four landscape PNGs are embedded and have matching 2172×724 dimensions.
- Changed the **actual Style Settings dropdown** to both Pixel clásico and Detallado.
- In each option, toggled light/dark mode and verified the computed background
  matches the correct embedded PNG. Four combinations passed.
- Every combination retains zero bottom padding, negative backdrop z-index and
  the existing opacity. Style Settings reports no errors.
- Original preferences restored after testing; classic is the fresh-install default.
- Machine-readable evidence: [art-validation.json](screenshots/art-validation.json).
  Individual QA captures are retained locally. The public README uses the three
  user-supplied light/dark comparisons for classic, plain and detailed modes.
- Prompt records: `assets/PROMPTS-CLASSIC.md`. Images generated with the built-in tool.

## Baseline 0.1.0 validation

Date: 2026-09-20. Actual app: **Obsidian 1.14.2, installer 1.13.4**, Windows.

## Completed

- Official `stylelint-config-obsidianmd`: **0 errors, 0 warnings**, both source
  CSS and the complete generated theme CSS.
- CSS parsed with PostCSS; Style Settings YAML parsed with js-yaml.
- Manifest, package and versions map agree on 0.1.0 and minimum app 1.14.2.
- TrueType font header and embedded payload verified.
- Day and night images are valid PNGs with matching 2172×724 dimensions;
  both complete payloads are embedded in the distributed CSS.
- No remote CSS/font/image dependencies and no oversized CSS custom properties.
- In real Obsidian, Style Settings reports **no parsing errors**.
- Clicked the actual **Activar el bosque** UI toggle off and on, verified
  the applied class, and restored its previous setting.
- Confirmed dark mode loads the night image and light mode loads a different
  day image, with valid computed image URLs in both cases.
- Confirmed forest-off removes the pseudo-element in both color modes.
- Confirmed the forest reserves **zero layout space**: the editor retains the
  full workspace height in Reading view and Live Preview. The backdrop has
  negative z-index inside an isolated workspace, adjustable opacity, a vertical
  gradient mask and `pointer-events: none`.
- Confirmed Pixelify Sans loads and optional pixel body text applies.
- Tested a 600×800 desktop viewport with both sidebars open: no page overflow,
  capped background height, editor at least 240 CSS pixels wide.
- Screenshots are actual Obsidian captures, not generated UI mockups.
- Local development installation completed; settings and zoom restored after QA.

Machine-readable results: [screenshots/validation.json](screenshots/validation.json).
The final day/night showcase captures use a temporary 80% browser zoom and a
220px forest, then restore the user's previous preferences. Other screenshots
reflect the existing development-vault preferences.

## Important implementation findings

Large embedded image data URLs cannot live in CSS custom properties: Chromium
rejects oversized token streams. Both landscape URLs are therefore assigned
directly to `background-image` in mode-specific rules. Packaging validation
guards against introducing oversized variables later.

The landscape uses `background-size: cover`, preserving proportions. Its crop
depends on window aspect ratio and scene height; the complete panorama is not
always visible at once.

## Limits

- Desktop verified. Narrow desktop viewport testing is **not** physical iOS or
  Android testing. Mobile-specific height and native sidebar rules are included
  but not device-certified.
- No exhaustive third-party plugin, Canvas, Bases, PDF or multi-window matrix.
  The theme primarily uses native Obsidian variables for these surfaces.
- Reading/Live Preview layout was tested without changing note contents.
- No claims of Community Themes approval.
