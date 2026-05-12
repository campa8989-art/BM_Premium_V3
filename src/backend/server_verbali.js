import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => res.json({ status: 'OK', service: 'Verbali API' }));

const BASE_OPERATION_DIR = path.join(__dirname, '..', '01-Operation');
const VERBALI_DIR = path.join(BASE_OPERATION_DIR, '05 - Servizi', 'VERBALI');

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return [];
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            } else if (file.toLowerCase().endsWith('.pdf')) {
                arrayOfFiles.push({
                    path: fullPath,
                    name: file,
                    folder: path.basename(dirPath),
                    relativePath: path.relative(VERBALI_DIR, fullPath)
                });
            }
        });
    } catch (e) {}
    return arrayOfFiles;
}

app.get('/api/verbali', (req, res) => {
    const files = getAllFiles(VERBALI_DIR);
    res.json({ files, count: files.length });
});

app.get('/api/verbali/read/*', (req, res) => {
    const relativePath = decodeURIComponent(req.params[0]);
    // Risoluzione rispetto alla root dell'operazione
    const filePath = path.join(BASE_OPERATION_DIR, relativePath);
    
    if (!fs.existsSync(filePath)) {
        console.error(`[404] File non trovato: "${filePath}"`);
        return res.status(404).json({ error: 'File non trovato' });
    }
    
    try {
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (ext === '.xls') contentType = 'application/vnd.ms-excel';
        else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.doc') contentType = 'application/msword';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

        console.log(`[READ] File: ${filePath}, Ext: ${ext}, Type: ${contentType}`);

        // Invio diretto del file
        res.sendFile(filePath, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': 'inline'
            }
        });
    } catch (err) {
        console.error(`[500] Errore invio file: ${err.message}`);
        res.status(500).json({ error: 'Errore durante l\'invio del file' });
    }
});

// --- PROXY AI SICURO CON RETRY ---
app.post('/api/proxy-ai', async (req, res) => {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key mancante nel server.");

            // Ripristino del nome modello corretto per v1beta
            const model = "gemini-flash-latest"; 
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            console.log(`[AI Proxy] Attempt ${attempt}/${maxRetries} for model ${model}`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req.body)
            });

            const data = await response.json();
            
            // Se errore 503 (sovraccarico) o 429 (quota), riprova se abbiamo altri tentativi
            if (response.status === 503 || response.status === 429) {
                console.warn(`[AI Proxy] Attempt ${attempt} failed with status ${response.status}. Retrying...`);
                lastError = data.error?.message || `Status ${response.status}`;
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, attempt * 1500)); // Backoff: 1.5s, 3s
                    continue;
                }
            }

            if (!response.ok) {
                console.error("❌ Gemini API Error:", data.error?.message || "Unknown Error");
            }
            
            return res.status(response.status).json(data);

        } catch (error) {
            console.error(`[AI Proxy Error] Attempt ${attempt}:`, error.message);
            lastError = error.message;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                continue;
            }
        }
    }

    res.status(503).json({ error: `Il servizio AI è congestionato dopo ${maxRetries} tentativi. Ultimo errore: ${lastError}. Riprova tra qualche istante.` });
});

app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.url} - Route non trovata`);
    res.status(404).json({ error: `Rotta ${req.url} non trovata in Verbali API` });
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`📂 Verbali API ready on port ${PORT}`);
});