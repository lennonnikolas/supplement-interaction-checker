const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const pool = require('../db');
const { authenticateJWT } = require('./auth');

// Map common supplement names to correct slugs for NIH ODS and WebMD
const slugMap = {
  'creatine': { ods: 'Creatine', webmd: 'creatine-monohydrate' },
  'caffeine': { ods: 'Caffeine', webmd: 'caffeine' },
  'vitamin c': { ods: 'VitaminC', webmd: 'vitamin-c' },
  'vitamin d': { ods: 'VitaminD', webmd: 'vitamin-d' },
  'magnesium': { ods: 'Magnesium', webmd: 'magnesium' },
  'whey protein isolate': { ods: 'Protein', webmd: 'whey-protein' },
  'whey protein': { ods: 'Protein', webmd: 'whey-protein' },
  'protein': { ods: 'Protein', webmd: 'whey-protein' },
  // Add more as needed
};

// Helper: Get CUI and metadata for a supplement from SUPP.AI
async function getSuppAIInfo(name) {
  const search = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(name)}`);
  const agent = search.data.results && search.data.results[0];
  if (!agent) return null;
  const cui = agent.cui;
  const meta = await axios.get(`https://supp.ai/api/agent/${cui}`);
  return { cui, meta: meta.data };
}

// Helper: Get interaction evidence between two CUIs from SUPP.AI
async function getSuppAIInteraction(cui1, cui2) {
  const [a, b] = [cui1, cui2].sort();
  const interactionId = `${a}-${b}`;
  try {
    const resp = await axios.get(`https://supp.ai/api/interaction/${interactionId}`);
    if (resp.data && resp.data.evidence && resp.data.evidence.length > 0) {
      // Try to extract severity and reason from evidence
      const ev = resp.data.evidence[0];
      let severity = 'Unknown';
      let reason = '';
      if (ev.sentences && ev.sentences.length > 0) {
        reason = ev.sentences[0].text;
      } else if (ev.text) {
        reason = ev.text;
      }
      // Enhanced heuristic for severity
      const text = (reason || '').toLowerCase();
      if (/severe|danger|contraindicat|life[- ]?threaten|fatal|toxic|anaphylaxis|hospital/i.test(text)) severity = 'Severe';
      else if (/moderate|caution|monitor|risk|interfere|reduce|increase|potentiate|inhibit|avoid|adverse|bleed|arrhythmia|hypertension|hypotension|interaction/i.test(text)) severity = 'Moderate';
      else if (/mild|minor|low risk|generally safe|well[- ]?tolerated|benign|slight|minimal/i.test(text)) severity = 'Mild';
      else severity = 'Not specified in available research';
      return {
        risk: 'Negative Interaction',
        severity,
        reason: reason || 'No detailed reason provided in available research.',
        evidence: ev
      };
    }
  } catch (e) {}
  return null;
}

// Strict extractUse for fitness/bodybuilding context
function extractUse(text, supplementName = '') {
  if (!text) return '';
  let clean = text
    .replace(/\n+/g, ' ')
    .replace(/FAQ[s]?:.*|Update History.*|All Updates.*|References.*/gi, '')
    .replace(/(Dosage information|Medical disclaimer|Overview|What is|How to Take|How does it work|How to use|Dosing|Summary|Table of Contents|Expand All|Collapse All|Show Conditions|Filters|Health Condition\/Goal|Health Outcome|Grade|Evidence|Effect|Frequently asked questions|How much protein do I need per day\?|What’s the difference between the various types of whey protein\?)/gi, '')
    .replace(/\[\d+\]/g, '') // remove references like [6]
    .replace(/•/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Remove dates and headlines
  clean = clean.replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[^.!?]*[.!?]/gi, '');
  clean = clean.replace(/\d{4}[^.!?]*[.!?]/g, '');
  // Remove table/list artifacts
  clean = clean.replace(/\+\d+ more|Show Conditions|Expand All|Collapse All|Health Condition\/Goal|Health Outcome|Grade|Evidence|Effect|Filters/gi, '');
  // Fitness/bodybuilding keywords and patterns
  const fitnessKeywords = [
    'muscle', 'strength', 'performance', 'workout', 'bodybuilding', 'exercise', 'training', 'recovery',
    'athletic', 'gym', 'sports', 'endurance', 'hypertrophy', 'fat loss', 'lean mass', 'power', 'stamina',
    'pre-workout', 'post-workout', 'energy', 'fatigue', 'gains', 'build', 'bulk', 'cut', 'weight loss', 'weight gain',
    'protein', 'supplementation', 'athlete', 'bodybuilder', 'resistance training', 'cardio', 'anabolic', 'catabolic',
    'growth', 'size', 'composition', 'recovery', 'synthesis', 'output', 'capacity', 'explosive', 'pump'
  ];
  const usePatterns = [
    /used to [^.?!]+[.?!]/i,
    /supports? [^.?!]+[.?!]/i,
    /helps? [^.?!]+[.?!]/i,
    /benefits? [^.?!]+[.?!]/i,
    /improves? [^.?!]+[.?!]/i,
    /increases? [^.?!]+[.?!]/i,
    /enhances? [^.?!]+[.?!]/i
  ];
  // Only accept sentences that do NOT contain numbers/units, dates, or look like a study headline
  const sentences = clean.match(/[^.!?]+[.!?]/g);
  if (sentences && sentences.length > 0) {
    for (const s of sentences) {
      const sClean = s.trim();
      if (
        (usePatterns.some(pat => pat.test(sClean)) || fitnessKeywords.some(k => sClean.toLowerCase().includes(k))) &&
        !/(\d+\s*(mg|g|mcg|µg|milligram|gram|microgram|kg|lb|pound|%|\d{4}))/i.test(sClean) &&
        !/study|studies|evidence|grade|effect|summary|table|faq|disclaimer|overview|how to|protocol|loading|maintenance|dose|dosing|per day|per kg|per pound|bodyweight|before exercise|after exercise|pre-workout|post-workout|range|phase|initial|protocol|research|trial|participants|subjects|group|randomized|double-blind|placebo/i.test(sClean)
      ) {
        return sClean;
      }
    }
  }
  // Fallback: supplement-specific fitness use
  let fallback = '';
  if (/whey|casein|protein/i.test(supplementName)) fallback = 'Used to support muscle growth and recovery by providing high-quality protein.';
  else if (/creatine/i.test(supplementName)) fallback = 'Used to increase muscle strength, power, and performance during high-intensity exercise.';
  else if (/bcaa|branched chain amino acid|leucine|isoleucine|valine|eaa|essential amino acid/i.test(supplementName)) fallback = 'Used to support muscle recovery, reduce fatigue, and stimulate muscle protein synthesis.';
  else if (/caffeine/i.test(supplementName)) fallback = 'Used to enhance energy, alertness, and exercise performance.';
  else if (/beta-alanine/i.test(supplementName)) fallback = 'Used to improve muscular endurance and reduce fatigue during high-intensity exercise.';
  else if (/citrulline/i.test(supplementName)) fallback = 'Used to boost nitric oxide production, enhance blood flow, and improve exercise performance.';
  else if (/glutamine/i.test(supplementName)) fallback = 'Used to support muscle recovery and immune function after intense exercise.';
  else if (/taurine/i.test(supplementName)) fallback = 'Used to support endurance and reduce muscle fatigue.';
  else if (/electrolyte/i.test(supplementName)) fallback = 'Used to maintain hydration and support muscle function during exercise.';
  else if (/carbohydrate|gainer|mass/i.test(supplementName)) fallback = 'Used to provide energy and support muscle growth during bulking phases.';
  else if (/fat burner|thermogenic|l-carnitine/i.test(supplementName)) fallback = 'Used to support fat loss and enhance metabolic rate.';
  else if (/hmb/i.test(supplementName)) fallback = 'Used to reduce muscle breakdown and support muscle mass during training.';
  if (fallback) {
    return fallback;
  }
  return '';
}

// Strict extractDosage for fitness/bodybuilding context, with post-processing for Creatine and Caffeine
function extractDosage(text, supplementName = '') {
  if (!text) return '';
  let clean = text
    .replace(/\n+/g, ' ')
    .replace(/FAQ[s]?:.*|Update History.*|All Updates.*|References.*/gi, '')
    .replace(/(Dosage information|Medical disclaimer|Overview|What is|How to Take|How does it work|How to use|Dosing|Summary|Table of Contents|Expand All|Collapse All|Show Conditions|Filters|Health Condition\/Goal|Health Outcome|Grade|Evidence|Effect|Frequently asked questions|How much protein do I need per day\?|What’s the difference between the various types of whey protein\?)/gi, '')
    .replace(/\[\d+\]/g, '')
    .replace(/•/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Only accept dosages with number, unit, and context
  let results = [];
  // For Creatine, look for both loading and maintenance
  if (/creatine/i.test(supplementName)) {
    const loading = clean.match(/(0\.3\s*(g|gram|grams)\s*per\s*(kg|kilogram|kilograms)\s*bodyweight.*?(loading|phase)?)/i);
    const maintenance = clean.match(/(3\s*-\s*5\s*(g|gram|grams)\s*per\s*day|3\s*to\s*5\s*(g|gram|grams)\s*per\s*day|3\s*-\s*5\s*(g|gram|grams)\s*daily|3\s*to\s*5\s*(g|gram|grams)\s*daily)/i);
    if (loading) results.push(loading[0].replace(/\s+/g, ' ').trim() + ' (loading phase)');
    if (maintenance) results.push(maintenance[0].replace(/\s+/g, ' ').trim() + ' (maintenance)');
    if (results.length) {
      return results.join(', ');
    }
  }
  // For Caffeine, look for mg per kg bodyweight
  if (/caffeine/i.test(supplementName)) {
    const range = clean.match(/(3\s*-\s*6\s*mg\s*per\s*kg\s*bodyweight|3\s*to\s*6\s*mg\s*per\s*kg\s*bodyweight)/i);
    if (range) {
      return range[0].replace(/\s+/g, ' ').trim();
    }
  }
  // General: range with context
  const range = clean.match(/(\d+(?:[.,]\d+)?(?:\s*-\s*| to )\d+(?:[.,]\d+)?\s*(mg|g|mcg|µg|milligram|gram|microgram)[^.,;\n]*?(per kg|per kilogram|per pound|per lb|bodyweight|per day|\/day|daily|a day|each day|before exercise|after exercise|pre-workout|post-workout|maintenance dose|loading dose))/i);
  if (range) {
    return range[0].replace(/\s+/g, ' ').trim();
  }
  const single = clean.match(/(\d+(?:[.,]\d+)?\s*(mg|g|mcg|µg|milligram|gram|microgram)[^.,;\n]*?(per kg|per kilogram|per pound|per lb|bodyweight|per day|\/day|daily|a day|each day|before exercise|after exercise|pre-workout|post-workout|maintenance dose|loading dose))/i);
  if (single) {
    return single[0].replace(/\s+/g, ' ').trim();
  }
  return '';
}

// Helper: Try multiple slug variants for scraping
function getSlugVariants(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const variants = [base];
  if (base.includes('isolate')) variants.push(base.replace('isolate', ''));
  if (base.includes('monohydrate')) variants.push(base.replace('monohydrate', ''));
  if (base.includes('protein')) variants.push('protein');
  if (base.includes('whey')) variants.push('whey-protein');
  if (base.includes('creatine')) variants.push('creatine-monohydrate', 'creatine');
  // Add more as needed
  return [...new Set(variants)];
}

// Helper: Find supplement info by name or alias (case-insensitive)
async function findSupplementInfo(name) {
  // Try direct name match (case-insensitive)
  let result = await pool.query(
    `SELECT * FROM supplement_info WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (result.rows.length > 0) return result.rows[0];
  // Try alias match (case-insensitive)
  result = await pool.query(
    `SELECT * FROM supplement_info WHERE $1 = ANY(SELECT LOWER(alias) FROM unnest(aliases) AS alias) LIMIT 1`,
    [name.toLowerCase()]
  );
  if (result.rows.length > 0) return result.rows[0];
  // Try partial/similar match (simple LIKE)
  result = await pool.query(
    `SELECT * FROM supplement_info WHERE LOWER(name) ILIKE $1 OR $1 = ANY(SELECT LOWER(alias) FROM unnest(aliases) AS alias) LIMIT 1`,
    [`%${name.toLowerCase()}%`]
  );
  if (result.rows.length > 0) return result.rows[0];
  return null;
}

// Helper: Scrape NIH ODS for typical dosage and use
async function scrapeNIHODS(name) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (slugMap[slug]) slug = slugMap[slug].ods;
  const url = `https://ods.od.nih.gov/factsheets/${slug}-Consumer/`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    // Try to find use in various sections
    const useRaw = $(
      'h2:contains("What"), h2:contains("Uses"), h2:contains("Benefits"), h2:contains("Overview"), h2:contains("Why")'
    ).nextUntil('h2').text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('h2').filter((i, el) => /how much|dosage|dose/i.test($(el).text())).nextUntil('h2').text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape WebMD for typical dosage and use
async function scrapeWebMD(name) {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (slugMap[name.toLowerCase()]) slug = slugMap[name.toLowerCase()].webmd;
  const url = `https://www.webmd.com/vitamins/ai/ingredientmono-${slug}`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    // Try to find use in various sections
    const useRaw = $(
      'section:contains("What"), section:contains("Uses"), section:contains("Benefits"), section:contains("Overview"), section:contains("Why"), .monograph-section:contains("What"), .monograph-section:contains("Uses"), .monograph-section:contains("Benefits"), .monograph-section:contains("Overview"), .monograph-section:contains("Why")'
    ).first().text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('section, .monograph-section').filter((i, el) => /dosage|how to use|dose/i.test($(el).text())).text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape MedlinePlus for typical dosage and use
async function scrapeMedlinePlus(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://medlineplus.gov/druginfo/natural/${slug}.html`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    // Try to find use in various sections
    const useRaw = $(
      'section.summary, .section.summary, h2:contains("What"), h2:contains("Uses"), h2:contains("Benefits"), h2:contains("Overview"), h2:contains("Why")'
    ).first().text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('section, .section').filter((i, el) => /dosage|how to use|dose/i.test($(el).text())).text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape Examine.com for typical use and dosage
async function scrapeExamine(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://examine.com/supplements/${slug}/`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    // Try to find use in various sections
    const useRaw = $(
      'section:contains("What is it?"), section:contains("Summary"), section:contains("Uses"), section:contains("Benefits"), section:contains("Overview"), section:contains("Why")'
    ).first().text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('section:contains("How to Take")').text().trim() || $('section:contains("Dosage")').text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape Drugs.com for typical use and dosage
async function scrapeDrugsCom(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.drugs.com/npp/${slug}.html`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const useRaw = $(
      'section:contains("Uses"), section:contains("Benefits"), section:contains("Overview"), section:contains("Why")'
    ).first().text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('section:contains("Dosing")').text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape Mayo Clinic for typical use and dosage
async function scrapeMayoClinic(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.mayoclinic.org/drugs-supplements/${slug}-oral-route/description/drg-20067126`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const useRaw = $(
      'section:contains("Description"), section:contains("Uses"), section:contains("Benefits"), section:contains("Overview"), section:contains("Why")'
    ).first().text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('section:contains("Dosing")').text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape Healthline for typical use and dosage
async function scrapeHealthline(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.healthline.com/nutrition/${slug}`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const useRaw = $(
      'h2:contains("What is"), h2:contains("Uses"), h2:contains("Benefits"), h2:contains("Overview"), h2:contains("Why")'
    ).nextUntil('h2').text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('h2:contains("Dosage")').nextUntil('h2').text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape Bodybuilding.com for typical use and dosage
async function scrapeBodybuilding(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `https://www.bodybuilding.com/nutrition/${slug}`;
  try {
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const useRaw = $(
      'h2:contains("What is"), h2:contains("Uses"), h2:contains("Benefits"), h2:contains("Overview"), h2:contains("Why")'
    ).nextUntil('h2').text().trim();
    const typical_use = extractUse(useRaw);
    const dosageRaw = $('h2:contains("Dosage")').nextUntil('h2').text().trim();
    const typical_dosage = extractDosage(dosageRaw);
    return { typical_use, typical_dosage };
  } catch (e) {
    return { typical_use: '', typical_dosage: '' };
  }
}

// Helper: Scrape additional sources for supplement-supplement interaction
async function scrapeInteractionSources(name1, name2) {
  // Try Examine.com, Drugs.com, Healthline for interaction evidence
  const pair = [name1, name2].map(n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-')).join('-and-');
  // Examine.com
  try {
    const url = `https://examine.com/stacks/${pair}/`;
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const interactionSection = $('section:contains("Interactions"), section:contains("Stacking"), section:contains("Warning")').text().trim();
    if (interactionSection.length > 30) {
      return {
        risk: 'Negative Interaction',
        severity: 'See details',
        reason: interactionSection
      };
    }
  } catch (e) {}
  // Drugs.com
  try {
    const url = `https://www.drugs.com/interactions-check.php?drug_list=${name1},${name2}`;
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const interactionSection = $('.interactions-reference').text().trim();
    if (interactionSection.length > 30) {
      return {
        risk: 'Negative Interaction',
        severity: 'See details',
        reason: interactionSection
      };
    }
  } catch (e) {}
  // Healthline
  try {
    const url = `https://www.healthline.com/nutrition/${name1}-and-${name2}`;
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);
    const interactionSection = $('h2:contains("Interaction"), h2:contains("Warning"), h2:contains("Stack")').nextUntil('h2').text().trim();
    if (interactionSection.length > 30) {
      return {
        risk: 'Negative Interaction',
        severity: 'See details',
        reason: interactionSection
      };
    }
  } catch (e) {}
  return null;
}

// Helper: Call OpenRouter Gemma 2B for interaction analysis
async function callOpenRouterGemma(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('[LLM] Missing OPENROUTER_API_KEY environment variable');
    throw new Error("Missing OPENROUTER_API_KEY");
  }
  
  try {
          const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "google/gemma-3n-e2b-it:free",
          messages: [
            { role: "user", content: `You are a supplement and fitness expert. ${prompt}` }
          ],
          max_tokens: 500,
          temperature: 0.2
        },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://supplement-interaction-checker/",
          "X-Title": "Supplement Interaction Checker"
        }
      }
    );
    
    const content = response.data.choices[0].message.content.trim();
    
    return content;
  } catch (error) {
    console.error('[LLM] Error calling OpenRouter:', error.message);
    if (error.response) {
      console.error('[LLM] OpenRouter error response:', error.response.data);
    }
    throw error;
  }
}

// Helper: Get/refresh supplement interaction from DB or SUPP.AI+OpenRouter
async function getOrUpdateInteraction(suppA, suppB) {
  // Always store pairs in sorted order
  const [a, b] = [suppA.toLowerCase(), suppB.toLowerCase()].sort();
  // 1. Check DB for recent record (within 30 days)
  const dbRes = await pool.query(
    `SELECT * FROM supplement_interactions WHERE supplement1 = $1 AND supplement2 = $2 AND last_updated > NOW() - INTERVAL '30 days' LIMIT 1`,
    [a, b]
  );
  if (dbRes.rows.length > 0) {
    const existingRecord = dbRes.rows[0];
    
    // If the existing record has no meaningful data, force a refresh
    if (!existingRecord.severity || existingRecord.severity === 'None' || existingRecord.source === 'supp.ai') {
    } else {
      return existingRecord;
    }
  }
  // 2. Fetch evidence from SUPP.AI
  let evidence = '';
  try {
    
    const searchA = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(a)}`);
    const agentA = searchA.data.results && searchA.data.results[0];
    
    const searchB = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(b)}`);
    const agentB = searchB.data.results && searchB.data.results[0];
    
    if (agentA && agentB) {
      const cuiA = agentA.cui;
      const cuiB = agentB.cui;
      const [c1, c2] = [cuiA, cuiB].sort();
      const interactionId = `${c1}-${c2}`;
      
      const resp = await axios.get(`https://supp.ai/api/interaction/${interactionId}`);
      
      // Debug: Log the first evidence item structure
      if (resp.data?.evidence?.length > 0) {
      }
      
          if (resp.data && resp.data.evidence && resp.data.evidence.length > 0) {
        // Try multiple evidence fields to get meaningful content
        evidence = resp.data.evidence.map(ev => {
          // First try direct text fields
          if (ev.text) return ev.text;
          if (ev.description) return ev.description;
          if (ev.summary) return ev.summary;
          if (ev.content) return ev.content;
          
          // If we have sentences with spans, reconstruct the full text
          if (ev.sentences && ev.sentences.length > 0) {
            const reconstructedSentences = ev.sentences.map(sentence => {
              if (sentence.spans && sentence.spans.length > 0) {
                // Reconstruct the sentence from spans
                return sentence.spans.map(span => span.text).join('');
              }
              return sentence.text || '';
            });
            return reconstructedSentences.join(' ');
          }
          
          return '';
        }).filter(text => text && text.trim()).join('\n');
        
      } else {
      }
    } else {
    }
  } catch (e) {
    console.error(`[SUPP.AI] Error fetching interaction data:`, e.message);
  }
  let severity = '', mechanism = '', side_effects = '', source = 'supp.ai';
  if (evidence) {
    source = 'supp.ai + gemma-2b-it';
    const prompt = `Given the following evidence from SUPP.AI about the interaction between ${suppA} and ${suppB}, provide a detailed analysis in JSON format.

Evidence:
${evidence}

Please analyze this evidence and provide:
1. Severity: Choose from "None", "Mild", "Moderate", or "Severe" based on the evidence
2. Mechanism: Explain what happens in the body when these supplements interact (focus on physiological changes)
3. Side effects: List the specific bodily symptoms and side effects a person might experience when taking these supplements together (e.g., dizziness, fatigue, fast heart rate, slow heart rate, nausea, headache, insomnia, anxiety, jitters, stomach upset, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "severity": "Mild/Moderate/Severe/None",
  "mechanism": "Detailed explanation of the physiological interaction mechanism",
  "side_effects": "Specific bodily symptoms and side effects like dizziness, fatigue, heart rate changes, nausea, etc."
}

Focus on practical, observable symptoms that users would actually experience. Ensure all three fields are filled with meaningful information based on the evidence provided.`;
    try {
      const llmResp = await callOpenRouterGemma(prompt);
      
      const jsonMatch = llmResp.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        severity = parsed.severity || '';
        mechanism = parsed.mechanism || '';
        side_effects = parsed.side_effects || '';
      } else {
        console.error(`[LLM] No JSON found in response:`, llmResp);
        severity = '';
        mechanism = '';
        side_effects = '';
      }
    } catch (e) {
      console.error(`[LLM] Error processing LLM response:`, e.message);
      severity = '';
      mechanism = '';
      side_effects = '';
    }
  } else {
    severity = 'None';
    mechanism = 'No known interaction in available research.';
    side_effects = 'No known side effects.';
    source = 'supp.ai';
  }
  // 4. Store in DB
  await pool.query(
    `INSERT INTO supplement_interactions (supplement1, supplement2, severity, mechanism, side_effects, source, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (supplement1, supplement2) DO UPDATE SET severity = $3, mechanism = $4, side_effects = $5, source = $6, last_updated = NOW()`,
    [a, b, severity, mechanism, side_effects, source]
  );
  return { supplement1: a, supplement2: b, severity, mechanism, side_effects, source };
}

// POST /check - improved logic
router.post('/check', async (req, res) => {
  const { stack, stack_id } = req.body;
  if (!Array.isArray(stack) || stack.length < 2) {
    return res.status(400).json({ error: 'At least 2 supplements required.' });
  }
  try {
    // 1. Get CUI and meta for each supplement (for interactions)
    const suppInfo = {};
    for (const name of stack) {
      const info = await getSuppAIInfo(name);
      if (info) suppInfo[name] = info;
    }
    // 2. Get all unique pairs and fetch interaction info
    const names = Object.keys(suppInfo);
    const interactions = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const n1 = names[i], n2 = names[j];
        const interaction = await getOrUpdateInteraction(n1, n2);
        
        if (interaction && (interaction.severity || interaction.mechanism || interaction.side_effects)) {
          const interactionData = {
            supplements: [n1, n2],
            severity: interaction.severity || 'Unknown',
            mechanism: interaction.mechanism || 'Unknown',
            side_effects: interaction.side_effects || 'Unknown',
            source: interaction.source || 'supp.ai + gemma-2b-it'
          };
          interactions.push(interactionData);
        } else {
          const fallbackData = {
            supplements: [n1, n2],
            severity: 'Data not found. Please consult your healthcare provider.',
            mechanism: 'Data not found. Please consult your healthcare provider.',
            side_effects: 'Data not found. Please consult your healthcare provider.',
            source: 'none'
          };
          interactions.push(fallbackData);
        }
      }
    }
    // 3. For each supplement, get typical dosage and use from supplement_info table
    const supplements = [];
    for (const name of names) {
      let typical_use = '', typical_dosage = '';
      const info = await findSupplementInfo(name);
      if (info) {
        typical_use = info.typical_use;
        typical_dosage = info.typical_dosage;
      } else {
        typical_use = 'Data not found. Please consult your healthcare provider.';
        typical_dosage = 'Data not found. Please consult your healthcare provider.';
      }
      supplements.push({
        name,
        typical_use,
        typical_dosage
      });
    }
    
    // Save to stack_history if stack_id and user are present
    if (stack_id && req.user && req.user.id) {
      try {
        await pool.query(
          'INSERT INTO stack_history (user_id, stack_id, result) VALUES ($1, $2, $3)',
          [req.user.id, stack_id, JSON.stringify({ interactions, supplements })]
        );
      } catch (e) {
        console.error('Failed to save stack history:', e);
        // Don't block the response, just log the error
      }
    }
    res.json({ interactions, supplements });
  } catch (error) {
    console.error('Error in improved /check:', error);
    res.status(500).json({ error: 'Failed to check supplement interactions.' });
  }
});

module.exports = router;
