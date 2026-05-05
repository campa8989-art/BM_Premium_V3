/**
 * BM PREMIUM v3 | TELEMETRY & CHARTS MODULE
 *      Logic for Chart.js Integration, KPI Calculations, and Live Pulse Feed
 */

Object.assign(BM_v2, {
    updateGlobalStats() {
        if (!this.state.sites) return;

        const totalAttivita = this.state.sites.reduce((acc, s) => acc + s.total, 0);
        const urgentCount = this.state.sites.reduce((acc, s) => acc + s.urgentCount, 0);

        // Real compliance calculation
        const compliancePerc = Math.max(0, 100 - (urgentCount / totalAttivita * 100));

        if (this.dom.stats.total) this.dom.stats.total.textContent = totalAttivita;
        if (this.dom.stats.compliance) {
            this.dom.stats.compliance.textContent = `${compliancePerc.toFixed(1)}%`;
            this.dom.stats.compFill.style.width = `${compliancePerc}%`;
        }
        if (this.dom.stats.urgent) this.dom.stats.urgent.textContent = urgentCount;
        if (this.dom.stats.globalPerc) this.dom.stats.globalPerc.textContent = `${compliancePerc.toFixed(0)}%`;
    },

    initMainChart() {
        const canvas = document.getElementById('v2-main-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Estrazione Dati Vivi: Calcolo scadenze programmate mensili
        const monthCounts = new Array(12).fill(0);

        if (this.state.sites) {
            this.state.sites.forEach(site => {
                if (site.tasks) {
                    site.tasks.forEach(task => {
                        if (task.Next_Date && !task.Next_Date.includes("MANCANTE")) {
                            const d = new Date(task.Next_Date);
                            if (!isNaN(d.getTime())) {
                                monthCounts[d.getMonth()]++;
                            }
                        }
                    });
                }
            });
        }

        // Creazione Gradiente Dinamico
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        if (this.state.isDarkMode) {
            gradient.addColorStop(0, 'rgba(0, 218, 243, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 218, 243, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(0, 119, 182, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 119, 182, 0)');
        }

        const primaryColor = this.state.isDarkMode ? '#00daf3' : '#0077b6';

        const data = {
            labels: ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'],
            datasets: [{
                label: 'Volume Operativo Mensile',
                data: monthCounts,
                fill: true,
                backgroundColor: gradient,
                borderColor: primaryColor,
                borderWidth: 3,
                tension: 0.45, // Curva "analogica" fluida
                pointRadius: 4,
                pointBackgroundColor: primaryColor,
                pointBorderColor: this.state.isDarkMode ? '#131314' : '#e0e5ec',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: primaryColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        };

        if (this.charts.main) this.charts.main.destroy(); 

        this.charts.main = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.state.isDarkMode ? 'rgba(32, 31, 32, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: primaryColor,
                        titleFont: { family: 'Space Grotesk', size: 13, weight: 'bold' },
                        bodyColor: this.state.isDarkMode ? '#e5e2e3' : '#2d3436',
                        bodyFont: { family: 'Inter', size: 12 },
                        padding: 12,
                        cornerRadius: 12,
                        borderColor: this.state.isDarkMode ? 'rgba(0, 218, 243, 0.2)' : 'rgba(0, 119, 182, 0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `⚡ ${context.parsed.y} Task Programmati`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: this.state.isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            drawBorder: false 
                        },
                        ticks: { 
                            color: this.state.isDarkMode ? '#8b90a0' : '#636e72', 
                            font: { size: 10, family: 'Space Grotesk' }, 
                            precision: 0,
                            padding: 10
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: this.state.isDarkMode ? '#8b90a0' : '#636e72', 
                            font: { size: 10, family: 'Space Grotesk', weight: 'bold' },
                            padding: 10
                        }
                    }
                }
            }
        });
    },

    initTelemetryCharts() {
        const sites = this.state.sites;
        if (!sites || sites.length === 0) return;

        this.charts = this.charts || {};

        // 1. Calculate Aggregates
        let totalUrgent = 0;
        let totalActivities = 0;
        const systemCounts = {};

        sites.forEach(s => {
            totalUrgent += s.urgentCount;
            totalActivities += s.total;
            s.tasks.forEach(t => {
                const sys = t.Tipologia_Impianto || 'HVAC';
                systemCounts[sys] = (systemCounts[sys] || 0) + 1;
            });
        });

        const globalCompliance = Math.max(0, 100 - (totalUrgent / totalActivities * 100)).toFixed(1);

        // Dynamic UI Updates
        if (document.getElementById('kpi-urgencies')) document.getElementById('kpi-urgencies').innerText = totalUrgent;
        if (document.getElementById('kpi-compliance')) document.getElementById('kpi-compliance').innerText = globalCompliance + '%';
        if (document.getElementById('kpi-health')) document.getElementById('kpi-health').innerText = (globalCompliance * 0.94).toFixed(1) + '%';
        if (document.getElementById('kpi-network-load')) document.getElementById('kpi-network-load').innerText = totalActivities;

        const primaryColor = this.state.isDarkMode ? '#00daf3' : '#0077b6';

        // 2. Radar Chart: System Distribution
        const distEl = document.getElementById('sys-dist-chart');
        if (distEl) {
            const distCtx = distEl.getContext('2d');
            if (this.charts.sysDist) this.charts.sysDist.destroy();

            this.charts.sysDist = new Chart(distCtx, {
                type: 'radar',
                data: {
                    labels: Object.keys(systemCounts),
                    datasets: [{
                        label: 'Incidenza Sistemi',
                        data: Object.values(systemCounts),
                        backgroundColor: this.state.isDarkMode ? 'rgba(0, 218, 243, 0.15)' : 'rgba(0, 119, 182, 0.1)',
                        borderColor: primaryColor,
                        pointBackgroundColor: primaryColor,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: primaryColor,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: this.state.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                            grid: { color: this.state.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                            pointLabels: { 
                                color: this.state.isDarkMode ? '#8b90a0' : '#636e72', 
                                font: { size: 10, family: 'Space Grotesk', weight: 'bold' } 
                            },
                            ticks: { display: false }
                        }
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: this.state.isDarkMode ? 'rgba(32, 31, 32, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                            cornerRadius: 8,
                            padding: 10,
                            titleFont: { family: 'Space Grotesk' },
                            bodyFont: { family: 'Inter' }
                        }
                    }
                }
            });
        }

        // 3. Weekly Operational Trend (Next 4 Weeks)
        const trendEl = document.getElementById('compliance-trend-chart');
        if (trendEl) {
            const trendCtx = trendEl.getContext('2d');
            if (this.charts.trend) this.charts.trend.destroy();

            const now = new Date();
            const weekStats = [0, 0, 0, 0]; 
            const weekLabels = [];

            for (let i = 0; i < 4; i++) {
                const wStart = new Date(now);
                wStart.setDate(now.getDate() + (i * 7));
                const wEnd = new Date(wStart);
                wEnd.setDate(wStart.getDate() + 7);
                
                weekLabels.push(`W${i + 1} (${wStart.getDate()}/${wStart.getMonth() + 1})`);

                sites.forEach(s => {
                    s.tasks.forEach(t => {
                        if (t.Next_Date && !t.Next_Date.includes("MANCANTE")) {
                            const d = new Date(t.Next_Date);
                            if (d >= wStart && d < wEnd) {
                                weekStats[i]++;
                            }
                        }
                    });
                });
            }

            // Create Trend Gradient
            const trendGradient = trendCtx.createLinearGradient(0, 0, 0, 300);
            trendGradient.addColorStop(0, this.state.isDarkMode ? 'rgba(0, 218, 243, 0.25)' : 'rgba(0, 119, 182, 0.15)');
            trendGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.charts.trend = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: weekLabels,
                    datasets: [{
                        label: 'Volume Scadenze',
                        data: weekStats,
                        fill: true,
                        backgroundColor: trendGradient,
                        borderColor: primaryColor,
                        tension: 0.4,
                        borderWidth: 4,
                        pointRadius: 6,
                        pointBackgroundColor: primaryColor,
                        pointBorderColor: this.state.isDarkMode ? '#1a1a1b' : '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 9,
                        pointHoverBackgroundColor: primaryColor,
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index',
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { 
                                color: this.state.isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                drawBorder: false 
                            }, 
                            ticks: { 
                                color: this.state.isDarkMode ? '#8b90a0' : '#636e72', 
                                font: { family: 'Space Grotesk' },
                                stepSize: 5,
                                padding: 10
                            } 
                        },
                        x: { 
                            grid: { display: false }, 
                            ticks: { 
                                color: this.state.isDarkMode ? '#8b90a0' : '#636e72',
                                font: { family: 'Space Grotesk', weight: 'bold' },
                                padding: 10
                            } 
                        }
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: this.state.isDarkMode ? 'rgba(32, 31, 32, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                            titleColor: primaryColor,
                            titleFont: { family: 'Space Grotesk', size: 13, weight: 'bold' },
                            bodyColor: this.state.isDarkMode ? '#e5e2e3' : '#2d3436',
                            borderColor: 'rgba(0, 218, 243, 0.1)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 12,
                            displayColors: false
                        }
                    }
                }
            });
        }

        // 4. Critical Ranking
        const rankingContainer = document.getElementById('top-urgency-list');
        if (rankingContainer) {
            const sortedByHealth = [...sites].map(s => {
                const health = s.total > 0 ? Math.round(((s.total - s.urgentCount) / s.total) * 100) : 100;
                return { ...s, health };
            }).sort((a, b) => a.health - b.health);

            rankingContainer.innerHTML = sortedByHealth.map(s => {
                return `
                <div class="ranking-item" onclick="BM_v2.focusSiteOnMap('${s.id}')" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-glass); cursor: pointer; transition: background 0.3s;">
                    <div style="flex: 1; overflow: hidden; padding-right: 15px;">
                        <div class="ranking-site-name" style="font-weight: 600; color: var(--text-main); font-size: 13px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${s.nome}</div>
                        <div class="ranking-site-meta" style="font-size: 11px; color: var(--text-muted);">${s.id} • ${s.urgentCount} anomalie su ${s.total}</div>
                    </div>
                    <div style="text-align: right; min-width: 80px;">
                        <div style="font-size: 10px; color: ${s.health < 50 ? 'var(--urgent)' : 'var(--primary)'}; margin-bottom: 4px; font-weight: 700;">SALUTE: ${s.health}%</div>
                        <div class="health-bar-wrapper" style="height: 4px; background: var(--border-glass); border-radius: 2px; overflow: hidden;">
                            <div class="health-bar-fill" style="width: ${s.health}%; height: 100%; transition: width 1s ease; background: linear-gradient(90deg, ${s.health < 50 ? 'var(--urgent)' : 'rgba(0, 119, 182, 0.4)'} 0%, var(--primary) 100%);"></div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        this.initPulseFeed();
    },

    initPulseFeed() {
        const feed = document.getElementById('pulse-feed');
        if (!feed) return;

        const events = [];

        if (this.state.sites) {
            this.state.sites.forEach(site => {
                if (site.tasks) {
                    site.tasks.forEach(task => {
                        if (task.Urgency === 'Urgent' || task.Urgency === 'Overdue') {
                            let cleanSite = site.nome;
                            if (cleanSite.includes(" - ")) cleanSite = cleanSite.split(" - ")[1];

                            events.push({
                                site: cleanSite,
                                type: task.Tipologia_Impianto || task.Sistema || 'Anomalia Tecnica',
                                msg: `${task.Stato_Documentale}: ${task.Attivita || task.Tipologia_Servizio}`,
                                dateStr: task.Next_Date,
                                isOverdue: task.Urgency === 'Overdue' || task.Next_Date.includes("MANCANTE")
                            });
                        }
                    });
                }
            });
        }

        if (events.length === 0) {
            feed.innerHTML = `
            <div class="pulse-event" style="border-left-color: #22c55e;">
                <div class="pulse-time">${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                <div class="pulse-content">
                    <h5 style="color: #22c55e;">Telemetria Pulita</h5>
                    <p>Nessun alert. Tutti i presidi risultano in asse di conformità.</p>
                </div>
            </div>`;
            return;
        }

        const streamBase = events.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return 0.5 - Math.random(); 
        }).slice(0, 15);

        feed.innerHTML = streamBase.map((e, i) => `
            <div class="pulse-event ${e.isOverdue ? 'critical' : ''}" style="animation-delay: ${i * 0.15}s">
                <div class="pulse-time">${e.dateStr || 'MISSING'}</div>
                <div class="pulse-content">
                    <h5>${e.site} — ${e.type}</h5>
                    <p>${e.msg}</p>
                </div>
            </div>
        `).join('');
    }
});
