const express = require('express')
const router = express.Router()

const articles = [
  {
    title: 'How to Build a Safe Supplement Stack',
    slug: 'safe-supplement-stack',
    summary: 'Learn the basics of combining supplements safely and what to watch out for.',
    tags: ['safety', 'stacking', 'beginner']
  },
  {
    title: 'Common Supplement Interactions to Avoid',
    slug: 'common-interactions',
    summary: 'A list of supplement combinations that may cause problems and how to avoid them.',
    tags: ['interactions', 'risks']
  },
  {
    title: 'What Does “Possible Risk” Mean?',
    slug: 'possible-risk-label',
    summary: 'Understanding the risk labels in your supplement interaction results.',
    tags: ['faq', 'labels']
  },
  // Add more articles as needed
]

router.get('/', (req, res) => {
  res.json({ articles })
})

module.exports = router 