const express = require('express')
const axios = require('axios')
const router = express.Router()

// Summarization abstraction for easy swapping
async function summarizeEvidence(text) {
  // Use Cohere for now
  return await summarizeWithCohere(text)
}

async function summarizeWithCohere(text) {
  const apiKey = process.env.COHERE_API_KEY
  if (!apiKey) return ''
  try {
    const resp = await axios.post(
      'https://api.cohere.ai/v1/summarize',
      {
        text,
        length: 'short',
        format: 'paragraph',
        model: 'summarize-xlarge',
        extractiveness: 'auto',
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return resp.data.summary || ''
  } catch (e) {
    return ''
  }
}

// Helper: Search SUPP.AI for agent CUI by name
async function getCUIForName(name) {
  const resp = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(name)}`)
  if (resp.data && resp.data.results && resp.data.results.length > 0) {
    return resp.data.results[0].cui
  }
  return null
}

// Helper: Translate technical medical terms to human-readable language
function translateToHumanReadable(text) {
  const translations = {
    'increases blood pressure': 'may raise your blood pressure',
    'decreases blood pressure': 'may lower your blood pressure',
    'increases heart rate': 'may make your heart beat faster',
    'decreases heart rate': 'may slow your heart rate',
    'bleeding risk': 'may increase your risk of bleeding',
    'bleeding time': 'may make you bleed more easily',
    'coagulation': 'may affect blood clotting',
    'platelet aggregation': 'may affect blood clotting',
    'liver enzymes': 'may affect your liver function',
    'liver toxicity': 'may harm your liver',
    'hepatotoxicity': 'may harm your liver',
    'kidney function': 'may affect your kidney function',
    'renal': 'may affect your kidneys',
    'gastrointestinal': 'may upset your stomach',
    'nausea': 'may cause nausea',
    'vomiting': 'may cause vomiting',
    'diarrhea': 'may cause diarrhea',
    'constipation': 'may cause constipation',
    'headache': 'may cause headaches',
    'dizziness': 'may cause dizziness',
    'fatigue': 'may cause tiredness',
    'insomnia': 'may cause trouble sleeping',
    'sleep disturbances': 'may affect your sleep',
    'allergic reaction': 'may cause an allergic reaction',
    'rash': 'may cause a skin rash',
    'itching': 'may cause itching',
    'swelling': 'may cause swelling',
    'difficulty breathing': 'may make it harder to breathe',
    'shortness of breath': 'may cause shortness of breath',
    'chest pain': 'may cause chest pain',
    'irregular heartbeat': 'may cause irregular heartbeat',
    'arrhythmia': 'may cause irregular heartbeat',
    'absorption': 'may affect how your body absorbs nutrients',
    'bioavailability': 'may affect how well your body uses the supplement',
    'metabolism': 'may affect how your body processes the supplement',
    'excretion': 'may affect how your body removes the supplement',
    'clearance': 'may affect how your body removes the supplement',
    'half-life': 'may affect how long the supplement stays in your body',
    'serum levels': 'may affect levels in your blood',
    'plasma levels': 'may affect levels in your blood',
    'concentration': 'may affect levels in your blood',
    'efficacy': 'may make the supplement less effective',
    'effectiveness': 'may make the supplement less effective',
    'potency': 'may change how strong the supplement is',
    'toxicity': 'may be harmful',
    'toxic': 'may be harmful',
    'harmful': 'may be harmful',
    'dangerous': 'may be dangerous',
    'risk': 'may increase your risk',
    'adverse': 'may cause problems',
    'side effect': 'may cause side effects',
    'adverse effect': 'may cause problems',
    'adverse reaction': 'may cause problems',
    'negative effect': 'may cause problems',
    'complication': 'may cause complications',
    'interference': 'may interfere with',
    'interferes': 'may interfere with',
    'reduces': 'may reduce',
    'decreases': 'may decrease',
    'increases': 'may increase',
    'enhances': 'may enhance',
    'potentiates': 'may make stronger',
    'synergistic': 'may work together in unexpected ways',
    'antagonistic': 'may work against each other'
  }
  
  let humanText = text
  for (const [technical, human] of Object.entries(translations)) {
    const regex = new RegExp(technical, 'gi')
    humanText = humanText.replace(regex, human)
  }
  
  return humanText
}

// Helper: Summarize side effects for a layperson using Cohere
async function summarizeSideEffectsForLayperson(supp1, supp2, evidenceSentences) {
  const apiKey = process.env.COHERE_API_KEY
  if (!apiKey || !evidenceSentences || evidenceSentences.length === 0) return ''
  const prompt = `Summarize the following research for a general audience. What are the possible side effects or bodily risks if someone combines ${supp1} and ${supp2}? Use clear, simple language.\n\nResearch:\n${evidenceSentences.join(' ')}`
  try {
    const resp = await axios.post(
      'https://api.cohere.ai/v1/summarize',
      {
        text: prompt,
        length: 'short',
        format: 'paragraph',
        model: 'summarize-xlarge',
        extractiveness: 'auto',
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return resp.data.summary || ''
  } catch (e) {
    return ''
  }
}

// Helper: Get interaction evidence between two CUIs
const summaryCache = {}
async function getInteractionEvidence(cui1, cui2, supp1, supp2) {
  // SUPP.AI interaction IDs are sorted alphabetically
  const [a, b] = [cui1, cui2].sort()
  const interactionId = `${a}-${b}`
  try {
    const resp = await axios.get(`https://supp.ai/api/interaction/${interactionId}`)
    if (resp.data && resp.data.evidence && resp.data.evidence.length > 0) {
      return await Promise.all(resp.data.evidence.map(async ev => {
        const paper = ev.paper || {}
        // Prefer DOI, fallback to PubMed, fallback to Semantic Scholar
        let link = null
        if (paper.doi) {
          link = `https://doi.org/${paper.doi}`
        } else if (paper.pmid) {
          link = `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`
        } else if (paper.pid) {
          link = `https://www.semanticscholar.org/paper/${paper.pid}`
        }
        // Determine type
        let type = 'Research'
        if (paper.clinical_study) type = 'Clinical Study'
        else if (paper.human_study) type = 'Human Study'
        else if (paper.animal_study) type = 'Animal Study'
        // Concatenate all evidence sentences
        let allSentences = ''
        let sideEffects = []
        if (ev.sentences && ev.sentences.length > 0) {
          allSentences = ev.sentences.map(s => s.spans.map(span => span.text).join('')).join(' ')
          // Extract side effects sentences
          const sideEffectKeywords = [
            'side effect', 'adverse effect', 'adverse reaction', 'negative effect',
            'toxicity', 'toxic', 'harmful', 'dangerous', 'risk', 'risky',
            'symptom', 'symptoms', 'complication', 'complications',
            'interference', 'interferes', 'reduces', 'decreases', 'increases',
            'bleeding', 'blood pressure', 'heart rate', 'liver', 'kidney',
            'nausea', 'dizziness', 'headache', 'fatigue', 'insomnia',
            'allergic', 'allergy', 'rash', 'swelling', 'difficulty breathing',
            'absorption', 'bioavailability', 'metabolism', 'efficacy',
            'serum', 'plasma', 'concentration', 'clearance', 'half-life',
            'gastrointestinal', 'vomiting', 'diarrhea', 'constipation',
            'chest pain', 'irregular heartbeat', 'arrhythmia',
            'coagulation', 'platelet', 'hepatotoxicity', 'renal'
          ]
          const sideEffectSentences = ev.sentences
            .map(sentence => sentence.spans.map(span => span.text).join(''))
            .filter(sentenceText => {
              const lower = sentenceText.toLowerCase()
              return sideEffectKeywords.some(keyword => lower.includes(keyword))
            })
          // Use Cohere to summarize for layperson if any side effect sentences found
          if (sideEffectSentences.length > 0) {
            const laypersonSummary = await summarizeSideEffectsForLayperson(supp1, supp2, sideEffectSentences)
            if (laypersonSummary) {
              sideEffects = [laypersonSummary]
            } else {
              sideEffects = sideEffectSentences
            }
          }
        }
        // Debug logging
        if (sideEffects.length > 0) {
          console.log(`Layperson side effect summary for ${supp1} + ${supp2}:`, sideEffects[0])
        }
        // Cache key: paper+interaction+sentences
        const cacheKey = `${interactionId}:${paper.title || ''}:${allSentences}`
        let summary = summaryCache[cacheKey]
        if (!summary) {
          if (allSentences && allSentences.trim().length > 0) {
            summary = await summarizeEvidence(allSentences)
          }
          // Fallback: if summary is empty or there is nothing to summarize, show a helpful message
          if (!summary) {
            summary = 'Summary could not be generated. Please review the study for more information.'
          }
          summaryCache[cacheKey] = summary
        }
        return {
          type,
          title: paper.title || null,
          link,
          summary,
          sideEffects: sideEffects.length > 0 ? sideEffects : null
        }
      }))
    }
  } catch (e) {
    // No interaction found or error
  }
  return null
}

// In the POST /check route, pass supplement names to getInteractionEvidence
router.post('/check', async (req, res) => {
  const { stack } = req.body
  try {
    // 1. Map names to CUIs
    const cuiMap = {}
    for (const name of stack) {
      const cui = await getCUIForName(name.trim())
      if (cui) cuiMap[name.trim()] = cui
    }
    const names = Object.keys(cuiMap)
    // 2. For each unique pair, check for interactions
    const interactions = []
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const n1 = names[i], n2 = names[j]
        const cui1 = cuiMap[n1], cui2 = cuiMap[n2]
        const evidence = await getInteractionEvidence(cui1, cui2, n1, n2)
        if (evidence && evidence.length > 0) {
          interactions.push({
            supplements: [n1, n2],
            effect: 'Interaction found',
            evidence
          })
        } else {
          interactions.push({
            supplements: [n1, n2],
            effect: 'No known interaction',
            evidence: []
          })
        }
      }
    }
    res.json({ interactions })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' })
  }
})

module.exports = router
