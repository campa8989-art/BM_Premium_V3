/**
 * BM PREMIUM v2 | VERBALI SYNC MODULE
 * Auto-detects and processes new PDF verbali at startup
 */

Object.assign(BM_v2, {
    verbaliState: {
        isEnabled: false,
        processedFiles: [],
        pendingCount: 0,
        lastSync: null
    },

    async initVerbaliSync() {
        console.log("🔄 Inizializzazione Verbali Sync...");
        
        // Load processed files from localStorage
        const stored = localStorage.getItem('bm_verbali_processed');
        if (stored) {
            this.verbaliState.processedFiles = JSON.parse(stored);
        }

        // Create UI button in header
        this.createVerbaliSyncButton();

        // Auto-check if enabled
        if (this.verbaliState.isEnabled) {
            await this.checkForNewVerbali();
        }
    },

    createVerbaliSyncButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const btn = document.createElement('button');
        btn.id = 'btn-verbali-sync';
        btn.type = 'button';
        btn.className = 'header-action-btn';
        btn.innerHTML = '<i class="fas fa-file-medical"></i><span class="btn-label">Verbali</span>';
        btn.title = 'Sincronizza verbali (PDF)';
        btn.onclick = () => this.checkForNewVerbali();
        
        const badge = document.createElement('span');
        badge.id = 'verbali-badge';
        badge.className = 'action-badge';
        badge.style.display = 'none';
        btn.appendChild(badge);
        
        headerActions.appendChild(btn);
    },

    async checkForNewVerbali() {
        const btn = document.getElementById('btn-verbali-sync');
        if (btn) btn.classList.add('processing');

        try {
            const response = await fetch('http://127.0.0.1:3001/api/verbali');
            const { files } = await response.json();

            const newFiles = files.filter(f => 
                !this.verbaliState.processedFiles.includes(f.name)
            );

            this.verbaliState.pendingCount = newFiles.length;
            this.updateVerbaliBadge();

            if (newFiles.length > 0) {
                this.showNotification(`📄 Trovati ${newFiles.length} nuovi verbali da processare`, 'info');
                await this.processVerbali(newFiles);
            } else {
                this.showNotification('✅ Nessun nuovo verbale', 'success');
            }

            this.verbaliState.lastSync = new Date().toISOString();
        } catch (err) {
            console.error("Verbali Sync Error:", err);
            this.showNotification('⚠️ Server verbali non disponibile', 'warning');
        } finally {
            if (btn) btn.classList.remove('processing');
        }
    },

    async processVerbali(files) {
        // Get unique sites from data.js
        const siteNames = [...new Set(maintenanceData.map(r => r.Nome_Sito).filter(s => s))];
        const systemTypes = [...new Set(maintenanceData.map(r => r.Tipologia_Impianto).filter(t => t))];

        let processed = 0;

        for (const file of files) {
            this.showNotification(`📄 Elaborazione: ${file.name}...`, 'info');

            try {
                // Read file
                const readRes = await fetch(`http://127.0.0.1:3001/api/verbali/read/${file.relativePath}`);
                const { data: base64, name } = await readRes.json();

                // Analyze with AI
                const result = await this.analyzeVerbaleWithAI(base64, siteNames, systemTypes, file.folder);

                if (result) {
                    // Update data.js
                    this.updateMaintenanceData(result);
                    
                    // Mark as processed
                    this.verbaliState.processedFiles.push(name);
                    processed++;
                }
            } catch (err) {
                console.error(`Errore ${file.name}:`, err);
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 5000));
        }

        // Save processed list
        localStorage.setItem('bm_verbali_processed', JSON.stringify(this.verbaliState.processedFiles));

        this.verbaliState.pendingCount = 0;
        this.updateVerbaliBadge();

        this.showNotification(`✨ Processati ${processed} verbali`, 'success');
        
        // Refresh UI
        this.renderSiteList();
        this.updateGlobalStats();
    },

    async analyzeVerbaleWithAI(base64, siteNames, systemTypes, folderName) {
        const prompt = `Analizza questo verbale di manutenzione tecnica.
        La cartella del file è: "${folderName}"
        
        Site disponibili: [${siteNames.join(', ')}]
        Tipologie: [${systemTypes.join(', ')}]
        
        Estrai in JSON:
        {
            "data_intervento": "YYYY-MM-DD",
            "nome_presidio": "Nome presidio dalla lista",
            "tipologia_impianto": "Tipologia dalla lista",
            "note_tecniche": "Sintesi intervento",
            "stato": "OK" o "NON CONFORME"
        }
        
        Regole:
        1. Usa solo site e tipologie dalla lista
        2. Cerca la data nel verbale
        3. Rispondi SOLO JSON`;

        try {
            const response = await fetch(`http://127.0.0.1:3001/api/proxy-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: "application/pdf", data: base64 } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("AI Error:", e);
        }
        return null;
    },

    updateMaintenanceData(aiResult) {
        if (!aiResult || !aiResult.nome_presidio || !aiResult.tipologia_impianto) return;

        const siteMatch = aiResult.nome_presidio.toLowerCase();
        const systemMatch = aiResult.tipologia_impianto.toLowerCase();

        maintenanceData.forEach(row => {
            const rowSite = (row.Nome_Sito || '').toLowerCase();
            const rowSystem = (row.Tipologia_Impianto || '').toLowerCase();

            if (rowSite.includes(siteMatch) || siteMatch.includes(rowSite) && 
                rowSystem.includes(systemMatch)) {
                
                if (aiResult.data_intervento) {
                    row.Last_Date = aiResult.data_intervento;
                }
                row.Stato_Documentale = aiResult.stato || 'OK';
                row.Note = (row.Note || '') + ` [Verbale:${aiResult.data_intervento}]`;
            }
        });
    },

    updateVerbaliBadge() {
        const badge = document.getElementById('verbali-badge');
        if (!badge) return;

        if (this.verbaliState.pendingCount > 0) {
            badge.textContent = this.verbaliState.pendingCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    },

    showNotification(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.remove(), 5000);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    toggleVerbaliSync() {
        this.verbaliState.isEnabled = !this.verbaliState.isEnabled;
        
        const btn = document.getElementById('btn-verbali-sync');
        if (btn) {
            btn.classList.toggle('active', this.verbaliState.isEnabled);
        }

        if (this.verbaliState.isEnabled) {
            this.checkForNewVerbali();
        }
    }
});

// Auto-init when BM_v2 loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BM_v2.initVerbaliSync());
} else {
    BM_v2.initVerbaliSync();
}