# Dance Nissim

A bilingual digital archive for exploring Nissim Ben-Ami's Israeli folk dance collection.

The site currently presents 1,936 recordings grouped into 843 dance entries, with Hebrew and English browsing, choreographer credits, formation and decade filters, favorites, recently viewed dances, accessible display preferences, and a full-screen discovery mode. Different choreographies with the same title remain separate.

The October 17 title-card audit is merged across all credit layers, with canonical bilingual creator names. The 682 retained audit credits are regression-tested in `scripts/title-card-credits.json`. Four Casablanca recordings are excluded at the archive curator's request.

Run `node scripts/check-catalog.cjs` before publishing to verify that every recording has a readable bilingual title and credit and that distinct choreographies stay separate.

## Visual system

`style.css` owns the layout and component behavior. `design.css` is the visual layer: shared dark/light palette tokens, reading surfaces, typography, corner shapes and interaction states. `assets/dance-ribbons.svg` provides the decorative background lines without animation or additional network dependencies. Keep atmospheric effects behind opaque reading surfaces. Run `node scripts/check-design.cjs` to check palette contrast when editing colors.

## Run locally

From this directory, run:

```bash
python3 -m http.server 8091 --bind 127.0.0.1
```

Then visit [http://127.0.0.1:8091](http://127.0.0.1:8091).

Google Fonts, YouTube thumbnails, and YouTube video embeds require an internet connection. Favorites, recently opened dances, language, theme, and text-size preferences are stored in the visitor's browser.
