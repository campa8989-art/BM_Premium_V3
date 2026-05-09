/**
 * BM PREMIUM v2 | WORKSPACE MODULE
 * Logic for Technical Archive, File System Navigation, and Excel Editing
 */

Object.assign(BM_v2, {
    /* --- WORKSPACE / ARCHIVIO LOGIC --- */
    renderWorkspace(currentPath = []) {
        const grid = document.getElementById('ws-grid');
        const breadcrumbs = document.getElementById('ws-breadcrumbs');
        const btnBack = document.getElementById('ws-btn-back');

        if (!grid) return;
        if (!window.workspaceDataLocal) {
            console.error("workspaceDataLocal non caricato.");
            return;
        }

        // 1. Resolve current directory
        let currentDir = window.workspaceDataLocal;
        const breadcrumbData = [{ name: 'Home', path: [] }];

        currentPath.forEach((step, index) => {
            const found = currentDir.find(item => item.name === step);
            if (found && found.children) {
                currentDir = found.children;
                breadcrumbData.push({
                    name: step,
                    path: currentPath.slice(0, index + 1)
                });
            }
        });

        // 2. Render Breadcrumbs
        if (breadcrumbs) {
            breadcrumbs.innerHTML = breadcrumbData.map((crumb, idx) => `
                <span class="crumb ${idx === breadcrumbData.length - 1 ? 'active' : ''}" 
                      onclick="BM_v2.navigateWorkspace(${JSON.stringify(crumb.path)})">
                    ${crumb.name}
                </span>
            `).join('');
        }

        // 3. Update Nav Buttons
        if (btnBack) {
            btnBack.disabled = (currentPath.length === 0);
        }

        // 4. Render Items
        this.renderItemsInGrid(currentDir, grid);
    },

    goBackWorkspace() {
        if (this.state.currentWsPath.length > 0) {
            this.state.currentWsPath.pop();
            this.renderWorkspace(this.state.currentWsPath);
        }
    },

    renderItemsInGrid(items, grid) {
        if (!items || items.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-muted); opacity: 0.5; font-family: \'Space Grotesk\';">DATABASE_EMPTY: ACCESS_DENIED</div>';
            return;
        }

        grid.innerHTML = items.map((item, i) => {
            const glowClass = this.getFileGlowClass(item);
            const iconClass = this.getFileIconClass(item);
            const sizeStr = item.isDir ? `${item.children.length} asset` : this.formatFileSize(item.size);

            return `
                <div class="ws-card ${glowClass}" 
                     data-name="${item.name}" 
                     style="animation-delay: ${Math.min(i * 0.04, 0.8)}s;"
                     onclick="BM_v2.handleWsClick(this.getAttribute('data-name'))">
                    <i class="${iconClass}"></i>
                    <div class="ws-info">
                        <div class="ws-name" data-value="${item.name}">${item.name}</div>
                        <div class="ws-meta">${sizeStr}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger decryption effect (only in Dark Mode)
        setTimeout(() => {
            const isLight = document.body.classList.contains('light-theme');
            grid.querySelectorAll('.ws-name').forEach(el => {
                if (isLight) {
                    el.innerText = el.getAttribute('data-value');
                } else {
                    this.animateDecryption(el, el.getAttribute('data-value'));
                }
            });
        }, 300);
    },

    handleWsClick(itemName) {
        let currentDir = window.workspaceDataLocal;
        this.state.currentWsPath.forEach(step => {
            const found = currentDir.find(i => i.name === step);
            if (found && found.children) currentDir = found.children;
        });

        const item = currentDir.find(i => i.name === itemName);
        if (!item) return;

        if (item.isDir) {
            this.state.currentWsPath.push(item.name);
            this.renderWorkspace(this.state.currentWsPath);
        } else {
            let safePath = item.path.startsWith('../') ? item.path.substring(2) : item.path;
            if (!safePath.startsWith('/')) safePath = '/' + safePath;

            if (item.ext && item.ext.toLowerCase() === '.xlsx') {
                console.log("Opening Excel in app:", safePath);
                this.openExcel(safePath, item.name);
            } else {
                console.log("Opening file:", safePath);
                const encodedPath = encodeURI(safePath);
                window.open(encodedPath, '_blank');
            }
        }
    },

    async openExcel(url, filename) {
        try {
            document.getElementById('excel-modal-title').innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div><i class="fas fa-file-excel"></i> ${filename} <span id="excel-status-badge" style="font-size: 12px; margin-left: 10px; opacity: 0.6;"><i class="fas fa-spinner fa-spin"></i> Decrittazione in corso...</span></div>
                    <div style="display: flex; gap: 10px; margin-right: 20px;">
                        <button class="map-action-btn" onclick="BM_v2.openNativeExcel('${url}')">
                            <i class="fas fa-desktop"></i> Apri Nativo
                        </button>
                        <button class="map-action-btn primary" onclick="BM_v2.saveExcel('${url}')">
                            <i class="fas fa-save"></i> Salva Modifiche
                        </button>
                    </div>
                </div>`;

            document.getElementById('excel-modal-body').innerHTML = '';

            document.getElementById('excel-modal').classList.add('active');
            document.getElementById('drawer-backdrop').classList.add('active');

            const response = await fetch(url);
            if (!response.ok) throw new Error("Errore nel recupero del file Excel");
            const arrayBuffer = await response.arrayBuffer();

            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            let htmlHTML = XLSX.utils.sheet_to_html(ws, { editable: true });

            const template = document.createElement('div');
            template.innerHTML = htmlHTML;
            const table = template.querySelector('table');

            if (table) {
                table.className = "excel-viewer-table";
                table.id = "current-excel-table";
                document.getElementById('excel-modal-body').innerHTML = '';
                document.getElementById('excel-modal-body').appendChild(table);
                document.getElementById('excel-status-badge').innerHTML = `<i class="fas fa-lock-open"></i> Sbloccato e Modificabile`;
            } else {
                document.getElementById('excel-modal-body').innerHTML = '<div style="padding: 20px; color: #ef4444;">Errore: Nessun dato leggibile trovato.</div>';
                document.getElementById('excel-status-badge').innerHTML = `Errore.`;
            }

        } catch (err) {
            console.error("Excel rendering error:", err);
            document.getElementById('excel-modal-body').innerHTML = `<div style="padding: 20px; color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> Fallita apertura in-app: ${err.message}. <br><br><button class="map-action-btn primary" onclick="window.open('${url}', '_blank')" style="margin-top: 15px;">Scarica File Originale</button></div>`;
            document.getElementById('excel-modal-title').innerHTML = `<i class="fas fa-file-excel"></i> Errore di Decrittazione`;
        }
    },

    async saveExcel(url) {
        const statusBadge = document.getElementById('excel-status-badge');
        statusBadge.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Salvataggio...`;

        try {
            const table = document.getElementById('current-excel-table');
            if (!table) throw new Error("Tabella non trovata");

            const wb = XLSX.utils.table_to_book(table, { sheet: "Foglio1" });
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

            const response = await fetch('/api/save-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-File-Path': encodeURIComponent(url)
                },
                body: wbout
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error("Server error: " + errText);
            }

            statusBadge.innerHTML = `<i class="fas fa-check" style="color: #4ade80;"></i> Salvato su Disco!`;
            setTimeout(() => {
                statusBadge.innerHTML = `<i class="fas fa-lock-open"></i> Sbloccato e Modificabile`;
            }, 3000);

        } catch (err) {
            console.error("Excel save error:", err);
            statusBadge.innerHTML = `<i class="fas fa-times" style="color: #ef4444;"></i> Errore: ` + err.message;
        }
    },

    async openNativeExcel(url) {
        const statusBadge = document.getElementById('excel-status-badge');
        statusBadge.innerHTML = `<i class="fas fa-desktop"></i> Inizializzazione Ambiente OS...`;

        try {
            const response = await fetch('/api/open-native', {
                method: 'POST',
                headers: {
                    'X-File-Path': encodeURIComponent(url)
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error("Server error: " + errText);
            }

            statusBadge.innerHTML = `<i class="fas fa-check" style="color: #4ade80;"></i> Aperto in Microsoft Excel!`;
            setTimeout(() => {
                statusBadge.innerHTML = `<i class="fas fa-lock-open"></i> Sbloccato e Modificabile`;
            }, 3000);

        } catch (err) {
            console.error("Excel native open error:", err);
            statusBadge.innerHTML = `<i class="fas fa-times" style="color: #ef4444;"></i> Errore OS: ` + err.message;
        }
    },

    closeExcelModal() {
        document.getElementById('excel-modal').classList.remove('active');
        if (!document.getElementById('aria-modal').classList.contains('active')) {
            document.getElementById('drawer-backdrop').classList.remove('active');
        }
    },

    navigateWorkspace(path) {
        this.state.currentWsPath = path;
        this.renderWorkspace(path);
    },

    searchWorkspace(query) {
        const normalizedQuery = query.toLowerCase();
        const grid = document.getElementById('ws-grid');

        let currentDir = window.workspaceDataLocal;
        this.state.currentWsPath.forEach(step => {
            const found = currentDir.find(item => item.name === step);
            if (found && found.children) currentDir = found.children;
        });

        const filtered = currentDir.filter(item => item.name.toLowerCase().includes(normalizedQuery));
        this.renderItemsInGrid(filtered, grid);
    },

    animateDecryption(el, finalValue) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%#!?";
        let iteration = 0;
        const interval = setInterval(() => {
            el.innerText = finalValue.split("")
                .map((char, index) => {
                    if (index < iteration) return finalValue[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");

            if (iteration >= finalValue.length) clearInterval(interval);
            iteration += 1 / 2;
        }, 20);
    },

    getFileGlowClass(item) {
        if (item.isDir) return 'glow-folder';
        const ext = item.ext ? item.ext.toLowerCase() : '';
        if (ext === '.pdf') return 'glow-pdf';
        if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') return 'glow-excel';
        if (ext === '.docx' || ext === '.doc') return 'glow-word';
        return 'glow-generic';
    },

    getFileIconClass(item) {
        if (item.isDir) return 'fas fa-folder';
        const ext = item.ext ? item.ext.toLowerCase() : '';
        if (ext === '.pdf') return 'fas fa-file-pdf';
        if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') return 'fas fa-file-excel';
        if (ext === '.docx' || ext === '.doc') return 'fas fa-file-word';
        return 'fas fa-file-lines';
    },

    formatFileSize(bytes) {
        if (!bytes) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    populateRecentDocs(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !window.workspaceDataLocal) return;

        // Flatten file structure to find all files
        const allFiles = [];
        const flatten = (items) => {
            items.forEach(item => {
                if (item.isDir && item.children) flatten(item.children);
                else if (!item.isDir) allFiles.push(item);
            });
        };
        flatten(window.workspaceDataLocal);

        // Take first 5 files for the demo/beta
        const recent = allFiles.slice(0, 5);

        container.innerHTML = recent.map(file => {
            const iconClass = this.getFileIconClass(file);
            const date = new Date().toLocaleDateString();
            return `
                <div class="doc-item-v3" onclick="BM_v2.handleWsClick('${file.name.replace(/'/g, "\\'")}')">
                    <div class="doc-icon-v3"><i class="${iconClass}"></i></div>
                    <div class="doc-info-v3">
                        <h5>${file.name}</h5>
                        <span>Modificato ${date} · ${this.formatFileSize(file.size)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
});

