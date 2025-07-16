const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const allowedOrigins = [
  'https://supplement-checker-ui-app-e82892764eec.herokuapp.com',
  'http://localhost:5173',
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json())

const passport = require('passport')
const initPassport = require('./auth/passport')
initPassport()
app.use(passport.initialize())

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

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
