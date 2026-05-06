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

app.get('/', (req, res) => res.json({ status: 'OK', service: 'Verbali API' }));

const VERBALI_DIR = path.join(__dirname, '..', '01-Operation', '05 - Servizi', 'VERBALI');

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

app.get('/api/verbali/read/:relativePath', (req, res) => {
    const filePath = path.join(VERBALI_DIR, req.params.relativePath);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File non trovato' });
    }
    const base64 = fs.readFileSync(filePath).toString('base64');
    res.json({ data: base64, name: path.basename(filePath) });
});

// --- PROXY AI SICURO ---
app.post('/api/proxy-ai', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key mancante nel server.");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error("Proxy AI Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`📂 Verbali API ready on http://localhost:${PORT}`);
});