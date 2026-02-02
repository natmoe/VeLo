<p align="center">
  <img src="https://velo.philia.moe/assets/velo.png" alt="VeLo" width="200">
</p>

<p align="center">
  <strong>A minimal, self-hosted file browser</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white" alt="Node.js"></a>
</p>

---

## Features

- **Browsing** — Navigate folders with breadcrumbs and file stats
- **Media Lightbox** — Preview images and videos in a gallery view
- **Font Previews** — Folders ending in `.font` render as interactive font previews
- **Markdown Reader** — Inline rendering of `.md` files
- **Pagination** — Load files incrementally with "Load More"

---

## Quick Start

```bash
git clone https://github.com/natmoe/VeLo.git
cd VeLo
npm install
npm start
```

Open `http://localhost:3000`. Add files to `files/`.

---

## Customization

All options are at the top of `script.js`:

| Option | Description |
|--------|-------------|
| `ROOT_NAME` | Breadcrumb root label (`'/'`, `'files'`, etc.) |
| `FILE_EXTENSION_COLOR` | `1` = extension colored, `2` = both colored, `3` = both white |
| `PAGE_SIZE` | Files per page (`10` default, `0` = show all) |
| `TYPE_COLORS` | Color per file type |
| `TYPE_ICONS` | SVG icon per file type (set to `null` for colored square) |
| `ICONS_PATH` | Path to icon SVGs (`/icons` default) |

**Theme colors** in `style.css`:

```css
:root {
    --bg: #0c0c0c;
    --accent: #6ee7b7;
    --text: #f0f0f0;
}
```

---

## Deployment

Works on **Vercel**, **Render**, **Railway**, **Fly.io**, or any Node.js host.

```bash
npm install && npm start
```

---

## License

[MIT](LICENSE) © natmoe
