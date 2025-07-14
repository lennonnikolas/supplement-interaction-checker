const express = require('express')
const cors = require('cors')
require('dotenv').config()
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const checkRoute = require('./routes/check')
app.use('/api', checkRoute)

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'frontend_dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
