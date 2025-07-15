const express = require('express')
const axios = require('axios')
const router = express.Router()

// In-memory recent history (per session would be better, but for now global)
let recentStacks = []

// Helper: Map SUPP.AI evidence to general risk label
function getRiskLabel(evidence) {
  if (!evidence || evidence.length === 0) return 'No Known Interaction'
  // You can refine this logic based on evidence type/strength
  // For now, if any evidence exists, call it "Possible Risk"
  return 'Possible Risk'
}

// Helper: Search SUPP.AI for agent CUI by name
async function getCUIForName(name) {
  const resp = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(name)}`)
  if (resp.data && resp.data.results && resp.data.results.length > 0) {
    return resp.data.results[0].cui
  }
  return null
}

// Helper: Get interaction evidence between two CUIs (no summarization, just presence)
async function getInteractionEvidenceSimple(cui1, cui2) {
  // SUPP.AI interaction IDs are sorted alphabetically
  const [a, b] = [cui1, cui2].sort()
  const interactionId = `${a}-${b}`
  try {
    const resp = await axios.get(`https://supp.ai/api/interaction/${interactionId}`)
    if (resp.data && resp.data.evidence && resp.data.evidence.length > 0) {
      return resp.data.evidence
    }
  } catch (e) {
    // No interaction found or error
  }
  return []
}

// Free tier: /check endpoint
router.post('/check', async (req, res) => {
  const { stack } = req.body
  if (!Array.isArray(stack) || stack.length < 2) {
    return res.status(400).json({ error: 'At least 2 supplements required.' })
  }
  if (stack.length > 5) {
    return res.status(400).json({ error: 'You can only check up to 5 supplements at once in the free version.' })
  }
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
        const evidence = await getInteractionEvidenceSimple(cui1, cui2)
        const risk = getRiskLabel(evidence)
        interactions.push({
          supplements: [n1, n2],
          risk
        })
      }
    }
    // Save to recent history (keep only last 2)
    recentStacks.unshift({ stack: names, date: new Date().toISOString(), interactions })
    if (recentStacks.length > 2) recentStacks = recentStacks.slice(0, 2)
    res.json({ interactions })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' })
  }
})

// Endpoint to get recent stacks
router.get('/recent', (req, res) => {
  res.json({ recent: recentStacks })
})

module.exports = router
