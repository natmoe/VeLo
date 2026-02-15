const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const filesDir = path.join(rootDir, 'files');

app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.type('text/css').sendFile(path.join(rootDir, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.type('application/javascript').sendFile(path.join(rootDir, 'script.js'));
});

app.use('/files', express.static(filesDir));

app.get('/api/files', (req, res) => {
    const requestPath = req.query.path || '';
    const safePath = path.normalize(requestPath).replace(/^(\.\.[\\/])+/, '');
    const fullPath = path.join(filesDir, safePath);

    if (!fullPath.startsWith(filesDir)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Directory not found' });
    }

    try {
        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Not a directory' });
        }

        const items = fs.readdirSync(fullPath)
            .filter(name => !name.startsWith('.'))
            .map(name => {
                const filePath = path.join(fullPath, name);
                try {
                    const fileStats = fs.statSync(filePath);
                    const ext = path.extname(name).slice(1).toLowerCase();
                    return {
                        name,
                        path: safePath ? `${safePath}/${name}` : name,
                        isDirectory: fileStats.isDirectory(),
                        size: fileStats.size,
                        modified: fileStats.mtime.toISOString(),
                        extension: ext,
                        type: getFileType(ext, fileStats.isDirectory())
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean);

        items.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        const totalSize = items.reduce((acc, item) => acc + (item.isDirectory ? 0 : item.size), 0);
        const folderCount = items.filter(i => i.isDirectory).length;
        const fileCount = items.filter(i => !i.isDirectory).length;

        res.json({
            path: safePath,
            parent: safePath ? path.dirname(safePath) : null,
            items,
            stats: { folders: folderCount, files: fileCount, totalSize }
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/zip', (req, res) => {
    const requestPath = req.query.path || '';
    const safePath = path.normalize(requestPath).replace(/^(\.\.[\\/])+/, '');
    const fullPath = path.join(filesDir, safePath);

    if (!fullPath.startsWith(filesDir)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Directory not found' });
    }

    try {
        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: 'Not a directory' });
        }

        const folderName = path.basename(safePath);
        const zipName = folderName.replace(/\.font$/, '') + '.zip';

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create archive' });
            } else {
                res.destroy();
            }
        });

        archive.pipe(res);
        archive.directory(fullPath, false);
        archive.finalize();

    } catch (error) {
        console.error('Zip API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function getFileType(ext, isDir) {
    if (isDir) return 'folder';
    const types = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'],
        video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv'],
        audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
        font: ['otf', 'ttf', 'woff', 'woff2'],
        document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        text: ['txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml'],
        code: ['js', 'ts', 'py', 'rb', 'go', 'rs', 'c', 'cpp', 'h', 'java', 'php', 'html', 'css', 'scss', 'sass'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
    };
    for (const [type, extensions] of Object.entries(types)) {
        if (extensions.includes(ext)) return type;
    }
    return 'file';
}

app.listen(PORT, () => {
    console.log(`VeLo running at http://localhost:${PORT}`);
});
