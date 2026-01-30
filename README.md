# VeLo

A minimal customizable online file viewer, markdown viewer, and more. 

![Preview](https://img.shields.io/badge/deploy-vercel-black?style=flat-square)

## Features

- **Directory browsing** — Navigate folders with breadcrumb trail
- **Image & video lightbox** — Gallery view with keyboard navigation
- **Font folder previews** — Special `.font` folders show all styles with a slider
- **Markdown reader** — Inline rendering of `.md` files
- **Hover previews** — Images and fonts preview on hover
- **Zip downloads** — Download entire font folders as zip

## Quick Start

1. Clone or download this repository
2. Add your files to the `files/` directory
3. Deploy to Vercel: `vercel deploy`

## Customization

### Colors

Edit the CSS variables at the top of `style.css`:

```css
:root {
    --bg: #0c0c0c;              /* Main background */
    --bg-elevated: #141414;     /* Cards, modals */
    --bg-hover: #1c1c1c;        /* Hover states */
    --border: #252525;          /* Borders */
    --border-subtle: #1a1a1a;   /* Subtle dividers */
    --text: #f0f0f0;            /* Primary text */
    --text-secondary: #888;     /* Secondary text */
    --text-muted: #555;         /* Muted text */
    --accent: #6ee7b7;          /* Accent color (links, folders) */
    --accent-dim: rgba(110, 231, 183, 0.15);  /* Selection highlight */
}
```

**Example themes:**

```css
/* Blue theme */
--accent: #60a5fa;
--accent-dim: rgba(96, 165, 250, 0.15);

/* Purple theme */
--accent: #a78bfa;
--accent-dim: rgba(167, 139, 250, 0.15);

/* Orange theme */
--accent: #fb923c;
--accent-dim: rgba(251, 146, 60, 0.15);
```

### File Type Colors

File type indicators are colored in `style.css`. Search for `.file-row.[type] .file-indicator`:

```css
.file-row.folder .file-indicator { background: var(--accent); }
.file-row.image .file-indicator { background: #f472b6; }
.file-row.video .file-indicator { background: #a78bfa; }
.file-row.audio .file-indicator { background: #facc15; }
.file-row.font .file-indicator { background: #38bdf8; }
.file-row.text .file-indicator { background: #facc15; }
.file-row.fontFolder .file-indicator { background: #38bdf8; }
```

## Font Folders

Create folders ending in `.font` to enable the font preview feature:

```
files/
├── MyFont.font/
│   ├── MyFont-Regular.otf
│   ├── MyFont-Bold.otf
│   ├── MyFont-Italic.otf
│   └── MyFont-BoldItalic.otf
```

When clicked:
- Opens a preview modal with sample text
- Slider switches between font styles
- Download single font or zip the entire folder

**Note:** The `.font` suffix is removed from the zip filename when downloading.

## Project Structure

```
├── api/
│   ├── files.js    # Directory listing API
│   └── zip.js      # Folder zip download API
├── files/          # Your files go here
├── index.html      # Main page
├── script.js       # Application logic
├── style.css       # Styles
├── package.json    # Dependencies (archiver)
└── vercel.json     # Vercel routing config
```

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel deploy
```

### Other Platforms

Requires Node.js serverless function support for the `/api` endpoints.

## License

MIT
