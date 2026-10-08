# Dance Nissim

A bilingual digital archive for exploring Nissim Ben-Ami's Israeli folk dance collection.

The site currently presents 1,940 recordings grouped into 849 dance entries, with Hebrew and English browsing, choreographer credits, formation and decade filters, favorites, recently viewed dances, accessible display preferences, and a full-screen discovery mode. Different choreographies with the same title remain separate.

Run `node scripts/check-catalog.cjs` before publishing to verify that every recording has a readable bilingual title and credit and that distinct choreographies stay separate.

## Run locally

From this directory, run:

```bash
python3 -m http.server 8091 --bind 127.0.0.1
```

Then visit [http://127.0.0.1:8091](http://127.0.0.1:8091).

Google Fonts, YouTube thumbnails, and YouTube video embeds require an internet connection. Favorites, recently opened dances, language, theme, and text-size preferences are stored in the visitor's browser.
