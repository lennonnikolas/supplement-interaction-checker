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

// Helper: Get interaction evidence between two CUIs
const summaryCache = {}
async function getInteractionEvidence(cui1, cui2) {
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
        if (ev.sentences && ev.sentences.length > 0) {
          allSentences = ev.sentences.map(s => s.spans.map(span => span.text).join('')).join(' ')
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
          summary
        }
      }))
    }
  } catch (e) {
    // No interaction found or error
  }
  return null
}

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
        const evidence = await getInteractionEvidence(cui1, cui2)
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
