/**
 * BM PREMIUM v2 | MATRIX PLANNING MODULE
 * Logic for Kinetic Matrix, Timeline, and Task Management
 */

// Estensione dell'oggetto globale BM_v2
Object.assign(BM_v2, {
    toggleMobileMatrixFilters() {
        const sidebar = document.querySelector('.matrix-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');

            // Se aperto, aggiungi un pulsante di chiusura se non esiste
            if (sidebar.classList.contains('mobile-open') && !document.getElementById('close-matrix-mobile')) {
                const closeBtn = document.createElement('button');
                closeBtn.id = 'close-matrix-mobile';
                closeBtn.className = 'map-action-btn primary';
                closeBtn.style.margin = '20px';
                closeBtn.innerHTML = '<i class="fas fa-check"></i> Applica e Chiudi';
                closeBtn.onclick = () => sidebar.classList.remove('mobile-open');
                sidebar.appendChild(closeBtn);
            }
        }
    },

    toggleMatrixDropdown(containerId) {
        const container = containerId ? document.getElementById(containerId) : document.querySelector('.matrix-dropdown-container');
        if (container) {
            container.classList.toggle('open');
            
            // Chiudi se si clicca fuori
            if (container.classList.contains('open')) {
                const closeHandler = (e) => {
                    if (!container.contains(e.target)) {
                        container.classList.remove('open');
                        document.removeEventListener('click', closeHandler);
                    }
                };
                setTimeout(() => document.addEventListener('click', closeHandler), 10);
            }
        }
    },

    handleUpcomingClick(el) {
        const jsonStr = el.getAttribute('data-task');
        this.showTaskDetail(jsonStr);
    },
    // --- PLANNING MATRIX ENGINE (v2.3 Kinetic Observatory) ---
    initCalendarView() {
        console.log("Initializing Kinetic Matrix View...");
        this.populateMatrixFilters();
        this.renderPlanningMatrix();
    },

    populateMatrixFilters(searchQuery = null) {
        const siteContainer = document.getElementById('matrix-filter-sites');
        const systemContainer = document.getElementById('matrix-filter-systems');
        
        if (!siteContainer) {
            setTimeout(() => this.populateMatrixFilters(searchQuery), 500);
            return;
        }
        if (!systemContainer) return;

        const searchInput = document.getElementById('matrix-site-search');
        const currentQuery = searchQuery !== null ? searchQuery : (searchInput ? searchInput.value : "");

        // 0. Controllo Integrità Dati (Tabula Rasa)
        if (this.state.filters.sites.length > 0) {
            const hasCorruptedData = this.state.filters.sites.every(s => !s.nome || s.nome.includes('undefined') || s.nome.includes('Sito undefined'));
            if (hasCorruptedData) {
                console.warn("Matrix Module - Corrupted sites detected, resetting...");
                this.state.filters.sites = [];
            }
        }

        // 1. Popolamento Siti con Fallback e Retry
        if (this.state.filters.sites.length === 0) {
            const sitesSource = this.state.sites || [];
            
            // PRIORITÀ 1: Database Manutenzione (Più affidabile per i nomi)
            if (typeof maintenanceData !== 'undefined' && maintenanceData.length > 0) {
                console.log("Matrix Module - Populating from maintenanceData...");
                const uniqueSiteIds = [...new Set(maintenanceData.map(d => d.ID_Sito))];
                this.state.filters.sites = uniqueSiteIds.map(id => {
                    const sample = maintenanceData.find(d => d.ID_Sito === id);
                    return { 
                        id: String(id), 
                        nome: sample ? (sample.Nome_Sito || sample.nome || `Presidio ${id}`) : `Presidio ${id}`, 
                        enabled: true 
                    };
                });
            } 
            // PRIORITÀ 2: Dati Workspace/Mappa
            else if (sitesSource.length > 0) {
                console.log("Matrix Module - Populating from workspace source...");
                this.state.filters.sites = sitesSource.map(s => ({ 
                    id: String(s.id || s.ID_Sito), 
                    nome: s.nome || s.Nome_Sito || s.siteName || `Sito ${s.id || '??'}`, 
                    enabled: true 
                }));
            }

            // Se è ancora vuoto, ritenta con dati globali window
            if (this.state.filters.sites.length === 0) {
                // Prova a leggere direttamente dalla variabile globale
                if (typeof window.maintenanceData !== 'undefined' && window.maintenanceData.length > 0) {
                    console.log("Matrix Module - Retry using window.maintenanceData...");
                    const uniqueSiteIds = [...new Set(window.maintenanceData.map(d => d.ID_Sito))];
                    this.state.filters.sites = uniqueSiteIds.map(id => {
                        const sample = window.maintenanceData.find(d => d.ID_Sito === id);
                        return { 
                            id: String(id), 
                            nome: sample ? (sample.Nome_Sito || sample.nome || `Presidio ${id}`) : `Presidio ${id}`, 
                            enabled: true 
                        };
                    });
                }
                // Se ancora vuoto, ritenta
                if (this.state.filters.sites.length === 0) {
                    setTimeout(() => this.populateMatrixFilters(), 500);
                    siteContainer.innerHTML = '<div style="padding:10px; font-size:10px; opacity:0.5;">Inizializzazione dati...</div>';
                    return;
                }
            }
        }

        // 2. Popolamento Sistemi
        const mData = typeof maintenanceData !== 'undefined' ? maintenanceData : (typeof window.maintenanceData !== 'undefined' ? window.maintenanceData : []);
        if (this.state.filters.systems.length === 0 && mData.length > 0) {
            const systems = [...new Set(mData.map(d => d.Tipologia_Impianto).filter(s => s))];
            this.state.filters.systems = systems.map(sys => ({ id: String(sys), enabled: true }));
        }

        // Render HTML Siti
        let filteredSites = this.state.filters.sites.filter(s =>
            (s.nome || "").toLowerCase().includes(currentQuery.toLowerCase())
        );

        // Fallback: Se la ricerca non trova nulla ma i siti esistono, mostra i primi 5 (per debug) o tutti se query vuota
        if (filteredSites.length === 0 && currentQuery === "" && this.state.filters.sites.length > 0) {
            filteredSites = this.state.filters.sites;
        }

        if (filteredSites.length === 0) {
            siteContainer.innerHTML = `<div style="padding:20px; font-size:11px; opacity:0.6; text-align:center;">
                <i class="fas fa-exclamation-circle"></i> Nessun presidio trovato.
            </div>`;
        } else {
            console.log("Matrix - Rendering", filteredSites.length, "sites in dropdown");
            siteContainer.innerHTML = filteredSites.map(s => {
                const nameToDisplay = s.nome || `SITO ID: ${s.id}`;
                return `
                    <div class="dropdown-item ${s.enabled ? 'active' : ''}" 
                         onclick="BM_v2.updateMatrixFilter('sites', '${s.id}', ${!s.enabled})">
                        <div class="item-checkbox">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="item-info">
                            <span class="item-name">${nameToDisplay}</span>
                            <span class="item-id">ID: ${s.id}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Aggiorna Label Header Dropdown
        const selectedCount = this.state.filters.sites.filter(s => s.enabled).length;
        const totalCount = this.state.filters.sites.length;
        const label = document.getElementById('selected-sites-label');
        if (label) {
            if (selectedCount === totalCount) {
                label.textContent = "Tutti i Presidi";
            } else if (selectedCount === 0) {
                label.textContent = "Nessun Presidio";
            } else if (selectedCount === 1) {
                const first = this.state.filters.sites.find(s => s.enabled);
                label.textContent = first.nome;
            } else {
                label.textContent = `${selectedCount} Presidi selezionati`;
            }
        }

        // Render HTML Sistemi
        if (this.state.filters.systems.length > 0) {
            const systemQuery = (document.getElementById('matrix-system-search')?.value || "").toLowerCase();
            const filteredSystems = this.state.filters.systems.filter(sys => 
                sys.id.toLowerCase().includes(systemQuery)
            );

            systemContainer.innerHTML = filteredSystems.map(sys => {
                let icon = 'fa-wrench';
                if (sys.id.includes('HVAC')) icon = 'fa-fan';
                if (sys.id.includes('ELETTR')) icon = 'fa-bolt';
                if (sys.id.includes('IDRIC')) icon = 'fa-faucet';
                return `
                    <div class="dropdown-item ${sys.enabled ? 'active' : ''}" onclick="BM_v2.updateMatrixFilter('systems', '${sys.id}', ${!sys.enabled})">
                        <div class="item-checkbox">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="item-info">
                            <span class="item-name">${sys.id}</span>
                            <span class="item-id"><i class="fas ${icon}"></i> Sistema Tecnico</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Aggiorna Label Header Sistemi
            const selSysCount = this.state.filters.systems.filter(s => s.enabled).length;
            const totSysCount = this.state.filters.systems.length;
            const sysLabel = document.getElementById('selected-systems-label');
            if (sysLabel) {
                if (selSysCount === totSysCount) {
                    sysLabel.textContent = "Tutti i Sistemi";
                } else if (selSysCount === 0) {
                    sysLabel.textContent = "Nessun Sistema";
                } else if (selSysCount === 1) {
                    const first = this.state.filters.systems.find(s => s.enabled);
                    sysLabel.textContent = first.id;
                } else {
                    sysLabel.textContent = `${selSysCount} Sistemi selezionati`;
                }
            }
        }
    },

    updateMatrixFilter(type, id, isEnabled) {
        const list = this.state.filters[type];
        const item = list.find(i => i.id === id);
        if (item) item.enabled = isEnabled;

        // Refresh UI filtri per mostrare il cambio di stato (LED)
        this.populateMatrixFilters();
        this.renderPlanningMatrix();
    },

    toggleAllMatrixFilters(type) {
        const list = this.state.filters[type];
        if (!list || list.length === 0) return;

        // Se almeno uno è disattivato, attiva TUTTI. Se sono TUTTI attivi, disattiva TUTTI.
        const allEnabled = list.every(i => i.enabled);
        const newState = !allEnabled;
        
        list.forEach(i => i.enabled = newState);

        console.log(`Matrix - Toggling all ${type} to ${newState}`);
        this.populateMatrixFilters();
        this.renderPlanningMatrix();
    },

    navigateMatrixDate(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const isRight = btn.querySelector('.fa-chevron-right') !== null;
        const days = this.state.matrixView === 'month' ? 30 : 7;
        
        this.state.calDate.setDate(this.state.calDate.getDate() + (isRight ? days : -days));
        this.renderPlanningMatrix();
    },

    switchMatrixView(type) {
        this.state.matrixView = type;

        // Aggiorna UI bottoni
        const buttons = document.querySelectorAll('.matrix-view-toggle button');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(type.toLowerCase().substring(0, 4)));
        });

        // Se passiamo a mese, resettiamo alla data del 1Â° del mese corrente per coerenza
        if (type === 'month') {
            this.state.calDate.setDate(1);
        }

        this.renderPlanningMatrix();
    },

    renderPlanningMatrix() {
        const grid = document.getElementById('matrix-operational-grid');
        const label = document.getElementById('matrix-timeline-label');
        if (!grid || !label) return;

        const isMonth = this.state.matrixView === 'month';

        // 1. Calcolo Intervallo
        let startDate, endDate, numDays;

        if (isMonth) {
            startDate = new Date(this.state.calDate.getFullYear(), this.state.calDate.getMonth(), 1);
            endDate = new Date(this.state.calDate.getFullYear(), this.state.calDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            numDays = endDate.getDate();
        } else {
            startDate = new Date(this.state.calDate);
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
            startDate.setHours(0, 0, 0, 0);
            startDate.setDate(diff);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            numDays = 7;
        }

        // Label Formattata
        if (isMonth) {
            label.textContent = startDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();
        } else {
            const options = { day: '2-digit', month: 'long' };
            label.textContent = `${startDate.toLocaleDateString('it-IT', options)} - ${endDate.toLocaleDateString('it-IT', options)} ${endDate.getFullYear()}`;
        }

        // Aggiorna variabile CSS per il numero di colonne
        document.documentElement.style.setProperty('--matrix-cols', numDays);

        // 2. Definizione Sedi Dinamiche (Filtrate e Normalizzate)
        const enabledSiteIds = this.state.filters.sites.filter(s => s.enabled).map(s => String(s.id));
        const activeSites = this.state.sites ? this.state.sites.filter(s => enabledSiteIds.includes(String(s.id))) : [];
        const enabledSystems = this.state.filters.systems.filter(s => s.enabled).map(s => String(s.id));
        const taskSearchInput = document.getElementById('matrix-task-search');
        const taskQuery = (taskSearchInput ? taskSearchInput.value : "").toLowerCase();

        let html = `<div class="matrix-header-cell">Sito / Data</div>`;
        const colDates = [];
        for (let i = 0; i < numDays; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            colDates.push(d);
            const dayName = d.toLocaleDateString('it-IT', { weekday: isMonth ? 'narrow' : 'short' });
            const isToday = d.toDateString() === new Date().toDateString();
            html += `<div class="matrix-header-cell ${isToday ? 'today-highlight' : ''} ${isMonth ? 'month-mode' : ''}">
                ${dayName}<br>${d.getDate()}
            </div>`;
        }

        // 3. Costruzione Righe Matrix
        activeSites.forEach(site => {
            html += `
                <div class="matrix-row-header">
                    ${site.nome.length > 20 ? site.nome.substring(0, 18) + '...' : site.nome}
                    <small>${site.indirizzo}</small>
                </div>
            `;

            colDates.forEach(dayDate => {
                const dayStr = dayDate.toISOString().split('T')[0];
                const tasks = site.tasks.filter(t => {
                    const matchesSystem = enabledSystems.includes(t.Tipologia_Impianto);
                    const isPlanned = t.Planned_Dates && t.Planned_Dates.includes(dayStr);
                    const isNextDate = t.Next_Date === dayStr; // Fallback
                    const matchesQuery = !taskQuery || t.Attivita.toLowerCase().includes(taskQuery);
                    return matchesSystem && (isPlanned || isNextDate) && matchesQuery;
                });

                html += `<div class="matrix-cell ${isMonth ? 'month-mode' : ''}">`;
                tasks.forEach(t => {
                    const isUrgent = t.Urgency === 'Urgent' || t.Urgency === 'Overdue';
                    let icon = 'fa-wrench';
                    if (t.Tipologia_Impianto.includes('HVAC')) icon = 'fa-fan';
                    if (t.Tipologia_Impianto.includes('ELETTR')) icon = 'fa-bolt';
                    if (t.Tipologia_Impianto.includes('IDRIC')) icon = 'fa-faucet';

                    if (isMonth) {
                        const taskData = {
                            site: t.Nome_Sito,
                            system: t.Tipologia_Impianto,
                            activity: t.Attivita,
                            freq: t.Frequenza,
                            date: dayStr,
                            urgency: t.Urgency,
                            norm: t.Riferimento_Normativo,
                            code: t.Sottocategoria
                        };
                        const taskJson = JSON.stringify(taskData).replace(/'/g, "&apos;");

                        html += `<div class="matrix-task-dot ${isUrgent ? 'urgent' : ''}" 
                                     data-task='${taskJson}'
                                     onclick="BM_v2.showTaskDetail(this.getAttribute('data-task'))"
                                     title="${t.Attivita} (${dayStr})"
                                     style="cursor: pointer;"></div>`;
                    } else {
                        const taskData = {
                            site: t.Nome_Sito,
                            system: t.Tipologia_Impianto,
                            activity: t.Attivita,
                            freq: t.Frequenza,
                            date: dayStr,
                            urgency: t.Urgency,
                            norm: t.Riferimento_Normativo,
                            code: t.Sottocategoria
                        };
                        const taskJson = JSON.stringify(taskData).replace(/'/g, "&apos;");

                        html += `
                            <div class="m-task-pill ${isUrgent ? 'urgent' : ''}" 
                                 data-task='${taskJson}'
                                 onclick="BM_v2.showTaskDetail(this.getAttribute('data-task'))"
                                 title="${t.Attivita}"
                                 style="cursor: pointer;">
                                <i class="fas ${icon}"></i>
                                <span>${t.Attivita.substring(0, 15)}...</span>
                            </div>`;
                    }
                });
                html += `</div>`;
            });
        });

        grid.innerHTML = html;
        this.updatePlanningKPIs(startDate, endDate);
        this.updateMatrixUpcoming();
    },

    updatePlanningKPIs(start, end) {
        const enabledSystems = this.state.filters.systems.filter(s => s.enabled).map(s => s.id);
        const enabledSiteIds = this.state.filters.sites.filter(s => s.enabled).map(s => s.id);

        const tasksInRange = [];
        maintenanceData.forEach(d => {
            if (!enabledSystems.includes(d.Tipologia_Impianto) || !enabledSiteIds.includes(d.ID_Sito)) return;

            const datesToCheck = d.Planned_Dates || [d.Next_Date];
            datesToCheck.forEach(dateStr => {
                const dDate = new Date(dateStr);
                if (dDate >= start && dDate <= end) {
                    tasksInRange.push({ ...d, Active_Date: dateStr });
                }
            });
        });

        const total = tasksInRange.length;
        const critical = tasksInRange.filter(d => d.Urgency === 'Urgent').length;
        const complete = Math.floor(total * 0.25); // Mock
        const inProgress = total - complete - critical;

        document.getElementById('m-kpi-total').textContent = String(total).padStart(2, '0');
        document.getElementById('m-kpi-critical').textContent = String(critical).padStart(2, '0');
        document.getElementById('m-kpi-done').textContent = String(complete).padStart(2, '0');
        document.getElementById('m-kpi-progress').textContent = String(Math.max(0, inProgress)).padStart(2, '0');
    },

    updateMatrixUpcoming() {
        const list = document.getElementById('matrix-upcoming-list');
        if (!list) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = [];
        maintenanceData.forEach(d => {
            const datesToCheck = d.Planned_Dates || [d.Next_Date];
            datesToCheck.forEach(dateStr => {
                const dDate = new Date(dateStr);
                if (dDate >= today) {
                    upcoming.push({ ...d, Active_Next: dateStr });
                }
            });
        });

        upcoming.sort((a, b) => new Date(a.Active_Next) - new Date(b.Active_Next));
        const top5 = upcoming.slice(0, 5);

        const systemIcons = {
            'HVAC': 'fa-wind',
            'Elettrici': 'fa-bolt',
            'Idrici': 'fa-faucet',
            'Antincendio': 'fa-fire-extinguisher',
            'Elevatori': 'fa-elevator',
            'Opere Edili': 'fa-hammer'
        };

        list.innerHTML = top5.map(u => {
            const dDate = new Date(u.Active_Next);
            const diffTime = dDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let countdownLabel = `Tra ${diffDays} gg`;
            if (diffDays === 0) countdownLabel = "OGGI";
            if (diffDays === 1) countdownLabel = "DOMANI";

            const icon = systemIcons[u.Tipologia_Impianto] || 'fa-tools';
            const isCritical = u.Urgency === 'Urgent';

            // Mapping for detail drawer - Using correct keys from data.js
            const taskObj = {
                site: u.Nome_Sito,
                system: u.Tipologia_Impianto,
                activity: u.Attivita,
                date: u.Active_Next,
                freq: u.Frequenza,
                norm: u.Riferimento_Normativo,
                urgency: u.Urgency,
                code: u.Sottocategoria
            };
            const taskJson = JSON.stringify(taskObj).replace(/'/g, "&apos;");

            return `
                <div class="u-item-v2 ${isCritical ? 'critical' : ''}" 
                     data-task='${taskJson}'
                     onclick="BM_v2.handleUpcomingClick(this)">
                    <div class="u-icon-v2"><i class="fas ${icon}"></i></div>
                    <div class="u-info-v2">
                        <div class="u-site-v2">${u.Nome_Sito}</div>
                        <div class="u-task-v2">${u.Attivita}</div>
                    </div>
                    <div class="u-date-v2">${countdownLabel}</div>
                </div>
            `;
        }).join('');
    },

    prevTimeline() {
        if (this.state.matrixView === 'month') {
            this.state.calDate.setMonth(this.state.calDate.getMonth() - 1);
            this.state.calDate.setDate(1);
        } else {
            this.state.calDate.setDate(this.state.calDate.getDate() - 7);
        }
        this.renderPlanningMatrix();
    },

    nextTimeline() {
        if (this.state.matrixView === 'month') {
            this.state.calDate.setMonth(this.state.calDate.getMonth() + 1);
            this.state.calDate.setDate(1);
        } else {
            this.state.calDate.setDate(this.state.calDate.getDate() + 7);
        }
        this.renderPlanningMatrix();
    },

    showTaskDetail(jsonStr) {
        let data;
        try {
            const decoded = jsonStr.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
            data = JSON.parse(decoded);
        } catch (e) {
            console.error("Error parsing task data", e);
            return;
        }

        console.log('DEBUG Matrix showTaskDetail - data.code:', data.code, 'Sottocategoria:', data.Sottocategoria);

        const drawer = document.getElementById('profile-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        if (!drawer) return;

        const isUrgent = data.urgency === 'Urgent' || data.urgency === 'Overdue';

        drawer.innerHTML = `
            <div class="task-detail-v2">
                <div class="task-header-v2">
                    <button class="close-drawer-v2" onclick="BM_v2.deselectSite()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="task-type-badge ${isUrgent ? 'urgent' : ''}">${data.system}</div>
                    <h1 class="task-title-v2">${data.activity}</h1>
                    <p class="task-subtitle-v2">${data.site} — ${data.date}</p>
                </div>

                <div class="task-meta-grid-v2">
                    <div class="meta-item-v2">
                        <span class="meta-label-v2">Frequenza</span>
                        <span class="meta-value-v2">${data.freq || 'N/D'}</span>
                    </div>
                    <div class="meta-item-v2">
                        <span class="meta-label-v2">Normativa</span>
                        <span class="meta-value-v2">${data.norm || 'Standard'}</span>
                    </div>
                    <div class="meta-item-v2">
                        <span class="meta-label-v2">Stato</span>
                        <span class="meta-value-v2 ${isUrgent ? 'urgent' : ''}">${data.urgency}</span>
                    </div>
                </div>

                <div class="task-doc-section-v2">
                    <h4 class="section-title-v2">Integrità & Compliance</h4>
                    <div class="task-doc-preview-v2" onclick="BM_v2.showAriaPanel('${(data.code || '').replace(/'/g, "\\'")}')">
                        <div class="doc-icon-v2"><i class="fas fa-microchip"></i></div>
                        <div class="doc-info-v2">
                            <div class="doc-name-v2">Analisi Tecnica ARIA</div>
                            <div class="doc-meta-v2">Parametri di conformità ${data.code || ''}</div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="task-actions-v2">
                    <button class="btn-v2-primary" onclick="alert('Salvataggio stato task...')">
                        <i class="fas fa-check"></i> Segna Eseguito
                    </button>
                    <button class="btn-v2-outline" onclick="alert('Log storico non disponibile')">
                        Log Storico
                    </button>
                </div>
            </div>
        `;

        drawer.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
    },

    addTask() {
        if (this.openAriaModal) {
            this.openAriaModal("Configurazione Nuovo Task", `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-tools" style="font-size: 40px; color: var(--primary); margin-bottom: 20px;"></i>
                    <h3>Creazione Task Operativo</h3>
                    <p>Il modulo di pianificazione dinamica è in sola lettura per questa sessione.</p>
                    <button class="btn-v2-primary" onclick="BM_v2.closeAriaModal()" style="margin-top: 20px;">Ho Capito</button>
                </div>
            `);
        } else {
            alert("Apertura modulo creazione Task (Matrix Style)...");
        }
    }
});

