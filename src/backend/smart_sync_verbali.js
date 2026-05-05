const fs = require('fs');
const path = require('path');
const XLSX = require('./xlsx.full.min.js');

// Configurazione
const DRY_RUN = false; // IMPOSTARE A FALSE PER SCRIVERE SUL DB
const MASTER_XLSX = path.join(__dirname, '01-Operation', '01_Operations_Standard', 'MASTER_DATABASE_UNIFICATO_2026.xlsx');
const VERBALI_DIR = path.join(__dirname, '01-Operation', '05 - Servizi', 'VERBALI');
const CONFIG_FILE = path.join(__dirname, 'GEMINI_CONFIG.json');
const LOG_FILE = path.join(__dirname, 'smart_sync_audit.log');

function logAudit(msg) {
    const timestamp = new Date().toLocaleString();
    const entry = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, entry);
    } catch (e) {
        console.warn(`⚠️ Errore scrittura log: ${e.message}`);
    }
    console.log(msg);
}

async function runSmartSync() {
    logAudit("🚀 AVVIO SMART SYNC VERBALI (MODALITÀ RIGOROSA)");
    
    // 1. Caricamento API Key
    if (!fs.existsSync(CONFIG_FILE)) {
        logAudit("❌ Errore: GEMINI_CONFIG.json non trovato.");
        return;
    }
    const { GEMINI_API_KEY } = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

    // 2. Caricamento Database Excel
    logAudit("📊 Caricamento Master Database...");
    try {
        const fileBuffer = fs.readFileSync(MASTER_XLSX);
        const workbook = XLSX.read(fileBuffer, {type: 'buffer', cellDates: true});
        const sheetName = 'Dettaglio';
        const worksheet = workbook.Sheets[sheetName];
        
        // MODIFICA CRITICA: preserviamo righe vuote e valori predefiniti per evitare slittamenti
        var data = XLSX.utils.sheet_to_json(worksheet, { defval: "", blankrows: true });
        
        logAudit(`✅ Database caricato correttamente. Totale righe: ${data.length}`);
    } catch (e) {
        logAudit("❌ Errore nel caricamento Excel: " + e.message);
        return;
    }

    // 3. Scansione Verbali PDF
    logAudit(`📂 Scansione cartella verbali: ${VERBALI_DIR}`);
    const files = getAllFiles(VERBALI_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    logAudit(`🔍 Trovati ${files.length} file PDF.`);

    let updatedCount = 0;
    const siteNames = [...new Set(data.map(r => r.Nome_Sito))].filter(s => s).join(', ');
    const systemTypes = [...new Set(data.map(r => r.Tipologia_Impianto))].filter(t => t).join(', ');

    for (const filePath of files) {
        const fileName = path.basename(filePath);
        const folderName = path.basename(path.dirname(filePath));

        // SKIP: Se il file è già stato processato
        const alreadyProcessed = data.some(r => r.Note && r.Note.includes(`[AI Automazione:${fileName}]`));
        if (alreadyProcessed) {
            console.log(`\n⏭️ Salto: ${fileName} (Già processato)`);
            continue;
        }
        
        // FILTRO SITO: Verifica se la cartella è nel Master Database
        const targetSite = data.find(r => {
            if (!r.Nome_Sito) return false;
            const rowNome = String(r.Nome_Sito || "").toLowerCase();
            const rowFolder = String(r.ID_Sito || r.ID_Folder || "").toLowerCase();
            const searchFolder = folderName.toLowerCase();
            if (rowNome.includes(searchFolder) || searchFolder.includes(rowNome.replace("via ", "").trim())) return true;
            if (rowFolder && rowFolder === searchFolder) return true;
            return false;
        });
        
        if (!targetSite) {
            console.log(`\n📄 Salto: ${fileName} (Sito '${folderName}' non trovato)`);
            continue;
        }

        logAudit(`\n📄 Elaborazione: ${fileName} (Presunto Sito: ${targetSite.Nome_Sito})`);

        try {
            const fileBase64 = fs.readFileSync(filePath).toString('base64');
            const aiResult = await analyzeWithGemini(fileBase64, GEMINI_API_KEY, siteNames, systemTypes, targetSite.Nome_Sito);
            
            logAudit(`   🧠 Risultato AI: ${JSON.stringify(aiResult)}`);

            if (aiResult && aiResult.data_intervento && aiResult.tipologia_impianto) {
                // C. AGGIORNAMENTO MULTI-RIGA PER CATEGORIA
                const res = updateExcelData(data, aiResult, fileName, targetSite.Nome_Sito);
                if (res.count > 0) {
                    logAudit(`   ✨ Successo: Aggiornate ${res.count} righe per la categoria '${aiResult.tipologia_impianto}'`);
                    updatedCount += res.count;

                    // D. SALVATAGGIO INCREMENTALE (CON CONVERSIONE DATE)
                    if (!DRY_RUN) {
                        const workbook_out = XLSX.read(fs.readFileSync(MASTER_XLSX), {type: 'buffer'});
                        const newWorksheet = XLSX.utils.json_to_sheet(data, { cellDates: true });
                        workbook_out.Sheets['Dettaglio'] = newWorksheet;
                        const buf = XLSX.write(workbook_out, {type: 'buffer', bookType: 'xlsx'});
                        fs.writeFileSync(MASTER_XLSX, buf);
                        logAudit("   💾 Backup incrementale Excel salvato.");
                    } else {
                        logAudit("   🔍 [DRY RUN] Nessuna modifica eseguita all'Excel.");
                    }
                } else {
                    logAudit(`   ⚠️ Attenzione: Nessun match nel DB per Sito: ${aiResult.nome_presidio} e Sistema: ${aiResult.tipologia_impianto}`);
                }
            } else {
                logAudit(`   ❌ Errore: AI non ha restituito dati validi per ${fileName}`);
            }

            console.log("   ⏳ Pausa tecnica (30s)...");
            await new Promise(resolve => setTimeout(resolve, 30000));
        } catch (err) {
            logAudit(`   ❌ Errore critico su ${fileName}: ` + err.message);
        }
    }

    if (updatedCount > 0) {
        logAudit(`\n🏁 SINCRONIZZAZIONE COMPLETATA! Totale righe aggiornate: ${updatedCount}`);
    } else {
        logAudit("\nℹ️ Nessun aggiornamento effettuato.");
    }
}

async function analyzeWithGemini(base64Data, apiKey, siteNames, systemTypes, identifiedSite) {
    const prompt = `Analizza questa scansione di un verbale di manutenzione tecnica.
    Il sito identificato dalla cartella è: "${identifiedSite}".
    
    COMPITO:
    Estrai esclusivamente le seguenti informazioni in formato JSON puro.
    
    DATI RICHIESTI:
    {
        "data_intervento": "YYYY-MM-DD",
        "nome_presidio": "Conferma il nome del presidio scegliendo tra questa lista: [${siteNames}]",
        "tipologia_impianto": "Identifica la categoria ESATTA tra queste presenti nel database: [${systemTypes}]",
        "note_tecniche": "Breve sintesi di cosa è stato fatto (es: controllo estintori, prova fumi)"
    }
    
    REGOLE RIGOROSE:
    1. Se il verbale è un registro antincendio, la "tipologia_impianto" DEVE essere "Antincendio".
    2. Non inventare categorie. Usa solo quelle fornite.
    3. Cerca la data con massima attenzione (spesso è in alto o vicino ai timbri).
    4. Rispondi SOLO con il JSON, niente testo prima o dopo.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let attempts = 0;
    while (attempts < 3) {
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

            if (!response.ok) throw new Error(`Status ${response.status}`);
            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            attempts++;
        } catch (e) {
            attempts++;
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    return null;
}

function updateExcelData(excelData, aiResult, fileName, identifiedSiteName) {
    const siteToMatch = (aiResult.nome_presidio || identifiedSiteName || "").toLowerCase().trim();
    const systemToMatch = (aiResult.tipologia_impianto || "").toLowerCase().trim();
    
    let count = 0;

    // Filtriamo TUTTE le righe che corrispondono a SITO e CATEGORIA ESATTA
    excelData.forEach(row => {
        if (!row.Nome_Sito) return; // Salta righe vuote o di intestazione parziale

        const rowNome = String(row.Nome_Sito || "").toLowerCase().trim();
        const rowSystem = String(row.Tipologia_Impianto || "").toLowerCase().trim();

        const siteMatch = rowNome === siteToMatch || rowNome.includes(siteToMatch) || siteToMatch.includes(rowNome.replace("via ", "").trim());
        const systemMatch = rowSystem === systemToMatch;

        if (siteMatch && systemMatch) {
            // CONVERSIONE DATA IN OGGETTO DATE PER EXCEL
            if (aiResult.data_intervento) {
                const parts = aiResult.data_intervento.split('-');
                // Creiamo la data (attenzione: mesi in JS partono da 0)
                const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                row.Data_Ultimo_Intervento = dateObj;
            }
            
            row.Stato_Documentale = 'OK';
            row.Note = (row.Note || '') + ` [AI Automazione:${fileName}]`;
            count++;
        }
    });

    return { count };
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return [];
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(function(file) {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        });
    } catch (e) {}
    return arrayOfFiles;
}

runSmartSync();
