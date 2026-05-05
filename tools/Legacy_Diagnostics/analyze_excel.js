const fs = require('fs');
const path = require('path');

// Reading Excel via COM object from Node is not standard.
// But we have xlsx.full.min.js which is the SheetJS library.

const xlsxPath = path.join(process.cwd(), 'xlsx.full.min.js');
const xlsx = require(xlsxPath);

const targetFile = path.join(process.cwd(), '01-Operation/01_Operations_Standard/MASTER_DATABASE_UNIFICATO_2026.xlsx');

try {
    const workbook = xlsx.readFile(targetFile);
    
    const wsAna = workbook.Sheets['Anagrafica Presidi'];
    const wsMan = workbook.Sheets['Manutenzioni'];

    if (!wsAna || !wsMan) {
        console.error('Missing sheets!');
        process.exit(1);
    }

    const anaData = xlsx.utils.sheet_to_json(wsAna);
    const manData = xlsx.utils.sheet_to_json(wsMan);

    const anaNames = new Set(anaData.map(r => String(r.Nome_Sito || '').toUpperCase().trim()));

    console.log('--- Sites in Anagrafica ---');
    anaData.forEach(r => console.log(r.Nome_Sito));

    console.log('\n--- Discrepancies in Manutenzioni ---');
    const discrepancies = new Set();
    manData.forEach(r => {
        const name = String(r.Nome_Sito || '').trim();
        if (name && !anaNames.has(name.toUpperCase())) {
            discrepancies.add(name);
        }
    });

    discrepancies.forEach(d => console.log(`Missing in Anagrafica: [${d}]`));

} catch (err) {
    console.error(err);
}
