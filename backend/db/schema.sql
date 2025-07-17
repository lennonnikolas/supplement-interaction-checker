-- Users table: stores user credentials and OAuth info
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- nullable for OAuth-only users
    oauth_provider VARCHAR(32),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profile: health info, demographics, etc.
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(32),
    conditions TEXT[],
    medications TEXT[],
    allergies TEXT[],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved stacks (library)
CREATE TABLE IF NOT EXISTS stacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    stack_data JSONB NOT NULL, -- supplement list, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stack history (timeline)
CREATE TABLE IF NOT EXISTS stack_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stack_id INTEGER REFERENCES stacks(id) ON DELETE CASCADE,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result JSONB -- store analysis result for this check
);

-- Feature voting (priority feedback)
CREATE TABLE IF NOT EXISTS feature_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    feature_id VARCHAR(64) NOT NULL,
    vote INTEGER NOT NULL, -- 1=upvote, -1=downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports (PDF/shareable)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stack_id INTEGER REFERENCES stacks(id) ON DELETE CASCADE,
    pdf_url VARCHAR(512),
    share_token VARCHAR(128) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplement info: curated fitness/bodybuilding-focused data
CREATE TABLE IF NOT EXISTS supplement_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) UNIQUE NOT NULL,
    aliases TEXT[],
    typical_use TEXT NOT NULL,
    typical_dosage TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supplement_interactions (
    id SERIAL PRIMARY KEY,
    supplement1 VARCHAR(128) NOT NULL,
    supplement2 VARCHAR(128) NOT NULL,
    severity VARCHAR(32),
    mechanism TEXT,
    side_effects TEXT,
    source VARCHAR(64),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (supplement1, supplement2)
);

TRUNCATE TABLE supplement_info RESTART IDENTITY CASCADE;
-- Seed top fitness/bodybuilding supplements (partial list for brevity; full 100 should be added in a separate seed file or migration)
INSERT INTO supplement_info (name, aliases, typical_use, typical_dosage) VALUES
('creatine', ARRAY['creatine monohydrate'], 'Used to increase muscle strength, power, and performance during high-intensity exercise.', '0.3 g per kg bodyweight (loading phase), 3–5 g per day (maintenance)'),
('caffeine', ARRAY['anhydrous caffeine'], 'Used to enhance energy, alertness, and exercise performance.', '3–6 mg per kg bodyweight, taken 30–60 minutes before exercise'),
('whey protein isolate', ARRAY['whey protein', 'protein powder'], 'Used to support muscle growth and recovery by providing high-quality protein.', '20–40 g after exercise or as needed to meet daily protein requirements'),
('beta-alanine', ARRAY[]::TEXT[], 'Used to improve muscular endurance and reduce fatigue during high-intensity exercise.', '2–5 g per day, often split into multiple doses'),
('BCAA', ARRAY['branched chain amino acids', 'leucine', 'isoleucine', 'valine'], 'Used to support muscle recovery, reduce fatigue, and stimulate muscle protein synthesis.', '5–10 g before, during, or after exercise'),
('citrulline malate', ARRAY['citrulline'], 'Used to boost nitric oxide production, enhance blood flow, and improve exercise performance.', '6–8 g 30–60 minutes before exercise'),
('casein protein', ARRAY['casein'], 'Used to support muscle growth and recovery, especially overnight.', '20–40 g before sleep or as needed'),
('L-glutamine', ARRAY['glutamine'], 'Used to support muscle recovery and immune function after intense exercise.', '5–10 g after exercise'),
('L-carnitine', ARRAY['carnitine'], 'Used to support fat metabolism and energy production.', '1–3 g per day'),
('multivitamin', ARRAY['multi-vitamin'], 'Used to support overall health and fill micronutrient gaps.', 'As directed on product label'),
('fish oil', ARRAY['omega-3', 'epa', 'dha'], 'Used to support cardiovascular health, reduce inflammation, and aid recovery.', '1–3 g combined EPA/DHA per day'),
('vitamin D', ARRAY['cholecalciferol', 'D3'], 'Used to support bone health, immune function, and muscle performance.', '1000–4000 IU per day'),
('magnesium', ARRAY[]::TEXT[], 'Used to support muscle function, energy production, and recovery.', '200–400 mg per day'),
('zinc', ARRAY[]::TEXT[], 'Used to support immune function, hormone production, and recovery.', '10–30 mg per day'),
('electrolytes', ARRAY['sodium', 'potassium', 'magnesium', 'calcium'], 'Used to maintain hydration and support muscle function during exercise.', 'As needed, especially during prolonged exercise or heavy sweating'),
('pre-workout', ARRAY['preworkout'], 'Used to enhance energy, focus, and performance before exercise.', 'As directed on product label, typically 1 serving 20–30 minutes before exercise'),
('post-workout', ARRAY['postworkout'], 'Used to support recovery and muscle growth after exercise.', 'As directed on product label, typically 1 serving after exercise'),
('HMB', ARRAY['beta-hydroxy beta-methylbutyrate'], 'Used to reduce muscle breakdown and support muscle mass during training.', '1.5–3 g per day'),
('EAA', ARRAY['essential amino acids'], 'Used to stimulate muscle protein synthesis and support recovery.', '5–15 g before, during, or after exercise'),
('vitamin C', ARRAY['ascorbic acid'], 'Used to support immune function and recovery.', '500–2000 mg per day'),
('ashwagandha', ARRAY[]::TEXT[], 'Used to reduce stress, support recovery, and enhance strength.', '300–600 mg per day (root extract)'),
('turmeric', ARRAY['curcumin'], 'Used to reduce inflammation and support joint health.', '500–2000 mg per day (standardized extract)'),
('green tea extract', ARRAY['EGCG'], 'Used to support fat loss and provide antioxidants.', '250–500 mg per day (standardized for EGCG)'),
('probiotics', ARRAY[]::TEXT[], 'Used to support gut health and immune function.', 'As directed on product label'),
('fiber', ARRAY['psyllium', 'inulin'], 'Used to support digestive health and regularity.', '5–15 g per day'),
('melatonin', ARRAY[]::TEXT[], 'Used to support sleep quality and recovery.', '1–5 mg 30–60 minutes before bedtime'),
('nitric oxide booster', ARRAY['NO booster'], 'Used to enhance blood flow and exercise performance.', 'As directed on product label, typically 1 serving before exercise'),
('CLA', ARRAY['conjugated linoleic acid'], 'Used to support fat loss and body composition.', '1–3 g per day'),
('thermogenic', ARRAY['fat burner'], 'Used to support fat loss and increase metabolic rate.', 'As directed on product label'),
('mass gainer', ARRAY['weight gainer', 'gainer'], 'Used to provide calories and nutrients for muscle growth during bulking phases.', 'As directed on product label, typically 1–2 servings per day'),
('DHEA', ARRAY[]::TEXT[], 'Used to support hormone balance and muscle growth.', '25–100 mg per day'),
('betaine', ARRAY['trimethylglycine'], 'Used to support power output and body composition.', '2.5–6 g per day'),
('chromium', ARRAY[]::TEXT[], 'Used to support blood sugar control and metabolism.', '200–1000 mcg per day'),
('alpha-lipoic acid', ARRAY['ALA'], 'Used to support antioxidant status and blood sugar control.', '300–600 mg per day'),
('coenzyme Q10', ARRAY['CoQ10'], 'Used to support energy production and cardiovascular health.', '100–300 mg per day'),
('vitamin B12', ARRAY['cobalamin'], 'Used to support energy production and red blood cell formation.', '500–2000 mcg per day'),
('niacin', ARRAY['vitamin B3'], 'Used to support energy metabolism and cardiovascular health.', '14–35 mg per day'),
('iron', ARRAY[]::TEXT[], 'Used to support oxygen transport and energy production.', '8–18 mg per day'),
('calcium', ARRAY[]::TEXT[], 'Used to support bone health and muscle function.', '500–1200 mg per day'),
('potassium', ARRAY[]::TEXT[], 'Used to support muscle function and hydration.', '2000–4000 mg per day'),
('selenium', ARRAY[]::TEXT[], 'Used to support antioxidant status and immune function.', '55–200 mcg per day'),
('vitamin E', ARRAY['tocopherol'], 'Used to support antioxidant status and recovery.', '15–400 IU per day'),
('vitamin K2', ARRAY['menaquinone'], 'Used to support bone and cardiovascular health.', '90–200 mcg per day'),
('iodine', ARRAY[]::TEXT[], 'Used to support thyroid function and metabolism.', '150 mcg per day'),
('resveratrol', ARRAY[]::TEXT[], 'Used to support cardiovascular health and antioxidant status.', '100–500 mg per day'),
('garlic extract', ARRAY[]::TEXT[], 'Used to support cardiovascular health and immune function.', '300–1000 mg per day'),
('GABA', ARRAY[]::TEXT[], 'Used to promote relaxation and support sleep.', '100–500 mg before bedtime'),
('Rhodiola rosea', ARRAY[]::TEXT[], 'Used to reduce fatigue and support endurance.', '200–600 mg per day'),
('coconut water', ARRAY[]::TEXT[], 'Used to support hydration and electrolyte balance.', 'As needed, especially after exercise'),
('collagen', ARRAY[]::TEXT[], 'Used to support joint, skin, and connective tissue health.', '5–15 g per day'),
('MSM', ARRAY['methylsulfonylmethane'], 'Used to support joint health and reduce inflammation.', '1–3 g per day'),
('glucosamine', ARRAY[]::TEXT[], 'Used to support joint health and mobility.', '1500 mg per day'),
('chondroitin', ARRAY[]::TEXT[], 'Used to support joint health and cartilage.', '800–1200 mg per day'),
('SAM-e', ARRAY['S-adenosyl methionine'], 'Used to support mood and joint health.', '400–1600 mg per day'),
('quercetin', ARRAY[]::TEXT[], 'Used to support immune function and recovery.', '500–1000 mg per day'),
('astaxanthin', ARRAY[]::TEXT[], 'Used to support antioxidant status and skin health.', '4–12 mg per day'),
('grape seed extract', ARRAY[]::TEXT[], 'Used to support cardiovascular health and antioxidant status.', '100–300 mg per day'),
('maca root', ARRAY[]::TEXT[], 'Used to support energy, mood, and hormone balance.', '1–3 g per day'),
('tribulus terrestris', ARRAY[]::TEXT[], 'Used to support hormone balance and libido.', '250–1500 mg per day'),
('fenugreek', ARRAY[]::TEXT[], 'Used to support testosterone and blood sugar control.', '500–1000 mg per day'),
('yohimbine', ARRAY[]::TEXT[], 'Used to support fat loss and energy.', '5–20 mg per day'),
('DMAE', ARRAY['dimethylaminoethanol'], 'Used to support cognitive function and focus.', '100–300 mg per day'),
('inositol', ARRAY[]::TEXT[], 'Used to support mood and metabolic health.', '2–4 g per day'),
('phosphatidylserine', ARRAY[]::TEXT[], 'Used to support cognitive function and recovery.', '100–400 mg per day'),
('L-arginine', ARRAY['arginine'], 'Used to support nitric oxide production and blood flow.', '3–6 g before exercise'),
('L-ornithine', ARRAY['ornithine'], 'Used to support recovery and reduce fatigue.', '2–6 g before exercise'),
('L-lysine', ARRAY['lysine'], 'Used to support immune function and recovery.', '1–3 g per day'),
('L-histidine', ARRAY['histidine'], 'Used to support muscle recovery and immune function.', '1–2 g per day'),
('L-methionine', ARRAY['methionine'], 'Used to support protein synthesis and liver health.', '1–2 g per day'),
('L-phenylalanine', ARRAY['phenylalanine'], 'Used to support mood and cognitive function.', '500–1500 mg per day'),
('L-threonine', ARRAY['threonine'], 'Used to support protein synthesis and gut health.', '500–1500 mg per day'),
('L-valine', ARRAY['valine'], 'Used to support muscle recovery and energy.', '1–3 g before or after exercise'),
('L-glutamic acid', ARRAY['glutamic acid'], 'Used to support cognitive function and gut health.', '1–3 g per day'),
('L-proline', ARRAY['proline'], 'Used to support joint and skin health.', '500–2000 mg per day'),
('L-serine', ARRAY['serine'], 'Used to support cognitive function and nervous system health.', '500–2000 mg per day'),
('L-glycine', ARRAY['glycine'], 'Used to support sleep, recovery, and joint health.', '3–5 g before bedtime or after exercise'),
('L-alanine', ARRAY['alanine'], 'Used to support energy production and muscle recovery.', '1–3 g per day'),
('L-aspartic acid', ARRAY['aspartic acid'], 'Used to support energy production and hormone balance.', '1–3 g per day'),
('L-cysteine', ARRAY['cysteine'], 'Used to support antioxidant status and detoxification.', '500–1500 mg per day'),
('L-glutathione', ARRAY['glutathione'], 'Used to support antioxidant status and immune function.', '250–1000 mg per day'),
('L-taurine', ARRAY['taurine'], 'Used to support endurance and reduce muscle fatigue.', '1–3 g before or after exercise'),
('L-citrulline', ARRAY['citrulline'], 'Used to support nitric oxide production and blood flow.', '6–8 g before exercise'),
('L-tyrosine', ARRAY['tyrosine'], 'Used to support focus and cognitive function during stress or exercise.', '500–2000 mg before exercise or as needed'),
('L-theanine', ARRAY['theanine'], 'Used to promote relaxation and focus, often combined with caffeine.', '100–400 mg as needed'),
('L-tryptophan', ARRAY['tryptophan'], 'Used to support mood and sleep.', '500–2000 mg before bedtime');
-- (Add remaining supplements in a separate seed file or migration for maintainability) 

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS jwt_blacklist (
  id SERIAL PRIMARY KEY,
  jti VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- active, inactive, past_due, canceled
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free', -- free, pro
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
); 

-- Migration to add unique constraint to subscriptions.user_id
-- This allows the ON CONFLICT (user_id) clause to work properly

-- Add unique constraint to user_id column
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id); 