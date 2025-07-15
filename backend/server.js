const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const checkRoute = require('./routes/check')
app.use('/api', checkRoute)

const autosuggestRoute = require('./routes/autosuggest');
app.use('/api/autosuggest', autosuggestRoute);

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
