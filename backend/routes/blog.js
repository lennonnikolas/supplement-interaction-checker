const express = require('express')
const router = express.Router()

const articles = [
  // Blog Articles
  {
    title: 'How to Build a Safe Supplement Stack',
    slug: 'safe-supplement-stack',
    summary: 'Learn the basics of combining supplements safely and what to watch out for. Discover the fundamental principles of supplement stacking for optimal results without compromising your health.',
    tags: ['safety', 'stacking', 'beginner']
  },
  {
    title: 'Common Supplement Interactions to Avoid',
    slug: 'common-interactions',
    summary: 'A comprehensive list of supplement combinations that may cause problems and how to avoid them. Essential reading for anyone taking multiple supplements.',
    tags: ['interactions', 'risks', 'safety']
  },
  {
    title: 'The Science Behind Supplement Interactions',
    slug: 'supplement-interaction-science',
    summary: 'Understanding the biochemical mechanisms that cause supplement interactions and how they affect your body. Deep dive into the research.',
    tags: ['science', 'research', 'education']
  },
  {
    title: 'Pre-Workout Supplement Safety Guide',
    slug: 'pre-workout-safety',
    summary: 'Everything you need to know about pre-workout supplements, their ingredients, and how to use them safely for maximum performance.',
    tags: ['pre-workout', 'fitness', 'performance']
  },
  {
    title: 'Post-Workout Recovery Supplements',
    slug: 'post-workout-recovery',
    summary: 'The best supplements for post-workout recovery, muscle growth, and reducing soreness. Learn what to take and when.',
    tags: ['recovery', 'muscle-growth', 'fitness']
  },
  {
    title: 'Vitamins and Minerals: The Foundation',
    slug: 'vitamins-minerals-foundation',
    summary: 'Understanding the role of essential vitamins and minerals in your supplement stack and how they work together.',
    tags: ['vitamins', 'minerals', 'nutrition']
  },
  
  // FAQ Items
  {
    title: 'What Does "Possible Risk" Mean?',
    slug: 'possible-risk-label',
    summary: 'Understanding the risk labels in your supplement interaction results. Learn what different risk levels mean and how to interpret them for your health decisions.',
    tags: ['faq', 'labels', 'risk-assessment']
  },
  {
    title: 'How Accurate Are the Interaction Results?',
    slug: 'interaction-accuracy',
    summary: 'Our interaction checker uses scientific databases and AI analysis to provide accurate results. Learn about our data sources and methodology.',
    tags: ['faq', 'accuracy', 'methodology']
  },
  {
    title: 'Can I Take Supplements with Prescription Medications?',
    slug: 'supplements-with-medications',
    summary: 'Important information about combining supplements with prescription medications. Always consult your healthcare provider for personalized advice.',
    tags: ['faq', 'medications', 'healthcare']
  },
  {
    title: 'How Often Should I Check My Supplement Stack?',
    slug: 'how-often-check-stack',
    summary: 'Guidelines for when to recheck your supplement stack for interactions, especially when adding new supplements or changing dosages.',
    tags: ['faq', 'timing', 'best-practices']
  },
  {
    title: 'What Should I Do If I Find a Risk?',
    slug: 'what-to-do-if-risk',
    summary: 'Step-by-step guide on what to do if our tool identifies a potential risk in your supplement stack.',
    tags: ['faq', 'risk-management', 'safety']
  },
  {
    title: 'Are Natural Supplements Safer Than Synthetic Ones?',
    slug: 'natural-vs-synthetic',
    summary: 'Understanding the differences between natural and synthetic supplements and their respective safety profiles.',
    tags: ['faq', 'natural', 'synthetic', 'education']
  }
]

router.get('/', (req, res) => {
  res.json({ articles })
})

module.exports = router 