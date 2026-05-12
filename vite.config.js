import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

const saveReportsApi = {
  name: 'save-reports-api',
  configureServer(server) {
    server.middlewares.use('/api/save-report', async (req, res) => {
      // Usiamo una cartella interna al progetto per i salvataggi
      const reportsDir = path.join(process.cwd(), 'data', 'salvataggi');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      if (req.method === 'GET') {
        try {
          const files = fs.readdirSync(reportsDir)
            .filter(f => f.endsWith('.json'))
            .map(f => ({
              name: f,
              modified: fs.statSync(path.join(reportsDir, f)).mtime
            }));
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(files));
        } catch (err) {
          console.error('Error reading reports:', err);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([]));
        }
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const fileName = req.headers['x-file-name'] || 'report.json';
            const safeName = decodeURIComponent(fileName);
            const filePath = path.join(reportsDir, safeName);
            
            fs.writeFileSync(filePath, body, 'utf8');
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, path: filePath, name: safeName }));
          } catch (err) {
            console.error('Error saving report:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
      }
    });

    server.middlewares.use('/api/get-report', async (req, res) => {
      if (req.method === 'GET') {
        const fileName = req.url.split('/api/get-report/')[1] || req.url.split('?file=')[1];
        if (!fileName) {
          res.statusCode = 400;
          res.end('Missing filename');
          return;
        }
        
        const reportsDir = path.join(process.cwd(), 'data', 'salvataggi');
        const filePath = path.join(reportsDir, decodeURIComponent(fileName));
        
        try {
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end('File not found');
            return;
          }
          
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (err) {
          console.error('Error reading report file:', err);
          res.statusCode = 500;
          res.end('Error reading file');
        }
      }
    });

    server.middlewares.use('/api/sync', async (req, res) => {
      if (req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: 'Sincronizzazione avviata' }));
        
        setImmediate(() => {
          try {
            const rootDir = process.cwd();
            const geminiScript = path.join(rootDir, 'src', 'backend', 'GeminiManager.cjs');
            exec(`node "${geminiScript}"`, { cwd: rootDir });
          } catch (e) {
            console.error('Sync error:', e);
          }
        });
      }
    });

    server.middlewares.use('/data', (req, res, next) => {
      const dataDir = path.join(process.cwd(), 'data');
      const urlPath = req.url.split('?')[0];
      const filePath = path.join(dataDir, urlPath);
      
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(fs.readFileSync(filePath));
        return;
      }
      next();
    });
  }
};

export default defineConfig({
  root: 'src/frontend',
  envDir: '../../', // .env e' nella root del progetto
  plugins: [
    {
      name: 'silence-source-map-warnings',
      configureServer(server) {
        server.config.logger.warn = () => {};
      }
    },
    saveReportsApi
  ],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/verbali': {
        target: 'http://localhost:3005',
        changeOrigin: true
      }
    },
    fs: {
      allow: ['..', '../../data', '../../src/01-Operation']
    }
  },
  build: {
    sourcemap: false,
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/frontend/index.html')
    }
  },
  optimizeDeps: {
    exclude: ['jspdf', 'xlsx']
  },
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, 'data'),
      '@root': path.resolve(__dirname)
    }
  }
});