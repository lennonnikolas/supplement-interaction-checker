const express = require('express')
const axios = require('axios')
const router = express.Router()
// const apiKey = process.env.API_KEY // Need for future API calls


router.post('/check', async (req, res) => {
  const { stack } = req.body
  try {
    // Replace with a real supplement interaction API call
    const interactions = await getSupplementInteractions(stack)
    res.json({ interactions })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' })
  }
})

// MOCK FUNCTION (Replace with actual API logic)
async function getSupplementInteractions(supplements) {
  return supplements.map((s, idx) => ({
    id: idx,
    supplements: [s, supplements[(idx + 1) % supplements.length]],
    effect: Math.random() > 0.5 ? 'Positive synergy' : 'Negative interaction'
  }))
}

module.exports = router
