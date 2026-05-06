const fs = require('fs');
const path = require('path');

/**
 * CHECK_ENV.JS - Script di verifica prerequisiti per BM Premium V2
 * Creato per garantire che il progetto funzioni su qualsiasi PC locale.
 */

function checkEnvironment() {
    console.log("\n--- 🔍 VERIFICA AMBIENTE BM V2 ---");

    // 1. Verifica Cartella Dipendenze (Root)
    const modulesPath = path.join(__dirname, '..', '..', 'node_modules');
    if (!fs.existsSync(modulesPath)) {
        console.error("❌ ERRORE: Cartella 'node_modules' non trovata.");
        console.error("👉 Esegui 'npm install' prima di avviare.\n");
        process.exit(1);
    }
    console.log("✅ Dipendenze installate.");

    // 2. Verifica File .env (Sicurezza - Root)
    const envPath = path.join(__dirname, '..', '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.error("❌ ERRORE: File '.env' mancante nella root del progetto.");
        console.error("👉 Crea il file .env con la tua GEMINI_API_KEY.\n");
        process.exit(1);
    }
    console.log("✅ File .env configurato.");

    // 3. Verifica Percorsi Critici (OneDrive - In src/)
    const masterPath = path.join(__dirname, '..', '01-Operation', '01_Operations_Standard', 'MASTER_DATABASE_UNIFICATO_2026.xlsx');
    if (!fs.existsSync(masterPath)) {
        console.warn("⚠️ AVVISO: Il Master Database non è stato trovato nel percorso previsto.");
        console.warn("👉 Verifica la sincronizzazione di OneDrive.\n");
    } else {
        console.log("✅ Master Database accessibile.");
    }

    console.log("--- 🎉 AMBIENTE PRONTO ---\n");
    process.exit(0);
}

checkEnvironment();
