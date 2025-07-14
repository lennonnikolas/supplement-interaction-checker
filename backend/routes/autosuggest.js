const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/autosuggest', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ results: [] });
  try {
    const resp = await axios.get(`https://supp.ai/api/agent/search?q=${encodeURIComponent(q)}`);
    res.json(resp.data);
  } catch (e) {
    res.status(500).json({ results: [] });
  }
});

module.exports = router;