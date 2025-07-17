const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const router = express.Router()
const multer = require('multer');
const Tesseract = require('tesseract.js');
const upload = multer({ storage: multer.memoryStorage() });

// Helper: Slugify supplement name for WebMD URL
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
// Map of known WebMD ingredient IDs for common supplements (expand as needed)
const webmdIdMap = {
  'n-acetyl-cysteine': '1018',
  'zinc': '982',
  'vitamin-b12': '926',
  'alpha-lipoic-acid': '1170',
  // Add more as needed, but now will auto-populate
}

// Scrape WebMD for primary use and typical dosages
async function scrapeWebMDSupplement(name) {
  const slug = slugify(name)
  let id = webmdIdMap[slug]
  let foundSlug = slug

  // If not in map, search WebMD for the correct ID and slug
  if (!id) {
    try {
      const searchUrl = `https://www.webmd.com/vitamins/search?query=${encodeURIComponent(name)}`
      const { data: searchHtml } = await axios.get(searchUrl)
      const $search = cheerio.load(searchHtml)
      // Find the first supplement result link
      const firstLink = $search('a[href*="/vitamins/ai/ingredientmono-"]').first()
      if (firstLink.length) {
        const href = firstLink.attr('href')
        // Example: /vitamins/ai/ingredientmono-35/whey-protein
        const match = href.match(/ingredientmono-(\d+)\/([a-z0-9-]+)/)
        if (match) {
          id = match[1]
          foundSlug = match[2]
          // Cache for future requests
          webmdIdMap[slug] = id
        }
      }
    } catch (e) {
      // Search failed, fallback to slug only
    }
  }

  // Try both with and without the id (WebMD sometimes works with just the slug)
  const urls = [
    id ? `https://www.webmd.com/vitamins/ai/ingredientmono-${id}/${foundSlug}` : null,
    `https://www.webmd.com/vitamins/ai/ingredientmono-${foundSlug}`
  ].filter(Boolean)
  for (const url of urls) {
    try {
      const { data } = await axios.get(url)
      const $ = cheerio.load(data)
      let primaryUse = ''
      let typicalDosages = ''
      $('h2').each((i, el) => {
        const txt = $(el).text().toLowerCase()
        if (txt.includes('uses')) {
          primaryUse = $(el).nextUntil('h2').text().trim()
        }
        if (txt.includes('dosing')) {
          typicalDosages = $(el).nextUntil('h2').text().trim()
        }
      })
      if (primaryUse || typicalDosages) {
        return { primaryUse, typicalDosages }
      }
    } catch (e) {
      // Try next URL
    }
  }
  return { primaryUse: null, typicalDosages: null }
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const LLM_MODEL = 'google/gemma-3n-e2b-it:free'; // updated to match checkjs

router.get('/', async (req, res) => {
  const name = (req.query.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Name required' })

  try {
    // 1. Search for the supplement to get the CUI
    const searchResp = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(name)}`)
    if (searchResp.data && searchResp.data.results && searchResp.data.results.length > 0) {
      const supp = searchResp.data.results[0]
      // 2. Fetch detailed info using the CUI
      const agentResp = await axios.get(`https://supp.ai/api/agent/${supp.cui}`)
      const agent = agentResp.data
      // 3. Scrape WebMD for missing fields
      let primary_use = null
      let typical_dosages = null
      try {
        const scraped = await scrapeWebMDSupplement(agent.preferred_name)
        primary_use = scraped.primaryUse
        typical_dosages = scraped.typicalDosages
      } catch {}
      res.json({
        name: agent.preferred_name,
        aliases: agent.synonyms || [],
        description: agent.definition || '',
        primary_use,
        typical_dosages
      })
    } else {
      res.status(404).json({ error: 'Supplement not found' })
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch supplement info' })
  }
})

// POST /api/ocr-upload - Upload image and extract supplement names (OCR)
router.post('/ocr-upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
    // Basic supplement name extraction: split by newlines, commas, semicolons
    const supplements = text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    res.json({ supplements });
  } catch (err) {
    res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});

// POST /api/parse-stack-text - Parse pasted text into supplement names
router.post('/parse-stack-text', async (req, res) => {
  try {
    console.log('parse-stack-text req.body:', req.body)
    const { text } = req.body;
    console.log('parse-stack-text text:', text)
    if (!text) return res.status(400).json({ error: 'No text provided' });
    // Improved: split by newlines, commas, semicolons, tabs
    const supplements = text.split(/[\n,;\t]+/).map(s => s.trim()).filter(Boolean);
    res.json({ supplements });
  } catch (err) {
    console.error('parse-stack-text error:', err)
    res.status(500).json({ error: 'Parse stack text failed', details: err.message });
  }
});

// POST /api/stack-rating - Rate a stack 1-10 using LLM
router.post('/stack-rating', async (req, res) => {
  console.log('stack-rating req.body:', req.body)
  const { stack } = req.body;
  if (!Array.isArray(stack) || !stack.length) return res.status(400).json({ error: 'No stack provided' });
  try {
    const prompt = `You are a supplement stack expert. Given the following stack: [${stack.join(', ')}], rate the overall quality, safety, and evidence for this stack on a scale of 1-10 (10 = best, 1 = worst). Respond ONLY in JSON with keys 'rating' (number), 'benefits' (string overview of the benefits of the stack), and 'drawbacks' (string overview of the drawbacks or risks of the stack). Do not include any other text or explanation.`;
    const llmRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: LLM_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 256,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    // Try to parse the LLM's response as JSON
    let rating = null, benefits = '', drawbacks = '';
    const content = llmRes.data.choices?.[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(content);
      rating = parsed.rating;
      benefits = cleanField(parsed.benefits);
      drawbacks = cleanField(parsed.drawbacks);
      // If benefits/drawbacks missing but explanation present, try to extract
      if ((!benefits || !drawbacks) && parsed.explanation) {
        const benMatch = parsed.explanation.match(/benefits\s*[:=\-]?\s*([\s\S]*?)(?:drawbacks\s*[:=\-]?|$)/i);
        const drawMatch = parsed.explanation.match(/drawbacks\s*[:=\-]?\s*([\s\S]*)/i);
        if (benMatch) benefits = cleanField(benMatch[1]);
        if (drawMatch) drawbacks = cleanField(drawMatch[1]);
      }
    } catch (e) {
      // Fallback: try to extract fields from text
      const ratingMatch = content.match(/rating\s*[:=]\s*(\d+)/i);
      rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;
      // Try to extract benefits and drawbacks from text
      const benMatch = content.match(/benefits\s*[:=\-]?\s*([\s\S]*?)(?:drawbacks\s*[:=\-]?|$)/i);
      const drawMatch = content.match(/drawbacks\s*[:=\-]?\s*([\s\S]*)/i);
      if (benMatch) benefits = cleanField(benMatch[1]);
      if (drawMatch) drawbacks = cleanField(drawMatch[1]);
      // If still missing, try to extract from 'explanation' if present
      const explMatch = content.match(/explanation\s*[:=\-]?\s*([\s\S]*)/i);
      if ((!benefits || !drawbacks) && explMatch) {
        const ben2 = explMatch[1].match(/benefits\s*[:=\-]?\s*([\s\S]*?)(?:drawbacks\s*[:=\-]?|$)/i);
        const draw2 = explMatch[1].match(/drawbacks\s*[:=\-]?\s*([\s\S]*)/i);
        if (ben2) benefits = cleanField(ben2[1]);
        if (draw2) drawbacks = cleanField(draw2[1]);
      }
    }
    if (!rating) rating = 5;
    res.json({ rating, benefits, drawbacks });
  } catch (err) {
    console.error('LLM stack rating error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'LLM stack rating failed', details: err?.response?.data || err.message });
  }
});

// GET /api/related-products/:supplement - Get related products (static mapping)
const relatedMap = {
  'Creatine': ['Creatine Monohydrate', 'Creatine HCL', 'Creatine + Beta-Alanine'],
  'Whey Protein': ['Casein Protein', 'Plant Protein', 'Whey Isolate'],
  'Whey Protein Isolate': ['Whey Isolate', 'Casein Protein', 'Plant Protein'],
  'Caffeine': ['L-Theanine', 'Green Tea Extract', 'Guarana'],
  'Vitamin D': ['Vitamin D3', 'Vitamin K2', 'Calcium + D3'],
  'Magnesium': ['Magnesium Glycinate', 'Zinc', 'Calcium'],
  'Zinc': ['Magnesium', 'Vitamin C', 'Copper'],
  'Vitamin C': ['Zinc', 'Vitamin D', 'Elderberry'],
  // Add more as needed
};
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/ Isolate$/, '') // treat "Whey Protein Isolate" as "Whey Protein"
    .trim();
}
router.get('/related-products/:supplement', async (req, res) => {
  let { supplement } = req.params;
  let related = [];
  // Try exact match
  if (relatedMap[supplement]) {
    related = relatedMap[supplement];
  } else {
    // Try normalized name
    const norm = normalizeName(supplement);
    if (relatedMap[norm]) {
      related = relatedMap[norm];
    } else {
      // Try base name (first word)
      const base = norm.split(' ')[0];
      for (const key of Object.keys(relatedMap)) {
        if (key.toLowerCase().includes(base.toLowerCase())) {
          related = relatedMap[key];
          break;
        }
      }
    }
  }
  if (!related.length) {
    related = [`${supplement} Plus`, `${supplement} Max`, `${supplement} Advanced`];
  }
  res.json({ related });
});

// Helper to clean up extracted text
function cleanField(str) {
  if (!str) return '';
  return str
    .replace(/^[:=\-\s"'{\[\]`]+/, '') // leading colons, quotes, brackets, code block
    .replace(/[:=\-\s"'}\[\]`]+$/, '') // trailing colons, quotes, brackets, code block
    .replace(/^\s+|\s+$/g, '') // trim
    .replace(/^\n+|\n+$/g, '') // trim newlines
    .replace(/^,+|,+$/g, '') // trim commas
    .replace(/^\/+|\/+$/g, '') // trim slashes
    .replace(/^[.]+|[.]+$/g, '') // trim periods
    .replace(/^[\\]+|[\\]+$/g, '') // trim backslashes
    .replace(/^[`]+|[`]+$/g, '') // trim backticks
    .replace(/^[{]+|[}]+$/g, '') // trim curly braces
    .replace(/^[\[]+|[\]]+$/g, '') // trim square brackets
    .replace(/\n/g, ' ') // replace newlines with space
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

module.exports = router 