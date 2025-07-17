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
  const browser = await puppeteer.launch({ headless: 'new' });
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

// POST /reports - Generate PDF and shareable link for a stack check result
router.post('/', authenticateJWT, async (req, res) => {
  const { stack_id, result } = req.body;
  if (!stack_id || !result) return res.status(400).json({ error: 'stack_id and result required' });
  try {
    // Get stack data for supplement list
    const stackRes = await pool.query('SELECT * FROM stacks WHERE id = $1 AND user_id = $2', [stack_id, req.user.id]);
    if (stackRes.rows.length === 0) return res.status(404).json({ error: 'Stack not found' });
    const stack = stackRes.rows[0].stack_data;
    // Generate PDF
    const pdfId = uuidv4();
    const pdfPath = path.join(__dirname, `../../pdf_reports/${pdfId}.pdf`);
    const html = reportHtmlTemplate(stack, result);
    // Ensure directory exists
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    await generatePdfFromHtml(html, pdfPath);
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
  const pdfPath = path.join(__dirname, `../../pdf_reports/${pdfId}.pdf`);
  if (!fs.existsSync(pdfPath)) return res.status(404).send('PDF not found');
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(pdfPath).pipe(res);
});

module.exports = router; 