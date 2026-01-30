# VeLo

**A minimal, self-hosted file browser with font previews.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)

---

## Features

- **Browsing** — Navigate folders in a nice text-based view.
- **Media** — Images and videos have a nice previe and a gallery-based view.
- **Font Previews** — To show multiple versions of a font, put them in a folder ending in `.font` to have them render as a collective preview.
- **Markdown Reader** — Inline rendering of `.md` files
- **Zip Downloads** — Download entire font folders as a zip

---

## 🚀 Quick Start

```bash
git clone https://github.com/natmoe/VeLo.git
cd VeLo
npm install
npm start
```

Open `http://localhost:3000` and add your files to the `files/` folder.

---

## 📦 Deployment

### Any Node.js Host

```bash
npm install
npm start
```

Works on **Render**, **Railway**, **Fly.io**, **DigitalOcean**, or any VPS.

### Vercel

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🎨 Customization

Edit the CSS variables at the top of `style.css`:

```css
:root {
    --bg: #0c0c0c;           /* Background */
    --accent: #6ee7b7;       /* Accent color */
    --text: #f0f0f0;         /* Text color */
}
```

**File type indicator colors:**

```css
.file-row.folder .file-indicator { background: var(--accent); }
.file-row.image .file-indicator { background: #f472b6; }
.file-row.video .file-indicator { background: #a78bfa; }
.file-row.font .file-indicator { background: #38bdf8; }
```

---

## 🔤 Font Folders

Create folders ending in `.font` to enable the font preview feature:

```
files/
└── MyFont.font/
    ├── MyFont-Regular.otf
    ├── MyFont-Bold.otf
    └── MyFont-Italic.otf
```

Click to open an interactive preview with:
- Sample text at multiple sizes
- Slider to switch between styles
- Download single font or zip all

---

## 📁 Project Structure

```
├── server.js       # Express server
├── index.html      # Main page
├── script.js       # Frontend logic
├── style.css       # Styles
├── files/          # Your files go here
├── package.json
├── vercel.json     # Vercel config (optional)
└── LICENSE
```

---

## 📄 License

[MIT](LICENSE) © natmoe
