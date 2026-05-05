/**
 * BM PREMIUM v3 | CORE LOGIC ADAPTER
 * Adapting legacy data logic to Stitch Command Center UI
 */

var BM_v2 = {
    // Esportazione immediata per sottomoduli
    _initGlobal() { /* Handled automatically by var */ },

    state: {
        currentView: 'home',
        selectedSite: null,
        isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        isDarkMode: true,
        currentWsPath: [], // Percorso corrente nell'archivio
        calDate: new Date(), // Inizializzatore per la Timeline Matrix
        matrixView: 'week', // 'week' o 'month'
        filters: { // Per la vista Matrix
            sites: [],
            systems: []
        }
    },

    init() {
        try {
            this._initGlobal();
            console.log("🚀 BM_v3: Inizio Inizializzazione...");
            this.cacheDOM();
            console.log("✅ DOM Cached");
            this.prepareData();
            console.log("✅ Data Prepared");
            this.populateRecentDocs();
            this.charts = {};
            this.bindEvents();
            console.log("✅ Events Bound");
            this.renderSiteList();
            this.updateGlobalStats();
            this.initMainChart();
            this.initTheme();
            console.log("✅ Modules Initialized. Switching to Home...");

            // Finalize start: Auto-switch to home
            setTimeout(() => {
                console.log("⚡ Triggering Auto-Switch to Home");
                this.switchView('home');
            }, 300);
        } catch (e) {
            console.error("❌ CRITICAL ERROR DURING INIT:", e);
        }
    },

    populateRecentDocs(targetId = 'recent-docs') {
        const recentDocsEl = document.getElementById(targetId);
        if (!recentDocsEl || !window.workspaceDataLocal) return;

        const allFiles = [];
        const traverse = (nodes) => {
            nodes.forEach(n => {
                if (n.isDir) {
                    if (n.children) traverse(n.children);
                } else {
                    if (n.mtime) allFiles.push(n);
                }
            });
        };
        traverse(window.workspaceDataLocal);

        // Sort desc per mtime
        allFiles.sort((a, b) => b.mtime - a.mtime);
        const limit = targetId === 'recent-docs-home' ? 3 : 5;
        const top = allFiles.slice(0, limit);

        if (top.length === 0) {
            recentDocsEl.innerHTML = `<div class="empty-state">Monitoraggio in tempo reale attivo...<br><span style="font-size: 10px; opacity: 0.5;">(Attendi Sincronizzazione)</span></div>`;
            return;
        }

        let html = '';
        top.forEach(file => {
            const dateObj = new Date(file.mtime);
            const dateStr = dateObj.toLocaleDateString('it-IT') + ' ' + dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            let icon = 'fa-file';
            let color = '#8b90a0';
            if (file.ext === '.pdf') { icon = 'fa-file-pdf'; color = '#ef4444'; }
            else if (file.ext === '.xlsx') { icon = 'fa-file-excel'; color = '#22c55e'; }
            else if (file.ext === '.docx' || file.ext === '.doc') { icon = 'fa-file-word'; color = '#3b82f6'; }

            let safePath = file.path.startsWith('../') ? file.path.substring(2) : file.path;
            if (!safePath.startsWith('/')) safePath = '/' + safePath;

            const isHome = targetId === 'recent-docs-home';

            html += `
            <div class="doc-item" style="display: flex; justify-content: space-between; align-items: center; padding: ${isHome ? '6px 8px' : '10px'}; border-bottom: 1px solid rgba(255,255,255,0.05); cursor:pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(0, 218, 243, 0.05)'" onmouseout="this.style.background='transparent'" onclick="BM_v2.openFile('${safePath}', '${file.ext}', '${file.name}')">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${icon}" style="color: ${color}; font-size: ${isHome ? '13px' : '16px'};"></i>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: ${isHome ? '11px' : '13px'}; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: ${isHome ? '120px' : '150px'};">${file.name}</span>
                        <span style="font-size: 9px; color: var(--text-muted);">${dateStr}</span>
                    </div>
                </div>
                <i class="fas fa-external-link-alt" style="font-size: 9px; color: #00daf3; opacity: 0.5;"></i>
            </div>`;
        });

        recentDocsEl.innerHTML = html;

        // Define global open helper if missing
        if (!this.openFile) {
            this.openFile = function (path, ext, name) {
                console.log('[OpenFile] path:', path, 'ext:', ext);
                if (ext && ext.toLowerCase() === '.xlsx') {
                    this.openExcel(path, name);
                } else if (ext && ext.toLowerCase() === '.pdf') {
                    // Per PDF, usa l'URL assoluta con encoding
                    const encodedPath = encodeURI(path);
                    window.open(encodedPath, '_blank');
                } else {
                    window.open(path, '_blank');
                }
            }.bind(this);
        }
    },

    populateRecentDocsHome() {
        this.populateRecentDocs('recent-docs-home');
    },

    initMainChart() {
        const ctx = document.getElementById('main-performance-chart');
        if (!ctx) return;

        if (typeof Chart === 'undefined') {
            console.warn("⚠️ Chart.js non disponibile.");
            return;
        }

        // Home Chart logic: simple distribution
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Conformi', 'Anomalie'],
                datasets: [{
                    data: [94.2, 5.8],
                    backgroundColor: [this.state.isDarkMode ? '#00daf3' : '#0077b6', 'rgba(255, 77, 77, 0.2)'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    async triggerSync() {
        const btn = document.getElementById('btn-live-sync');
        if (!btn) return;

        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Scansione Disco...`;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';

        try {
            const response = await fetch('/api/sync', { method: 'POST' });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error("Sync Failed: " + errText);
            }

            btn.innerHTML = `<i class="fas fa-check" style="color: #4ade80;"></i> Database Aggiornato`;
            btn.style.borderColor = '#4ade80';

            setTimeout(() => {
                window.location.reload();
            }, 800);

        } catch (error) {
            console.error("Errore Sincronizzazione Live:", error);
            btn.innerHTML = `<i class="fas fa-times" style="color: #ef4444;"></i> Errore OS`;
            btn.style.borderColor = '#ef4444';

            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.style.borderColor = '';
            }, 4000);
        }
    },

    prepareData() {
        // Handle environment
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.state.isLocal = isLocal;

        // Group maintenanceData into sites (presidi)
        if (typeof maintenanceData === 'undefined') {
            console.error("maintenanceData not found! Ensure data.js is loaded.");
            return;
        }

        const sites = {};
        maintenanceData.forEach(row => {
            if (!sites[row.ID_Sito]) {
                sites[row.ID_Sito] = {
                    id: row.ID_Sito,
                    nome: row.Nome_Sito,
                    indirizzo: row.Indirizzo,
                    tasks: [],
                    total: 0,
                    urgentCount: 0
                };
            }
            sites[row.ID_Sito].tasks.push(row);
            sites[row.ID_Sito].total++;
            if (row.Urgency === 'Urgent' || row.Urgency === 'Overdue') {
                sites[row.ID_Sito].urgentCount++;
            }
        });

        // Convert to sorted array
        this.state.sites = Object.values(sites).sort((a, b) => parseInt(a.id) - parseInt(b.id));
        console.log(`Data prepared: ${this.state.sites.length} sites mapped.`);
    },

    cacheDOM() {
        this.dom = {
            sidebar: document.getElementById('sidebar'),
            navItems: document.querySelectorAll('.nav-item'),
            viewPanes: document.querySelectorAll('.view-pane'),
            siteList: document.getElementById('presidi-list'),
            siteSearch: document.getElementById('site-search'),
            stats: {
                total: document.getElementById('stat-total'),
                compliance: document.getElementById('stat-compliance'),
                urgent: document.getElementById('stat-urgent'),
                compFill: document.getElementById('compliance-fill'),
                globalPerc: document.getElementById('global-perc')
            },
            currentTitle: document.getElementById('view-title'),
            themeBtn: document.getElementById('theme-btn'),
            drawer: document.getElementById('profile-drawer'),
            backdrop: document.getElementById('drawer-backdrop'),
            telemetry: {
                health: document.getElementById('kpi-health'),
                urgencies: document.getElementById('kpi-urgencies'),
                compliance: document.getElementById('kpi-compliance'),
                pulse: document.getElementById('pulse-feed')
            }
        };
    },

    bindEvents() {
        // Navigation logic
        this.dom.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                if (view) this.switchView(view);
            });
        });

        // Search logic
        if (this.dom.siteSearch) {
            this.dom.siteSearch.addEventListener('input', (e) => this.filterSites(e.target.value));
        }

        // Theme toggle
        if (this.dom.themeBtn) {
            this.dom.themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // AI Command Center
        const aiBtn = document.getElementById('btn-ai-center');
        if (aiBtn) {
            aiBtn.addEventListener('click', () => this.toggleAiCenter());
        }

        // Matrix Site Search
        const matrixSearch = document.getElementById('matrix-site-search');
        if (matrixSearch) {
            matrixSearch.addEventListener('input', (e) => {
                if (this.populateMatrixFilters) this.populateMatrixFilters(e.target.value);
            });
        }

        const matrixTaskSearch = document.getElementById('matrix-task-search');
        if (matrixTaskSearch) {
            matrixTaskSearch.addEventListener('input', () => {
                if (this.renderPlanningMatrix) this.renderPlanningMatrix();
            });
        }

        // Matrix Navigation
        const matrixPrev = document.querySelector('.matrix-timeline-nav button:first-child');
        const matrixNext = document.querySelector('.matrix-timeline-nav button:last-child');
        if (matrixPrev) matrixPrev.addEventListener('click', () => this.prevTimeline && this.prevTimeline());
        if (matrixNext) matrixNext.addEventListener('click', () => this.nextTimeline && this.nextTimeline());

        // Matrix View Toggles
        document.querySelectorAll('.matrix-view-toggle button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.textContent.toLowerCase().includes('mese') ? 'month' : 'week';
                if (this.switchMatrixView) this.switchMatrixView(type);
            });
        });

        // Backdrop click to close drawer
        if (this.dom.backdrop) {
            this.dom.backdrop.addEventListener('click', () => this.deselectSite());
        }
    },

    renderSiteList() {
        if (!this.dom.siteList || !this.state.sites) return;

        this.dom.siteList.innerHTML = this.state.sites.map(site => {
            const urgencyClass = site.urgentCount > 3 ? 'urgent-critical' : (site.urgentCount > 0 ? 'urgent-warning' : '');
            return `
                <div class="site-item ${urgencyClass}" data-id="${site.id}" onclick="BM_v2.selectSite('${site.id}')">
                    <div class="site-id">${site.id}</div>
                    <div class="site-details">
                        <span class="site-name">${site.nome}</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="site-urgency">${site.total} Attività</span>
                            <canvas id="sparkline-${site.id}" width="50" height="15" style="opacity:0.6;"></canvas>
                        </div>
                    </div>
                    ${site.urgentCount > 0 ? `<div class="urgent-badge-v3">${site.urgentCount}</div>` : '<div class="pulse-badge"></div>'}
                </div>
            `;
        }).join('');

        setTimeout(() => this.drawAllSparklines(), 100);
    },

    drawAllSparklines() {
        this.state.sites.forEach(site => {
            const canvas = document.getElementById(`sparkline-${site.id}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            // Generiamo un trend finto basato sull'urgenza per realismo visivo
            const base = 80 + Math.random() * 20;
            const trend = [base, base - 5, base + 2, base - 10, 100 - (site.urgentCount * 10)];

            this.drawMiniChart(ctx, trend, site.urgentCount > 0 ? '#ff4d4d' : '#00daf3');
        });
    },

    drawMiniChart(ctx, data, color) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';

        const step = w / (data.length - 1);
        data.forEach((val, i) => {
            const x = i * step;
            const y = h - (val / 100 * h);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    },

    selectSite(id) {
        const site = this.state.sites.find(s => s.id === id);
        if (!site) return;

        this.state.selectedSite = site;

        // Update active class in list
        document.querySelectorAll('.site-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.site-item[data-id="${id}"]`);
        if (activeItem) activeItem.classList.add('active');

        // Open Drawer
        this.renderSiteDetail(site);
        this.dom.drawer.classList.add('open');
        this.dom.backdrop.classList.add('active');
    },

    deselectSite() {
        this.state.selectedSite = null;
        document.querySelectorAll('.site-item').forEach(el => el.classList.remove('active'));
        this.dom.drawer.classList.remove('open');
        this.dom.backdrop.classList.remove('active');
    },

    renderSiteDetail(site) {
        this.dom.drawer.innerHTML = `
            <div class="drawer-header">
                <button class="close-drawer" onclick="BM_v2.deselectSite()"><i class="fas fa-times"></i></button>
                <div class="drawer-id">ID: ${site.id}</div>
                <h2 class="drawer-title">${site.nome}</h2>
                <div class="site-urgency" style="margin-top: 4px;">${site.tasks.length} Attività Pianificate</div>
            </div>
            <div class="drawer-content custom-scrollbar">
                <div class="detail-table-container">
                    <table class="v2-table">
                        <thead>
                            <tr>
                                <th>Sistema</th>
                                <th>Attività</th>
                                <th>Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${site.tasks.map(task => `
                                <tr class="v2-row">
                                    <td style="width: 80px;"><span class="system-tag">${task.Tipologia_Impianto || 'HVAC'}</span></td>
                                    <td>
                                        <div style="font-weight: 600;">${task.Attivita}</div>
                                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                                            Frequenza: ${task.Frequenza || 'N/D'}
                                            <button class="v2-info-btn" onclick="BM_v2.showAriaPanel('${(task.Sottocategoria || '').replace(/'/g, "\\'").replace(/[\\.\\s]+$/, '')}')">
                                                <i class="fas fa-info-circle"></i> Info
                                            </button>
                                        </div>
                                    </td>
                                    <td style="width: 100px;">
                                        <span class="status-indicator ${this.checkTaskStatus(task) ? 'status-ok' : 'status-missing'}">
                                            ${this.checkTaskStatus(task) ? 'Conforme' : 'Mancante'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },



    parseAriaCode(code) {
        const clean = code.replace(/^[-,\s]+/, '').trim();
        const parts = clean.split('.');
        if (parts.length >= 3) {
            return {
                base: parts.slice(0, 2).join('.'),
                activity: parseInt(parts[2], 10)
            };
        }
        return { base: clean, activity: null };
    },

    showAriaPanel(category) {
        console.log('DEBUG showAriaPanel called with:', category, 'type:', typeof category);

        // Check if category is empty
        if (!category || category.trim() === '') {
            console.log('DEBUG: category is empty');

            // Get current site from state to show all available tasks
            const currentSite = this.state.selectedSite;
            console.log('DEBUG: current site:', currentSite);
            console.log('DEBUG: available sites:', this.state.sites?.slice(0, 3));

            // Show all available ARIA codes from data
            const modal = document.getElementById('aria-modal');
            const body = document.getElementById('aria-modal-body');
            const title = document.getElementById('aria-modal-title');

            if (modal && body) {
                title.innerText = 'Catalogo ARIA Disponibile';
                // Show available ARIA codes from the data
                const availableCodes = Object.keys(window.ARIA_FULL_DATA?.sheets || {}).slice(0, 20);
                body.innerHTML = `
                    <div style="padding:15px;">
                        <p style="color:#666; margin-bottom:15px;">Nessun codice specifico per questo task. Ecco i codici ARIA disponibili:</p>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                            ${availableCodes.map(code => `
                                <button class="v2-info-btn" style="padding:8px 12px;" onclick="BM_v2.showAriaPanel('${code}')">${code}</button>
                            `).join('')}
                        </div>
                        <p style="margin-top:15px; font-size:12px; color:#999;">Total: ${Object.keys(window.ARIA_FULL_DATA?.sheets || {}).length} codici</p>
                    </div>
                `;
                modal.classList.add('visible');
            }
            return;
        }

        if (typeof ARIA_FULL_DATA === 'undefined') {
            console.error('DEBUG: ARIA_FULL_DATA is undefined! Loading script...');
            const script = document.createElement('script');
            script.src = 'aria_full_data.js';
            script.onload = () => {
                console.log('ARIA_FULL_DATA loaded');
                this.showAriaPanel(category);
            };
            document.head.appendChild(script);
            return;
        }

        const rawCodes = category.split(/[-,\s]+/).map(c => c.trim()).filter(c => c.length > 0);
        console.log('DEBUG rawCodes:', rawCodes);

        const modal = document.getElementById('aria-modal');
        const body = document.getElementById('aria-modal-body');

        let combinedData = [];
        let foundCodes = [];

        const specialMappings = {
            'G1': 'G1.06.04'
        };

        rawCodes.forEach(rawCode => {
            let currentCode = specialMappings[rawCode] || rawCode;

            // CASO RANGE EXTRACTION (C2 -> C6, C6 -> C7)
            if (currentCode === 'C2' || currentCode === 'C6') {
                const startRange = currentCode;
                // Se è C2, prendiamo tutto fino a C6 (escluso) per includere C4 e C5
                const endRange = currentCode === 'C2' ? 'C6' : 'C7';

                const keys = Object.keys(ARIA_FULL_DATA.sheets).sort();
                let rangeItems = [];

                keys.forEach(k => {
                    if (k >= startRange && k < endRange) {
                        ARIA_FULL_DATA.sheets[k].forEach(item => {
                            const isDup = rangeItems.some(ex =>
                                ex.Codice_C === item.Codice_C &&
                                ex.Sottocodice_E === item.Sottocodice_E &&
                                ex.Descrizione === item.Descrizione
                            );
                            if (!isDup) rangeItems.push(item);
                        });
                    }
                });

                if (rangeItems.length > 0) {
                    combinedData.push({
                        original: rawCode,
                        code: `${startRange}-${endRange}`,
                        activity: null,
                        items: rangeItems
                    });
                    foundCodes.push(rawCode);
                }
                return;
            }

            // 1. Prova match esatto (es. G2.01.01)
            if (ARIA_FULL_DATA.sheets[currentCode]) {
                combinedData.push({
                    original: rawCode,
                    code: currentCode,
                    activity: null,
                    items: ARIA_FULL_DATA.sheets[currentCode]
                });
                foundCodes.push(rawCode);
                return;
            }

            // 2. Prova scomposizione chirurgica (B2.07.05)
            const parsed = this.parseAriaCode(currentCode);
            const sheetData = ARIA_FULL_DATA.sheets[parsed.base];

            if (sheetData) {
                let filteredItems = sheetData;
                if (parsed.activity !== null) {
                    filteredItems = sheetData.filter(item =>
                        item.Codice_D === parsed.activity || item.Codice_D === "" || item.Codice_D === `0${parsed.activity}`
                    );
                }
                combinedData.push({
                    original: rawCode,
                    code: parsed.base,
                    activity: parsed.activity,
                    items: filteredItems
                });
                foundCodes.push(rawCode);
            }
        });

        if (combinedData.length === 0) {
            alert(`Nessun dato tecnico trovato per: ${rawCodes.join(', ')}`);
            return;
        }

        let html = `
            <div class="aria-header">
                <div class="drawer-id">Rapporto Tecnico Reale</div>
                <h3 class="drawer-title" style="font-size: 18px;">Specifiche: ${foundCodes.join(' | ')}</h3>
                
                <div class="aria-filter-bar custom-scrollbar">
                    <button class="filter-tab active" data-filter="all" onclick="BM_v2.filterAriaContent('all')">TUTTI</button>
                    ${foundCodes.map(code => `
                        <button class="filter-tab" data-filter="${code}" onclick="BM_v2.filterAriaContent('${code}')">${code}</button>
                    `).join('')}
                </div>
            </div>
            <div class="aria-scroll custom-scrollbar">
                ${combinedData.map(group => `
                    <div class="aria-content-group" data-code="${group.original}">
                        <div class="aria-group-divider">SCHEDA TECNICA ${group.original}</div>
                        ${group.items.map(item => `
                            <div class="aria-item ${item.Codice_D === "" ? 'aria-category' : ''}">
                                <div class="aria-desc">${item.Descrizione}</div>
                                ${item.Frequenza ? `<div class="aria-freq"><i class="fas fa-clock"></i> ${item.Frequenza}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;

        body.innerHTML = html;
        modal.classList.add('visible');
    },

    filterAriaContent(code) {
        // Toggle Active Tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-filter') === code);
        });

        // Filter Visibility
        document.querySelectorAll('.aria-content-group').forEach(group => {
            if (code === 'all' || group.getAttribute('data-code') === code) {
                group.style.display = 'block';
            } else {
                group.style.display = 'none';
            }
        });
    },

    closeAriaModal() {
        document.getElementById('aria-modal').classList.remove('visible');
    },


    checkTaskStatus(task) {
        // Simple logic: if Stato_Documentale is 'OK', return true.
        return task.Stato_Documentale === 'OK';
    },

    filterSites(query) {
        const normalizedQuery = query.toLowerCase();
        const items = document.querySelectorAll('.site-item');

        items.forEach(item => {
            const name = item.querySelector('.site-name').textContent.toLowerCase();
            const id = item.querySelector('.site-id').textContent;
            if (name.includes(normalizedQuery) || id.includes(normalizedQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    },

    switchView(viewId) {
        console.log(`Switching view to: ${viewId}`);
        this.state.currentView = viewId;

        // 1. Update Sidebar UI
        if (this.dom.navItems) {
            this.dom.navItems.forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-view') === viewId);
            });
        }

        // 2. Update Viewport Panes
        if (this.dom.viewPanes) {
            this.dom.viewPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `view-${viewId}`) {
                    pane.classList.add('active');
                }
            });
        }

        // 3. Reset Scroll & Breadcrumb
        const viewport = document.querySelector('.view-viewport');
        if (viewport) viewport.scrollTop = 0;

        if (this.dom.currentTitle) {
            const viewNames = {
                'home': 'Home Dashboard',
                'dashboard': 'Mission Control',
                'workspace': 'Archivio Documentale',
                'map': 'Mappa Hub',
                'charts': 'Osservatorio Cinetico',
                'calendar': 'Pianificazione Matrix',
                'reports': 'Report & Analisi'
            };
            this.dom.currentTitle.textContent = viewNames[viewId] || (viewId.charAt(0).toUpperCase() + viewId.slice(1));
        }

        // Conditional view init (manteniamo i ritardi per caricamento moduli pesanti)
        if (viewId === 'dashboard') {
            this.updateGlobalStats();
            this.initMainChart();
        } else if (viewId === 'home') {
            this.renderHome();
        } else if (viewId === 'workspace') {
            this.state.currentWsPath = [];
            this.renderWorkspace(this.state.currentWsPath);
        } else if (viewId === 'map') {
            setTimeout(() => {
                this.initMap();
                if (this.map) this.map.invalidateSize();
            }, 100);
        } else if (viewId === 'charts') {
            setTimeout(() => {
                this.initTelemetryCharts();
            }, 100);
        } else if (viewId === 'calendar') {
            setTimeout(() => {
                this.initCalendarView();
            }, 100);
        } else if (viewId === 'reports') {
            setTimeout(() => {
                if (this.initReportsModule) this.initReportsModule();
            }, 100);
        }
    },

    // --- TELEMETRY / CHARTS LOGIC RELOCATED TO charts_module.js ---


    toggleTheme() {
        this.state.isDarkMode = !this.state.isDarkMode;
        document.body.classList.toggle('light-theme', !this.state.isDarkMode);

        // Salvataggio preferenza
        localStorage.setItem('bm-theme', this.state.isDarkMode ? 'dark' : 'light');

        // Aggiornamento Icona
        if (this.dom.themeBtn) {
            this.dom.themeBtn.innerHTML = this.state.isDarkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }

        console.log(`Theme switched to: ${this.state.isDarkMode ? 'DARK' : 'LIGHT'}`);

        // Refresh chart colors
        this.initMainChart();
        if (this.state.currentView === 'charts') this.initTelemetryCharts();
        if (this.state.currentView === 'calendar') this.renderPlanningMatrix();

        // Refresh Map if active
        if (this.map) {
            this.map.eachLayer(layer => {
                if (layer instanceof L.TileLayer) this.map.removeLayer(layer);
            });
            const tileUrl = this.state.isDarkMode
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(this.map);

            // Re-render markers with new theme colors
            this.renderMapMarkers();
        }
    },

    initTheme() {
        // 1. Controlla localStorage
        const savedTheme = localStorage.getItem('bm-theme');

        // 2. Controlla preferenza sistema
        const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

        let shouldBeDark = true;
        if (savedTheme) {
            shouldBeDark = (savedTheme === 'dark');
        } else if (systemPrefersLight) {
            shouldBeDark = false;
        }

        this.state.isDarkMode = shouldBeDark;
        document.body.classList.toggle('light-theme', !shouldBeDark);

        // Imposta stato iniziale bottone
        if (this.dom.themeBtn) {
            this.dom.themeBtn.innerHTML = shouldBeDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }

        // Forza ricaricamento grafici dopo un breve delay per adattare i colori (opzionale)
        if (!shouldBeDark) console.log("System initialized in LIGHT MODE");
    },



    // --- MAP HUB LOGIC RELOCATED TO map_module.js ---




    // --- WORKSPACE / ARCHIVIO LOGIC RELOCATED TO workspace_module.js ---




    // --- MATRIX MODULE RELOCATED TO matrix_module.js ---

    // --- ARIA DETAILS MODULE ---
    ariaRegistryCache: null,

    normalizeAriaCode(c) {
        if (!c) return "";
        let s = c.toString().trim().toUpperCase();
        s = s.replace(/[\.\s,;!]+$/, '');
        s = s.replace(/\s+/g, '');
        return s;
    },

    async loadAriaFromExcel() {
        if (this.ariaRegistryCache) return this.ariaRegistryCache;

        try {
            if (!window.ARIA_FULL_DATA || !window.ARIA_FULL_DATA.sheets) {
                console.warn("⚠️ Database ARIA non trovato.");
                return null;
            }

            const registry = {};
            const sheets = window.ARIA_FULL_DATA.sheets;

            Object.keys(sheets).forEach(sheetName => {
                const jsonData = sheets[sheetName];
                const normCat = this.normalizeAriaCode(sheetName);

                if (!registry[normCat]) {
                    registry[normCat] = { sezioni: [], rawName: sheetName };
                }

                jsonData.forEach(row => {
                    const opId = (row.Sottocodice_E || "").toString().trim();
                    const subD = (row.Codice_D || "").toString().trim();
                    const desc = (row.Descrizione || "").toString().trim();
                    const freq = (row.Frequenza || "").toString().trim();
                    const note = (row.Nota_N || "").toString().trim();
                    const isHeader = !opId;

                    registry[normCat].sezioni.push({
                        id: opId,
                        desc: desc,
                        freq: freq || "N/D",
                        note: note,
                        isHeader: isHeader,
                        colD: subD
                    });
                });
            });

            this.ariaRegistryCache = registry;
            console.log(`🚀 ARIA caricato: ${Object.keys(registry).length} codici.`);
            return registry;
        } catch (e) {
            console.error("Errore caricamento ARIA:", e);
            return null;
        }
    },

    closeAriaModal() {
        const ariaModal = document.getElementById('aria-modal');
        const ariaOverlay = document.querySelector('.aria-modal-overlay');
        if (ariaModal) {
            ariaModal.classList.remove('visible');
            ariaModal.style.display = 'none';
        }
        if (ariaOverlay) {
            ariaOverlay.classList.remove('visible');
            ariaOverlay.style.display = 'none';
        }
    },

    async showAriaDetails(rawCodes) {
        const ariaModal = document.getElementById('aria-modal');
        const ariaOverlay = document.querySelector('.aria-modal-overlay');
        const modalBody = document.getElementById('aria-modal-body');
        const modalTitle = document.getElementById('aria-modal-title');

        if (!ariaModal || !modalBody) {
            console.error("ARIA modal elements not found");
            return;
        }

        modalBody.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Caricamento database ARIA...</div>';

        const ariaRegistry = await this.loadAriaFromExcel();
        if (!ariaRegistry) {
            modalBody.innerHTML = '<div style="text-align:center; color: #e53e3e;">Impossibile caricare il database ARIA.</div>';
            return;
        }

        const codes = rawCodes.split(/[-,\s/]+/)
            .filter(c => c.length >= 4)
            .map(c => c.trim().replace(/[\.\s,;!]+$/, ''));

        modalBody.innerHTML = '';

        if (codes.length === 0) {
            modalBody.innerHTML = '<div style="text-align:center">Nessun dettaglio ARIA disponibile.</div>';
        } else {
            // Create tabs
            codes.forEach((code, idx) => {
                this.renderAriaSection(code, ariaRegistry, idx === 0);
            });

            // Show first code
            this.renderAriaSection(codes[0], ariaRegistry, true);
        }

        ariaModal.style.display = 'flex';
        if (ariaOverlay) ariaOverlay.style.display = 'block';
        setTimeout(() => {
            ariaModal.classList.add('active');
            if (ariaOverlay) ariaOverlay.classList.add('active');
        }, 10);
    },

    renderAriaSection(code, ariaRegistry, isActive = true) {
        const modalBody = document.getElementById('aria-modal-body');
        const modalTitle = document.getElementById('aria-modal-title');

        if (!modalBody) return;

        modalBody.innerHTML = '';
        modalTitle.innerText = `Checklist ARIA - ${code}`;

        let normRequest = this.normalizeAriaCode(code);
        let data = ariaRegistry[normRequest];

        // Fallback logic
        if (!data && normRequest.includes('.')) {
            const parts = normRequest.split('.');
            if (parts.length > 2) {
                const fallbackCode = parts.slice(0, 2).join('.');
                console.log(`Fallback ARIA: ${normRequest} -> ${fallbackCode}`);
                data = ariaRegistry[fallbackCode];
            }
        }

        if (data && data.sezioni) {
            let currentGroupD = null;

            data.sezioni.forEach(op => {
                const subGroup = (op.colD || "").toString().trim();
                if (subGroup && subGroup !== currentGroupD && !op.isHeader) {
                    currentGroupD = subGroup;
                    const groupDiv = document.createElement('div');
                    groupDiv.style.cssText = 'padding:12px 24px; font-weight:800; background:#2d3748; color:white;';
                    groupDiv.innerText = `Sottogruppo: ${currentGroupD}`;
                    modalBody.appendChild(groupDiv);
                }

                const item = document.createElement('div');
                item.style.cssText = 'display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;';

                if (op.isHeader) {
                    item.style.cssText = 'padding:12px 24px; font-weight:800; background:#4a5568; color:white;';
                    item.innerText = op.desc;
                } else {
                    const freqString = (op.freq || "").toLowerCase();
                    let badgeClass = 'badge-none';

                    if (freqString.includes("mensile") || freqString.includes("trimestrale") || freqString.includes("semestrale")) {
                        badgeClass = 'background:#48bb78; color:white; padding:2px 8px; border-radius:4px;';
                    } else if (freqString.includes("annuale") || freqString.includes("biennale")) {
                        badgeClass = 'background:#ed8936; color:white; padding:2px 8px; border-radius:4px;';
                    } else if (freqString.includes("occorrenza")) {
                        badgeClass = 'background:#a0aec0; color:white; padding:2px 8px; border-radius:4px;';
                    }

                    item.innerHTML = `
                        <span style="font-weight:700; color:#3182ce;">${op.id || '-'}</span>
                        <span style="font-size:14px;">${op.desc}</span>
                        <span style="${badgeClass}">${op.freq || 'N/D'}</span>
                    `;
                }
                modalBody.appendChild(item);
            });
        } else {
            modalBody.innerHTML = `<div style="text-align:center; padding: 20px;">Dettagli non trovati per il codice <strong>${code}</strong>.</div>`;
        }
    }
};

// Esportazione globale per consentire l'accesso ai sottomoduli (es. matrix_module, charts_module)
window.BM_v2 = BM_v2;

// Global wrapper for onclick events
window.showAriaDetails = function (rawCodes) {
    BM_v2.showAriaDetails(rawCodes);
};

window.closeAriaModal = function () {
    BM_v2.closeAriaModal();
};

document.addEventListener('DOMContentLoaded', () => BM_v2.init());
