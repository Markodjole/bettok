-- Add physical_behavior to each character's personality JSONB.
-- This governs HOW characters move on screen — energy, gestures, posture, pace.
-- User input that conflicts with these traits gets adapted to fit the character.

-- Mike: impatient, high-energy, fidgety
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'high — restless, always moving some body part',
    'movement_style', 'quick, jerky, impatient — grabs things fast, turns sharply, rarely stays still',
    'posture', 'slouched forward, leaning into things, phone-checking hunch',
    'typical_gestures', jsonb_build_array('tapping foot', 'drumming fingers', 'checking phone', 'running hand through hair', 'sighing when bored'),
    'walking_pace', 'fast, slightly ahead of everyone else',
    'emotional_expressiveness', 'high — rolls eyes, grins big, groans loudly',
    'comfort_zone', jsonb_build_array('tech stores', 'fast food joints', 'gaming setups', 'skateparks'),
    'behavioral_red_flags', jsonb_build_array('standing perfectly still for more than 3 seconds', 'being patient or calm', 'reading labels carefully', 'moving slowly or gracefully', 'meditating or yoga poses')
  )
) WHERE slug = 'mike';

-- Elena: methodical, controlled, precise
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'low-medium — controlled, deliberate, nothing wasted',
    'movement_style', 'precise, methodical — picks things up carefully, puts them back exactly, turns items to read labels',
    'posture', 'upright, good posture, hands often clasped or holding her bag strap',
    'typical_gestures', jsonb_build_array('adjusting glasses', 'tucking hair behind ear', 'tilting head when reading', 'holding items at arm-length to inspect', 'slight frown when concentrating'),
    'walking_pace', 'measured, purposeful, never rushed',
    'emotional_expressiveness', 'subtle — slight smiles, micro-expressions, rarely dramatic',
    'comfort_zone', jsonb_build_array('organic grocery stores', 'bookshops', 'yoga studios', 'farmers markets', 'quiet cafes'),
    'behavioral_red_flags', jsonb_build_array('jumping or running excitedly', 'being spontaneous or reckless', 'grabbing things without looking', 'loud reactions or big gestures', 'eating junk food enthusiastically')
  )
) WHERE slug = 'elena';

-- Darius: calm, confident, deliberate
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'medium — smooth, unhurried, radiates calm confidence',
    'movement_style', 'deliberate, grounded — picks things up with purpose, inspects methodically, moves like he owns the space',
    'posture', 'chest slightly out, chin level, relaxed shoulders, weight evenly distributed',
    'typical_gestures', jsonb_build_array('stroking goatee when thinking', 'slow nod of approval', 'checking price tags first', 'looking around to assess the room', 'slight head tilt when evaluating'),
    'walking_pace', 'relaxed but purposeful, never hurried, never dragging',
    'emotional_expressiveness', 'controlled — slight smirk, raised eyebrow, minimal but meaningful',
    'comfort_zone', jsonb_build_array('barbershops', 'basketball courts', 'hardware stores', 'car lots', 'sneaker shops', 'grilling outdoors'),
    'behavioral_red_flags', jsonb_build_array('jumping or bouncing', 'being frantic or panicked', 'moving quickly without purpose', 'flirtatious or playful energy', 'losing cool or showing anxiety')
  )
) WHERE slug = 'darius';

-- Yuki: shy, small movements, retreat tendency
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'low — small, contained movements, takes up minimal space',
    'movement_style', 'tentative, soft — reaches for things slowly, pulls hand back, approaches sideways rather than head-on',
    'posture', 'slightly hunched, shoulders drawn in, arms close to body, makes herself small',
    'typical_gestures', jsonb_build_array('fidgeting with hair', 'pulling hoodie sleeves over hands', 'looking down then peeking up', 'touching headphones around neck', 'small apologetic bow'),
    'walking_pace', 'slow, hesitant, often pauses to look at things from a distance before approaching',
    'emotional_expressiveness', 'subtle but readable — wide eyes when surprised, slight smile when pleased, shrinks when uncomfortable',
    'comfort_zone', jsonb_build_array('cat cafes', 'art supply stores', 'quiet parks', 'small bakeries', 'bookshops'),
    'behavioral_red_flags', jsonb_build_array('being loud or boisterous', 'confidently approaching strangers', 'big arm movements or dancing', 'being the center of attention', 'flirting', 'jumping around excitedly', 'speaking loudly')
  )
) WHERE slug = 'yuki';

-- Frank: old-school, slow, methodical
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'low — slow, steady, no wasted energy, everything is considered',
    'movement_style', 'heavy, deliberate — picks things up with both hands, reads every label, puts things down gently',
    'posture', 'slightly stooped from years of work, hands often in pockets or behind back',
    'typical_gestures', jsonb_build_array('squinting at labels', 'adjusting cap', 'rubbing chin thoughtfully', 'pointing with whole hand', 'patting pockets for wallet'),
    'walking_pace', 'slow and steady, stops often, never in a rush',
    'emotional_expressiveness', 'dry — rare smiles, eyebrow raises, long pauses before reacting',
    'comfort_zone', jsonb_build_array('hardware stores', 'diners', 'fishing spots', 'garages', 'grocery stores'),
    'behavioral_red_flags', jsonb_build_array('moving fast or energetically', 'being excitable', 'using technology comfortably', 'trendy behavior', 'taking selfies', 'dancing')
  )
) WHERE slug = 'frank';

-- Priya: warm, expressive, deliberate
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'medium-high — warm, engaged, hands often in motion while thinking',
    'movement_style', 'graceful, flowing — picks things up delicately, examines with care, moves with practiced ease',
    'posture', 'upright and proud, open body language, faces people directly',
    'typical_gestures', jsonb_build_array('pressing palms together when thinking', 'slight head wobble when considering', 'touching fabric to feel texture', 'smelling spices or food', 'counting on fingers'),
    'walking_pace', 'moderate, confident, occasionally stops to examine quality',
    'emotional_expressiveness', 'warm and expressive — genuine smiles, concerned frowns, animated when explaining',
    'comfort_zone', jsonb_build_array('spice markets', 'fabric stores', 'kitchens', 'family gatherings', 'tea shops'),
    'behavioral_red_flags', jsonb_build_array('being cold or dismissive', 'rushing through shopping', 'ignoring quality for price', 'being rude to staff', 'wasting food')
  )
) WHERE slug = 'priya';

-- Carlos: relaxed, charming, smooth
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'medium — relaxed but present, moves with natural rhythm',
    'movement_style', 'smooth, confident, slightly theatrical — gestures while talking, leans on surfaces casually',
    'posture', 'relaxed lean, one hand in pocket, easy confidence without trying',
    'typical_gestures', jsonb_build_array('running hand through hair', 'leaning on counters', 'pointing with chin', 'easy smile at strangers', 'touching things casually while walking by'),
    'walking_pace', 'easy, moderate, unhurried, sometimes stops to take in surroundings',
    'emotional_expressiveness', 'openly expressive — big smile, easy laugh, shows interest genuinely',
    'comfort_zone', jsonb_build_array('street markets', 'music venues', 'beaches', 'casual restaurants', 'soccer fields'),
    'behavioral_red_flags', jsonb_build_array('being stiff or formal', 'being anxious or nervous', 'rushing', 'ignoring people around him', 'being aggressive or confrontational')
  )
) WHERE slug = 'carlos';

-- Zara: commanding, precise, fashion-forward
UPDATE characters SET personality = personality || jsonb_build_object(
  'physical_behavior', jsonb_build_object(
    'energy_level', 'medium — poised, controlled energy, every movement intentional',
    'movement_style', 'sharp, decisive — picks things up briskly, makes quick judgments, puts rejected items back immediately',
    'posture', 'impeccable — straight back, chin up, shoulders back, takes up space confidently',
    'typical_gestures', jsonb_build_array('inspecting items with one raised eyebrow', 'flicking through racks quickly', 'checking phone between decisions', 'slight dismissive hand wave', 'adjusting sunglasses on head'),
    'walking_pace', 'brisk, purposeful, like she has somewhere important to be',
    'emotional_expressiveness', 'guarded — subtle eye rolls, pursed lips, rare but impactful smile',
    'comfort_zone', jsonb_build_array('luxury boutiques', 'design studios', 'art galleries', 'upscale cafes', 'fashion events'),
    'behavioral_red_flags', jsonb_build_array('being sloppy or careless', 'showing vulnerability publicly', 'being indecisive for too long', 'settling for less', 'being overly friendly with strangers', 'acting silly or childish')
  )
) WHERE slug = 'zara';
