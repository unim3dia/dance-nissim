# Dance Nissim

A bilingual digital archive for exploring Nissim Ben-Ami's Israeli folk dance collection.

The site currently presents 1,936 recordings grouped into 797 dance entries, with Hebrew and English browsing, choreographer credits, formation and decade filters, favorites, recently viewed dances, accessible display preferences, and a full-screen discovery mode. Different choreographies with the same title remain separate.

The October 17 title-card audit is merged across all credit layers, with canonical bilingual creator names. The 682 retained audit credits are regression-tested in `scripts/title-card-credits.json`. Four Casablanca recordings are excluded at the archive curator's request.

Run `node scripts/check-catalog.cjs` before publishing to verify that every recording has a readable bilingual title and credit and that distinct choreographies stay separate.

## Demonstration And Lesson Pairing

`pairing-data.js` holds reviewed recording-type corrections, title aliases, and companion credit corrections. It runs after the older credit layers and before grouping. Each rule names its source recording and evidence; runtime grouping never uses fuzzy title matching. Keep curated title-card credits intact unless a separately documented correction is verified. Favorites follow renamed and merged card identities.

The October 21 review checked all retained recordings against public channel titles, including checking the other public tabs for missing full companions. Eleven type labels were corrected and 46 split card identities were consolidated. There are 592 Watch/Learn cards (591 with studio demonstrations and one with a live performance), 69 watch-only cards, and 136 lesson-only cards. This is not 95% pairing coverage. Missing or conflicting companions must not be invented. Partial Shorts are not substituted for complete demonstrations.

Run `node scripts/check-pairings.cjs` for source-type, pairing, favorites, and distinct-choreography regression checks. Run `node scripts/audit-companions.cjs --out /absolute/path/review.json` to reproduce the unresolved companion list using the checked public snapshot in `audit/`. Refresh that snapshot only from a full public channel metadata export using the script's `--source` option. UI availability badges and recording counts are intentionally omitted; a card features at most one Watch and one Learn choice.

## Visual system

`style.css` owns the layout and component behavior. `design.css` is the visual layer: shared dark/light palette tokens, reading surfaces, typography, corner shapes and interaction states. `assets/dance-ribbons.svg` provides the decorative background lines without animation or additional network dependencies. Keep atmospheric effects behind opaque reading surfaces. Run `node scripts/check-design.cjs` to check palette contrast when editing colors.

## Run locally

From this directory, run:

```bash
python3 -m http.server 8091 --bind 127.0.0.1
```

Then visit [http://127.0.0.1:8091](http://127.0.0.1:8091).

Google Fonts, YouTube thumbnails, and YouTube video embeds require an internet connection. Favorites, recently opened dances, language, theme, and text-size preferences are stored in the visitor's browser.
