const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = function handler(req, res) {
    let baseDir = path.join(process.cwd(), 'files');
    if (!fs.existsSync(baseDir)) {
        baseDir = path.join(process.cwd(), 'public', 'files');
    }

    const requestPath = req.query.path || '';
    const safePath = path.normalize(requestPath).replace(/^(\.\.[\\/])+/, '');
    const fullPath = path.join(baseDir, safePath);

    if (!fullPath.startsWith(baseDir)) {
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
            res.status(500).json({ error: 'Failed to create archive' });
        });

        archive.pipe(res);
        archive.directory(fullPath, false);
        archive.finalize();

    } catch (error) {
        console.error('Zip API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
