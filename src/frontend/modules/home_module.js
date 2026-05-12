/**
 * BM PREMIUM v2 | HOME MODULE (CHIEF MANAGER EDITION)
 * High-fidelity institutional dashboard layout.
 */

Object.assign(BM_v2, {
    weatherData: null,

    async fetchWeather() {
        try {
            const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=45.4642&longitude=9.1900&current_weather=true');
            const data = await response.json();
            if (data && data.current_weather) {
                this.weatherData = data.current_weather;
                this.updateWeatherUI();
            }
        } catch (err) {
            console.error("Weather fetch failed:", err);
        }
    },

    updateWeatherUI() {
        const weatherIconEl = document.querySelector('.weather-icon-v3');
        const weatherTempEl = document.querySelector('.weather-info-v3 .temp');
        if (!weatherIconEl || !weatherTempEl || !this.weatherData) return;

        const code = this.weatherData.weathercode;
        const temp = Math.round(this.weatherData.temperature);

        const weatherMap = {
            0: { icon: 'fa-sun', desc: 'Sereno' },
            1: { icon: 'fa-cloud-sun', desc: 'Preval. Sereno' },
            2: { icon: 'fa-cloud-sun', desc: 'Parzialm. Nuvoloso' },
            3: { icon: 'fa-cloud', desc: 'Coperto' },
            45: { icon: 'fa-smog', desc: 'Nebbia' },
            48: { icon: 'fa-smog', desc: 'Nebbia Brinata' },
            51: { icon: 'fa-cloud-rain', desc: 'Pioviggine' },
            61: { icon: 'fa-cloud-showers-heavy', desc: 'Pioggia Debole' },
            63: { icon: 'fa-cloud-showers-heavy', desc: 'Pioggia' },
            71: { icon: 'fa-snowflake', desc: 'Neve Debole' },
            95: { icon: 'fa-cloud-bolt', desc: 'Temporale' }
        };

        const config = weatherMap[code] || { icon: 'fa-cloud-sun', desc: 'Variabile' };

        weatherIconEl.innerHTML = `<i class="fas ${config.icon}"></i>`;
        weatherTempEl.innerHTML = `${temp}°C · ${config.desc}`;
    },

    renderHome() {
        const container = document.getElementById('view-home');
        if (!container) return;

        // KPI Calculations - REAL DATA from maintenanceData
        const currentData = (typeof maintenanceData !== 'undefined') ? maintenanceData : [];
        const siteCount = 33;

        // Alerts: Urgent or Overdue
        const urgentTasks = currentData.filter(d => d.Urgency === 'Urgent' || d.Urgency === 'Overdue');
        const urgentCount = urgentTasks.length;

        // Compliance: % of tasks with documentation 'OK'
        const totalTasks = currentData.length;
        const compliantTasks = currentData.filter(d => d.Stato_Documentale === 'OK').length;
        const compliance = totalTasks > 0 ? (compliantTasks / totalTasks * 100).toFixed(1) : 0;

        // Contract Management: Missing Documents count (In data.js this is indicated in Last_Date)
        const missingDocsCount = currentData.filter(d => d.Last_Date === 'DOCUMENTO MANCANTE').length;

        const hours = new Date().getHours();
        const greeting = hours < 12 ? 'Buongiorno' : (hours < 18 ? 'Buon pomeriggio' : 'Buonasera');

        // Dynamic System Health Calculation - ALL categories from data
        const allCategories = [...new Set(currentData.map(d => d.Tipologia_Impianto).filter(Boolean))].sort();

        const healthHtml = allCategories.map(cat => {
            const sysTasks = currentData.filter(d => d.Tipologia_Impianto === cat);
            const sysTotal = sysTasks.length;
            const sysOK = sysTasks.filter(d => d.Stato_Documentale === 'OK').length;
            const sysPerc = sysTotal > 0 ? Math.round(sysOK / sysTotal * 100) : 0;

            // Color mapping based on health
            let healthClass = 'status-ok';
            if (sysPerc < 50) healthClass = 'status-critical';
            else if (sysPerc < 80) healthClass = 'status-warning';

            return `
                <div class="health-row">
                    <div class="health-label"><span>${cat}</span> <span>${sysPerc}%</span></div>
                    <div class="health-bar"><div class="health-fill ${healthClass}" style="width: ${sysPerc}%;"></div></div>
                </div>
            `;
        }).join('');

        // Dynamic Feed Construction
        let feedHtml = '';
        if (urgentTasks.length > 0) {
            feedHtml = urgentTasks.slice(0, 5).map(task => `
                <div class="feed-item-v3" onclick="BM_v2.switchView('dashboard'); BM_v2.selectSite('${task.ID_Sito}')" style="cursor:pointer;">
                    <div class="item-time">${task.Next_Date ? task.Next_Date.split('-').reverse().slice(0, 2).join('/') : '--'}</div>
                    <div class="item-body">
                        <span class="tag-v3 ${task.Urgency.toLowerCase()}">${task.Urgency.toUpperCase()}</span>
                        <h4>${task.Nome_Sito}</h4>
                        <p>${task.Attivita.substring(0, 50)}${task.Attivita.length > 50 ? '...' : ''}</p>
                    </div>
                </div>
            `).join('');
        } else {
            feedHtml = `<div class="empty-state" style="padding: 20px; opacity: 0.5;">Nessun alert critico rilevato.</div>`;
        }

        container.innerHTML = `
            <div class="home-layout chief-manager">
                <!-- Hero Section -->
                <header class="home-hero-v3">
                    <span class="tag-v3">SYSTEM OPERATIONAL</span>
                    <h1>${greeting}, Building Manager</h1>
                    <p>Attualmente gestisci <strong>${siteCount} siti</strong> con un tasso di compliance globale del <strong>${compliance}%</strong>. Ci sono <strong>${urgentCount} segnalazioni</strong> critiche che richiedono analisi.</p>
                </header>

                <!-- KPI Ribbon -->
                <section class="kpi-grid-v3">
                    <div class="kpi-card-v3" onclick="BM_v2.switchView('dashboard')">
                        <div class="kpi-icon-v3"><i class="fas fa-building"></i></div>
                        <div class="kpi-info-v3">
                            <span class="label">Siti Gestiti</span>
                            <span class="value">${siteCount}</span>
                        </div>
                    </div>
                    <div class="kpi-card-v3" onclick="BM_v2.switchView('charts')">
                        <div class="kpi-icon-v3"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="kpi-info-v3">
                            <span class="label">Alert Attivi</span>
                            <span class="value">${urgentCount}</span>
                        </div>
                    </div>
                    <div class="kpi-card-v3" onclick="BM_v2.switchView('charts')">
                        <div class="kpi-icon-v3"><i class="fas fa-shield-alt"></i></div>
                        <div class="kpi-info-v3">
                            <span class="label">Compliance</span>
                            <span class="value">${compliance}%</span>
                        </div>
                    </div>
                    <div class="kpi-card-v3" onclick="BM_v2.switchView('dashboard')">
                        <div class="kpi-icon-v3" style="${missingDocsCount > 0 ? 'background: rgba(255, 77, 77, 0.1); color: var(--urgent);' : ''}">
                            <i class="fas fa-file-circle-exclamation"></i>
                        </div>
                        <div class="kpi-info-v3">
                            <span class="label">Doc. Mancanti</span>
                            <span class="value" style="${missingDocsCount > 0 ? 'color: var(--urgent);' : ''}">${missingDocsCount}</span>
                        </div>
                    </div>
                </section>

                <div class="home-main-v3">
                    <!-- Central Activity Feed -->
                    <section class="panel-v3">
                        <div class="panel-header-v3">
                            <h3><i class="fas fa-list-ul"></i> Daily Ops Feed</h3>
                        </div>
                        <div class="feed-v3">
                            ${feedHtml}
                        </div>
                    </section>

                    <!-- Sidebar Intelligence -->
                    <aside class="aside-v3">
                        <div class="weather-v3">
                            <div class="weather-icon-v3"><i class="fas fa-spinner fa-spin"></i></div>
                            <div class="weather-info-v3">
                                <div class="city">Milano, IT</div>
                                <div class="temp">Caricamento...</div>
                            </div>
                        </div>

                        <div class="panel-v3">
                            <h3>System Health</h3>
                            <div class="sys-health-v3 custom-scrollbar" style="max-height: 250px; overflow-y: auto; padding-right: 10px;">
                                ${healthHtml}
                            </div>
                        </div>

                        <div class="panel-v3">
                            <h3>Documenti Recenti</h3>
                            <div id="recent-docs-home" class="docs-list-v3 custom-scrollbar" style="max-height: 250px;">
                                <div class="empty-state" style="padding:10px; font-size:11px; opacity:0.5;">Ricerca asset...</div>
                            </div>
                        </div>

                        <div class="panel-v3">
                            <h3>Quick Actions</h3>
                            <div class="mini-grid">
                                <div class="mini-tile" onclick="BM_v2.switchView('calendar')">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>Pianifica</span>
                                </div>
                                <div class="mini-tile" onclick="BM_v2.switchView('map')">
                                    <i class="fas fa-map-marked-alt"></i>
                                    <span>Mappa Siti</span>
                                </div>
                                <div class="mini-tile" onclick="BM_v2.switchView('workspace')">
                                    <i class="fas fa-archive"></i>
                                    <span>Archivio</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;

        // Start Weather Fetch
        this.fetchWeather();

        // Trigger Recent Docs Population for the Home container
        setTimeout(() => {
            if (this.populateRecentDocsHome) {
                this.populateRecentDocsHome();
            } else {
                // Fallback attempt to use global if accessible
                this.populateRecentDocs();
            }
        }, 100);
    }
});

