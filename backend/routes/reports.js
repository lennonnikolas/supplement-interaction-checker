const express = require('express');
const pool = require('../db/pool');
const { authenticateJWT } = require('./auth');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const router = express.Router();

// Helper: Generate PDF from HTML using Puppeteer
async function generatePdfFromHtml(html, pdfPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--no-zygote'
    ],
    executablePath: '/app/.chrome-for-testing/chrome-linux64/chrome'
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await browser.close();
}

// Helper: Simple HTML template for PDF
function reportHtmlTemplate(stack, result) {
  const hasData = result && Array.isArray(result.interactions) && result.interactions.length > 0;
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Supplement Stack Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; }
          h1 { color: #1976d2; }
          .section { margin-bottom: 24px; }
          .supplements { font-size: 1.1em; margin-bottom: 12px; }
          .interaction-table { border-collapse: collapse; width: 100%; }
          .interaction-table th, .interaction-table td { border: 1px solid #ccc; padding: 8px; }
          .interaction-table th { background: #f5f5f5; }
          .no-data { color: #e53935; font-weight: bold; margin-top: 24px; }
        </style>
      </head>
      <body>
        <h1>Supplement Stack Report</h1>
        <div class="section">
          <div class="supplements"><strong>Supplements:</strong> ${stack && stack.length ? stack.join(', ') : ''}</div>
        </div>
        <div class="section">
          <h2>Interaction Results</h2>
          <table class="interaction-table">
            <thead>
              <tr><th>Pair</th><th>Risk</th><th>Mechanism</th><th>Severity</th><th>Explanation</th></tr>
            </thead>
            <tbody>
              ${hasData ? result.interactions.map(r => `
                <tr>
                  <td>${r.supplements ? r.supplements.join(' + ') : ''}</td>
                  <td>${r.risk || ''}</td>
                  <td>${r.mechanism || ''}</td>
                  <td>${r.severity || ''}</td>
                  <td>${r.explanation || ''}</td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="no-data">No interaction data available for this stack.</td></tr>`}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
}

const sanitizeFilename = name => name.replace(/[^a-z0-9\-]+/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();

// POST /reports - Generate PDF and shareable link for a stack check result
router.post('/', authenticateJWT, async (req, res) => {
  const { stack_id, result } = req.body;
  if (!stack_id || !result) return res.status(400).json({ error: 'stack_id and result required' });
  try {
    // Get stack data for supplement list
    const stackRes = await pool.query('SELECT * FROM stacks WHERE id = $1 AND user_id = $2', [stack_id, req.user.id]);
    if (stackRes.rows.length === 0) return res.status(404).json({ error: 'Stack not found' });
    const stack = stackRes.rows[0].stack_data;
    const stackName = stackRes.rows[0].name || 'stack';
    // Generate PDF
    const pdfId = uuidv4();
    const pdfDir = process.env.PDF_REPORTS_DIR || '/tmp/pdf_reports';
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const pdfPath = path.join(pdfDir, `${pdfId}.pdf`);
    const metaPath = path.join(pdfDir, `${pdfId}.json`);
    const html = reportHtmlTemplate(stack, result);
    await generatePdfFromHtml(html, pdfPath);
    // Save metadata
    fs.writeFileSync(metaPath, JSON.stringify({ stackName, createdAt: new Date().toISOString() }));
    const pdfUrl = `/api/reports/pdf/${pdfId}`;
    res.json({ pdf_url: pdfUrl });
  } catch (err) {
    console.error('Failed to generate PDF report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /reports/pdf/:id - Serve the PDF file
router.get('/pdf/:id', (req, res) => {
  const pdfId = req.params.id;
  const pdfDir = process.env.PDF_REPORTS_DIR || '/tmp/pdf_reports';
  const pdfPath = path.join(pdfDir, `${pdfId}.pdf`);
  const metaPath = path.join(pdfDir, `${pdfId}.json`);
  if (!fs.existsSync(pdfPath)) return res.status(404).send('PDF not found');
  let filename = 'report.pdf';
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const stackName = meta.stackName ? sanitizeFilename(meta.stackName) : 'stack';
      const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      filename = `${stackName}-${dateStr}.pdf`;
    } catch {}
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  fs.createReadStream(pdfPath).pipe(res);
});

module.exports = router; 