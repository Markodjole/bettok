-- Add betting_signals JSONB to characters.
-- This is the user-facing, simplified layer: bettable patterns with approximate probabilities.
-- Internal AI uses the full personality data; users see these distilled signals.

ALTER TABLE characters ADD COLUMN IF NOT EXISTS betting_signals JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Seed betting signals for all 8 predefined characters

-- Mike: impulsive, flashy, impatient
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Grabs first thing he sees (80%)',
    'Picks the flashier option (75%)',
    'Loses patience in under 10s (70%)'
  ),
  'choice_patterns', jsonb_build_object(
    'flashiest_option', 0.75,
    'cheapest_option', 0.05,
    'most_popular_option', 0.15,
    'walks_away', 0.05
  ),
  'behavior_patterns', jsonb_build_object(
    'impulse_grab', 0.80,
    'reads_labels', 0.05,
    'asks_for_help', 0.10,
    'compares_options', 0.10
  ),
  'exploitable_tendencies', jsonb_build_array(
    'never reads labels or prices',
    'always picks bigger or louder',
    'checks phone mid-decision',
    'skips instructions completely'
  ),
  'context_modifiers', jsonb_build_object(
    'in_tech_store', jsonb_build_object('impulse_grab', 0.90, 'flashiest_option', 0.85),
    'in_food_court', jsonb_build_object('impulse_grab', 0.85, 'flashiest_option', 0.70),
    'under_time_pressure', jsonb_build_object('impulse_grab', 0.95, 'mistake_chance', 0.30)
  )
) WHERE slug = 'mike';

-- Elena: perfectionist, label-reader, cautious
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Reads every label (90%)',
    'Picks organic/healthy (80%)',
    'Walks away without choosing (35%)'
  ),
  'choice_patterns', jsonb_build_object(
    'healthiest_option', 0.80,
    'organic_option', 0.75,
    'cheapest_option', 0.05,
    'walks_away_undecided', 0.35
  ),
  'behavior_patterns', jsonb_build_object(
    'reads_labels', 0.90,
    'compares_options', 0.85,
    'impulse_grab', 0.02,
    'asks_stranger_opinion', 0.40
  ),
  'exploitable_tendencies', jsonb_build_array(
    'paralyzed by too many options',
    'always picks organic even at 3x price',
    'puts items back if unsure',
    'takes photos to research later'
  ),
  'context_modifiers', jsonb_build_object(
    'in_grocery_store', jsonb_build_object('reads_labels', 0.95, 'healthiest_option', 0.85),
    'in_restaurant', jsonb_build_object('walks_away_undecided', 0.20, 'healthiest_option', 0.75),
    'under_time_pressure', jsonb_build_object('walks_away_undecided', 0.55, 'mistake_chance', 0.15)
  )
) WHERE slug = 'elena';

-- Darius: strategic, value-focused, calm
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Picks best value (75%)',
    'Checks price first (85%)',
    'Walks away if overpriced (50%)'
  ),
  'choice_patterns', jsonb_build_object(
    'best_value_option', 0.75,
    'premium_option', 0.10,
    'brand_loyal_option', 0.60,
    'walks_away_if_overpriced', 0.50
  ),
  'behavior_patterns', jsonb_build_object(
    'checks_price_first', 0.85,
    'negotiates_or_asks', 0.70,
    'impulse_grab', 0.05,
    'compares_methodically', 0.75
  ),
  'exploitable_tendencies', jsonb_build_array(
    'will not overpay even under time pressure',
    'always checks price before choosing',
    'prefers value over brand prestige',
    'loyal to Timberland and G-Shock',
    'talks to staff for insider deals'
  ),
  'context_modifiers', jsonb_build_object(
    'shopping', jsonb_build_object('best_value_option', 0.85, 'checks_price_first', 0.90),
    'under_time_pressure', jsonb_build_object('best_value_option', 0.65, 'mistake_chance', 0.15),
    'social_setting', jsonb_build_object('negotiates_or_asks', 0.80, 'generous_with_others', 0.60)
  )
) WHERE slug = 'darius';

-- Yuki: shy, aesthetic-driven, retreat tendency
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Picks cutest/prettiest option (70%)',
    'Retreats if overwhelmed (55%)',
    'Circles back after walking past (45%)'
  ),
  'choice_patterns', jsonb_build_object(
    'cutest_option', 0.70,
    'most_colorful', 0.60,
    'smallest_version', 0.55,
    'walks_away_overwhelmed', 0.55
  ),
  'behavior_patterns', jsonb_build_object(
    'hesitates_before_touching', 0.75,
    'photographs_before_choosing', 0.65,
    'avoids_eye_contact', 0.80,
    'retreats_then_returns', 0.45
  ),
  'exploitable_tendencies', jsonb_build_array(
    'freezes when too many options',
    'always drawn to pink/pastel/cute',
    'apologizes before acting',
    'puts headphones on when stressed',
    'picks smaller/cuter version always'
  ),
  'context_modifiers', jsonb_build_object(
    'in_quiet_shop', jsonb_build_object('cutest_option', 0.80, 'walks_away_overwhelmed', 0.30),
    'in_crowded_place', jsonb_build_object('walks_away_overwhelmed', 0.75, 'retreats_then_returns', 0.60),
    'social_interaction', jsonb_build_object('avoids_eye_contact', 0.85, 'hesitates_before_touching', 0.85)
  )
) WHERE slug = 'yuki';

-- Frank: old-school, familiar, stubborn
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Picks what he knows (85%)',
    'Complains about prices (70%)',
    'Suspicious of anything new (75%)'
  ),
  'choice_patterns', jsonb_build_object(
    'familiar_option', 0.85,
    'new_or_trendy', 0.05,
    'cheapest_option', 0.40,
    'asks_staff_for_help', 0.50
  ),
  'behavior_patterns', jsonb_build_object(
    'reads_expiration_dates', 0.80,
    'grumbles_about_price', 0.70,
    'picks_same_brand_decades', 0.85,
    'confused_by_new_packaging', 0.65
  ),
  'exploitable_tendencies', jsonb_build_array(
    'will never try anything trendy',
    'always picks the brand he has used for years',
    'complains but still buys',
    'carries physical shopping list',
    'suspicious of self-checkout'
  ),
  'context_modifiers', jsonb_build_object(
    'in_familiar_store', jsonb_build_object('familiar_option', 0.90, 'grumbles_about_price', 0.60),
    'in_unfamiliar_store', jsonb_build_object('asks_staff_for_help', 0.75, 'confused_by_new_packaging', 0.80),
    'with_technology', jsonb_build_object('confused_by_new_packaging', 0.90, 'asks_staff_for_help', 0.80)
  )
) WHERE slug = 'frank';

-- Priya: efficient, practical, organized
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Picks most practical option (80%)',
    'Sticks to her list (75%)',
    'Checks protein content (65%)'
  ),
  'choice_patterns', jsonb_build_object(
    'most_practical', 0.80,
    'best_nutrition', 0.70,
    'impulse_treat', 0.20,
    'bulk_buy_if_sensible', 0.55
  ),
  'behavior_patterns', jsonb_build_object(
    'follows_list', 0.75,
    'compares_per_unit_price', 0.70,
    'helps_strangers_unprompted', 0.45,
    'multi_tasks', 0.80
  ),
  'exploitable_tendencies', jsonb_build_array(
    'always picks practical over pretty',
    'reads nutrition facts for protein',
    'occasionally adds exactly one treat',
    'organized to a fault',
    'competitive — picks efficient path'
  ),
  'context_modifiers', jsonb_build_object(
    'shopping', jsonb_build_object('follows_list', 0.85, 'most_practical', 0.85),
    'under_time_pressure', jsonb_build_object('multi_tasks', 0.90, 'follows_list', 0.80),
    'with_friends', jsonb_build_object('helps_strangers_unprompted', 0.60, 'impulse_treat', 0.35)
  )
) WHERE slug = 'priya';

-- Carlos: romantic, aesthetic, emotional
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Picks the most beautiful option (75%)',
    'Buys for others more than self (60%)',
    'Seduced by good packaging (70%)'
  ),
  'choice_patterns', jsonb_build_object(
    'most_beautiful', 0.75,
    'most_unique', 0.65,
    'gift_for_someone', 0.60,
    'practical_option', 0.10
  ),
  'behavior_patterns', jsonb_build_object(
    'talks_to_shop_owner', 0.70,
    'takes_scenic_route', 0.65,
    'buys_flowers_impulsively', 0.50,
    'holds_door_for_others', 0.80
  ),
  'exploitable_tendencies', jsonb_build_array(
    'never picks the practical option',
    'easily seduced by stories and packaging',
    'will buy flowers or small gifts impulsively',
    'always talks to every shop owner',
    'picks experiences over objects'
  ),
  'context_modifiers', jsonb_build_object(
    'in_market', jsonb_build_object('talks_to_shop_owner', 0.85, 'most_beautiful', 0.80),
    'with_someone', jsonb_build_object('gift_for_someone', 0.75, 'buys_flowers_impulsively', 0.65),
    'alone', jsonb_build_object('takes_scenic_route', 0.75, 'most_unique', 0.70)
  )
) WHERE slug = 'carlos';

-- Zara: content-driven, trend-obsessed, performative
UPDATE characters SET betting_signals = jsonb_build_object(
  'quick_read', jsonb_build_array(
    'Picks most photogenic option (80%)',
    'Films everything (75%)',
    'Returns 40% of purchases (40%)'
  ),
  'choice_patterns', jsonb_build_object(
    'most_photogenic', 0.80,
    'trending_option', 0.75,
    'practical_option', 0.05,
    'returns_later', 0.40
  ),
  'behavior_patterns', jsonb_build_object(
    'films_the_process', 0.75,
    'says_this_is_so_me', 0.60,
    'picks_based_on_aesthetic', 0.80,
    'influenced_by_tiktok', 0.70
  ),
  'exploitable_tendencies', jsonb_build_array(
    'optimizes every decision for content',
    'picks whatever is trending this week',
    'has main character energy always',
    'returns almost half of what she buys',
    'will try anything if it gets views'
  ),
  'context_modifiers', jsonb_build_object(
    'shopping', jsonb_build_object('most_photogenic', 0.85, 'films_the_process', 0.80),
    'in_public', jsonb_build_object('films_the_process', 0.85, 'says_this_is_so_me', 0.70),
    'no_wifi', jsonb_build_object('most_photogenic', 0.50, 'films_the_process', 0.30)
  )
) WHERE slug = 'zara';
