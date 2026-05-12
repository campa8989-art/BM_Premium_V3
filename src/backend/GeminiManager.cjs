const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// --- Configurazione Percorsi Isolati V2 ---
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const SRC_DIR = path.join(__dirname, '..');
const MASTER_XLSX = path.join(SRC_DIR, '01-Operation', '01_Operations_Standard', 'MASTER_DATABASE_UNIFICATO_2026.xlsx');
const VERBALI_DIR = path.join(SRC_DIR, '01-Operation', '05 - Servizi', 'VERBALI');
const CONFIG_FILE = path.join(PROJECT_ROOT, 'GEMINI_CONFIG.json');
const HISTORY_FILE = path.join(PROJECT_ROOT, 'BM_HISTORY.md');
const INSIGHTS_FILE = path.join(__dirname, 'ai_insights_data.js'); // Output in V2
const LOG_FILE = path.join(__dirname, 'smart_sync_audit_v2.log');
const DATA_FILE = path.join(PROJECT_ROOT, 'data.js'); // Output in Root for both V1 and V2
const WORKSPACE_DATA_FILE = path.join(__dirname, 'workspace_data.js'); // Output in V2
const AI_CONFIG_FILE = path.join(SRC_DIR, 'frontend', 'modules', 'ai_config.js');
const OPERATION_DIR = path.join(SRC_DIR, '01-Operation');
const ARIA_XLSX = path.join(OPERATION_DIR, '01_Operations_Standard', 'aria_sacco_final.xlsx');
const ARIA_DATA_FILE = path.join(__dirname, 'aria_full_data.js'); // Output in V2

// --- Utility per gestione conflitti I/O (OneDrive/Lock) ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function safeWriteFile(filePath, data, isAppend = false, maxRetries = 5, initialDelayMs = 200) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            if (isAppend) {
                fs.appendFileSync(filePath, data);
            } else {
                fs.writeFileSync(filePath, data);
            }
            return;
        } catch (error) {
            attempts++;
            const isLocked = error.code === 'EBUSY' || error.code === 'EPERM' || error.message.includes('busy');
            if (isLocked && attempts < maxRetries) {
                const waitTime = initialDelayMs * Math.pow(2, attempts - 1);
                console.warn(`⚠️ File occupato (${path.basename(filePath)}). Riprovo tra ${waitTime}ms... (Tentativo ${attempts}/${maxRetries})`);
                await delay(waitTime);
            } else {
                throw error;
            }
        }
    }
}

// --- Inizializzazione Log ---
async function logAudit(msg) {
    const timestamp = new Date().toLocaleString('it-IT');
    const entry = `[${timestamp}] ${msg}\n`;
    try {
        await safeWriteFile(LOG_FILE, entry, true);
    } catch (e) {
        console.warn(`⚠️ Errore critico scrittura log: ${e.message}`);
    }
    console.log(msg);
}

// --- Motore Principale Gemini Manager ---
async function runManager() {
    logAudit("🚀 GEMINI PROJECT MANAGER: Avvio Ciclo di Gestione Automatica");
    
// --- Caricamento Variabili d'Ambiente ---
require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    logAudit("❌ Errore: GEMINI_API_KEY non trovata nel file .env.");
    return;
}

    // 2. Caricamento Master Database
    logAudit("📊 Caricamento Master Database...");
    let excelData = [];
    let workbook;
    try {
        const fileBuffer = fs.readFileSync(MASTER_XLSX);
        workbook = XLSX.read(fileBuffer, {type: 'buffer', cellDates: true});
        const sheetName = 'Dettaglio';
        const worksheet = workbook.Sheets[sheetName];
        excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "", blankrows: true });
        logAudit(`✅ Database caricato. Righe: ${excelData.length}`);
    } catch (e) {
        logAudit("❌ Errore nel caricamento Excel: " + e.message);
        return;
    }

    // 3. Scansione Verbali PDF
    logAudit(`📂 Scansione cartella verbali: ${VERBALI_DIR}`);
    const files = getAllFiles(VERBALI_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    logAudit(`🔍 Trovati ${files.length} file PDF.`);

    let updatedCount = 0;
    const siteNames = [...new Set(excelData.map(r => r.Nome_Sito))].filter(s => s).join(', ');
    const systemTypes = [...new Set(excelData.map(r => r.Tipologia_Impianto))].filter(t => t).join(', ');

    const newlyProcessed = [];

    for (const filePath of files) {
        const fileName = path.basename(filePath);
        const folderName = path.basename(path.dirname(filePath));

        // Skip se gia processato
        if (excelData.some(r => r.Note && r.Note.includes(`[AI Automazione:${fileName}]`))) {
            continue;
        }
        
        // Cerca il sito target nel DB
        const targetSite = excelData.find(r => {
            if (!r.Nome_Sito) return false;
            const rowNome = String(r.Nome_Sito || "").toLowerCase();
            const searchFolder = folderName.toLowerCase();
            return rowNome.includes(searchFolder) || searchFolder.includes(rowNome.replace("via ", "").trim());
        });
        
        if (!targetSite) continue;

        logAudit(`📄 Analisi: ${fileName} (${targetSite.Nome_Sito})`);

        try {
            const fileBase64 = fs.readFileSync(filePath).toString('base64');
            const aiResult = await analyzeWithGemini(fileBase64, GEMINI_API_KEY, siteNames, systemTypes, targetSite.Nome_Sito);
            
            if (aiResult && aiResult.data_intervento && aiResult.tipologia_impianto) {
                const res = updateExcelInMemory(excelData, aiResult, fileName, targetSite.Nome_Sito);
                if (res.count > 0) {
                    updatedCount += res.count;
                    newlyProcessed.push({ file: fileName, site: aiResult.nome_presidio, system: aiResult.tipologia_impianto });
                    await logAudit(`   ✨ Aggiornate ${res.count} righe per ${aiResult.tipologia_impianto}`);
                }
            }
            // Pausa per rate limit
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            await logAudit(`   ❌ Errore su ${fileName}: ` + err.message);
        }
    }

    // 4. Salvataggio Database se aggiornato
    if (updatedCount > 0) {
        try {
            const newWorksheet = XLSX.utils.json_to_sheet(excelData, { cellDates: true });
            workbook.Sheets['Dettaglio'] = newWorksheet;
            const buf = XLSX.write(workbook, {type: 'buffer', bookType: 'xlsx'});
            await safeWriteFile(MASTER_XLSX, buf);
            await logAudit(`💾 Master Database aggiornato con ${updatedCount} nuove voci.`);
            
            // 5. Aggiornamento BM_HISTORY.md
            await updateHistory(newlyProcessed);
        } catch (e) {
            await logAudit("❌ Errore nel salvataggio Excel: " + e.message);
        }
    }

    // 6. Sincronizzazione Totale Dati Dashboard (Sostituisce sync_data.ps1)
    await logAudit("🔄 Sincronizzazione totale dati in corso...");
    const dashboardData = syncDashboardData(workbook);
    await saveDataFiles(dashboardData, GEMINI_API_KEY);

    // 8. Sincronizzazione Dati ARIA (Full Turbo)
    await logAudit("🚀 Ottimizzazione ARIA: Elaborazione tabelle tecniche...");
    await syncAriaData();
    
    await logAudit("🏁 CICLO GESTIONE COMPLETATO.");
}

async function analyzeWithGemini(base64Data, apiKey, siteNames, systemTypes, identifiedSite) {
    const prompt = `Analizza questa scansione di un verbale di manutenzione tecnica.
    Il sito identificato dalla cartella è: "${identifiedSite}".
    
    ESTRAI IN JSON:
    {
        "data_intervento": "YYYY-MM-DD",
        "nome_presidio": "Scegli tra: [${siteNames}]",
        "tipologia_impianto": "Scegli tra: [${systemTypes}]",
        "note_tecniche": "Breve sintesi"
    }
    RISPONDI SOLO JSON. Se è un registro antincendio, tipologia è "Antincendio".`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "application/pdf", data: base64Data } }
                ]}]
            })
        });

        if (!response.ok) {
            console.error(`❌ Errore API Gemini: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error(errorBody);
            return null;
        }

        const result = await response.json();
        const text = result.candidates[0].content.parts[0].text;
        console.log("🤖 AI Raw Response:", text);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
        console.error("❌ Errore durante l'analisi Gemini:", e.message);
        return null;
    }
}

function updateExcelInMemory(data, aiResult, fileName, siteName) {
    const siteToMatch = (aiResult.nome_presidio || siteName || "").toLowerCase().trim();
    const systemToMatch = (aiResult.tipologia_impianto || "").toLowerCase().trim();
    let count = 0;

    data.forEach(row => {
        if (!row.Nome_Sito) return;
        const rowNome = String(row.Nome_Sito || "").toLowerCase().trim();
        const rowSystem = String(row.Tipologia_Impianto || "").toLowerCase().trim();

        if ((rowNome === siteToMatch || rowNome.includes(siteToMatch)) && rowSystem === systemToMatch) {
            if (aiResult.data_intervento) {
                const parts = aiResult.data_intervento.split('-');
                row.Data_Ultimo_Intervento = new Date(parts[0], parts[1] - 1, parts[2]);
            }
            row.Stato_Documentale = 'OK';
            row.Note = (row.Note || '') + ` [AI Automazione:${fileName}]`;
            count++;
        }
    });
    return { count };
}

async function updateHistory(processedFiles) {
    if (processedFiles.length === 0) return;
    
    let historyContent = fs.readFileSync(HISTORY_FILE, 'utf8');
    const today = new Date().toLocaleDateString('it-IT');
    const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    let newEntry = `\n### 🤖 AI Automation Log (${today} — ${time})\n`;
    newEntry += `- **Attività**: Sincronizzazione automatica verbali PDF.\n`;
    newEntry += `- **File Processati**: ${processedFiles.length}\n`;
    processedFiles.forEach(f => {
        newEntry += `  - ✅ ${f.file} → ${f.site} (${f.system})\n`;
    });
    newEntry += `- **Stato**: Master Database aggiornato correttamente.\n`;

    // Inseriamo dopo il titolo principale
    const lines = historyContent.split('\n');
    lines.splice(4, 0, newEntry);
    await safeWriteFile(HISTORY_FILE, lines.join('\n'));
    await logAudit("📝 BM_HISTORY.md aggiornato con i log dell'IA.");
}

async function generateDashboardInsights(fullData, newUpdates) {
    const total = fullData.length;
    const ok = fullData.filter(r => r.Stato_Documentale === 'OK').length;
    const compliance = Math.round((ok / total) * 100);
    
    const overdue = fullData.filter(r => {
        if (!r.Next_Date) return false;
        return new Date(r.Next_Date) < new Date();
    }).length;

    const insights = {
        lastRun: new Date().toISOString(),
        newUpdates: newUpdates,
        globalStats: { total, ok, compliance, overdue },
        alerts: []
    };

    if (overdue > 0) {
        insights.alerts.push({
            type: 'critical',
            title: 'Scadenze Superate',
            message: `Rilevate ${overdue} attività oltre la data di scadenza. Azione immediata richiesta.`
        });
    }

    if (newUpdates > 0) {
        insights.alerts.push({
            type: 'success',
            title: 'Sincronizzazione Completata',
            message: `L'IA ha allineato ${newUpdates} nuove attività dai verbali PDF.`
        });
    }

    const jsContent = `window.aiInsights = ${JSON.stringify(insights, null, 2)};`;
    await safeWriteFile(INSIGHTS_FILE, jsContent);
    await logAudit("🌐 ai_insights_data.js generato per la dashboard.");
}

// --- Logica Sincronizzazione Dashboard (Porting da sync_data.ps1) ---

function syncDashboardData(workbook) {
    const anagraficaRaw = XLSX.utils.sheet_to_json(workbook.Sheets["Anagrafica Presidi"], { defval: "" });
    const manutenzioniRaw = XLSX.utils.sheet_to_json(workbook.Sheets["Dettaglio"], { defval: "" });
    const periodicitaRaw = XLSX.utils.sheet_to_json(workbook.Sheets["Periodicita manutenzioni"], { defval: "" });

    const sitesMap = {};
    anagraficaRaw.forEach(row => {
        if (row.ID_Folder) sitesMap[row.ID_Folder] = row;
    });

    const periodicitaMap = {};
    periodicitaRaw.forEach(row => {
        if (row.ID_Folder && row.Sottocategoria) {
            const key = `${row.ID_Folder}_${normalizeCode(row.Sottocategoria)}`;
            periodicitaMap[key] = row;
        }
    });

    const dashboardData = [];
    manutenzioniRaw.forEach(row => {
        if (!row.ID_Folder || !row.Attivita) return;

        const site = sitesMap[row.ID_Folder];
        const siteName = site ? site.Nome_Sito : row.Nome_Sito;
        const indirizzo = site ? site.Indirizzo_Verificato : row.Indirizzo;

        // Recupero frequenza con match robusto
        let freq = String(row.Frequenza || "");
        let norma = String(row.Riferimento_Normativo || "");
        const normCode = normalizeCode(row.Sottocategoria);
        const key = `${row.ID_Folder}_${normCode}`;

        if (periodicitaMap[key]) {
            const p = periodicitaMap[key];
            if (p.Frequenza) freq = String(p.Frequenza);
            if (p.Riferimento_Normativo) norma = String(p.Riferimento_Normativo);
        }

        // Calcolo Scadenze e Urgenza
        let urgency = "Normal";
        if (row.Stato_Documentale === "DA VERIFICARE" || row.Data_Ultimo_Intervento === "DOCUMENTO MANCANTE") {
            urgency = "Urgent";
        }

        const lastIntercept = row.Data_Ultimo_Intervento;
        const plannedDates = calculatePlannedDates(lastIntercept, freq);
        const nextDate = plannedDates.length > 0 ? plannedDates[0] : "2026-06-30";

        // Mapping finale
        dashboardData.push({
            ID_Sito: String(row.ID_Folder),
            Nome_Sito: String(siteName),
            Indirizzo: String(indirizzo),
            Sistema: String(row.Sistema),
            Tipologia_Impianto: String(row.Tipologia_Impianto),
            Sottocategoria: String(row.Sottocategoria || "").replace(/\.$/, "").trim(),
            Tipologia_Servizio: String(row.Tipologia_Servizio),
            Attivita: String(row.Attivita),
            Frequenza: freq,
            Quantita: getExcelProp(row, "Quantit"),
            Unita_Misura: getExcelProp(row, "Unit"),
            Note: String(row.Note),
            Last_Date: lastIntercept instanceof Date ? lastIntercept.toLocaleDateString('it-IT') : String(lastIntercept),
            Next_Date: nextDate,
            Planned_Dates: plannedDates,
            Urgency: urgency,
            Stato_Documentale: row.Stato_Documentale === "REALE" && row.Data_Ultimo_Intervento === "DOCUMENTO MANCANTE" ? "DA VERIFICARE" : String(row.Stato_Documentale),
            Riferimento_Normativo: norma,
            Sort_Rank: parseInt(row.ID_Folder)
        });
    });

    return dashboardData;
}

function calculatePlannedDates(lastDate, freqString) {
    let intervalMonths = 6; // Default
    const f = String(freqString || "").toLowerCase();
    
    if (f.includes('mensile')) intervalMonths = 1;
    else if (f.includes('bimestrale')) intervalMonths = 2;
    else if (f.includes('trimestrale')) intervalMonths = 3;
    else if (f.includes('quadrimestrale')) intervalMonths = 4;
    else if (f.includes('semestrale')) intervalMonths = 6;
    else if (f.includes('annuale')) intervalMonths = 12;
    else if (f.includes('biennale')) intervalMonths = 24;
    else if (f.includes('settimanale')) intervalMonths = 0.25;

    const dates = [];
    let current;

    if (lastDate instanceof Date && !isNaN(lastDate.getTime())) {
        current = new Date(lastDate);
    } else {
        // Se manca la data ultima, partiamo dall'inizio dell'anno corrente o prossimo
        current = new Date(2026, 0, 1);
    }

    // Proiettiamo per 18 mesi (fino a metà 2027)
    const limit = new Date(2027, 6, 1); 
    
    // Sicurezza per evitare loop infiniti
    let safety = 0;
    while (current < limit && safety < 100) {
        if (intervalMonths >= 1) {
            current.setMonth(current.getMonth() + intervalMonths);
        } else {
            // Caso settimanale
            current.setDate(current.getDate() + 7);
        }
        
        if (current > limit) break;
        dates.push(formatLocalISO(current));
        safety++;
    }
    return dates;
}

function formatLocalISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function normalizeCode(code) {
    if (!code) return "";
    return String(code).toLowerCase().replace(/[ .-]/g, "").replace("b2", "b");
}

function getExcelProp(row, prefix) {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(prefix.toLowerCase()));
    return key ? String(row[key]) : "";
}

async function saveDataFiles(data, apiKey) {
    // 1. data.js
    const jsContent = `const maintenanceData = ${JSON.stringify(data, null, 2)};`;
    await safeWriteFile(DATA_FILE, jsContent);
    await logAudit(`✅ data.js generato con ${data.length} righe.`);

    // 2. ai_config.js (Proxy URL per il browser)
    const configContent = `window.AI_PROXY_URL = "http://localhost:3005/api/proxy-ai";\nconsole.log("🌐 Sistema AI configurato tramite Proxy locale Sicuro.");`;
    await safeWriteFile(AI_CONFIG_FILE, configContent);
    await logAudit(`🔐 ai_config.js generato (Secure Config).`);

    // 3. workspace_data.js (Albero cartelle OneDrive per la Dashboard)
    const exclusions = [
        "node_modules", "assets", ".git", ".gemini", ".agents", 
        "06 - Contabilità", "08 - Contratto Iniziale"
    ];
    
    // Scansione ricorsiva per app.js
    const tree = getFolderTree(OPERATION_DIR, __dirname, exclusions);
    const now = new Date().toLocaleString('it-IT');
    
    const workspaceContent = `
/* WORKSPACE_DATA_START */
window.workspaceDataLocal = ${JSON.stringify(tree, null, 2)};
window.workspaceDataRemote = ${JSON.stringify(tree, null, 2)};
window.workspaceVersion = '${now}';
/* WORKSPACE_DATA_END */`;

    await safeWriteFile(WORKSPACE_DATA_FILE, workspaceContent);
    await logAudit(`✅ workspace_data.js generato con albero cartelle (Versione: ${now}).`);
}

function getFolderTree(dirPath, root, exclusions) {
    if (!fs.existsSync(dirPath)) return [];
    
    const items = fs.readdirSync(dirPath);
    const result = [];

    items.forEach(name => {
        // Filtro esclusioni
        if (name.startsWith('.') || exclusions.some(ex => name.includes(ex))) return;

        const fullPath = path.join(dirPath, name);
        const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
        const stats = fs.statSync(fullPath);
        const isDir = stats.isDirectory();

        const item = {
            name: name,
            path: relPath,
            isDir: isDir
        };

        if (isDir) {
            item.children = getFolderTree(fullPath, root, exclusions);
        } else {
            item.size = stats.size;
            item.ext = path.extname(name);
            item.mtime = stats.mtime.getTime();
        }

        result.push(item);
    });

    return result;
}
function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

async function syncAriaData() {
    try {
        await logAudit("📂 Lettura Excel ARIA...");
        if (!fs.existsSync(ARIA_XLSX)) {
            await logAudit("⚠️ File Excel ARIA non trovato. Salto ottimizzazione ARIA.");
            return;
        }

        const ariaBuffer = fs.readFileSync(ARIA_XLSX);
        const wb = XLSX.read(ariaBuffer, {type: 'buffer'});

        const ariaFull = {
            sheets: {},
            timestamp: new Date().toISOString()
        };

        wb.SheetNames.forEach(name => {
            ariaFull.sheets[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
        });

        const jsContent = `window.ARIA_FULL_DATA = ${JSON.stringify(ariaFull, null, 2)};`;
        await safeWriteFile(ARIA_DATA_FILE, jsContent);
        await logAudit(`✅ aria_full_data.js generato correttamente con ${wb.SheetNames.length} categorie.`);
    } catch (e) {
        await logAudit("❌ Errore nella sincronizzazione ARIA: " + e.message);
    }
}

runManager();
