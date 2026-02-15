const API_ENDPOINT = '/api/files';
const FILES_PATH = '/files';

// ===========================================
// CUSTOMIZATION: Change the root folder display name
// Examples: '/', 'files', 'archive', 'home'
// ===========================================
const ROOT_NAME = '/';

// ===========================================
// CUSTOMIZATION: File extension color mode
// 1 = filename is white, extension is colored (e.g., "readme" white, ".md" yellow)
// 2 = filename AND extension are both colored
// 3 = filename AND extension are both white
// ===========================================
const FILE_EXTENSION_COLOR = 1;

// ===========================================
// CUSTOMIZATION: Pagination settings
// PAGE_SIZE = number of files to show initially and per "Load More" click
// Set to 0 or Infinity to disable pagination (show all files)
// ===========================================
const PAGE_SIZE = 10;

const TYPE_COLORS = {
    folder: 'var(--accent)',
    fontFolder: '#38bdf8',
    image: '#f472b6',
    video: '#a78bfa',
    audio: '#facc15',
    font: '#38bdf8',
    text: '#facc15',
    code: '#34d399',
    archive: '#fb923c',
    document: '#f87171',
    file: 'var(--text-muted)'
};

// ===========================================
// CUSTOMIZATION: Animation settings
// true = enable animations
// false = disable animations
// ===========================================
const ANIMATIONS = true;

// ===========================================
// CUSTOMIZATION: Icon settings
// ICONS_PATH = base path where icon SVGs are stored
// TYPE_ICONS = default icon per file type category
// EXTENSION_ICONS = override icon for specific file extensions
// Set any icon to null to use the colored square fallback
// ===========================================
const ICONS_PATH = '/assets/icons';

// Default icons by file type category
const TYPE_ICONS = {
    folder: 'folder.svg',
    fontFolder: 'fonts.svg',
    image: 'image.svg',
    video: 'video.svg',
    audio: null,
    font: 'fonts.svg',
    text: 'document.svg',
    code: 'document.svg',
    archive: null,
    document: 'document.svg',
    file: 'document.svg'
};

const EXTENSION_ICONS = {
    // Add your custom extension icons here
};

const FILE_TYPES = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'],
    video: ['mp4', 'webm', 'mov', 'ogv'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    font: ['otf', 'ttf', 'woff', 'woff2'],
    text: ['txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml'],
    code: ['js', 'ts', 'py', 'rb', 'go', 'rs', 'c', 'cpp', 'h', 'java', 'php', 'html', 'css', 'scss']
};

let currentPath = '';
let fontFolderFonts = [];
let currentFontIndex = 0;
let currentFontFolderPath = '';

let allSortedItems = [];
let currentlyShown = 0;

let navigationDirection = 'forward';
let previousPath = '';
let nextDirection = null;

const elements = {
    fileList: document.getElementById('file-list'),
    breadcrumb: document.getElementById('breadcrumb'),
    stats: document.getElementById('stats'),
    lightbox: document.getElementById('lightbox'),
    lightboxMedia: document.getElementById('lightbox-media'),
    lightboxBack: document.getElementById('lightbox-back'),
    lightboxDownload: document.getElementById('lightbox-download'),
    reader: document.getElementById('reader'),
    readerTitle: document.getElementById('reader-title'),
    readerContent: document.getElementById('reader-content'),
    readerDownload: document.getElementById('reader-download'),
    readerClose: document.getElementById('reader-close'),
    preview: document.getElementById('preview'),
    fontViewer: document.getElementById('font-viewer'),
    fontViewerTitle: document.getElementById('font-viewer-title'),
    fontViewerClose: document.getElementById('font-viewer-close'),
    fontPreview: document.getElementById('font-preview'),
    fontSlider: document.getElementById('font-slider'),
    fontStyleName: document.getElementById('font-style-name'),
    fontCount: document.getElementById('font-count'),
    fontDownloadSingle: document.getElementById('font-download-single'),
    fontDownloadAll: document.getElementById('font-download-all')
};

document.addEventListener('DOMContentLoaded', () => {
    if (!ANIMATIONS) {
        document.body.classList.add('no-animations');
    }

    currentPath = decodeURIComponent(window.location.hash.slice(1));
    loadDirectory(currentPath);

    window.addEventListener('hashchange', () => {
        currentPath = decodeURIComponent(window.location.hash.slice(1));
        loadDirectory(currentPath);
    });

    document.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    elements.lightboxBack.addEventListener('click', closeLightbox);

    document.querySelector('.reader-backdrop').addEventListener('click', closeReader);
    elements.readerClose.addEventListener('click', closeReader);

    document.querySelector('.font-viewer-backdrop').addEventListener('click', closeFontViewer);
    elements.fontViewerClose.addEventListener('click', closeFontViewer);
    elements.fontSlider.addEventListener('input', handleFontSlider);
    elements.fontDownloadSingle.addEventListener('click', downloadCurrentFont);
    elements.fontDownloadAll.addEventListener('click', downloadAllFonts);

    document.addEventListener('keydown', handleKeyboard);
});

async function loadDirectory(path) {
    if (nextDirection) {
        navigationDirection = nextDirection;
        nextDirection = null;
    } else {
        const prev = previousPath.endsWith('/') ? previousPath : previousPath + '/';
        const curr = path.endsWith('/') ? path : path + '/';

        const isGoingBack = prev.startsWith(curr) && path !== previousPath;
        navigationDirection = isGoingBack ? 'back' : 'forward';
    }

    const existingRows = elements.fileList.querySelectorAll('.file-row');
    if (ANIMATIONS && existingRows.length > 0) {
        const exitClass = navigationDirection === 'back' ? 'exiting-back' : 'exiting';
        existingRows.forEach((row, index) => {
            row.style.animationDelay = `${index * 15}ms`;
            row.classList.add(exitClass);
        });
        await new Promise(resolve => setTimeout(resolve, Math.min(existingRows.length * 15 + 200, 400)));
    }

    previousPath = path;

    elements.fileList.innerHTML = '<div class="loading">Loading...</div>';

    try {
        const url = `${API_ENDPOINT}?path=${encodeURIComponent(path)}&t=${Date.now()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(response.status === 404 ? 'Directory not found' : 'Failed to load');
        }

        const data = await response.json();
        renderFileList(data);
        renderBreadcrumb(data.path);
        renderStats(data.stats);

    } catch (error) {
        elements.fileList.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

function isFontFolder(item) {
    return item.isDirectory && item.name.endsWith('.font');
}

function getTypeClass(item) {
    if (isFontFolder(item)) return 'fontFolder';
    if (item.isDirectory) return 'folder';
    for (const [type, extensions] of Object.entries(FILE_TYPES)) {
        if (extensions.includes(item.extension)) return type;
    }
    return 'file';
}

function renderFileList(data) {
    elements.fileList.innerHTML = '';

    if (data.path && data.path !== '' && data.path !== '/' && data.path !== '.') {
        const parentRow = createFileRow({
            name: 'return',
            path: data.parent || '',
            isDirectory: true,
            type: 'folder'
        }, true);
        elements.fileList.appendChild(parentRow);
    }

    if (data.items.length === 0 && !data.path) {
        elements.fileList.innerHTML = '<div class="empty">Empty folder</div>';
        return;
    }

    allSortedItems = [...data.items].sort((a, b) => {
        const aIsText = FILE_TYPES.text.includes(a.extension) || FILE_TYPES.code.includes(a.extension);
        const bIsText = FILE_TYPES.text.includes(b.extension) || FILE_TYPES.code.includes(b.extension);

        if (aIsText && !bIsText) return -1;
        if (!aIsText && bIsText) return 1;

        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;

        return a.name.localeCompare(b.name);
    });

    currentlyShown = 0;
    loadMoreItems();
}

function loadMoreItems() {
    const isPaginationEnabled = PAGE_SIZE > 0 && PAGE_SIZE !== Infinity;
    const itemsToShow = isPaginationEnabled
        ? allSortedItems.slice(currentlyShown, currentlyShown + PAGE_SIZE)
        : allSortedItems.slice(currentlyShown);

    const existingLoadMore = document.querySelector('.load-more-container');
    if (existingLoadMore) existingLoadMore.remove();

    const startIndex = currentlyShown;
    itemsToShow.forEach((item, index) => {
        const row = createFileRow(item);
        if (ANIMATIONS) {
            row.style.animationDelay = `${(startIndex + index) * 30}ms`;
            if (navigationDirection === 'back') {
                row.classList.add('entering-back');
            }
        }
        elements.fileList.appendChild(row);
    });

    currentlyShown += itemsToShow.length;

    if (allSortedItems.length > 0) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';

        const fileCount = document.createElement('span');
        fileCount.className = 'file-count-text';
        fileCount.textContent = `showing ${currentlyShown} out of ${allSortedItems.length}`;
        loadMoreContainer.appendChild(fileCount);

        if (currentlyShown < allSortedItems.length && isPaginationEnabled) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.addEventListener('click', loadMoreItems);
            loadMoreContainer.appendChild(loadMoreBtn);
        }

        elements.fileList.appendChild(loadMoreContainer);
    }
}

function createFileRow(item, isParent = false) {
    const typeClass = getTypeClass(item);

    const row = document.createElement('div');
    row.className = `file-row ${typeClass}`;

    const isImage = FILE_TYPES.image.includes(item.extension);
    const isVideo = FILE_TYPES.video.includes(item.extension);
    const isText = FILE_TYPES.text.includes(item.extension) || FILE_TYPES.code.includes(item.extension);
    const isFont = FILE_TYPES.font.includes(item.extension);

    const nameCell = document.createElement('div');
    nameCell.className = 'file-name';

    const typeColor = TYPE_COLORS[typeClass] || TYPE_COLORS.file;
    const iconFile = (item.extension && EXTENSION_ICONS[item.extension]) || TYPE_ICONS[typeClass];

    let indicator;

    if (isParent && item.name === 'return') {
        indicator = document.createElement('div');
        indicator.className = 'file-icon back';
        indicator.style.setProperty('--icon-src', `url(${ICONS_PATH}/back.svg)`);
        indicator.style.setProperty('--icon-color', 'var(--text)');
    } else if (iconFile) {
        indicator = document.createElement('div');
        indicator.className = 'file-icon';
        indicator.style.setProperty('--icon-src', `url(${ICONS_PATH}/${iconFile})`);
        indicator.style.setProperty('--icon-color', typeColor);
    } else {
        indicator = document.createElement('span');
        indicator.className = 'file-indicator';
        if (FILE_EXTENSION_COLOR === 1 || FILE_EXTENSION_COLOR === 2) {
            indicator.style.background = typeColor;
        }
    }

    const link = document.createElement('span');
    link.className = 'file-link';

    const isFontFolderItem = isFontFolder(item);
    const hasExtension = !item.isDirectory && item.extension;
    const hasFontSuffix = isFontFolderItem && item.name.endsWith('.font');

    if (hasExtension || hasFontSuffix) {
        let baseName, extension;
        if (hasFontSuffix) {
            baseName = item.name.slice(0, -5); // Remove ".font"
            extension = '.font';
        } else {
            baseName = item.name.slice(0, -(item.extension.length + 1));
            extension = '.' + item.extension;
        }

        const baseSpan = document.createElement('span');
        baseSpan.textContent = baseName;

        const extSpan = document.createElement('span');
        extSpan.className = 'file-extension';
        extSpan.textContent = extension;

        if (FILE_EXTENSION_COLOR === 1) {
            baseSpan.style.color = 'var(--text)';
            extSpan.style.color = typeColor;
        } else if (FILE_EXTENSION_COLOR === 2) {
            baseSpan.style.color = typeColor;
            extSpan.style.color = typeColor;
        } else {
            baseSpan.style.color = 'var(--text)';
            extSpan.style.color = 'var(--text)';
        }

        link.appendChild(baseSpan);
        link.appendChild(extSpan);
    } else {
        if (item.name === 'return') {
            link.style.color = 'var(--text)';
        } else if (FILE_EXTENSION_COLOR === 2 && item.isDirectory) {
            link.style.color = typeColor;
        }
        link.textContent = item.name;
    }

    link.addEventListener('click', (e) => {
        e.preventDefault();
        hidePreview();

        if (isFontFolderItem) {
            openFontViewer(item);
        } else if (item.isDirectory) {
            if (item.name === 'return' || item.name === '..') {
                navigateBack(item.path);
            } else {
                navigateTo(item.path);
            }
        } else if (isImage || isVideo) {
            openLightbox(item);
        } else if (isText) {
            openReader(item);
        } else {
            downloadFile(item);
        }
    });

    if (isImage || isFont) {
        link.addEventListener('mouseenter', (e) => showPreview(item, e, isFont));
        link.addEventListener('mouseleave', hidePreview);
        link.addEventListener('mousemove', updatePreviewPosition);
    }

    nameCell.appendChild(indicator);
    nameCell.appendChild(link);
    row.appendChild(nameCell);

    const sizeCell = document.createElement('div');
    sizeCell.className = 'file-size';
    sizeCell.textContent = item.isDirectory ? '—' : formatSize(item.size);
    row.appendChild(sizeCell);

    const dateCell = document.createElement('div');
    dateCell.className = 'file-date';
    dateCell.textContent = item.modified ? formatDate(item.modified) : '—';
    row.appendChild(dateCell);

    return row;
}

function renderBreadcrumb(path) {
    elements.breadcrumb.innerHTML = '';

    const root = document.createElement('span');
    root.className = 'crumb' + (!path ? ' active' : '') + (ROOT_NAME === '/' ? ' no-separator' : '');
    root.textContent = ROOT_NAME;
    root.addEventListener('click', () => navigateBack(''));
    elements.breadcrumb.appendChild(root);

    if (path) {
        const parts = path.split('/').filter(Boolean);
        let accumulated = '';

        parts.forEach((part, i) => {
            accumulated += (accumulated ? '/' : '') + part;
            const crumb = document.createElement('span');
            crumb.className = 'crumb' + (i === parts.length - 1 ? ' active' : '');
            crumb.textContent = part;
            const navPath = accumulated;
            if (i < parts.length - 1) {
                crumb.addEventListener('click', () => navigateBack(navPath));
            }
            elements.breadcrumb.appendChild(crumb);
        });
    }
}

function renderStats(stats) {
    if (!stats) {
        elements.stats.textContent = '';
        return;
    }

    const parts = [];
    if (stats.folders > 0) parts.push(`${stats.folders} folder${stats.folders !== 1 ? 's' : ''}`);
    if (stats.files > 0) parts.push(`${stats.files} file${stats.files !== 1 ? 's' : ''}`);
    if (stats.totalSize > 0) parts.push(formatSize(stats.totalSize));
    elements.stats.textContent = parts.join(' · ');
}

function navigateBack(path) {
    nextDirection = 'back';
    navigateTo(path);
}

function navigateTo(path) {
    window.location.hash = path;
}

function openLightbox(item) {
    showMedia(item);
    elements.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showMedia(item) {
    const url = `${FILES_PATH}/${item.path}`;
    const isVideo = FILE_TYPES.video.includes(item.extension);

    elements.lightboxMedia.innerHTML = isVideo
        ? `<video src="${url}" controls autoplay></video>`
        : `<img src="${url}" alt="${item.name}">`;

    elements.lightboxDownload.href = url;
    elements.lightboxDownload.download = item.name;
}

function closeLightbox() {
    elements.lightbox.classList.remove('active');
    document.body.style.overflow = '';

    const video = elements.lightboxMedia.querySelector('video');
    if (video) video.pause();

    setTimeout(() => {
        elements.lightboxMedia.innerHTML = '';
    }, 250);
}

async function openReader(item) {
    const url = `${FILES_PATH}/${item.path}`;

    elements.readerTitle.textContent = item.name;
    elements.readerDownload.href = url;
    elements.readerDownload.download = item.name;
    elements.readerContent.innerHTML = '<p style="color: var(--text-muted)">Loading...</p>';
    elements.reader.classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load file');

        const text = await response.text();
        const isMarkdown = ['md', 'markdown'].includes(item.extension);

        elements.readerContent.innerHTML = isMarkdown ? parseMarkdown(text) : escapeHtml(text);
    } catch (error) {
        elements.readerContent.innerHTML = `<p style="color: #f87171">Error: ${error.message}</p>`;
    }
}

function closeReader() {
    elements.reader.classList.remove('active');
    document.body.style.overflow = '';
}

function parseMarkdown(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^---$/gm, '<hr>')
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/s, '<p>$1</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>)/g, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<pre>)/g, '$1')
        .replace(/(<\/pre>)<\/p>/g, '$1')
        .replace(/<p>(<ul>)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1')
        .replace(/<p>(<blockquote>)/g, '$1')
        .replace(/(<\/blockquote>)<\/p>/g, '$1')
        .replace(/<p>(<hr>)<\/p>/g, '$1');
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

async function showPreview(item, event, isFont = false) {
    const url = `${FILES_PATH}/${item.path}`;

    if (isFont) {
        elements.preview.innerHTML = '<div class="preview-loading">Loading font...</div>';
        elements.preview.classList.add('visible');
        updatePreviewPosition(event);

        try {
            const fontName = `preview-${item.name.replace(/[^\w]/g, '')}`;
            const font = new FontFace(fontName, `url(${url})`);
            await font.load();
            document.fonts.add(font);

            elements.preview.innerHTML = `
                <div class="preview-font" style="font-family: '${fontName}'">
                    Aa Bb Cc Dd Ee<br>
                    Ff Gg Hh Ii Jj<br>
                    1234567890
                </div>
            `;
        } catch (err) {
            elements.preview.innerHTML = '<div class="preview-loading" style="color: #f87171">Failed to load</div>';
        }
    } else {
        elements.preview.innerHTML = `<img src="${url}" alt="${item.name}">`;
    }

    elements.preview.classList.add('visible');
    updatePreviewPosition(event);
}

function hidePreview() {
    elements.preview.classList.remove('visible');
}

function updatePreviewPosition(event) {
    const padding = 16;
    const previewRect = elements.preview.getBoundingClientRect();

    let x = event.clientX + padding;
    let y = event.clientY + padding;

    if (x + previewRect.width > window.innerWidth) {
        x = event.clientX - previewRect.width - padding;
    }
    if (y + previewRect.height > window.innerHeight) {
        y = event.clientY - previewRect.height - padding;
    }

    elements.preview.style.left = `${Math.max(8, x)}px`;
    elements.preview.style.top = `${Math.max(8, y)}px`;
}

async function openFontViewer(item) {
    currentFontFolderPath = item.path;
    const displayName = item.name.replace(/\.font$/, '');
    elements.fontViewerTitle.textContent = displayName;
    elements.fontCount.textContent = 'Loading...';
    elements.fontViewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        const url = `${API_ENDPOINT}?path=${encodeURIComponent(item.path)}&t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load folder');

        const data = await response.json();

        fontFolderFonts = data.items.filter(f =>
            FILE_TYPES.font.includes(f.extension)
        );

        if (fontFolderFonts.length === 0) {
            elements.fontCount.textContent = 'No fonts found';
            return;
        }

        currentFontIndex = 0;
        elements.fontSlider.min = 0;
        elements.fontSlider.max = fontFolderFonts.length - 1;
        elements.fontSlider.value = 0;
        elements.fontCount.textContent = `${fontFolderFonts.length} style${fontFolderFonts.length !== 1 ? 's' : ''}`;

        await loadFontAndUpdate(0);

    } catch (error) {
        elements.fontCount.textContent = `Error: ${error.message}`;
    }
}

async function loadFontAndUpdate(index) {
    const fontItem = fontFolderFonts[index];
    const encodedPath = fontItem.path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const fontUrl = `${FILES_PATH}/${encodedPath}`;
    const fontName = `fontFolder-${Date.now()}-${index}`;

    let styleName = fontItem.name.replace(/\.(otf|ttf|woff|woff2)$/i, '');
    const parts = styleName.split(/[-_]/);
    if (parts.length > 1) {
        styleName = parts.slice(1).join(' ');
    }
    styleName = styleName || 'Regular';

    elements.fontStyleName.textContent = styleName;

    try {
        const font = new FontFace(fontName, `url("${fontUrl}")`);
        await font.load();
        document.fonts.add(font);

        const samples = elements.fontPreview.querySelectorAll('.font-sample, .font-sample-small, .font-sample-chars');
        samples.forEach(el => el.style.fontFamily = `'${fontName}'`);
    } catch (err) {
        console.error('Font load error:', err, fontUrl);
        elements.fontStyleName.textContent = `${styleName} (failed to load)`;
    }
}

function handleFontSlider() {
    const index = parseInt(elements.fontSlider.value, 10);
    if (index !== currentFontIndex) {
        currentFontIndex = index;
        loadFontAndUpdate(index);
    }
}

function closeFontViewer() {
    elements.fontViewer.classList.remove('active');
    document.body.style.overflow = '';
    fontFolderFonts = [];
    currentFontIndex = 0;
}

function downloadCurrentFont() {
    if (fontFolderFonts.length === 0) return;
    const fontItem = fontFolderFonts[currentFontIndex];
    const a = document.createElement('a');
    a.href = `${FILES_PATH}/${fontItem.path}`;
    a.download = fontItem.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadAllFonts() {
    if (!currentFontFolderPath) return;
    const zipUrl = `/api/zip?path=${encodeURIComponent(currentFontFolderPath)}`;
    window.location.href = zipUrl;
}

function handleKeyboard(e) {
    if (elements.lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        return;
    }

    if (elements.reader.classList.contains('active')) {
        if (e.key === 'Escape') closeReader();
        return;
    }

    if (elements.fontViewer.classList.contains('active')) {
        if (e.key === 'Escape') closeFontViewer();
        if (e.key === 'ArrowLeft' && currentFontIndex > 0) {
            elements.fontSlider.value = currentFontIndex - 1;
            handleFontSlider();
        }
        if (e.key === 'ArrowRight' && currentFontIndex < fontFolderFonts.length - 1) {
            elements.fontSlider.value = currentFontIndex + 1;
            handleFontSlider();
        }
        return;
    }
}

function downloadFile(item) {
    const a = document.createElement('a');
    a.href = `${FILES_PATH}/${item.path}`;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
