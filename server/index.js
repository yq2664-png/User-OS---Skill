import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
dotenv.config();

import simulate from './features/simulate.js';
import realPerspectives from './features/realPerspectives.js';
import verifyProduct from './features/verifyProduct.js';
import insights from './features/insights.js';
import prd from './features/prd.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/simulate', upload.fields([{ name: 'screenshots', maxCount: 5 }, { name: 'documents', maxCount: 5 }]), simulate);
app.post('/api/real-perspectives', realPerspectives);
app.post('/api/verify-product', verifyProduct);
app.post('/api/insights', insights);
app.post('/api/prd', prd);

// Serve frontend in production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = process.env.SERVER_PORT || process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
