const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const checkRoute = require('./routes/check')
app.use('/api', checkRoute)

app.listen(3000, () => console.log('Server running on http://localhost:3000'))
