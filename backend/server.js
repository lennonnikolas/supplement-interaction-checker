const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const allowedOrigins = [
  'https://supplement-checker-ui-app-e82892764eec.herokuapp.com',
  'http://localhost:5173',
  'http://www.ismystacksafe.com',
  'https://www.ismystacksafe.com'
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

// Register Stripe webhook route BEFORE JSON middleware to preserve raw body
const stripeRoute = require('./routes/stripe');
app.use('/api/stripe', stripeRoute);

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

const { router: authRoutes } = require('./routes/auth')
app.use('/api/auth', authRoutes)

const stacksRoute = require('./routes/stacks');
app.use('/api/stacks', stacksRoute);

const reportsRoute = require('./routes/reports');
app.use('/api/reports', reportsRoute);

const recentRoute = require('./routes/recent');
app.use('/api/recent', recentRoute);

const passwordResetRoute = require('./routes/passwordReset');
app.use('/api/password-reset', passwordResetRoute);

// Check for required environment variables
const requiredEnvs = ['DATABASE_URL', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY'];
const missing = requiredEnvs.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
