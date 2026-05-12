/**
 * BM PREMIUM v3 | WORKSPACE MODULE
 * Premium UI for Technical Archive with Glassmorphism and Advanced Animations
 */

Object.assign(BM_v2, {
    /* --- WORKSPACE / ARCHIVIO LOGIC --- */
    renderWorkspace(currentPath = []) {
        const grid = document.getElementById('ws-grid');
        const breadcrumbs = document.getElementById('ws-breadcrumbs');
        const btnBack = document.getElementById('ws-btn-back');
        const btnHome = document.getElementById('ws-btn-home');

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
                <div class="crumb-v3 ${idx === breadcrumbData.length - 1 ? 'active' : ''}" 
                      onclick="BM_v2.navigateWorkspace(${JSON.stringify(crumb.path)})">
                    ${idx > 0 ? '<i class="fas fa-chevron-right separator"></i>' : ''}
                    <span class="crumb-text">${crumb.name}</span>
                </div>
            `).join('');
        }

        // 3. Update Nav Buttons
        if (btnBack) {
            btnBack.disabled = (currentPath.length === 0);
            btnBack.onclick = () => this.goBackWorkspace();
        }
        
        if (btnHome) {
            btnHome.onclick = () => this.navigateWorkspace([]);
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

    navigateWorkspace(path) {
        this.state.currentWsPath = path;
        this.renderWorkspace(path);
    },

    renderItemsInGrid(items, grid) {
        if (!items || items.length === 0) {
            grid.innerHTML = '<div class="empty-state-v3">NO_DATA_FOUND: CHECK_PERMISSIONS</div>';
            return;
        }

        grid.innerHTML = items.map((item, i) => {
            const glowClass = this.getFileGlowClass(item);
            const iconClass = this.getFileIconClass(item);
            const sizeStr = item.isDir ? `${item.children.length} elementi` : this.formatFileSize(item.size);
            const typeLabel = item.isDir ? 'DIRECTORY' : (item.ext ? item.ext.substring(1).toUpperCase() : 'FILE');
            
            return `
                <div class="ws-card-v3 ${glowClass}" 
                     data-name="${item.name}" 
                     style="animation-delay: ${i * 0.05}s;"
                     onclick="BM_v2.handleWsClick(this.getAttribute('data-name'))">
                    <div class="card-glint"></div>
                    <div class="ws-icon-wrapper-v3">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="ws-content-v3">
                        <div class="ws-header-v3">
                            <span class="ws-type-v3">${typeLabel}</span>
                            <span class="ws-meta-v3">${sizeStr}</span>
                        </div>
                        <div class="ws-name-v3" data-value="${item.name}">${item.name}</div>
                        <div class="ws-footer-v3">
                            <div class="ws-progress-v3">
                                <div class="ws-progress-bar-v3" style="width: ${Math.floor(Math.random() * 40) + 60}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger decryption effect
        setTimeout(() => {
            grid.querySelectorAll('.ws-name-v3').forEach(el => {
                this.animateDecryption(el, el.getAttribute('data-value'));
            });
        }, 400);
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
            // Utilizziamo la funzione centralizzata per l'apertura dei file
            this.openFile(item.path, item.ext, item.name);
        }
    },

    getFileGlowClass(item) {
        if (item.isDir) return 'glow-folder';
        const ext = item.ext ? item.ext.toLowerCase() : '';
        if (ext === '.pdf') return 'glow-pdf';
        if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') return 'glow-excel';
        if (ext === '.docx' || ext === '.doc') return 'fas fa-file-word';
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
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    animateDecryption(el, finalValue) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%#!?";
        let iteration = 0;
        const interval = setInterval(() => {
            el.textContent = finalValue.split("")
                .map((char, index) => {
                    if (index < iteration) return finalValue[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");

            if (iteration >= finalValue.length) clearInterval(interval);
            iteration += 1 / 2;
        }, 20);
    }
});
