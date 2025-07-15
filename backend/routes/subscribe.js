const express = require('express')
const router = express.Router()

const subscribers = []

router.post('/', (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required.' })
  }
  if (!subscribers.includes(email)) {
    subscribers.push(email)
  }
  res.json({ message: 'You are subscribed for monthly supplement safety updates.' })
})

module.exports = router 