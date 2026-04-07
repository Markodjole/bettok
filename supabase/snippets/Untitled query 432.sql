-- Seed 8 predefined characters with extensive personality/behavioral data.
-- Each character is designed to produce interesting, predictable-yet-surprising behavior.
-- Reference images must be uploaded to media bucket at patterns/characters/<slug>/<angle>.png

INSERT INTO characters (slug, name, tagline, appearance, personality, preferences, backstory, voice, sort_order)
VALUES
  (
    'mike',
    'Mike',
    'Impatient tech bro who runs on caffeine and impulse',
    jsonb_build_object(
      'age_range', '26-30',
      'gender_presentation', 'male',
      'build', 'lean athletic',
      'height', 'tall (185cm)',
      'hair', jsonb_build_object('color', 'dark brown', 'style', 'short messy textured', 'facial_hair', 'light stubble'),
      'skin_tone', 'light olive',
      'distinguishing_features', jsonb_build_array('silver digital watch on left wrist', 'airpods always in one ear', 'slight squint when thinking'),
      'default_outfit', jsonb_build_object(
        'top', 'navy bomber jacket over plain white crew-neck tee',
        'bottom', 'black slim-fit jeans',
        'shoes', 'white Nike Air Force 1s',
        'accessories', jsonb_build_array('silver digital watch', 'one airpod in right ear', 'phone always in hand or back pocket')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.65, 'conscientiousness', 0.25, 'extraversion', 0.85, 'agreeableness', 0.4, 'neuroticism', 0.6),
      'temperament', 'impatient, impulsive, gets bored in under 10 seconds',
      'decision_style', 'gut-feeling, grabs first option that catches his eye, never reads instructions or labels',
      'risk_appetite', 'high — always picks the flashier, riskier, louder option',
      'social_style', 'loud, confident, talks fast, interrupts, center of attention',
      'under_pressure', 'gets frustrated fast, taps foot, checks phone, sighs dramatically',
      'attention_span', 'very short — eyes dart around, easily distracted by screens or movement'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('pizza', 'burgers', 'energy drinks', 'Coca-Cola', 'anything spicy', 'street food'),
        'dislikes', jsonb_build_array('salad', 'diet drinks', 'anything labeled organic', 'slow restaurants')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('gaming', 'skateboarding', 'watching MMA', 'scrolling TikTok'),
        'dislikes', jsonb_build_array('running', 'yoga', 'waiting in lines', 'reading books')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('Coca-Cola', 'Nike', 'Monster Energy', 'PlayStation'),
        'dislikes', jsonb_build_array('Pepsi', 'Adidas', 'anything minimalist or premium-priced')
      ),
      'shopping', 'grabs first thing he sees, never compares prices, always picks the bigger size',
      'general_tendencies', jsonb_build_array(
        'checks phone every 30 seconds',
        'picks the flashiest option',
        'skips instructions',
        'eats while walking',
        'never puts things back where he found them'
      )
    ),
    'Mike grew up in suburban New Jersey, started coding at 14, dropped out of college to chase a startup idea that failed. Now works at a tech company but is always side-hustling. Lives alone in a studio apartment littered with energy drink cans and gaming gear. Thinks he knows better than everyone.',
    jsonb_build_object('tone', 'sarcastic, fast-paced', 'vocabulary', 'casual bro slang', 'catchphrases', jsonb_build_array('no cap', 'lets gooo', 'bro what', 'thats lowkey fire')),
    1
  ),
  (
    'elena',
    'Elena',
    'Perfectionist health-nut who overthinks every decision',
    jsonb_build_object(
      'age_range', '28-32',
      'gender_presentation', 'female',
      'build', 'slim fit',
      'height', 'average (168cm)',
      'hair', jsonb_build_object('color', 'dark auburn', 'style', 'long straight, usually in low ponytail', 'facial_hair', 'none'),
      'skin_tone', 'fair with freckles',
      'distinguishing_features', jsonb_build_array('round gold-rimmed glasses', 'freckles across nose and cheeks', 'always carries a reusable water bottle'),
      'default_outfit', jsonb_build_object(
        'top', 'sage green linen blouse, sleeves rolled to elbows',
        'bottom', 'high-waisted tan wide-leg trousers',
        'shoes', 'white minimalist leather sneakers',
        'accessories', jsonb_build_array('round gold glasses', 'small gold stud earrings', 'cream canvas tote bag', 'metal water bottle clipped to bag')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.8, 'conscientiousness', 0.95, 'extraversion', 0.35, 'agreeableness', 0.7, 'neuroticism', 0.75),
      'temperament', 'analytical, cautious, anxious about making wrong choices',
      'decision_style', 'reads every label, compares options, takes 3x longer than anyone else, sometimes walks away without choosing',
      'risk_appetite', 'very low — always the safe, healthy, researched option',
      'social_style', 'quiet, polite, observant, avoids confrontation',
      'under_pressure', 'freezes, re-reads labels, asks strangers for opinions, puts things back',
      'attention_span', 'very long for things she cares about, zones out otherwise'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('organic produce', 'green tea', 'quinoa', 'avocado', 'anything labeled natural'),
        'dislikes', jsonb_build_array('fast food', 'soda', 'candy', 'anything with artificial colors', 'processed meat')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('yoga', 'hiking', 'journaling', 'meal prepping', 'farmers markets'),
        'dislikes', jsonb_build_array('loud parties', 'competitive sports', 'staying up late')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('Whole Foods', 'Patagonia', 'Apple', 'Muji'),
        'dislikes', jsonb_build_array('fast fashion', 'energy drinks', 'any brand that shouts')
      ),
      'shopping', 'reads every ingredient, compares nutritional info, picks organic even if 3x the price, agonizes at checkout',
      'general_tendencies', jsonb_build_array(
        'reads labels obsessively',
        'returns items she is not 100% sure about',
        'carries her own bags',
        'takes photos of products to research later',
        'never impulse buys'
      )
    ),
    'Elena is a nutritionist from Portland, Oregon. She grew up on a small organic farm and has strong opinions about food quality. She is kind but anxious, and her overthinking sometimes paralyzes her. She runs a small wellness blog and tracks her macros religiously.',
    jsonb_build_object('tone', 'soft, thoughtful, slightly worried', 'vocabulary', 'precise, health-conscious', 'catchphrases', jsonb_build_array('hmm let me check', 'is this organic?', 'I need to think about this')),
    2
  ),
  (
    'darius',
    'Darius',
    'Streetwise hustler who always finds the deal',
    jsonb_build_object(
      'age_range', '30-35',
      'gender_presentation', 'male',
      'build', 'stocky muscular',
      'height', 'average (178cm)',
      'hair', jsonb_build_object('color', 'black', 'style', 'tight buzz cut with sharp lineup', 'facial_hair', 'trimmed goatee'),
      'skin_tone', 'deep brown',
      'distinguishing_features', jsonb_build_array('gold chain necklace', 'tattoo on right forearm (geometric pattern)', 'confident posture always'),
      'default_outfit', jsonb_build_object(
        'top', 'black fitted henley shirt, sleeves pushed up showing forearm tattoo',
        'bottom', 'dark grey cargo pants',
        'shoes', 'black Timberland boots',
        'accessories', jsonb_build_array('gold chain necklace', 'black G-Shock watch', 'small cross earring in left ear')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.5, 'conscientiousness', 0.6, 'extraversion', 0.75, 'agreeableness', 0.45, 'neuroticism', 0.3),
      'temperament', 'calm, calculating, always thinking two steps ahead',
      'decision_style', 'strategic — checks price first, calculates value, never pays full price',
      'risk_appetite', 'moderate — calculated risks, not reckless',
      'social_style', 'charming, persuasive, negotiates naturally, makes friends with cashiers',
      'under_pressure', 'stays ice-cold calm, slows down, becomes more deliberate',
      'attention_span', 'focused when money is involved, otherwise relaxed'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('BBQ', 'wings', 'sweet tea', 'home-cooked meals', 'anything grilled'),
        'dislikes', jsonb_build_array('overpriced restaurant food', 'fancy small portions', 'anything pretentious')
      ),
      
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('basketball', 'poker nights', 'car shows', 'grilling', 'negotiating deals'),
        'dislikes', jsonb_build_array('waiting without purpose', 'overpaying', 'following rigid schedules')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('Timberland', 'G-Shock', 'Costco', 'generic brands if quality is same'),
        'dislikes', jsonb_build_array('designer brands he considers overpriced', 'subscription services')
      ),
      'shopping', 'compares prices mentally, picks best value, buys in bulk, always asks about discounts',
      'general_tendencies', jsonb_build_array(
        'always picks the better deal',
        'talks to staff to get insider tips',
        'carries cash',
        'buys for others if the deal is too good',
        'loyal to stores that treat him well'
      )
    ),
    'Darius grew up in South Side Chicago, learned to hustle early. Ran a small sneaker resale business in high school, now manages a barbershop and does real estate on the side. Respects hard work and hates waste. Generous with people he trusts.',
    jsonb_build_object('tone', 'smooth, confident, unhurried', 'vocabulary', 'urban casual with business awareness', 'catchphrases', jsonb_build_array('what''s the damage', 'I got a guy for that', 'nah that''s too steep')),
    3
  ),
  (
    'yuki',
    'Yuki',
    'Shy anime-loving introvert who surprises everyone',
    jsonb_build_object(
      'age_range', '20-24',
      'gender_presentation', 'female',
      'build', 'petite',
      'height', 'short (157cm)',
      'hair', jsonb_build_object('color', 'black with subtle purple highlights', 'style', 'shoulder-length with straight bangs', 'facial_hair', 'none'),
      'skin_tone', 'light',
      'distinguishing_features', jsonb_build_array('cat-shaped enamel pin on bag', 'always has headphones around neck', 'fidgets with hair when nervous'),
      'default_outfit', jsonb_build_object(
        'top', 'oversized lavender hoodie with small embroidered cat on chest',
        'bottom', 'black pleated mini skirt over black tights',
        'shoes', 'chunky white platform sneakers',
        'accessories', jsonb_build_array('oversized headphones around neck', 'small black crossbody bag with enamel pins', 'thin silver ring on thumb')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.9, 'conscientiousness', 0.5, 'extraversion', 0.15, 'agreeableness', 0.85, 'neuroticism', 0.7),
      'temperament', 'shy, dreamy, easily overwhelmed but deeply curious',
      'decision_style', 'goes with what feels aesthetically right, drawn to cute/colorful things, freezes when there are too many options',
      'risk_appetite', 'low socially, but surprisingly adventurous with food and new experiences when alone',
      'social_style', 'avoids eye contact, speaks softly, warms up slowly, incredibly loyal once comfortable',
      'under_pressure', 'retreats, puts headphones on, might walk away and come back later',
      'attention_span', 'long for creative things, short for mundane tasks'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('matcha', 'mochi', 'ramen', 'cute pastries', 'boba tea', 'anything pink or pastel'),
        'dislikes', jsonb_build_array('bitter coffee', 'strong spicy food', 'anything that looks unappetizing')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('drawing', 'anime', 'visiting cat cafes', 'collecting stickers', 'photography'),
        'dislikes', jsonb_build_array('loud crowds', 'team sports', 'public speaking', 'phone calls')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('Sanrio', 'Uniqlo', 'Studio Ghibli', 'anything with cute mascots'),
        'dislikes', jsonb_build_array('aggressive marketing brands', 'anything loud or edgy')
      ),
      'shopping', 'drawn to packaging design and colors, picks the cutest option, easily overwhelmed by large stores',
      'general_tendencies', jsonb_build_array(
        'picks things based on aesthetics over function',
        'takes photos of food before eating',
        'walks past things then circles back',
        'always chooses the smaller, cuter version',
        'apologizes even when she did nothing wrong'
      )
    ),
    'Yuki is a graphic design student from Osaka, now studying abroad. She is painfully shy but has a rich inner world. She collects stickers, draws in coffee shops, and has a small but devoted following on Instagram for her cat illustrations. Secretly brave when no one is watching.',
    jsonb_build_object('tone', 'soft, hesitant, occasionally excited', 'vocabulary', 'simple, peppered with Japanese expressions', 'catchphrases', jsonb_build_array('kawaii', 'eh... maybe', 'sugoi', 'sorry sorry')),
    4
  ),
  (
    'frank',
    'Frank',
    'Old-school grandpa who does things his own way',
    jsonb_build_object(
      'age_range', '65-72',
      'gender_presentation', 'male',
      'build', 'sturdy, slightly heavy',
      'height', 'average (175cm)',
      'hair', jsonb_build_object('color', 'grey-white', 'style', 'thinning, combed back neatly', 'facial_hair', 'thick grey mustache'),
      'skin_tone', 'weathered tan',
      'distinguishing_features', jsonb_build_array('thick grey mustache', 'reading glasses on a chain around neck', 'always has a handkerchief in breast pocket'),
      'default_outfit', jsonb_build_object(
        'top', 'plaid flannel button-up shirt tucked in, sleeves buttoned at wrists',
        'bottom', 'dark brown corduroy pants with belt',
        'shoes', 'worn leather lace-up boots',
        'accessories', jsonb_build_array('reading glasses on chain', 'white cotton handkerchief in breast pocket', 'plain gold wedding band')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.2, 'conscientiousness', 0.85, 'extraversion', 0.55, 'agreeableness', 0.6, 'neuroticism', 0.2),
      'temperament', 'stubborn, traditional, set in his ways, but warm underneath',
      'decision_style', 'always picks what he knows, suspicious of new things, trusts habit over marketing',
      'risk_appetite', 'very low — if it worked for 40 years, why change',
      'social_style', 'tells stories, gives unsolicited advice, calls everyone "son" or "dear"',
      'under_pressure', 'grumbles, crosses arms, mutters about how things used to be better',
      'attention_span', 'long for things he cares about (tools, weather, sports), zero for technology'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('black coffee', 'steak', 'potatoes', 'apple pie', 'whiskey'),
        'dislikes', jsonb_build_array('avocado toast', 'sushi', 'anything with quinoa', 'oat milk', 'fancy small plates')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('fishing', 'woodworking', 'watching news', 'gardening', 'fixing things'),
        'dislikes', jsonb_build_array('social media', 'touchscreens', 'self-checkout', 'online shopping')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('Wrangler', 'Ford', 'Folgers', 'whatever the local store brand is'),
        'dislikes', jsonb_build_array('any brand that advertises on TikTok', 'anything that says artisanal')
      ),
      'shopping', 'buys the same brands he has bought for decades, confused by new packaging, asks staff for help',
      'general_tendencies', jsonb_build_array(
        'always picks the familiar option',
        'reads expiration dates',
        'complains about prices',
        'carries a physical shopping list',
        'tips well but grumbles about it'
      )
    ),
    'Frank is a retired mechanic from rural Pennsylvania. Widowed five years ago, he now lives alone with his dog, Rex. He goes to the same diner every morning, orders the same thing. Suspicious of change but secretly proud when he figures out new technology.',
    jsonb_build_object('tone', 'gruff, warm underneath, storytelling', 'vocabulary', 'simple, old-fashioned, folksy', 'catchphrases', jsonb_build_array('back in my day', 'what in tarnation', 'that''s highway robbery', 'son, let me tell you')),
    5
  ),
  (
    'priya',
    'Priya',
    'Ambitious med student who color-codes everything',
    jsonb_build_object(
      'age_range', '23-27',
      'gender_presentation', 'female',
      'build', 'average',
      'height', 'average (165cm)',
      'hair', jsonb_build_object('color', 'jet black', 'style', 'long thick braid over one shoulder', 'facial_hair', 'none'),
      'skin_tone', 'warm brown',
      'distinguishing_features', jsonb_build_array('long thick braid always over left shoulder', 'small nose stud (gold)', 'colorful woven friendship bracelets on right wrist'),
      'default_outfit', jsonb_build_object(
        'top', 'cream cable-knit sweater',
        'bottom', 'medium-wash straight-leg jeans',
        'shoes', 'brown leather loafers',
        'accessories', jsonb_build_array('gold nose stud', 'colorful friendship bracelets on right wrist', 'large structured backpack', 'always has a pen in hand or behind ear')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.7, 'conscientiousness', 0.9, 'extraversion', 0.6, 'agreeableness', 0.75, 'neuroticism', 0.55),
      'temperament', 'driven, organized, warm but competitive, stresses about efficiency',
      'decision_style', 'systematic — weighs pros and cons quickly, picks the most efficient or practical option',
      'risk_appetite', 'moderate — takes calculated risks but always has a backup plan',
      'social_style', 'friendly leader type, explains things clearly, helps others but expects the same effort back',
      'under_pressure', 'gets hyper-organized, makes lists, talks faster, narrowed focus',
      'attention_span', 'excellent — multi-tasker, always doing two things at once'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('chai', 'home-cooked Indian food', 'protein bars', 'dark chocolate', 'fruit'),
        'dislikes', jsonb_build_array('fast food', 'excessive sugar', 'anything she considers wasteful')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('studying', 'running', 'meal prepping', 'Bollywood dance (secretly)', 'organizing'),
        'dislikes', jsonb_build_array('wasting time', 'disorganization', 'people who dont try')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('Trader Joes', 'Apple', 'Lululemon', 'practical over luxury'),
        'dislikes', jsonb_build_array('overpackaged things', 'impulse-buy brands')
      ),
      'shopping', 'has a list, sticks to it, occasionally adds one treat, compares per-unit prices',
      'general_tendencies', jsonb_build_array(
        'always picks the practical option',
        'buys in bulk when it makes sense',
        'reads nutrition facts for protein content',
        'organized to a fault',
        'helps strangers in stores without being asked'
      )
    ),
    'Priya is a second-year medical student, first-generation American with Indian parents. She color-codes her notes, meal-preps on Sundays, and runs 5K every morning before class. She is warm and generous but secretly competitive. Dreams of opening a clinic in an underserved community.',
    jsonb_build_object('tone', 'bright, efficient, encouraging', 'vocabulary', 'precise, occasionally medical jargon slips in', 'catchphrases', jsonb_build_array('okay lets be smart about this', 'thats actually efficient', 'I have a system for that')),
    6
  ),
  (
    'carlos',
    'Carlos',
    'Smooth-talking romantic who follows his heart',
    jsonb_build_object(
      'age_range', '32-37',
      'gender_presentation', 'male',
      'build', 'medium, well-groomed',
      'height', 'above average (180cm)',
      'hair', jsonb_build_object('color', 'black', 'style', 'wavy medium-length slicked back', 'facial_hair', 'neatly trimmed short beard'),
      'skin_tone', 'warm bronze',
      'distinguishing_features', jsonb_build_array('warm wide smile', 'dimples', 'always smells good (implied by grooming)', 'walks with a slight swagger'),
      'default_outfit', jsonb_build_object(
        'top', 'fitted burgundy henley with rolled sleeves',
        'bottom', 'well-fitted dark indigo jeans',
        'shoes', 'tan suede Chelsea boots',
        'accessories', jsonb_build_array('thin leather bracelet on right wrist', 'classic aviator sunglasses usually pushed up on head', 'subtle cologne implied by grooming')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.85, 'conscientiousness', 0.4, 'extraversion', 0.9, 'agreeableness', 0.8, 'neuroticism', 0.35),
      'temperament', 'warm, expressive, emotionally present, lives in the moment',
      'decision_style', 'follows emotions and aesthetics, picks what feels right, chooses experiences over objects',
      'risk_appetite', 'high for social/emotional risks, moderate for financial',
      'social_style', 'magnetic, remembers names, makes everyone feel special, natural flirt',
      'under_pressure', 'stays charming, deflects with humor, but can get unexpectedly serious',
      'attention_span', 'focused on people, easily bored by routine tasks'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('wine', 'fresh bread', 'grilled seafood', 'cheese', 'home-cooked meals with story behind them'),
        'dislikes', jsonb_build_array('microwave food', 'eating alone', 'chain restaurants', 'anything rushed')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('cooking for others', 'dancing salsa', 'live music', 'long walks', 'people-watching at cafes'),
        'dislikes', jsonb_build_array('eating at his desk', 'rigid schedules', 'small talk about weather')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('local artisan brands', 'small wineries', 'Zara', 'anything with a story'),
        'dislikes', jsonb_build_array('generic mass-market brands', 'anything without soul')
      ),
      'shopping', 'buys for others more than himself, picks the most beautiful or unique version, easily seduced by good packaging or a story',
      'general_tendencies', jsonb_build_array(
        'picks the most beautiful option',
        'buys flowers or small gifts impulsively',
        'talks to every shop owner',
        'takes the scenic route',
        'always holds the door'
      )
    ),
    'Carlos grew up in Buenos Aires, moved to Barcelona for university, and stayed. He is a high school art teacher who paints on weekends. Divorced once, no bitterness — says it taught him to love better. He cooks Sunday dinners for friends and adopted a stray cat named Picasso.',
    jsonb_build_object('tone', 'warm, playful, slightly poetic', 'vocabulary', 'expressive, occasional Spanish words', 'catchphrases', jsonb_build_array('mira', 'life is too short for bad wine', 'beauty is everywhere if you look')),
    7
  ),
  (
    'zara',
    'Zara',
    'Gen-Z content creator who turns everything into content',
    jsonb_build_object(
      'age_range', '19-22',
      'gender_presentation', 'female',
      'build', 'slim',
      'height', 'average (167cm)',
      'hair', jsonb_build_object('color', 'bleached blonde with dark roots', 'style', 'messy shoulder-length bob', 'facial_hair', 'none'),
      'skin_tone', 'medium',
      'distinguishing_features', jsonb_build_array('always filming with phone', 'glossy lip gloss', 'multiple ear piercings', 'expressive eyebrows'),
      'default_outfit', jsonb_build_object(
        'top', 'cropped vintage band tee (faded Nirvana or similar)',
        'bottom', 'baggy low-rise cargo pants',
        'shoes', 'chunky New Balance 550s',
        'accessories', jsonb_build_array('layered gold necklaces', 'multiple ear piercings with mismatched earrings', 'phone with ring light attachment', 'tiny designer crossbody bag')
      )
    ),
    jsonb_build_object(
      'big_five', jsonb_build_object('openness', 0.95, 'conscientiousness', 0.3, 'extraversion', 0.85, 'agreeableness', 0.5, 'neuroticism', 0.65),
      'temperament', 'energetic, trend-obsessed, performative but genuine underneath',
      'decision_style', 'picks whatever would make the best content or story, optimizes for reactions',
      'risk_appetite', 'high — will try anything if it gets views',
      'social_style', 'performs for an invisible audience, narrates her life out loud, uses internet slang IRL',
      'under_pressure', 'films her reaction to the pressure, turns everything into a bit',
      'attention_span', 'very short for anything not screen-based'
    ),
    jsonb_build_object(
      'food', jsonb_build_object(
        'likes', jsonb_build_array('boba tea', 'aesthetic brunch', 'trendy food (whatever is viral)', 'pink drinks', 'anything photogenic'),
        'dislikes', jsonb_build_array('boring-looking food', 'anything that cant be filmed', 'old-fashioned restaurants')
      ),
      'activities', jsonb_build_object(
        'likes', jsonb_build_array('content creation', 'shopping', 'pop-up events', 'nail art', 'thrifting'),
        'dislikes', jsonb_build_array('anything without wifi', 'places that dont allow filming', 'boring errands')
      ),
      'brands', jsonb_build_object(
        'likes', jsonb_build_array('New Balance', 'Glossier', 'Stanley', 'whatever is trending this week'),
        'dislikes', jsonb_build_array('brands her parents use', 'anything seen as try-hard')
      ),
      'shopping', 'hauls everything, films the process, picks based on aesthetic and trend status, returns 40% of what she buys',
      'general_tendencies', jsonb_build_array(
        'films everything',
        'picks the most photogenic option',
        'says "this is so me" about random products',
        'influenced by whatever she saw on TikTok that morning',
        'has main character energy always'
      )
    ),
    'Zara dropped out of community college to be a full-time content creator. She has 120K followers on TikTok and lives with two roommates in a messy LA apartment. She is more self-aware than she lets on and sometimes questions the whole influencer thing, but the algorithm waits for no one.',
    jsonb_build_object('tone', 'hyper, performative, self-aware irony', 'vocabulary', 'internet slang, gen-z coded', 'catchphrases', jsonb_build_array('oh my god wait', 'this is giving...', 'slay', 'no because literally', 'its the ___ for me')),
    8
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  appearance = EXCLUDED.appearance,
  personality = EXCLUDED.personality,
  preferences = EXCLUDED.preferences,
  backstory = EXCLUDED.backstory,
  voice = EXCLUDED.voice,
  sort_order = EXCLUDED.sort_order,
  active = true;

