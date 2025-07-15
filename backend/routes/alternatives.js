const express = require('express')
const router = express.Router()

const alternativesData = {
  'caffeine': {
    alternative: 'L-theanine',
    reason: 'L-theanine provides calm focus and can be combined with lower caffeine for fewer jitters.'
  },
  'glutamine': {
    alternative: 'BCAAs',
    reason: 'BCAAs support muscle recovery and may be safer for some users.'
  },
  // Add more as needed
}

router.get('/', (req, res) => {
  const name = (req.query.name || '').toLowerCase().trim()
  if (!name || !alternativesData[name]) {
    return res.json({
      alternative: null,
      reason: 'No alternative available.',
      upgradePrompt: 'Upgrade to Pro for more suggestions.'
    })
  }
  res.json({
    alternative: alternativesData[name].alternative,
    reason: alternativesData[name].reason,
    upgradePrompt: 'Upgrade to Pro for more alternative suggestions.'
  })
})

module.exports = router 