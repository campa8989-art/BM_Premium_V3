/**
 * BM PREMIUM v2 | AI COMMAND CENTER
 * Integration with Gemini 1.5 for real-time technical analysis
 */

if (typeof BM_v2 === 'undefined') {
    window.BM_v2 = {};
}

Object.assign(BM_v2, {
    aiState: {
        isOpen: false,
        history: [],
        isProcessing: false
    },

    toggleAiCenter() {
        const modal = document.getElementById('ai-command-modal');
        const backdrop = document.getElementById('drawer-backdrop');
        if (!modal) return;

        this.aiState.isOpen = !this.aiState.isOpen;
        modal.classList.toggle('active', this.aiState.isOpen);
        const trigger = document.getElementById('ai-trigger');
        if (trigger) trigger.classList.toggle('active', this.aiState.isOpen);
        if (backdrop) backdrop.classList.toggle('active', this.aiState.isOpen);

        if (this.aiState.isOpen && this.aiState.history.length === 0) {
            this.addAiMessage("ai", "Buongiorno, sono il tuo assistente Gemini. Come posso aiutarti con la gestione dei 33 presidi oggi?");
        }

        if (this.aiState.isOpen) {
            setTimeout(() => {
                const input = document.getElementById('ai-input-field');
                if (input) input.focus();
            }, 500); // Wait for transition
        }
    },

    async sendAiQuery() {
        const input = document.getElementById('ai-input-field');
        const query = input.value.trim();
        if (!query || this.aiState.isProcessing) return;

        this.addAiMessage("user", query);
        input.value = "";
        this.aiState.isProcessing = true;
        this.updateAiStatus(true);

        try {
            const systemPrompt = this.prepareAiContext();
            const proxyUrl = window.AI_PROXY_URL || "http://localhost:3005/api/proxy-ai";
            
            console.log(`[AI] Sending query to proxy: ${proxyUrl}`);
            
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents: [
                        ...this.aiState.history.slice(-10).filter(m => m.text).map(m => ({
                            role: m.role === 'ai' ? 'model' : 'user',
                            parts: [{ text: m.text }]
                        })),
                        { role: "user", parts: [{ text: query }] }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Errore HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            const aiResponse = data.candidates[0].content.parts[0].text;
            this.addAiMessage("ai", aiResponse);

        } catch (error) {
            console.error("AI Error:", error);
            let userMsg = `⚠️ **ERRORE DI CONNESSIONE**\nNon riesco a contattare il server AI sulla porta 3005.\n\nAssicurati che il backend sia attivo (esegui \`run.ps1\`).`;
            if (error.message.includes('503')) {
                userMsg = `⚠️ **SERVIZIO SOVRACCARICO**\nIl sistema Gemini è momentaneamente congestionato. Riprova tra qualche istante.`;
            } else if (error.message.includes('quota')) {
                userMsg = `⚠️ **LIMITE RAGGIUNTO**\nQuota API Gemini esaurita per oggi.`;
            }
            this.addAiMessage("ai", userMsg);
        } finally {
            this.aiState.isProcessing = false;
            this.updateAiStatus(false);
        }
    },

    prepareAiContext() {
        // Estrazione dati reali per il contesto
        const sites = this.state.sites || [];
        const urgentSites = sites.filter(s => s.urgentCount > 0).map(s => ({
            nome: s.nome,
            urgenze: s.urgentCount,
            id: s.id
        }));

        const globalStats = {
            totalSites: sites.length,
            urgentSitesCount: urgentSites.length,
            systemIntegrity: document.getElementById('global-perc')?.textContent || "94.2%"
        };

        return `Sei l'Assistente Tecnico "Gemini Command" del Building Manager V3 (Sacco Group).
        Il sistema monitora ${globalStats.totalSites} siti tecnici.
        Integrità Globale Attuale: ${globalStats.systemIntegrity}.
        
        SITI CON URGENZE ATTUALI (${globalStats.urgentSitesCount}):
        ${JSON.stringify(urgentSites)}

        ISTRUZIONI OPERATIVE:
        1. Sii estremamente professionale, tecnico e conciso.
        2. Usa un tono da "Centro di Controllo NASA".
        3. Se l'utente chiede un'analisi, focalizzati sui siti con urgenze > 0.
        4. Identifica i siti citandoli come "Sito [Nome]" o "ID [Numero]".
        5. Se l'utente chiede di compilare un report, attiva l'Auto-Pilot:
           [AUTOPILOT]
           {
             "siteId": "ID_DEL_SITO", 
             "date": "Data_Oggi (YYYY-MM-DD)",
             "systems": ["CODICE_SISTEMA"] 
           }
           [/AUTOPILOT]
        
        Parla esclusivamente in ITALIANO.`;
    },

    addAiMessage(role, text) {
        const container = document.getElementById('ai-chat-history');
        if (!container) return;

        // --- AI AUTOPILOT INTERCEPTOR ---
        if (role === 'ai' && text.includes('[AUTOPILOT]')) {
            try {
                const jsonMatch = text.match(/\[AUTOPILOT\]\s*({.*})\s*\[\/AUTOPILOT\]/s);
                if (jsonMatch) {
                    const pilotData = JSON.parse(jsonMatch[1]);
                    this.executeAiAutopilot(pilotData);
                    text = text.replace(/\[AUTOPILOT\].*\[\/AUTOPILOT\]/gs, "🪄 *Azione Auto-Pilot eseguita con successo!*");
                }
            } catch (e) {
                console.error("Autopilot Parsing Error:", e);
            }
        }

        this.aiState.history.push({ role, text });

        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${role} animate-in`;
        
        // Formattazione
        const formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.*)/gm, '• $1');

        msgDiv.innerHTML = `
            <div class="msg-bubble">
                <div class="msg-role">${role === 'ai' ? 'GEMINI INTELLIGENCE' : 'OPERATORE'}</div>
                <div class="msg-text"></div>
            </div>
        `;

        container.appendChild(msgDiv);
        const textContainer = msgDiv.querySelector('.msg-text');

        if (role === 'ai') {
            this.typeWriterEffect(textContainer, formattedText);
            this.highlightContext(text);
        } else {
            textContainer.innerHTML = formattedText;
        }

        container.scrollTop = container.scrollHeight;
    },

    typeWriterEffect(element, html) {
        let i = 0;
        element.innerHTML = "";
        
        // Temporaneamente usiamo un approccio chunk per non rompere i tag HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const textNodes = Array.from(tempDiv.childNodes);
        
        let nodeIndex = 0;
        const typeNextNode = () => {
            if (nodeIndex < textNodes.length) {
                const node = textNodes[nodeIndex].cloneNode(true);
                element.appendChild(node);
                nodeIndex++;
                setTimeout(typeNextNode, 30);
            }
        };
        typeNextNode();
    },

    highlightContext(text) {
        // Cerca ID siti (es. "ID 12" o "Sito 5")
        const siteMatches = text.match(/(ID|Sito)\s*(\d+)/gi);
        if (siteMatches) {
            siteMatches.forEach(match => {
                const id = match.replace(/\D/g, '');
                const siteEl = document.querySelector(`.site-item[data-id="${id}"]`);
                if (siteEl) {
                    siteEl.classList.add('ai-highlight-pulse');
                    setTimeout(() => siteEl.classList.remove('ai-highlight-pulse'), 5000);
                }
            });
        }
    },

    executeAiAutopilot(data) {
        console.log("🚀 [AI Autopilot] Executing command:", data);
        
        // 1. Switch to Reports view if not already there
        if (this.state.currentView !== 'reports') {
            this.switchView('reports');
        }

        setTimeout(() => {
            // 2. Select Site
            if (data.siteId) {
                const select = document.getElementById('presidio-select');
                if (select) {
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].dataset.id === String(data.siteId)) {
                            select.selectedIndex = i;
                            select.dispatchEvent(new Event('change'));
                            break;
                        }
                    }
                }
            }

            // 3. Set Date
            if (data.date) {
                const dateInput = document.getElementById('report-date');
                if (dateInput) {
                    dateInput.value = data.date;
                    dateInput.dispatchEvent(new Event('change'));
                }
            }

            // 4. Select Systems (Checkboxes)
            if (data.systems && Array.isArray(data.systems)) {
                data.systems.forEach(sysId => {
                    const cb = document.querySelector(`.picker-item-v2[data-code="${sysId}"]`);
                    if (cb && !cb.classList.contains('active')) {
                        cb.click();
                    }
                });
            }
            
            // 5. Scroll to report preview
            const preview = document.querySelector('.reports-preview-area');
            if (preview) {
                preview.scrollIntoView({ behavior: 'smooth' });
            }
        }, 600); // Wait for view transition
    },

    updateAiStatus(isProcessing) {
        const status = document.getElementById('ai-status-indicator');
        if (status) {
            status.innerHTML = isProcessing 
                ? '<i class="fas fa-microchip fa-spin"></i> Elaborazione...' 
                : '<i class="fas fa-check-circle"></i> Sistema Online';
            status.classList.toggle('processing', isProcessing);
        }
    }
});
