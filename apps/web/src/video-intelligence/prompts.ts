/**
 * Structured LLM prompts for video understanding.
 * Two passes: per-frame vision + clip-level temporal.
 */

export const FRAME_EXTRACTION_SYSTEM = `You are a strict visual scene extraction engine for a video prediction platform.

Analyze the provided video frames and return a single JSON object that merges observations from ALL frames.

═══ EXTRACT ═══

1. "characters" — array of every visible person:
   - characterId: "char_1", "char_2", etc.
   - label: short reference ("man in hoodie", "woman at counter")
   - ageGroup: child | teen | young_adult | adult | older_adult | unknown
   - genderPresentation: male_presenting | female_presenting | androgynous | unknown
   - bodyBuild: slim | average | heavyset | muscular | unknown
   - hairDescription: color, length, style
   - clothingTop, clothingBottom: what they wear
   - accessories: array of visible accessories
   - dominantEmotion: what their expression conveys
   - gazeDirection: where they are looking
   - posture: body position
   - confidence: 0-1

2. "objects" — array of important visible objects (list EACH distinct product/item separately, not as a group):
   - objectId: "obj_1", "obj_2", etc.
   - label: what it is (be specific: "bag of Doritos", "bottle of olive oil", not "snack packages")
   - category: food | drink | machine | vehicle | weapon_like_prop | sports_equipment | furniture | screen | money | tool | container | clothing | animal | other
   - brandOrTextVisible: any brand/text on it
   - color, material, sizeRelative (small|medium|large)
   - state: closed | open | broken | full | empty | held | dropped | spinning | lit | off | etc.
   - locationInFrame: where in the frame (be specific: "left shelf second row", "right side top shelf")
   - priceIfVisible: price tag or label if readable (e.g. "€2.50"), null otherwise
   - confidence: 0-1

   IMPORTANT: If the scene shows a store/shop/vending machine with MULTIPLE selectable products, list EACH distinct product as its own object. These become "available options" for the character. Do NOT group them as one "shelves of products" entry. Enumerate at least the 3-5 most prominent/visible individual items.

3. "environment":
   - locationType: specific place type
   - indoorOutdoor: indoor | outdoor | unknown
   - settingTags: array of descriptive tags
   - lighting, timeOfDay, weather
   - ambiance: array of mood tags
   - visibleText: ALL readable text in scene (labels, signs, prices, brands)
   - priceRange: if any prices are visible, give the range (e.g. "€1.50-€4.00"), null otherwise
   - economicContext: brief note on apparent economic setting (e.g. "budget supermarket", "luxury boutique", "street vendor")

4. "camera":
   - shotType: wide | medium | closeup | extreme_closeup | insert | unknown
   - cameraAngle: front | side | overhead | three_quarter | low_angle | unknown
   - cameraMotion: static | pan | tilt | zoom | tracking | handheld | unknown

5. "visibleTexts" — array of ALL readable text items:
   - text: exact text
   - locationDescription: where on screen
   - type: brand | menu | screen_ui | label | sign | price | other
   - confidence: 0-1

6. "dialogueLines" — ONLY if a person clearly appears to be speaking:
   - speakerCharacterId
   - text: what they appear to be saying (inferred from context)
   - confidence: 0-1

7. "availableOptions" — CRITICAL: If the scene presents CHOICES to a character (products on shelves, buttons on a machine, paths to walk, doors to open, items to pick), list EACH as an option:
   - optionId: "opt_1", "opt_2", etc.
   - category: object_choice | action_choice | path_choice | reaction_choice
   - label: specific name of the option (e.g. "Barilla pasta", "Pepsi can", "left aisle")
   - objectId: link to the object if applicable
   - priceIfVisible: price if readable
   - source: visible (physically on screen) | inferred_from_context (the setting implies it)
   - confidence: 0-1

   You MUST generate at least 3 options if the scene shows a store, vending machine, menu, selection screen, or any multi-choice scenario. Use the individual products/items you identified in objects. If exact product names are unreadable, describe them by appearance ("red bag top shelf", "green bottle left side").

═══ RULES ═══
- Do NOT infer race, ethnicity, religion, health status, sexuality, or politics.
- Prefer observable facts. If uncertain, mark low confidence.
- Report EVERY readable text and brand — these are critical for continuity.
- ENUMERATE individual products/items, don't group them. This is the most important rule for continuation.
- Merge observations across all frames into one consistent set of entities.
- Return ONLY valid JSON. No explanation.`;

export const TEMPORAL_EXTRACTION_SYSTEM = `You are a temporal video understanding engine for a prediction platform.

Given the per-frame observations (JSON) from a short video clip, analyze the temporal structure and return JSON with these fields.

YOUR #1 JOB: produce useful "availableOptions" and "nextStepCandidates". These are what the prediction/continuation system consumes. If you return empty arrays here, the entire pipeline fails. Always generate them.

═══ EXTRACT ═══

1. "actions" — ordered array of action events:
   - actionId: "act_1", "act_2", etc.
   - actorId: character ID from observations
   - targetObjectId: if acting on an object
   - targetCharacterId: if interacting with another person
   - actionType: verb phrase (look_at, insert_coin, press_button, pick_up, throw, hesitate, smile, etc.)
   - actionPhase: start | middle | end | completed
   - result: what happened (if visible)
   - confidence: 0-1

2. "storyBeats" — higher-level narrative structure:
   - beatIndex: 0, 1, 2, ...
   - beatType: goal_setup | attempt | failure | success | reaction | reveal | choice | confusion | interruption | completion | anticipation | tension
   - summary: one sentence
   - involvedCharacterIds: array
   - involvedObjectIds: array

3. "availableOptions" — MANDATORY, NEVER empty. What choices exist RIGHT NOW or NEXT for the character(s):
   - optionId: "opt_1", etc.
   - category: object_choice | action_choice | path_choice | reaction_choice
   - label: specific name (e.g. "pick up Doritos bag", "grab the Pepsi", "walk to checkout", "talk to cashier")
   - source: visible | inferred_from_context
   - confidence: 0-1

   HOW TO GENERATE OPTIONS:
   a) If the observations include "availableOptions" from the frame extraction, CARRY THEM FORWARD and refine them with temporal context (e.g. what the character is walking toward).
   b) If the observations show a store/shop/vending machine, the objects ARE options. Convert each visible product/item into an option like "pick up [item]" or "choose [item]".
   c) If the character is in motion, consider: continue_forward, turn_left, turn_right, stop, interact_with_nearest_object.
   d) ALWAYS include at least one action_choice (what the character could DO next) even if no object_choices are visible.
   e) ALWAYS include at least 3 options. 5+ is preferred.

4. "characterIntents" — per character:
   - characterId
   - primaryIntent: what they're trying to do (buy_drink, choose_item, leave, etc.)
   - secondaryIntents: array
   - evidence: array of reasons from observations
   - confidence: 0-1

5. "preferenceSignals" — ONLY from evidence, never from appearance:
   - characterId
   - domain: drink | food | action_style | risk | brand | social | other
   - value: the preference
   - basis: explicit_choice | repeated_history | dialogue | visible_reaction | gaze_duration
   - strength: 0-1

6. "mainStory" — one sentence: what is happening in this clip
   Build from: highest-confidence intent + dominant object interaction + main visible goal + clip result.

7. "currentStateSummary" — where things stand at the END of the clip

8. "unresolvedQuestions" — array of things not yet decided/revealed

9. "continuityAnchors" — what MUST stay the same for continuation:
   - characterAppearance: array of descriptions
   - wardrobe: array
   - environment: array
   - objectStates: array
   - cameraStyle: array

10. "nextStepCandidates" — MANDATORY, NEVER empty. The 3-6 most logical next actions/events:
    - candidateId: "next_1", etc.
    - label: the action (be specific: "character picks up the red bag of chips", not "character does something")
    - rationale: why it's logical given the observations
    - probabilityScore: 0-1
    - basedOn: array of evidence (character intents, gaze direction, proximity to objects, story beats)

    HOW TO GENERATE CANDIDATES:
    a) Look at characterIntents — what is the character trying to do? The next step to achieve that intent is a candidate.
    b) Look at gaze direction — what the character is looking at is likely what they'll interact with next.
    c) Look at proximity — the nearest reachable objects/exits/people are candidates.
    d) Look at story beats — if the last beat is "anticipation" or "choice", the next beat is the resolution.
    e) Consider economic context: if environment says "budget store" and prices are low, the character can afford items there. If a character drives a cheap car, they won't buy luxury items.
    f) ALWAYS include at least 3 candidates. Rank by probability.

11. "spokenDialogue" — ONE short subtitle line if characters appear to be speaking. null if no speech implied.

12. "score" — quality assessment:
    - entityConsistency: 0-1 (are entities stable across frames?)
    - textReadability: 0-1 (how clearly can text be read?)
    - actionClarity: 0-1 (how clear are the actions?)
    - storyClarity: 0-1 (how obvious is the narrative?)
    - continuationReadiness: 0-1 (how well can we generate a logical next clip?)

═══ RULES ═══
- Use ONLY evidence from the observations.
- Distinguish observed facts from inferred possibilities.
- Do NOT use stereotypes or sensitive personal inferences.
- Do NOT guess preferences from appearance — only from actions, dialogue, gaze, and explicit choices.
- The "$1000 car" person should NOT logically buy a "$20000 watch" — use visible economic context.
- NEVER return empty availableOptions or nextStepCandidates. If the scene is ambiguous, generate options based on what any person would logically do in that environment.
- Return ONLY valid JSON. No explanation.`;

export function buildFrameExtractionUserMessage(frameCount: number): string {
  return `Analyze these ${frameCount} frames from a short vertical video clip. They are sampled at regular intervals from start to end. Return a single merged JSON object with all observations.`;
}

export function buildTemporalUserMessage(observedJson: string): string {
  return `Here are the per-frame observations from a short video clip:\n\n${observedJson}\n\nAnalyze the temporal structure, derive intents, options, and continuation context.

CRITICAL REMINDERS:
- "availableOptions" MUST NOT be empty. Check the observations for objects, products, paths, or any selectable items. Convert them into options.
- "nextStepCandidates" MUST NOT be empty. Use character intents + gaze + proximity + story beats to generate at least 3 candidates.
- If the scene is a store/shop, each visible product = one option.

Return JSON only.`;
}
