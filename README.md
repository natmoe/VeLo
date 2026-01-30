# VeLo

A minimal, customizable file browser with font previews and markdown reader.

## Features

- **Directory browsing** — Navigate folders with breadcrumb trail
- **Image & video lightbox** — Gallery view with keyboard navigation
- **Font folder previews** — Special `.font` folders show all styles with a slider
- **Markdown reader** — Inline rendering of `.md` files
- **Hover previews** — Images and fonts preview on hover
- **Zip downloads** — Download entire font folders as zip

## Quick Start

```bash
npm install
npm start
```

Then open `http://localhost:3000`

Add your files to the `files/` directory.

## Deployment

### Any Node.js Host (Render, Railway, DigitalOcean, etc.)

```bash
npm install
npm start
```

Set the `PORT` environment variable if needed.

### Vercel

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

## Customization

### Colors

Edit the CSS variables at the top of `style.css`:

```css
:root {
    --bg: #0c0c0c;              /* Main background */
    --bg-elevated: #141414;     /* Cards, modals */
    --bg-hover: #1c1c1c;        /* Hover states */
    --border: #252525;          /* Borders */
    --text: #f0f0f0;            /* Primary text */
    --text-secondary: #888;     /* Secondary text */
    --text-muted: #555;         /* Muted text */
    --accent: #6ee7b7;          /* Accent color */
}
```

### File Type Colors

```css
.file-row.folder .file-indicator { background: var(--accent); }
.file-row.image .file-indicator { background: #f472b6; }
.file-row.video .file-indicator { background: #a78bfa; }
.file-row.audio .file-indicator { background: #facc15; }
.file-row.font .file-indicator { background: #38bdf8; }
.file-row.text .file-indicator { background: #facc15; }
```

## Font Folders

Create folders ending in `.font` to enable font preview:

```
files/
├── MyFont.font/
│   ├── MyFont-Regular.otf
│   ├── MyFont-Bold.otf
│   └── MyFont-Italic.otf
```

When clicked:
- Opens a preview modal with sample text
- Slider switches between font styles
- Download single font or zip the entire folder

## Project Structure

```
├── server.js       # Express server (for Node.js hosts)
├── api/            # Vercel serverless functions
├── files/          # Your files go here
├── index.html
├── script.js
├── style.css
└── package.json
```

## License

MIT
