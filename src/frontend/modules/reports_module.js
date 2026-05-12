/**
 * BM PREMIUM v2 | REPORTS MODULE
 * Logic for Technical Report Generation (Don Orione 2 Fidelity)
 */

Object.assign(BM_v2, {
    report: {
        selectedCodes: new Set(),
        reportState: {},
        historyStack: [],
        
        config: (typeof REPORT_CONFIG !== 'undefined') ? REPORT_CONFIG : { ALL_CONTRACT_CODES: [], documentationMapping: {}, sectionsDefinition: [] }
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
        const endpoint = `http://127.0.0.1:3005/api/proxy-ai`;
        
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Extract message from various possible formats
            const msg = (errorData.error && typeof errorData.error === 'object' ? errorData.error.message : null) || 
                        (typeof errorData.error === 'string' ? errorData.error : null) || 
                        errorData.message || 
                        "Errore API Gemini";
            
            console.error("BM_v2: Gemini API Error details:", errorData);
            throw new Error(msg);
        }
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
            'btn-direct-import': () => this.triggerDirectImport(),
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

        const directInput = document.getElementById('direct-import-input');
        if (directInput) directInput.addEventListener('change', (e) => this.handleDirectImport(e));

        const loadInput = document.getElementById('load-project-input');
        if (loadInput) loadInput.addEventListener('change', (e) => this.loadReportProject(e));

        const styleInput = document.getElementById('style-migration-input');
        if (styleInput) styleInput.addEventListener('change', (e) => this.handleStyleMigration(e));
    },

    triggerAIImport() {
        const input = document.getElementById('ai-import-input');
        if (input) input.click();
    },

    triggerDirectImport() {
        const input = document.getElementById('direct-import-input');
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
            const response = await fetch(`http://127.0.0.1:3005/api/proxy-ai`, {
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
            let aiResult;
            let extractedImages = [];
            const mimeType = file.type;
            const isWord = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                           mimeType === 'application/vnd.ms-word.document.macroEnabled.12' ||
                           file.name.endsWith('.docx') || 
                           file.name.endsWith('.docm');

            if (isWord) {
                // 1. Gestione Word via Mammoth (HTML per preservare la struttura)
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                const htmlContent = result.value;
                console.log("[AI Import] Struttura HTML estratta da Word.");
                
                // 2. Estrazione Immagini via JSZip
                extractedImages = await this.extractImagesFromWord(arrayBuffer);
                console.log(`[AI Import] Estratte ${extractedImages.length} immagini dal documento.`);

                aiResult = await this.analyzeOldReport(htmlContent, 'text/html');
            } else {
                // Gestione PDF/Foto
                const base64Data = await this.fileToReportBase64(file);
                aiResult = await this.analyzeOldReport(base64Data, mimeType);
            }

            if (aiResult) {
                // Passiamo anche le immagini estratte alla funzione di applicazione
                this.applyAIReportResult(aiResult, extractedImages);
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

    async handleStyleMigration(event) {
        const file = event.target.files[0];
        if (!file) return;

        showToast("🪄 Migrazione Stile Premium in corso...", "info");
        const btn = event.target.previousElementSibling;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conversione...';
        btn.disabled = true;

        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // 1. Estrazione Integrale (Disabilitiamo immagini inline per risparmiare token)
            const resultHtml = await mammoth.convertToHtml({ 
                arrayBuffer,
                convertImage: mammoth.images.inline(() => ({})) 
            });
            const photos = await this.extractImagesFromWord(arrayBuffer);

            // 2. Chiediamo all'AI di mappare i testi (Zero-Loss)
            const availableActivities = this.report.config.sectionsDefinition.flatMap(s => 
                s.items.map(i => `ID: "${i.id}" - Nome: "${i.name}"`)
            ).join('\n');

            const prompt = `
                MIGRAZIONE INTEGRALE - STILE PREMIUM V3
                Hai il compito di trasformare una vecchia relazione nel formato V3 "High-Fidelity".
                
                OBIETTIVO: 
                Estrarre SOLAMENTE i testi inerenti all'analisi tecnica degli impianti e delle foto. 
                Escludi dati anagrafici, indirizzi, numeri di telefono e intestazioni generali.

                REGOLE DI FERRO:
                1. FEDELTÀ ASSOLUTA: Copia LETTERALMENTE ogni singola parola dell'analisi tecnica originale. NON riassumere.
                2. FOCUS FOTO: Il testo deve essere associato alle attività tecniche che verranno visualizzate sotto le foto.
                3. MAPPATURA: Distribuisci i testi negli ID attività forniti sotto. Se un testo riguarda più impianti, dividilo o associalo all'attività più pertinente.
                
                ATTIVITÀ DISPONIBILI (ID):
                ${availableActivities}
                
                FORMATO OUTPUT (JSON PURO):
                {
                   "site_name": "...",
                   "date": "...",
                   "found_activities": [
                      { 
                        "activity_id": "ID_SCELTO", 
                        "technical_summary": "TESTO ORIGINALE INTEGRALE E DETTAGLIATO", 
                        "is_conforming": true 
                      }
                   ]
                }

                TESTO ORIGINALE DA ANALIZZARE (HTML):
                ${resultHtml.value.replace(/`/g, "'")}
            `;

            const body = {
                contents: [{
                    parts: [
                        { text: prompt }
                    ]
                }]
            };

            const response = await fetch('http://localhost:3005/api/proxy-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error("Errore AI Proxy");
            const aiData = await response.json();
            
            // 3. Applichiamo tutto al template V3
            if (aiData && aiData.found_activities) {
                this.applyAIReportResult(aiData, photos, true); // true = append/fidelity
                showToast("✨ Relazione convertita nello stile V3!", "success");
            }

        } catch (error) {
            console.error("Errore migrazione stile:", error);
            showToast("❌ Impossibile completare la conversione", "error");
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            event.target.value = "";
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

    async handleDirectImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const btn = document.getElementById('btn-direct-import');
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class='fas fa-circle-notch fa-spin'></i> Importazione...";
        btn.disabled = true;

        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // 1. Estrazione HTML (per preservare la struttura)
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            let content = result.value;
            
            // 2. Estrazione Immagini
            const extractedImages = await this.extractImagesFromWord(arrayBuffer);

            // 3. Mapping Strutturale Avanzato (Analisi Elementi)
            const activitiesMap = new Map(); // id -> text[]
            const allItems = this.report.config.sectionsDefinition.flatMap(s => s.items);
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            let currentActivityId = null;

            // Iteriamo su tutti gli elementi figli dell'HTML estratto
            Array.from(tempDiv.children).forEach(el => {
                const text = el.innerText.trim();
                if (!text) return;

                // Verifichiamo se questo elemento è un "Titolo" di un'attività
                let foundItem = allItems.find(item => 
                    text.toLowerCase() === item.name.toLowerCase() || 
                    text.toLowerCase().includes(`attività: ${item.name.toLowerCase()}`) ||
                    item.alias.some(a => text.toLowerCase() === a.toLowerCase())
                );

                // Se non è un match esatto, proviamo a vedere se il testo "contiene" un'attività (es. "1. Caldaia")
                if (!foundItem && (el.tagName.startsWith('H') || el.querySelector('strong'))) {
                    foundItem = allItems.find(item => 
                        text.toLowerCase().includes(item.name.toLowerCase()) ||
                        item.alias.some(a => text.toLowerCase().includes(a.toLowerCase()))
                    );
                }

                if (foundItem) {
                    currentActivityId = foundItem.id;
                    if (!activitiesMap.has(currentActivityId)) {
                        activitiesMap.set(currentActivityId, []);
                    }
                } else if (currentActivityId) {
                    // FILTRO SELETTIVO: Accettiamo solo testo che sembra un'analisi tecnica
                    // Scartiamo righe troppo corte, dati anagrafici o intestazioni ripetitive
                    const isTechnical = 
                        text.length > 20 && // Analisi dignitosa
                        !text.toLowerCase().includes("via ") && // No indirizzi
                        !text.toLowerCase().includes("tel:") && // No contatti
                        !text.toLowerCase().includes("pag.") && // No numeri pagina
                        (el.tagName === 'P' || el.tagName === 'LI' || el.querySelector('strong'));

                    if (isTechnical) {
                        activitiesMap.get(currentActivityId).push(text); // Prendiamo solo il testo pulito
                    }
                }
            });

            // Trasformiamo la mappa in array per l'applicazione
            const activities = [];
            activitiesMap.forEach((parts, id) => {
                if (parts.length > 0) {
                    activities.push({
                        activity_id: id,
                        technical_summary: parts.join('\n\n'), // Uniamo i vari paragrafi di analisi
                        is_conforming: true
                    });
                }
            });

            if (activities.length === 0) {
                alert("⚠️ Nessuna sezione riconosciuta. Assicurati che nel Word i titoli delle attività (es. 'Caldaia') siano ben visibili o in grassetto.");
            }

            // 4. Applicazione con APPEND
            this.applyAIReportResult({
                found_activities: activities,
                site_name: file.name.split('_')[0], // Ipotesi: NomeSito_Data.docx
                date: new Date().toISOString().split('T')[0]
            }, extractedImages, true); // Flag true per APPEND

        } catch (err) {
            console.error("[Direct Import Error]:", err);
            alert("❌ Errore durante l'importazione: " + err.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            event.target.value = "";
        }
    },
    async analyzeOldReport(data, mimeType) {
        // Normalize MIME type
        let safeMimeType = mimeType;
        if (safeMimeType.includes('pdf')) safeMimeType = 'application/pdf';

        const availableActivities = this.report.config.sectionsDefinition.flatMap(s => 
            s.items.map(i => `ID: "${i.id}" - Descrizione: "${i.name}"`)
        ).join('\n');

        const prompt = `Analizza questo documento tecnico (formato: ${mimeType}). 
        
        REQUISITO FONDAMENTALE: FEDELTÀ ASSOLUTA
        Devi copiare LETTERALMENTE i testi tecnici presenti nel file originale. NON riassumere, NON parafrasare. 
        Se trovi una descrizione di un'attività o di un guasto, copiala integralmente nel campo "technical_summary".

        COMPITO:
        Mappa ogni sezione del file originale sull'ID attività più pertinente tra quelli forniti.
        
        ATTIVITÀ DISPONIBILI NEL NUOVO TEMPLATE:
        ${availableActivities}

        DATI DA ESTRARRE (JSON):
        {
            "site_name": "Nome esatto del sito",
            "date": "Data in formato YYYY-MM-DD",
            "found_activities": [
                {
                    "activity_id": "L'ID esatto della lista",
                    "technical_summary": "TESTO ORIGINALE INTEGRALE COPIATO DAL FILE",
                    "is_conforming": true/false
                }
            ]
        }

        REGOLE:
        1. Se il file originale è diviso in sezioni (es. Intestazioni h1, h2 o paragrafi separati), tratta ogni sezione come un'attività distinta.
        2. NON tralasciare alcuna informazione tecnica.
        3. Assicurati che l'ID scelto corrisponda realmente al contenuto del testo.
        4. Rispondi SOLO con il JSON puro.`;

        const endpoint = `http://127.0.0.1:3005/api/proxy-ai`;
        
        try {
            let body;
            if (mimeType === 'text/plain' || mimeType === 'text/html') {
                // Invia testo puro o HTML
                body = {
                    contents: [{
                        parts: [
                            { text: prompt + "\n\nCONTENUTO DOCUMENTO:\n" + data }
                        ]
                    }]
                };
            } else {
                // Invia file (PDF/Immagine)
                body = {
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: safeMimeType, data: data } }
                        ]
                    }]
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(`API Error ${response.status}: ${errorBody.error?.message || errorBody.error || 'Errore di connessione al proxy AI'}`);
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

    async extractImagesFromWord(arrayBuffer) {
        const images = [];
        try {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const mediaFolder = zip.folder("word/media");
            if (!mediaFolder) return [];

            const imageFiles = [];
            mediaFolder.forEach((relativePath, file) => {
                if (!file.dir) imageFiles.push(file);
            });

            // Ordiniamo i file per nome (image1, image2...) per mantenere l'ordine logico
            imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

            for (const file of imageFiles) {
                const content = await file.async("base64");
                const ext = file.name.split('.').pop().toLowerCase();
                const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                images.push(`data:${mimeType};base64,${content}`);
            }
        } catch (e) {
            console.error("Errore estrazione immagini Word:", e);
        }
        return images;
    },

    applyAIReportResult(data, extractedImages = [], append = false) {
        this.saveReportToHistory();
        
        // 1. Set Date
        if (data.date && !append) { // Solo se non è append aggiorniamo la data
            const dateInput = document.getElementById('report-date');
            if (dateInput) {
                dateInput.value = data.date;
                this.updateReportDateDisplay(data.date);
            }
        }

        // 2. Set Site
        if (data.site_name && !append) {
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
            let globalImgIdx = 0;

            data.found_activities.forEach(act => {
                const def = this.findReportItemDefinition(act.activity_id);
                if (def) {
                    this.report.selectedCodes.add(act.activity_id);
                    
                    // Sync UI checkbox
                    const cb = document.querySelector(`#service-picker input[data-id="${act.activity_id}"]`);
                    if (cb) cb.checked = true;

                    // Gestione Testo (APPEND o SOVRASCRITTURA)
                    const newSummary = act.technical_summary || "";

                    if (!this.report.reportState[act.activity_id]) {
                        this.report.reportState[act.activity_id] = { 
                            photos: def.figures.map((f, i) => {
                                const photoObj = { 
                                    caption: f, 
                                    src: null, 
                                    audit: i === 0 ? newSummary : "" 
                                };
                                if (globalImgIdx < extractedImages.length) {
                                    photoObj.src = extractedImages[globalImgIdx];
                                    globalImgIdx++;
                                }
                                return photoObj;
                            }) 
                        };
                    } else {
                        const state = this.report.reportState[act.activity_id];
                        if (state.photos.length > 0) {
                            if (append) {
                                state.photos[0].audit = (state.photos[0].audit ? state.photos[0].audit + "\n\n" : "") + newSummary;
                            } else {
                                state.photos[0].audit = newSummary;
                            }
                            
                            // Riempimento foto vuote
                            state.photos.forEach(p => {
                                if (!p.src && globalImgIdx < extractedImages.length) {
                                    p.src = extractedImages[globalImgIdx];
                                    globalImgIdx++;
                                }
                            });
                        }
                    }
                }
            });
        }

        this.renderReportStructure();
        
        // Final Success Toast
        const toast = document.createElement('div');
        toast.className = 'save-toast visible';
        toast.style.background = append ? '#2b8a3e' : '#ae3ec9';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> Importazione ${append ? 'Diretta' : 'AI'} completata! ${extractedImages.length > 0 ? `(${extractedImages.length} foto)` : ''}`;
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
                setTimeout(() => { 
                    toast.classList.remove('visible'); 
                    setTimeout(() => toast.remove(), 300); 
                }, 2000);
            };
        }
    },

    printReport() {
        window.print();
    },

    async exportToWord() {
        if (this._isExporting) return;
        
        console.log("BM_v2: Starting High-Fidelity Word Export (Running Headers & Footers)...");
        
        const btn = document.getElementById('btn-report-word');
        const originalHtml = btn ? btn.innerHTML : '<i class="fas fa-file-word"></i> Word';

        const docxLib = window.docx || (typeof docx !== 'undefined' ? docx : null);
        if (!docxLib) {
            alert("Errore: Libreria Word (docx.js) non trovata.");
            return;
        }

        const { 
            Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, 
            ImageRun, AlignmentType, WidthType, BorderStyle, HeadingLevel, 
            VerticalAlign, Header, Footer, PageNumber
        } = docxLib;

        const siteName = document.getElementById('display-presidio-name').innerText;
        const siteId = document.getElementById('display-presidio-id').innerText;
        const siteAddress = document.getElementById('display-presidio-address').innerText;
        const reportDate = document.getElementById('display-date').innerText;

        if (btn) {
            this._isExporting = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generazione...';
            btn.disabled = true;
        }

        // --- Helper: Fetch Logo Data (as ArrayBuffer for docx.js) ---
        const getLogoData = async () => {
            try {
                const resp = await fetch('assets/cmf_logo.png');
                if (!resp.ok) return null;
                return await resp.arrayBuffer();
            } catch (e) { 
                console.error("BM_v2: Logo fetch error:", e);
                return null; 
            }
        };

        const createCell = (content, options = {}) => {
            let children = [];
            if (typeof content === 'string') {
                children = [new Paragraph({
                    children: [new TextRun({ text: content, bold: options.bold || false, size: 20, font: "Aptos" })],
                    alignment: options.align || AlignmentType.LEFT
                })];
            } else {
                children = content;
            }

            return new TableCell({
                children: children,
                shading: options.bg ? { fill: options.bg } : undefined,
                width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                }
            });
        };

        const mapHtmlToTextRuns = (html) => {
            if (!html) return [];
            const runs = [];
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.replace(/<br>/g, '\n').replace(/&bull;/g, '•').replace(/&nbsp;/g, ' ');
            tempDiv.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    runs.push(new TextRun({ text: node.textContent, size: 21, font: "Aptos" }));
                } else if (node.nodeName === 'STRONG' || node.nodeName === 'B') {
                    runs.push(new TextRun({ text: node.textContent, bold: true, size: 21, font: "Aptos" }));
                }
            });
            return runs;
        };

        try {
            const logoData = await getLogoData();

            // --- 1. RUNNING HEADER ---
            const headerLogoChildren = [];
            if (logoData) {
                headerLogoChildren.push(new Paragraph({
                    children: [new ImageRun({ 
                        data: logoData, 
                        transformation: { width: 100, height: 35 },
                        type: "png"
                    })]
                }));
            }

            const runningHeader = new Header({
                children: [
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: headerLogoChildren,
                                        width: { size: 40, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.BOTTOM,
                                        margins: { bottom: 100 }
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [new TextRun({ text: "RELAZIONE TECNICA DI SOPRALLUOGO", bold: true, size: 22, font: "Aptos" })],
                                                alignment: AlignmentType.RIGHT
                                            }),
                                             new Paragraph({
                                                children: [new TextRun({ text: "Building Manager Intelligence System", size: 18, font: "Aptos" })],
                                                alignment: AlignmentType.RIGHT
                                            })
                                        ],
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        verticalAlign: VerticalAlign.BOTTOM,
                                        margins: { bottom: 100 }
                                    })
                                ]
                            })
                        ]
                    })
                ]
            });

            // --- 2. RUNNING FOOTER ---
            const runningFooter = new Footer({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: `CMF Consorzio Stabile - Relazione Tecnica Manutentiva - Presidio: ${siteName}`, size: 16, font: "Aptos" }),
                            new TextRun({ text: "\t\t", size: 16 }), 
                            new TextRun({ text: "Pag. ", size: 16, font: "Aptos" }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Aptos" }),
                            new TextRun({ text: " di ", size: 16, font: "Aptos" }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Aptos" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        borders: { top: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" } },
                        spacing: { before: 200 }
                    })
                ]
            });

            // --- 3. MAIN PAGE CONTENT ---
            const docContent = [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [createCell("ID Presidio", { bold: true, bg: "F2F2F2", width: 25 }), createCell(siteId || "")] }),
                        new TableRow({ children: [createCell("Indirizzo", { bold: true, bg: "F2F2F2" }), createCell(siteAddress || "")] }),
                        new TableRow({ children: [createCell("ID servizio (Codici)", { bold: true, bg: "F2F2F2" }), createCell(siteName || "", { bold: true })] }),
                        new TableRow({ children: [createCell("Data", { bold: true, bg: "F2F2F2" }), createCell(reportDate || "")] }),
                    ]
                }),
                new Paragraph({ text: "", spacing: { after: 300 } })
            ];

            // --- 4. CHECKBOX GRID ---
            const gridRows = [];
            const allCodes = this.report.config.ALL_CONTRACT_CODES;
            for (let i = 0; i < allCodes.length; i += 10) {
                const rowCells = [];
                for (let j = 0; j < 10; j++) {
                    const code = allCodes[i + j];
                    if (!code) break;
                    const isSelected = Array.from(this.report.selectedCodes).some(id => {
                        const def = this.findReportItemDefinition(id);
                        return def && def.alias.includes(code);
                    });
                    rowCells.push(new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: `${isSelected ? "☒" : "☐"} ${code}`, size: 16, font: "Aptos" })],
                            alignment: AlignmentType.CENTER
                        })],
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 2 },
                            bottom: { style: BorderStyle.SINGLE, size: 2 },
                            left: { style: BorderStyle.SINGLE, size: 2 },
                            right: { style: BorderStyle.SINGLE, size: 2 },
                        }
                    }));
                }
                gridRows.push(new TableRow({ children: rowCells }));
            }
            docContent.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: gridRows }));
            docContent.push(new Paragraph({ text: "", spacing: { after: 400 } }));

            // --- 5. SECTIONS LOOP ---
            this.report.config.sectionsDefinition.forEach(section => {
                const activeItems = section.items.filter(item => this.report.selectedCodes.has(item.id));
                if (activeItems.length === 0) return;

                activeItems.forEach(item => {
                    const state = this.report.reportState[item.id];
                    if (!state) return;

                    docContent.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({ children: [createCell("Codice:", { bold: true, bg: "F2F2F2", width: 30 }), createCell(item.id, { bold: true })] }),
                            new TableRow({ children: [createCell("Tipologia di servizio:", { bold: true, bg: "F2F2F2" }), createCell(section.category)] }),
                            new TableRow({ children: [createCell("Servizio:", { bold: true, bg: "F2F2F2" }), createCell(item.name, { bold: true })] }),
                        ]
                    }));

                    // Photos Grid
                    const photosRows = [];
                    for (let i = 0; i < state.photos.length; i += 2) {
                        const cells = [];
                        [i, i + 1].forEach(idx => {
                            const photo = state.photos[idx];
                            if (!photo) {
                                cells.push(new TableCell({ children: [], width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }));
                                return;
                            }
                            const cellChildren = [];
                            if (photo.src && photo.src.includes('base64,')) {
                                try {
                                    // Extract pure base64 and remove any potential whitespace/newlines
                                    const base64Data = photo.src.split(',')[1].replace(/\s/g, '');
                                    const img = new ImageRun({ 
                                        data: base64Data, 
                                        transformation: { width: 300, height: 225 } 
                                    });
                                    cellChildren.push(new Paragraph({ children: [img], alignment: AlignmentType.CENTER }));
                                } catch (e) { 
                                    console.error("BM_v2: Image processing error:", e);
                                    cellChildren.push(new Paragraph({ text: "[Errore Foto]" })); 
                                }
                            }
                            cellChildren.push(new Paragraph({
                                children: [new TextRun({ text: `Figura ${idx + 1}: ${photo.caption}`, bold: true, size: 20, font: "Aptos" })],
                                alignment: AlignmentType.CENTER, spacing: { before: 100 }
                            }));
                            cells.push(new TableCell({
                                children: cellChildren,
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 4 }, bottom: { style: BorderStyle.SINGLE, size: 4 },
                                    left: { style: BorderStyle.SINGLE, size: 4 }, right: { style: BorderStyle.SINGLE, size: 4 }
                                }
                            }));
                        });
                        photosRows.push(new TableRow({ children: cells }));
                    }
                    if (photosRows.length > 0) {
                        docContent.push(new Paragraph({ text: "", spacing: { after: 200 } }));
                        docContent.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: photosRows, borders: { insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } } }));
                    }

                    // Audits
                    state.photos.forEach((photo, idx) => {
                        if (!photo.audit) return;
                        docContent.push(new Paragraph({
                            children: [new TextRun({ text: `Analisi Tecnica Figura ${idx + 1}: ${photo.caption}`, bold: true, size: 21, font: "Aptos" })],
                            spacing: { before: 400, after: 150 }
                        }));
                        const auditLines = photo.audit.split(/<br\s*\/?>/i);
                        auditLines.forEach(line => {
                            const runs = mapHtmlToTextRuns(line);
                            if (runs.length > 0) docContent.push(new Paragraph({ children: runs, alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 } }));
                        });
                    });
                });

                // Documentation
                if (this.report.config.documentationMapping[section.docKey]) {
                    docContent.push(new Paragraph({
                        children: [new TextRun({ text: "Documentazione Tecnica e Rapporti di Controllo da richiedere:", bold: true, size: 22, underline: {}, font: "Aptos" })],
                        spacing: { before: 600, after: 200 }
                    }));
                    this.report.config.documentationMapping[section.docKey].forEach(doc => {
                        docContent.push(new Paragraph({
                            children: [new TextRun({ text: `• ${doc}`, size: 20, font: "Aptos" })],
                            indent: { left: 720 }, spacing: { after: 100 }
                        }));
                    });
                }
            });

            // --- 6. COMPILE DOCUMENT ---
            const doc = new Document({
                styles: {
                    default: {
                        document: { run: { size: 20, font: "Aptos" } }
                    }
                },
                sections: [{
                    properties: {
                        page: {
                            size: { width: 11906, height: 16838 }, // A4
                            margin: { top: 850, bottom: 850, left: 1020, right: 1020 }
                        }
                    },
                    headers: { default: runningHeader },
                    footers: { default: runningFooter },
                    children: docContent,
                }],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fn = (siteName || "Relazione").replace(/[^a-z0-9]/gi, '_');
            a.download = `${fn}_Sopralluogo.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

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
