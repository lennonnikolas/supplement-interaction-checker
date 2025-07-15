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

const supplementInfoRoute = require('./routes/supplementInfo')
app.use('/api/supplement-info', supplementInfoRoute)

const alternativesRoute = require('./routes/alternatives')
app.use('/api/alternatives', alternativesRoute)

const blogRoute = require('./routes/blog')
app.use('/api/blog', blogRoute)

const subscribeRoute = require('./routes/subscribe')
app.use('/api/subscribe', subscribeRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
