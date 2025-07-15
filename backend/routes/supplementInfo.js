const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/', async (req, res) => {
  const name = (req.query.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Name required' })

  try {
    const resp = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(name)}`)
    if (resp.data && resp.data.results && resp.data.results.length > 0) {
      const supp = resp.data.results[0]
      res.json({
        name: supp.preferred_name,
        synonyms: supp.synonyms,
        description: supp.description || ''
      })
    } else {
      res.status(404).json({ error: 'Supplement not found' })
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch supplement info' })
  }
})

module.exports = router 