/**
 * BM PREMIUM v2 | REPORTS MODULE
 * Logic for Technical Report Generation (Don Orione 2 Fidelity)
 */

Object.assign(BM_v2, {
    report: {
        selectedCodes: new Set(),
        reportState: {},
        historyStack: [],
        
        config: {
            ALL_CONTRACT_CODES: [
                "1.2", "1.1", "13.3", "3.1", "15.1", "17.1", "20.1", "2.1", "30.1", "40.1", 
                "45.2", "45.1", "49.1", "50.1", "51.1", "52.1", "53.1", "61.1", "64.1", "62.1",
                "59.1", "60.1", "66.1", "67.1", "72.1", "72.2", "73.1", "76.1", "80.1", "81.1"
            ],
            documentationMapping: {
                "HVAC": [
                    "Ultimi Rapporti di Controllo di Efficienza Energetica (Analisi fumi) effettuati sui moduli analizzati;",
                    "Verifica dei parametri di combustione: in particolare i valori di rendimento, eccesso d'aria e concentrazione di CO (monossido di carbonio);",
                    "Certificazione di avvenuta manutenzione del sistema di scarico condensa, per verificare se eventuali problemi di ossidazione siano stati già oggetto di intervento;",
                    "Copia del Libretto d'Impianto aggiornato, completo di tutte le schede relative ai componenti analizzati (rampa gas, contatore e collettore idraulico)."
                ],
                "Elettrico": [
                    "Certificato di conformità ai sensi del D.M. 37/08 per gli interventi di modifica/rifacimento;",
                    "Verifica periodica dell'impianto di messa a terra ai sensi del D.P.R. 462/01;",
                    "Registro di manutenzione dell'illuminazione di emergenza con esito prove di autonomia."
                ],
                "Idrico": [
                    "Valutazione del Rischio Legionellosi aggiornata (Linee Guida 2015);",
                    "Registro degli interventi effettuati e dei dosaggi dei prodotti chimici antilegionella;",
                    "Esiti dei campionamenti microbiologici effettuati sulla rete idrico-sanitaria."
                ],
                "Antincendio": [
                    "Registro delle verifiche periodiche semestrali idranti e splinker;",
                    "Certificato di rinnovo periodico di conformità antincendio (CPI);",
                    "Esito prove di portata e pressione della rete idrica antincendio."
                ],
                "Elevatori": [
                    "Certificato di verifica periodica ai sensi del D.P.R. 162/99;",
                    "Registro di manutenzione con annotazione delle prove di sicurezza paracadute;",
                    "Copia dell'assegnazione del numero di matricola dell'impianto."
                ]
            },
            sectionsDefinition: [
                {
                    title: "Impianti Climatizzazione e Produzione Energia (HVAC)",
                    category: "Servizio energia - Manutenzione impianti di climatizzazione (B2)",
                    docKey: "HVAC",
                    items: [
                        { id: "B.01- B.02 - B.12", name: "Caldaie da 36kW a 350 kW", alias: ["1.1", "1.2", "13.3"], figures: ["Caldaia", "Rampa Gas"] },
                        { id: "B.01 - B.02 - B.12", name: "Caldaie da 350 kW a 1000kW", alias: ["2.1"], figures: ["Centrale Termica", "Generatore"] },
                        { id: "B.04", name: "Gruppi frigoriferi a vite/centrifughi fino a 100 kW", alias: ["3.1", "15.1"], figures: ["Chiller", "Compressori"] },
                        { id: "B.01-B.05-B.06-B.11", name: "Distribuzione impianti idronici e sottocentrali", alias: ["17.1", "20.1"], figures: ["Sottocentrale", "Pompe"] },
                        { id: "B.08-B.13-B.15", name: "Unità di Trattamento Aria (UTA)", alias: ["30.1", "40.1"], figures: ["UTA", "Filtri/Motore"] },
                        { id: "B.09-B.10", name: "Condizionatori Monosplit / VRF / Localizzati", alias: ["80.1", "81.1"], figures: ["Unità Esterna", "Split Interno"] }
                    ]
                },
                {
                    title: "Impianti Elettrici e Continuità",
                    category: "Manutenzione Impianti elettrici (C)",
                    docKey: "Elettrico",
                    items: [
                        { id: "C2-C6", name: "Distribuzione elettrica, quadri, ecc.", alias: ["45.1", "45.2"], figures: ["Quadro BT", "Termografia"] },
                        { id: "C1", name: "Cabine MT / BT e Trasformatori", alias: ["49.1", "50.1"], figures: ["Trasformatore", "Cella MT"] },
                        { id: "C4", name: "Gruppi Elettrogeni di Continuità", alias: ["53.1"], figures: ["Motore GE", "Pannello ATS"] }
                    ]
                },
                {
                    title: "Impianti Idrico-Sanitari",
                    category: "Manutenzione Impianti idrici (D)",
                    docKey: "Idrico",
                    items: [
                        { id: "D2.02", name: "Impianti addolcimento", alias: ["51.1"], figures: ["Addolcitore", "Resine"] },
                        { id: "D2.03 – D2.04", name: "Distribuzione idrico sanitaria", alias: ["52.1"], figures: ["Collettore Idrico", "Valvolame"] },
                        { id: "D3.01", name: "Apparecchiature controllo legionellosi", alias: ["51.1"], figures: ["Dosatore", "Campionamento"] },
                        { id: "D3.01.06/07", name: "Prove della legionella della rete idrico-sanitaria", alias: ["51.1"], figures: ["Analisi Microbiologica"] }
                    ]
                },
                {
                    title: "Impianti e Apparecchiature Antincendio",
                    category: "Manutenzione impianti e apparecchiature antincendio (E)",
                    docKey: "Antincendio",
                    items: [
                        { id: "E1.03 - E1.06 - E3.04", name: "Compartimentazioni, serrande tagliafuoco", alias: ["72.1", "72.2"], figures: ["Serranda", "Compartimento"] },
                        { id: "E2.01 - E2.04 - E2.05", name: "Impianti rivelazione e segnalazione incendi", alias: ["76.1"], figures: ["Sensore", "Centrale"] },
                        { id: "E1.04 - E1.05 - E2.02", name: "Illuminazione di emergenza, segnaletica antincendio e vie di esodo", alias: ["45.1"], figures: ["Lampada Emergenza", "Segnaletica"] },
                        { id: "E1.01", name: "Porte Tagliafuoco", alias: ["72.1"], figures: ["Porta", "Maniglione"] },
                        { id: "E1.02", name: "Estintori", alias: ["73.1"], figures: ["Estintore", "Manometro"] },
                        { id: "E3.01 - E3.08", name: "Centrale di pressurizzazione", alias: ["72.1"], figures: ["Motopompa", "Quadro Antincendio"] },
                        { id: "E3.02 - E3.08", name: "Rete idrica e terminali", alias: ["72.1"], figures: ["Idrante UNI 45", "Rete Soffitto"] }
                    ]
                },
                {
                    title: "Impianti Elevatori e Sistemi di Trasporto",
                    category: "Manutenzione Impianti elevatori (F)",
                    docKey: "Elevatori",
                    items: [
                        { id: "F1.01", name: "Elevatori 1-5 piani (fino a 6 fermate)", alias: ["61.1"], figures: ["Locale Macchine", "Cabina"] },
                        { id: "F1.01", name: "Elevatori 6-10 piani (fino a 11 fermate)", alias: ["62.1"], figures: ["Locale Macchine", "Vano"] },
                        { id: "F1.02", name: "Servoscala", alias: ["64.1"], figures: ["Piattaforma", "Guida"] }
                    ]
                },
                {
                    title: "Manutenzione Edile e Sistemi Speciali",
                    category: "Manutenzione edile (G)",
                    docKey: "Edile",
                    items: [
                        { id: "G1", name: "Pompe di sollevamento acque nere e chiare", alias: ["60.1"], figures: ["Vano Raccolta", "Stazione Sollevamento"] },
                        { id: "G2.01.01", name: "Cancelli e sbarre motorizzati", alias: ["59.1"], figures: ["Motore Cancello", "Sbarra"] },
                        { id: "G2.01.02", name: "Porte automatiche e portoni sezionali", alias: ["66.1", "67.1"], figures: ["Fotocellula", "Portone"] }
                    ]
                }
            ]
        }
    },

    initReportsModule() {
        console.log("Initializing Reports Module...");
        this.populateReportSites();
        this.renderServicePicker();
        this.setupReportDate();
        this.setupReportEvents();
        this.renderReportStructure();
    },

    populateReportSites() {
        const select = document.getElementById('presidio-select');
        if (!select || !this.state.sites) return;
        
        // Clear select first
        select.innerHTML = '<option value="">-- Seleziona Sito --</option>';

        // Use already prepared state.sites from app_v2.js
        this.state.sites.forEach(site => {
            const opt = document.createElement('option');
            opt.value = site.nome;
            opt.dataset.address = site.indirizzo;
            opt.dataset.id = site.id;
            opt.innerText = `${site.id} - ${site.nome}`;
            select.appendChild(opt);
        });

        select.addEventListener('change', (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            document.getElementById('display-presidio-name').innerText = e.target.value || "Seleziona un presidio";
            document.getElementById('display-presidio-address').innerText = opt.dataset.address || "-";
            document.getElementById('display-presidio-id').innerText = opt.dataset.id || "-";
            const footerText = document.getElementById('footer-presidio');
            if(footerText) footerText.innerText = e.target.value || "...";
            if (e.target.value) this.autoSelectReportServices(e.target.value);
        });
    },

    setupReportDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('report-date');
        if (dateInput) {
            dateInput.value = today;
            this.updateReportDateDisplay(today);
            dateInput.addEventListener('change', (e) => this.updateReportDateDisplay(e.target.value));
        }
    },

    updateReportDateDisplay(val) {
        const d = new Date(val);
        document.getElementById('display-date').innerText = d.toLocaleDateString('it-IT');
    },

    renderServicePicker() {
        const picker = document.getElementById('service-picker');
        if(!picker) return;
        let html = '';
        this.report.config.sectionsDefinition.forEach(section => {
            html += `<strong class="picker-section-title">${section.title.toUpperCase()}</strong>`;
            section.items.forEach(item => {
                html += `
                    <div class="picker-item">
                        <input type="checkbox" data-id="${item.id}" id="chk-${item.id}" name="chk-${item.id}" onchange="BM_v2.toggleReportCode('${item.id}', this.checked)">
                        <label for="chk-${item.id}">${item.name} <small class="item-alias">(${item.alias.join(',')})</small></label>
                    </div>
                `;
            });
        });
        picker.innerHTML = html;
    },

    toggleReportCode(id, checked) {
        this.saveReportToHistory();
        if (checked) {
            this.report.selectedCodes.add(id);
            if (!this.report.reportState[id]) {
                const defItem = this.findReportItemDefinition(id);
                this.report.reportState[id] = { 
                    photos: defItem.figures.map(f => ({ caption: f, src: null, audit: "" })) 
                };
            }
        } else { 
            this.report.selectedCodes.delete(id); 
        }
        this.renderReportStructure();
    },

    findReportItemDefinition(id) {
        for (const section of this.report.config.sectionsDefinition) {
            const item = section.items.find(i => i.id === id);
            if (item) return { ...item, macro: section.category, docKey: section.docKey };
        }
        return null;
    },

    autoSelectReportServices(siteName) {
        if (typeof maintenanceData === 'undefined') return;
        
        // Reset state
        this.report.selectedCodes.clear();
        this.report.reportState = {};
        document.querySelectorAll('#service-picker input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Get all maintenance records for this site
        const siteItems = maintenanceData.filter(i => i.Nome_Sito === siteName);
        if (siteItems.length === 0) {
            console.warn(`[Reports] Nessun dato trovato per il sito: "${siteName}"`);
            this.renderReportStructure();
            return;
        }
        
        // Collect all unique Sistema codes present for this site
        const siteSistemaCodes = new Set(siteItems.map(i => i.Sistema).filter(Boolean));
        
        console.log(`[Reports] Sito "${siteName}" → ${siteItems.length} records, codici: [${[...siteSistemaCodes].join(', ')}]`);
        
        // For each definition item, check if ANY of its aliases match a Sistema code from the site
        this.report.config.sectionsDefinition.forEach(section => {
            section.items.forEach(def => {
                const hasMatch = def.alias.some(alias => siteSistemaCodes.has(alias));
                
                if (hasMatch) {
                    const cb = document.querySelector(`#service-picker input[data-id="${def.id}"]`);
                    if (cb && !cb.checked) {
                        cb.checked = true;
                        this.toggleReportCode(def.id, true);
                    }
                }
            });
        });
        
        console.log(`[Reports] Auto-selezionati ${this.report.selectedCodes.size} servizi per "${siteName}"`);
    },

    renderReportStructure() {
        // 1. Checkbox Grid Update
        const gridContainer = document.getElementById('checkbox-grid-container');
        if (gridContainer) {
            let gridHtml = `<table class="checkbox-grid"><tr>`;
            this.report.config.ALL_CONTRACT_CODES.forEach((code, idx) => {
                const isSelected = Array.from(this.report.selectedCodes).some(id => {
                    const def = this.findReportItemDefinition(id);
                    return def && def.alias.includes(code);
                });
                gridHtml += `<td>${isSelected ? "☒" : "☐"} ${code}</td>`;
                if ((idx + 1) % 10 === 0) gridHtml += `</tr><tr>`;
            });
            gridContainer.innerHTML = gridHtml + `</tr></table>`;
        }

        // 2. Main Content Area
        const container = document.getElementById('report-content');
        if (!container) return;
        container.innerHTML = "";
        
        if (this.report.selectedCodes.size === 0) {
            container.innerHTML = `<div style="text-align:center; padding:60px 40px; color:#aaa; font-style:italic;">
                <i class="fas fa-file-invoice" style="font-size: 40px; margin-bottom: 20px; opacity:0.2;"></i><br>
                Seleziona gli impianti dal pannello laterale per comporre la relazione tecnica.
            </div>`;
            return;
        }

        this.report.config.sectionsDefinition.forEach(section => {
            const activeItems = section.items.filter(item => this.report.selectedCodes.has(item.id));
            if (activeItems.length === 0) return;

            activeItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = "service-item-block";
                itemEl.innerHTML = this.renderReportMixedItem(item, section.category);
                container.appendChild(itemEl);
            });

            if (this.report.config.documentationMapping[section.docKey]) {
                const docEl = document.createElement('div');
                docEl.className = "documentation-block";
                docEl.innerHTML = `
                    <div class="doc-title">Documentazione Tecnica e Rapporti di Controllo da richiedere:</div>
                    <ul class="doc-list">
                        ${this.report.config.documentationMapping[section.docKey].map(d => `<li>${d}</li>`).join('')}
                    </ul>
                `;
                container.appendChild(docEl);
            }
        });
    },

    renderReportMixedItem(item, macroCategory) {
        const state = this.report.reportState[item.id];
        if (!state) return '';
        
        return `
            <table class="word-table">
                <div class="row"><div class="cell label">Codice:</div><div class="cell val" contenteditable="true"><strong>${item.id}</strong></div></div>
                <div class="row"><div class="cell label">Tipologia di servizio:</div><div class="cell val" contenteditable="true">${macroCategory}</div></div>
                <div class="row"><div class="cell label">Servizio:</div><div class="cell val" contenteditable="true"><strong>${item.name}</strong></div></div>
            </table>
            
            <div class="photos-grid-2col">
                ${state.photos.map((photo, idx) => `
                    <div class="photo-cell" data-item-id="${item.id}" data-photo-idx="${idx}">
                        <div class="drop-zone" onclick="BM_v2.triggerReportUpload(this)" onpaste="BM_v2.handleReportPaste(event, this)">
                            ${photo.src ? `<img src="${photo.src}">` : "<i class='fas fa-camera' style='font-size:20px; opacity:0.3;'></i><br>Incolla o clicca"}
                        </div>
                        
                        <div class="figure-label" contenteditable="true" onblur="BM_v2.saveReportCaption('${item.id}', ${idx}, this)">
                            <strong>Figura ${idx + 1}: ${photo.caption}</strong>
                        </div>
    
                        <div class="no-print" style="margin-top:8px; display: flex; gap: 4px; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 5px;">
                            <button class="btn-audit-small js-btn-audit" onclick="BM_v2.runReportAudit('${item.id}', ${idx})">🛡️ Analizza</button>
                            <button class="btn-audit-small js-btn-remove" style="background: #c00;" onclick="BM_v2.removeReportPhoto('${item.id}', ${idx})">🗑️ Rimuovi</button>
                        </div>
                    </div>
                `).join('')}
            </div>
    
            <div class="audits-full-width">
                ${state.photos.filter(p => p.audit).map((photo, idx) => `
                    <div class="audit-para-block" style="margin-top: 15pt; border-top: 0.5pt solid #eee; padding-top: 10pt;">
                        <div class="audit-para-title"><strong>Analisi Tecnica Figura ${idx + 1}: ${photo.caption}</strong></div>
                        <div class="audit-para-text" contenteditable="true" onblur="BM_v2.saveReportAudit('${item.id}', ${idx}, this)" style="font-size: 10.5pt; text-align: justify; line-height: 1.4;">
                            ${this.formatReportAuditText(photo.audit)}
                        </div>
                    </div>
                `).join('')}
            </div>
    
            <div class="no-print" style="margin-top: 15px; text-align: right; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 10px;">
                <button class="v2-info-btn" style="padding: 5px 12px; font-size: 10px;" onclick="BM_v2.addReportPhotoSlot('${item.id}')">➕ Aggiungi Foto</button>
            </div>
        `;
    },

    formatReportAuditText(text) {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                   .replace(/\n/g, '<br>')
                   .replace(/- /g, '&bull; ');
    },

    saveReportCaption(itemId, photoIdx, el) {
        this.saveReportToHistory();
        const fullText = el.innerText;
        const prefix = `Figura ${parseInt(photoIdx) + 1}: `;
        this.report.reportState[itemId].photos[photoIdx].caption = fullText.replace(prefix, "").trim();
    },

    saveReportAudit(itemId, photoIdx, el) {
        this.saveReportToHistory();
        this.report.reportState[itemId].photos[photoIdx].audit = el.innerHTML;
    },

    addReportPhotoSlot(itemId) {
        this.saveReportToHistory();
        this.report.reportState[itemId].photos.push({ 
            caption: "Ulteriore documentazione", 
            src: null, 
            audit: "" 
        });
        this.renderReportStructure();
    },

    removeReportPhoto(itemId, idx) {
        this.saveReportToHistory();
        this.report.reportState[itemId].photos.splice(idx, 1);
        this.renderReportStructure();
    },

    async runReportAudit(itemId, photoIdx) {
        const state = this.report.reportState[itemId];
        const photo = state.photos[photoIdx];

        if (!photo || !photo.src) {
            alert("⚠️ Carica prima un'immagine.");
            return;
        }

        const btn = document.querySelector(`.photo-cell[data-item-id="${itemId}"][data-photo-idx="${photoIdx}"] .js-btn-audit`);
        if (btn) {
            btn.innerText = "⏳ Analisi...";
            btn.disabled = true;
        }

        try {
            this.saveReportToHistory();
            const def = this.findReportItemDefinition(itemId);
            
            const prompt = `Agisci come Ingegnere Tecnico Senior. Analizza questa foto ("Figura ${photoIdx+1}: ${photo.caption}") per l'attività: "${def.name}".
            FORMATO (Word Style):
            **TITOLO CRITICITÀ**
            - **Descrizione**: [Analisi oggettiva]
            - **Rischio**: [Impatto tecnico]
            - **Normativa**: [Norme precise]`;

            // Use the AI module helper (callGeminiVision is defined in reports_module or ai_module)
            const auditText = await this.callGeminiVision(photo.src, prompt);
            if (auditText) {
                state.photos[photoIdx].audit = auditText;
                this.renderReportStructure();
            }
        } catch (err) {
            console.error("Audit Error:", err);
            alert("❌ Errore analisi: " + err.message);
            if (btn) {
                btn.innerText = "🛡️ Analizza";
                btn.disabled = false;
            }
        }
    },

    async callGeminiVision(base64Image, prompt) {
        const endpoint = `http://127.0.0.1:3001/api/proxy-ai`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ 
                    parts: [
                        { text: prompt }, 
                        { inline_data: { mime_type: "image/jpeg", data: base64Image.split(',')[1] } }
                    ]
                }] 
            })
        });

        if (!response.ok) throw new Error("Errore API Gemini");
        const res = await response.json();
        return res.candidates[0].content.parts[0].text.trim();
    },

    triggerReportUpload(zone) {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
        input.onchange = (e) => { if (e.target.files[0]) this.handleReportFile(e.target.files[0], zone); };
        input.click();
    },

    handleReportPaste(e, zone) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            if (items[index].kind === 'file') this.handleReportFile(items[index].getAsFile(), zone);
        }
    },

    handleReportFile(file, zone) {
        const r = new FileReader();
        r.onload = (e) => {
            const cell = zone.closest('.photo-cell');
            const id = cell.dataset.itemId;
            const idx = cell.dataset.photoIdx;
            this.report.reportState[id].photos[idx].src = e.target.result;
            this.renderReportStructure();
        };
        r.readAsDataURL(file);
    },

    setupReportEvents() {
        // Drag & Drop
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const zone = e.target.closest('.drop-zone');
            if (zone && e.dataTransfer.files.length) this.handleReportFile(e.dataTransfer.files[0], zone);
        });

        // Click Listeners for Sidebar Buttons
        const bindings = {
            'btn-ai-import': () => this.triggerAIImport(),
            'btn-ai-autofill': () => this.handleAIAutoFill(),
            'btn-report-pdf': () => this.printReport(),
            'btn-report-word': () => {
                console.log("BM_v2: btn-report-word clicked");
                this.exportToWord();
            },
            'btn-report-save': () => this.saveReportProject(),
            'btn-report-archive': () => this.openSavedReportsList(),
            'btn-report-reset': () => this.resetReport(),
            'undo-btn': () => this.undoReportAction()
        };

        Object.entries(bindings).forEach(([id, fn]) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        });

        // File Inputs
        const aiInput = document.getElementById('ai-import-input');
        if (aiInput) aiInput.addEventListener('change', (e) => this.handleAIReportImport(e));

        const loadInput = document.getElementById('load-project-input');
        if (loadInput) loadInput.addEventListener('change', (e) => this.loadReportProject(e));
    },

    triggerAIImport() {
        const input = document.getElementById('ai-import-input');
        if (input) input.click();
    },

    async handleAIAutoFill() {
        if (this.report.selectedCodes.size === 0) {
            alert("⚠️ Seleziona almeno un impianto per l'Auto-Fill.");
            return;
        }

        const btn = document.getElementById('btn-ai-autofill');
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class='fas fa-magic fa-spin'></i> AI Filling...";
        btn.disabled = true;

        try {
            this.saveReportToHistory();
            const selectedItems = Array.from(this.report.selectedCodes).map(id => {
                const def = this.findReportItemDefinition(id);
                return { id, name: def.name };
            });

            const siteName = document.getElementById('presidio-select').value || "Sito Generico";

            const prompt = `Agisci come Ingegnere Tecnico Senior. Genera una sintesi tecnica professionale (3-4 righe) per ciascuna delle seguenti attività manutentive svolte presso il sito "${siteName}".
            Le attività sono:
            ${selectedItems.map(i => `- ${i.name} (ID: ${i.id})`).join('\n')}

            Regole:
            1. Sii molto tecnico e preciso.
            2. Simula una verifica andata a buon fine ma con piccoli dettagli di nota.
            3. Restituisci un JSON con questa struttura: {"results": [{"id": "ID_ATTIVITA", "text": "TESTO_SINTESI"}]}
            4. Rispondi SOLO col JSON.`;

            // Use the proxy endpoint via callGeminiText (we need to define it or use fetch directly)
            const response = await fetch(`http://localhost:3001/api/proxy-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });

            if (!response.ok) throw new Error("Errore API AI");
            const res = await response.json();
            const text = res.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                data.results.forEach(res => {
                    if (this.report.reportState[res.id]) {
                        // Fill the first photo audit as a general comment if empty
                        if (this.report.reportState[res.id].photos.length > 0) {
                            this.report.reportState[res.id].photos[0].audit = res.text;
                        }
                    }
                });
                this.renderReportStructure();
                
                // Toast
                const toast = document.createElement('div');
                toast.className = 'save-toast visible';
                toast.style.background = '#6741d9';
                toast.innerHTML = `<i class="fas fa-magic"></i> AI Auto-Fill completato!`;
                document.body.appendChild(toast);
                setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2000);
            }
        } catch (err) {
            console.error("AutoFill Error:", err);
            alert("❌ Errore AI: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    saveReportToHistory() {
        this.report.historyStack.push(structuredClone(this.report.reportState));
        if (this.report.historyStack.length > 10) this.report.historyStack.shift(); 
        const btn = document.getElementById('undo-btn');
        if (btn) btn.style.display = 'inline-block';
    },

    undoReportAction() {
        if (this.report.historyStack.length === 0) return;
        this.report.reportState = this.report.historyStack.pop();
        this.renderReportStructure();
        const btn = document.getElementById('undo-btn');
        if (btn && this.report.historyStack.length === 0) btn.style.display = 'none';
    },

    /** AI SMART IMPORT LOGIC **/
    async handleAIReportImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Loading State
        const btn = document.getElementById('btn-ai-import');
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class='fas fa-circle-notch fa-spin'></i> Analisi AI...";
        btn.disabled = true;

        try {
            const base64Data = await this.fileToReportBase64(file);
            const mimeType = file.type;

            const aiResult = await this.analyzeOldReport(base64Data, mimeType);
            if (aiResult) {
                this.applyAIReportResult(aiResult);
                // Success feedback is handled by applyAIReportResult
            } else {
                alert("❌ Non è stato possibile estrarre dati validi dal documento.");
            }
        } catch (err) {
            console.error("[AI Import Error]:", err);
            alert("❌ Errore durante l'analisi AI: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            event.target.value = ""; // Reset input
        }
    },

    fileToReportBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async analyzeOldReport(base64Data, mimeType) {
        // Normalize MIME type
        let safeMimeType = mimeType;
        if (safeMimeType.includes('pdf')) safeMimeType = 'application/pdf';

        const availableActivities = this.report.config.sectionsDefinition.flatMap(s => 
            s.items.map(i => `ID: "${i.id}" - Descrizione: "${i.name}"`)
        ).join('\n');

        const prompt = `Analizza questo vecchio verbale/relazione di manutenzione tecnica.
        
        COMPITO:
        Converti il contenuto nel formato strutturato del nostro nuovo template.
        
        ATTIVITÀ DISPONIBILI NEL NUOVO TEMPLATE (Usa solo questi ID):
        ${availableActivities}

        DATI DA ESTRARRE (JSON):
        {
            "site_name": "Nome del presidio/sito",
            "date": "YYYY-MM-DD",
            "found_activities": [
                {
                    "activity_id": "L'ID esatto scelto dalla lista sopra",
                    "technical_summary": "Sintesi tecnica dei rilievi trovati per questa attività",
                    "is_conforming": true
                }
            ]
        }

        REGOLE:
        1. Mappa le descrizioni del vecchio report agli ID attività più pertinenti.
        2. Se un'attività non è presente nel vecchio report, non includerla.
        3. Il campo "technical_summary" deve essere professionale e pronto per la relazione.
        4. Rispondi SOLO con il JSON puro.`;

        const endpoint = `http://127.0.0.1:3001/api/proxy-ai`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: safeMimeType, data: base64Data } }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API Error ${response.status}: ${errorBody.error?.message || 'Errore sconosciuto'}`);
            }

            const res = await response.json();
            
            if (!res.candidates || res.candidates.length === 0) {
                throw new Error("L'AI non ha generato alcuna risposta.");
            }

            const text = res.candidates[0].content.parts[0].text.trim();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                console.log("AI Response without JSON:", text);
                throw new Error("L'AI ha risposto ma non ha prodotto un formato dati valido.");
            }
            
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("Gemini Error:", e);
            throw e;
        }
    },

    applyAIReportResult(data) {
        this.saveReportToHistory();
        
        // 1. Set Date
        if (data.date) {
            const dateInput = document.getElementById('report-date');
            if (dateInput) {
                dateInput.value = data.date;
                this.updateReportDateDisplay(data.date);
            }
        }

        // 2. Set Site (try to find best match)
        if (data.site_name) {
            const select = document.getElementById('presidio-select');
            let bestMatch = "";
            let maxScore = 0;
            
            Array.from(select.options).forEach(opt => {
                if (!opt.value) return;
                const score = this.calculateReportMatchScore(data.site_name, opt.value);
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = opt.value;
                }
            });

            if (bestMatch && maxScore > 60) {
                select.value = bestMatch;
                select.dispatchEvent(new Event('change'));
            }
        }

        // 3. Select Activities and Fill State
        if (data.found_activities) {
            data.found_activities.forEach(act => {
                const def = this.findReportItemDefinition(act.activity_id);
                if (def) {
                    this.report.selectedCodes.add(act.activity_id);
                    
                    // Sync UI checkbox
                    const cb = document.querySelector(`#service-picker input[data-id="${act.activity_id}"]`);
                    if (cb) cb.checked = true;

                    // Create or update state
                    if (!this.report.reportState[act.activity_id]) {
                        this.report.reportState[act.activity_id] = { 
                            photos: def.figures.map((f, i) => ({ 
                                caption: f, 
                                src: null, 
                                audit: i === 0 ? act.technical_summary : "" 
                            })) 
                        };
                    } else {
                        if (this.report.reportState[act.activity_id].photos.length > 0) {
                            this.report.reportState[act.activity_id].photos[0].audit = act.technical_summary;
                        }
                    }
                }
            });
        }

        this.renderReportStructure();
        
        // Final Success Toast
        const toast = document.createElement('div');
        toast.className = 'save-toast visible';
        toast.style.background = '#ae3ec9';
        toast.innerHTML = `<i class="fas fa-magic"></i> Conversione AI completata con successo!`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
    },

    calculateReportMatchScore(s1, s2) {
        const n1 = s1.toLowerCase();
        const n2 = s2.toLowerCase();
        if (n1 === n2) return 100;
        if (n1.includes(n2) || n2.includes(n1)) return 80;
        return 0;
    },

    saveReportProject() {
        const siteSelect = document.getElementById('presidio-select');
        const siteName = siteSelect.value || 'nuovo';
        const dateVal = document.getElementById('report-date').value || new Date().toISOString().split('T')[0];
        
        const projectData = {
            site: siteName,
            date: dateVal,
            selectedCodes: Array.from(this.report.selectedCodes),
            reportState: this.report.reportState,
            savedAt: new Date().toISOString()
        };
        
        // Sanitize filename
        const safesite = siteName.replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s-]/g, '').replace(/\s+/g, '_');
        const fileName = `Relazione_${safesite}_${dateVal}.json`;
        
        fetch('/api/save-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-File-Name': encodeURIComponent(fileName)
            },
            body: JSON.stringify(projectData, null, 2)
        })
        .then(r => r.json())
        .then(result => {
            if (result.ok) {
                // Show success toast
                const toast = document.createElement('div');
                toast.className = 'save-toast';
                toast.innerHTML = `<i class="fas fa-check-circle"></i> Relazione salvata: <strong>${fileName}</strong>`;
                document.body.appendChild(toast);
                setTimeout(() => toast.classList.add('visible'), 50);
                setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);
                console.log(`[Reports] Salvato in: ${result.path}`);
            } else {
                alert(`❌ Errore salvataggio: ${result.error}`);
            }
        })
        .catch(err => {
            console.error('[Reports] Errore salvataggio:', err);
            alert('❌ Impossibile salvare. Il server è attivo?');
        });
    },

    applyReportData(data) {
        try {
            this.report.selectedCodes = new Set(data.selectedCodes || []);
            this.report.reportState = data.reportState || {};
            
            document.getElementById('report-date').value = data.date || "";
            const siteSelect = document.getElementById('presidio-select');
            siteSelect.value = data.site || "";
            
            // Sync UI checkboxes
            document.querySelectorAll('#service-picker input[type="checkbox"]').forEach(cb => {
                cb.checked = this.report.selectedCodes.has(cb.dataset.id);
            });
            
            // Trigger site updates
            const opt = siteSelect.options[siteSelect.selectedIndex];
            if(opt) {
                document.getElementById('display-presidio-name').innerText = siteSelect.value;
                document.getElementById('display-presidio-address').innerText = opt.dataset.address || "-";
                document.getElementById('display-presidio-id').innerText = opt.dataset.id || "-";
                const footerText = document.getElementById('footer-presidio');
                if(footerText) footerText.innerText = siteSelect.value || "...";
            }
            this.updateReportDateDisplay(data.date || "");
            this.renderReportStructure();
            return true;
        } catch (err) {
            console.error("[Reports] Error applying data:", err);
            return false;
        }
    },

    loadReportProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (this.applyReportData(data)) {
                    console.log("[Reports] Progetto caricato da file locale.");
                } else {
                    alert("❌ Formato file non valido.");
                }
            } catch (err) {
                console.error(err);
                alert("❌ Errore parsing JSON.");
            }
        };
        reader.readAsText(file);
    },

    async openSavedReportsList() {
        console.log('[Reports] Loading archive...');
        try {
            const resp = await fetch('/api/save-report');
            console.log('[Reports] Response status:', resp.status);
            if (!resp.ok) throw new Error(`Errore server: ${resp.status}`);
            const files = await resp.json();
            console.log('[Reports] Files found:', files);
            
            let html = `
                <div class="archive-modal">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin:0; color: var(--primary);"><i class="fas fa-archive"></i> Archivio Relazioni</h2>
                        <button class="v2-info-btn" onclick="document.getElementById('load-project-input').click()">
                            <i class="fas fa-upload"></i> Carica locale
                        </button>
                    </div>
                    <div class="archive-list custom-scrollbar" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px;">
            `;
            
            if (files.length === 0) {
                html += `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Nessun salvataggio trovato sul server.</div>`;
            } else {
                html += `<table style="width: 100%; border-collapse: collapse;">
                    <thead style="position: sticky; top: 0; background: var(--surface-glass); z-index: 10;">
                        <tr>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--border);">File</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--border);">Data Salvataggio</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 1px solid var(--border);">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>`;
                
                files.forEach(f => {
                    const d = new Date(f.modified).toLocaleString();
                    html += `
                        <tr class="archive-row">
                            <td style="padding: 12px; border-bottom: 1px solid var(--border); font-weight: 500;">${f.name}</td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 0.9em;">${d}</td>
                            <td style="padding: 12px; border-bottom: 1px solid var(--border); text-align: right;">
                                <button class="v2-info-btn" onclick="BM_v2.loadReportFromServer('${f.name}')" style="padding: 4px 10px;">Apri</button>
                            </td>
                        </tr>
                    `;
                });
                
                html += `</tbody></table>`;
            }
            
            html += `</div></div>`;
            
            // Use existing ARIA modal if available
            if (typeof this.openAriaModal === 'function') {
                this.openAriaModal(html, "Archivio Relazioni");
            } else if (document.getElementById('aria-modal')) {
                // Fallback for manual opening
                const modal = document.getElementById('aria-modal');
                const body = document.getElementById('aria-modal-body');
                const titleEl = document.getElementById('aria-modal-title');
                
                if (titleEl) titleEl.innerText = "Archivio Relazioni";
                if (body) body.innerHTML = html;
                modal.classList.add('visible');
            } else {
                alert("Sistema modale non trovato.");
            }
            
        } catch (err) {
            console.error("[Reports] Error fetching archive:", err);
            alert("❌ Impossibile caricare l'archivio dal server.");
        }
    },

    async loadReportFromServer(fileName) {
        try {
            // Use API endpoint instead of direct file access
            const url = `/api/get-report?file=${encodeURIComponent(fileName)}`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error("File not found on server");
            
            const data = await resp.json();
            if (this.applyReportData(data)) {
                // Close modal
                if (document.getElementById('aria-modal')) {
                    document.getElementById('aria-modal').classList.remove('visible');
                }
                
                // Show success toast
                const toast = document.createElement('div');
                toast.className = 'save-toast visible';
                toast.innerHTML = `<i class="fas fa-file-import"></i> Caricato: <strong>${fileName}</strong>`;
                document.body.appendChild(toast);
                setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2000);
            }
        } catch (err) {
            console.error("[Reports] Error loading from server:", err);
            alert("❌ Errore nel caricamento del file dal server.");
        }
    },

    resetReport() {
        const modalHtml = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 40px; color: #ff922b; margin-bottom: 15px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: var(--text-main); margin-bottom: 10px;">Conferma Reset</h3>
                <p style="color: var(--text-muted); margin-bottom: 25px;">
                    Sei sicuro di voler cancellare tutti i dati della relazione corrente?<br>
                    L'operazione non può essere annullata.
                </p>
                <div style="display: flex; justify-content: center; gap: 12px;">
                    <button class="v2-info-btn" onclick="BM_v2.closeAriaModal()" style="background: #666; padding: 10px 20px;">
                        Annulla
                    </button>
                    <button class="v2-info-btn" id="confirm-reset-btn" style="background: #e03131; padding: 10px 20px;">
                        Sì, Resetta Tutto
                    </button>
                </div>
            </div>
        `;
        
        this.openAriaModal(modalHtml, "Attenzione");
        
        // Add listener for the confirm button inside the modal
        const confirmBtn = document.getElementById('confirm-reset-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.report.selectedCodes.clear();
                this.report.reportState = {};
                this.renderReportStructure();
                document.querySelectorAll('#service-picker input[type="checkbox"]').forEach(cb => cb.checked = false);
                this.closeAriaModal();
                
                // Show success toast
                const toast = document.createElement('div');
                toast.className = 'save-toast visible';
                toast.style.background = '#666';
                toast.innerHTML = `<i class="fas fa-sync-alt"></i> Relazione resettata.`;
                document.body.appendChild(toast);
                setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2000);
            };
        }
    },

    printReport() {
        window.print();
    },

    async exportToWord() {
        if (this._isExporting) return;
        
        console.log("BM_v2: Starting Word Export (Local v7.1.1 mode)...");
        
        const btn = document.getElementById('btn-report-word');
        const originalHtml = btn ? btn.innerHTML : '<i class="fas fa-file-word"></i> Word';

        // La libreria locale v7.1.1 espone 'docx' in window
        let docxLib = window.docx;
        
        if (!docxLib) {
            console.warn("BM_v2: window.docx not found, checking global scope...");
            docxLib = typeof docx !== 'undefined' ? docx : null;
        }

        if (!docxLib) {
            console.error("BM_v2: DOCX library not found locally.");
            alert("Errore: La libreria Word non è stata caricata correttamente. Prova a premere CTRL+F5.");
            return;
        }

        if (btn) {
            this._isExporting = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generazione...';
            btn.disabled = true;
        }


        try {
            console.log("BM_v2: docxLib detected:", docxLib);
            
            // In v7.1.1 i membri sono spesso diretti o sotto .default se caricato come modulo
            const Document = docxLib.Document;
            const Packer = docxLib.Packer;
            const Paragraph = docxLib.Paragraph;
            const TextRun = docxLib.TextRun;
            const HeadingLevel = docxLib.HeadingLevel;
            const ImageRun = docxLib.ImageRun;
            const AlignmentType = docxLib.AlignmentType;

            if (!Document || !Packer) {
                console.error("BM_v2: Missing core members in v7.1.1:", docxLib);
                throw new Error("I componenti della libreria Word (Document/Packer) non sono accessibili.");
            }


            const siteSelect = document.getElementById('presidio-select');
            const siteName = siteSelect ? siteSelect.value : "Sito Non Specificato";
            const dateInput = document.getElementById('report-date');
            const dateVal = dateInput ? dateInput.value : new Date().toLocaleDateString();

            console.log(`BM_v2: Exporting report for ${siteName}`);

            const sections = [];

            // Title and Site Info
            sections.push(
                new Paragraph({
                    text: "RELAZIONE TECNICA DI MANUTENZIONE",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `SITO: ${siteName}`, bold: true }),
                        new TextRun({ text: `\tDATA: ${dateVal}`, bold: true }),
                    ],
                    spacing: { before: 400, after: 400 },
                })
            );



            // Iterate over selected activities
            if (this.report.selectedCodes.size === 0) {
                sections.push(new Paragraph({ text: "Nessun impianto selezionato per questa relazione.", italic: true }));
            }

            for (const id of this.report.selectedCodes) {
                const state = this.report.reportState[id];
                if (!state) continue;
                const def = this.findReportItemDefinition(id);
                if (!def) continue;

                sections.push(
                    new Paragraph({
                        text: `${def.name} (${id})`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 },
                    })
                );

                for (const photo of state.photos) {
                    sections.push(
                        new Paragraph({
                            text: `Rilievo: ${photo.caption || 'Nessuna didascalia'}`,
                            bold: true,
                            spacing: { before: 200, after: 100 },
                        })
                    );

                    // Add Image if present
                    if (photo.src && photo.src.startsWith('data:image')) {
                        try {
                            const base64Data = photo.src.split(',')[1];
                            const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                            
                            sections.push(
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: buffer,
                                            transformation: { width: 400, height: 300 },
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                })
                            );
                        } catch (e) {
                            console.warn("BM_v2: Failed to embed image in Word:", e);
                        }
                    }

                    // Add Audit Text
                    if (photo.audit) {
                        sections.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Analisi Tecnica:", bold: true, color: "2b5797" }),
                                    new TextRun({ text: `\n${photo.audit}` }),
                                ],
                                spacing: { after: 300 },
                            })
                        );
                    }
                }
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: sections,
                }],
            });

            console.log("BM_v2: Packing document to blob...");
            const blob = await Packer.toBlob(doc);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const safeSiteName = siteName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `Relazione_${safeSiteName}_${dateVal.replace(/\//g, '-')}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log("BM_v2: Word Export Complete.");

        } catch (err) {
            console.error("BM_v2: Word Export Error:", err);
            alert("❌ Errore durante l'esportazione Word: " + err.message);
        } finally {
            this._isExporting = false;
            if (btn) {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }
    },


    openAriaModal(html, title = "Dettaglio") {
        const modal = document.getElementById('aria-modal');
        const body = document.getElementById('aria-modal-body');
        const titleEl = document.getElementById('aria-modal-title');
        
        if (!modal) {
            console.error("[Modal] Errore: Elemento #aria-modal non trovato nel DOM!");
            alert("Errore critico: Infrastruttura modale mancante.");
            return;
        }
        if (!body) {
            console.error("[Modal] Errore: Elemento #aria-modal-body non trovato!");
            return;
        }
        
        titleEl.innerText = title;
        body.innerHTML = html;

        const closeBtn = modal.querySelector('.aria-modal-close');
        if (closeBtn) {
            // Use a clean listener to avoid conflicts
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                modal.classList.remove('visible');
            };
        }

        modal.classList.add('visible');
    },

    closeAriaModal() {
        const modal = document.getElementById('aria-modal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }
});
