// Snapshot taken: 2026-08-14 (Whittle This project — verify against Project Knowledge doc for anything newer)
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY;

export const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export function ideaSlug(idea) {
  return idea.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ---------------- Content moderation ----------------
// Hard server-side gate — this is NOT optional. The "describe an idea" search
// box accepts arbitrary free text from anyone, and image generation can take
// an arbitrary uploaded photo as input, so both need to be checked BEFORE any
// paid generation call runs. Uses OpenAI's Moderation API (a separate, cheap
// endpoint from image generation). Blocks on sexual content categories in
// particular — this must never be used to create nude or sexually explicit
// images of anyone, including minors — plus the standard broader categories
// (violence, self-harm, hate) as a general safety baseline.
//
// Returns { flagged: boolean, categories: string[] }. On any error reaching
// the moderation API itself, fails CLOSED (flagged: true) — better to block
// a legitimate request than to silently skip the safety check.
export async function moderateContent({ text, imageBase64 } = {}) {
  const input = [];
  if (text) input.push({ type: 'text', text });
  if (imageBase64) input.push({ type: 'image_url', image_url: { url: imageBase64 } });
  if (input.length === 0) return { flagged: false, categories: [] };

  try {
    const resp = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'omni-moderation-latest', input })
    });
    if (!resp.ok) {
      console.error('Moderation API request failed:', await resp.text());
      return { flagged: true, categories: ['moderation_check_failed'] };
    }
    const json = await resp.json();
    const result = json.results?.[0];
    if (!result) return { flagged: true, categories: ['moderation_check_failed'] };
    const categories = Object.entries(result.categories || {}).filter(([, v]) => v).map(([k]) => k);
    return { flagged: !!result.flagged, categories };
  } catch (err) {
    console.error('Moderation check error:', err);
    return { flagged: true, categories: ['moderation_check_failed'] };
  }
}

// Ideas that work better as a bust (head/shoulders/chest) than a full standing
// figure — sidesteps the headroom-cropping problem entirely since there's no
// tall hat-plus-full-body composition to fit, and matches how these are often
// actually carved in practice. Add more slugs here as needed.
const BUST_IDEAS = new Set(['cowboy', 'cowgirl']);

// Ideas that are plain OBJECTS, not a person/animal figure — a "full body,
// standing pose" instruction makes no sense for these (there's no body to
// stand), and was actually causing the AI to invent a whole person just to
// have something to put the object on (e.g. "cowboy hat" turning into a full
// cowboy wearing a hat). These get a completely separate, figure-free prompt.
const OBJECT_IDEAS = new Set(['sunflower', 'guitar', 'cowboy-hat', 'cowboy-boot', 'skull', 'cactus', 'wooden-spoon']);

// Chip carving patterns are flat, 2D designs meant for a flat wooden panel —
// not a full-body figure and not really a 3D object either. Front-facing
// only really applies; LEFT/RIGHT for these will just be the AI's best
// guess at an edge-on view of a flat panel, which is a real but minor and
// low-cost limitation of reusing the same pipeline as the 3D-figure presets.
const CHIP_CARVING_IDEAS = new Set([
  'geometric-rosette-chip-carving-pattern',
  'diamond-border-chip-carving-pattern',
  'deer-in-forest-chip-carving-landscape',
  'wolf-howling-at-moon-chip-carving-scene',
  'eagle-over-mountains-chip-carving-landscape'
]);

// Applied to every template-generation prompt (front/left/right — anything
// that gets traced and printed, NOT the photorealistic "how this looks
// carved" reference photo, which should show real wood color). Without this,
// the model has free rein and some ideas come back in full color (e.g. a red
// Santa suit) while others stay black-and-white, which looks inconsistent
// across the preset gallery.
const BW_LINE_ART_INSTRUCTION = `BLACK AND WHITE LINE ART ONLY — pure black outlines on a `
  + `plain white background, like a coloring-book page or a stencil. NO color of any kind `
  + `anywhere (no red, no brown, no skin tones, nothing) and no shading, gradients, or fill `
  + `patterns — just clean black linework, since this is a trace-ready template, not a `
  + `finished illustration. NO text, words, letters, numbers, labels, titles, signage, or `
  + `typography of ANY kind anywhere in the image — a purely visual design only. This applies `
  + `even if the subject is a named place, park, person, or brand (do not write out its name `
  + `anywhere in the image, the way a travel poster or product label might) — depict only the `
  + `visual scene or subject itself, never its name as text, unless the description explicitly `
  + `and specifically asks for lettering to be included.`;

export function buildPrompt(idea, options = {}) {
  const slug = ideaSlug(idea);
  const lower = idea.toLowerCase();
  // Respect an explicit composition word the person actually typed, not just
  // the hardcoded preset lists below — someone typing "a bust of a hippo"
  // should get a bust, not have that instruction silently overridden by the
  // default full-body framing.
  const isBust = BUST_IDEAS.has(slug) || /\b(bust|portrait|head\s*and\s*shoulders|close[\s-]?up)\b/.test(lower);
  const isObject = OBJECT_IDEAS.has(slug);
  const isChipCarving = CHIP_CARVING_IDEAS.has(slug);
  // Explicit "this is a 2D pattern" flag from the person (search box or
  // upload checkbox) — a broader, less stylistically-specific version of
  // the chip-carving preset treatment: any flat design, not necessarily
  // triangular-faceted chip-carving style specifically.
  const isFlat2D = !!options.is2D && !isChipCarving;

  if (isChipCarving) {
    return `A traditional CHIP CARVING pattern design, viewed flat and straight-on, for exactly this: `
      + `${idea}. Chip carving is a woodworking technique using a knife to remove small triangular `
      + `chips of wood, so the design should read as a network of clean, bold triangular/faceted `
      + `shapes and crisp geometric or angular lines — sharp straight-edged facets and cut lines, `
      + `NOT curved, painterly, or softly shaded. If it's a geometric pattern (a rosette, a border), `
      + `make it cleanly symmetrical and evenly spaced. If it's a pictorial scene (an animal, a `
      + `landscape), stylize it into simplified, angular, faceted shapes typical of chip-carved `
      + `folk-art plaques, not a realistic illustration. Centered, filling most of the frame with a `
      + `small even margin on all sides. ${BW_LINE_ART_INSTRUCTION} No shadows, no other objects, `
      + `suitable for a woodcarving template.`;
  }

  if (isFlat2D) {
    return `A flat, 2D relief-carving pattern design, viewed straight-on from directly above/in `
      + `front (NOT a 3D figure, NOT a standing pose, NOT viewed from an angle) — for exactly this: `
      + `${idea}. This is meant to be carved into a single flat wooden surface (a plaque, panel, or `
      + `board), so depict it the way a flat decorative pattern or silhouette would actually look on `
      + `a flat surface — clean, well-defined shapes and outlines rather than a photorealistic or `
      + `three-dimensional rendering. Centered, filling most of the frame with a small even margin `
      + `on all sides. ${BW_LINE_ART_INSTRUCTION} No shadows, no other objects, suitable for a `
      + `woodcarving template.`;
  }

  if (isBust) {
    return `A close-up BUST PORTRAIT — head, shoulders, and upper chest ONLY, nothing below that — `
      + `of exactly this: ${idea}. Depict that subject accurately and specifically; do not substitute `
      + `a different, more common, or more generic animal or character, even if it would be simpler `
      + `to draw. Cropped with a flat, straight horizontal line at the bottom, like a real carved bust `
      + `on a stand — not an angled line following the shoulders. Facing forward, centered, with `
      + `clear empty white margin on all sides (including above any hat, so it doesn't touch the top `
      + `edge). ${BW_LINE_ART_INSTRUCTION} No shadows, no other objects, suitable for a woodcarving `
      + `template.`;
  }

  if (isObject) {
    return `A simple, clear illustration of just ${idea} — the object itself ONLY, by itself, `
      + `like a clean product photo or catalog illustration. Depict that exact object accurately; `
      + `do not substitute a different, more generic object. Do NOT include a person, a body, `
      + `hands, arms, or any figure wearing, holding, or using it — just the standalone object, `
      + `centered, viewed from whichever angle shows its shape most clearly (usually a simple `
      + `side or three-quarter view of the object itself). Leave clear empty white margin on `
      + `all four sides so nothing touches the edges. ${BW_LINE_ART_INSTRUCTION} No shadows, `
      + `no other objects, suitable for a woodcarving template.`;
  }

  return `A full-body illustration of exactly this: ${idea}. Depict that subject accurately and `
    + `specifically — the exact species/animal/character named, with any exact accessories `
    + `mentioned like hats or clothing; do not substitute a different, more common, or more `
    + `generic subject, even if it would be simpler to draw. CRITICAL: do NOT add clothing, `
    + `human posture, standing-upright stance, facial expressions, or any other anthropomorphic/`
    + `humanizing elements that weren't explicitly asked for — render the subject in its own `
    + `natural, anatomically correct pose (a fish swims, a bird perches or flies, a snake `
    + `slithers, a four-legged animal stands on four legs, etc.), not forced into a human-like `
    + `upright pose unless the subject is normally bipedal (a person, a bear rearing up, etc.) `
    + `or the description explicitly asks for that. Viewed from directly in front — a true `
    + `forward-facing view, facing the camera, centered, in whatever natural pose suits this `
    + `specific subject. `
    + `CRITICAL — HEADROOM: if the subject has a hat, tall ears, antlers, horns, fins, or any `
    + `feature above/beyond its main body, that is the outermost point and is the single most `
    + `common thing that gets cropped — treat it as the true edge of the subject for framing `
    + `purposes and make sure there is clearly visible empty white space beyond it. Draw the `
    + `subject noticeably SMALLER than you initially plan, leaving roughly 15% empty margin on `
    + `every side (top, bottom, left, right) — the whole subject, every extremity included, must `
    + `sit fully inside that margin with room to spare, never touching or crossing any edge of `
    + `the image. ${BW_LINE_ART_INSTRUCTION} No shadows, no other objects, suitable for a `
    + `woodcarving template.`;
}

export async function generateAndCleanIdea(idea, options = {}) {
  const slug = ideaSlug(idea);

  if (supabase) {
    const { data: cached } = await supabase.from('generated_designs').select('image_path').eq('idea_slug', slug).maybeSingle();
    if (cached?.image_path) {
      const { data: publicUrlData } = supabase.storage.from('designs').getPublicUrl(cached.image_path);
      const cachedResp = await fetch(publicUrlData.publicUrl);
      if (cachedResp.ok) return { buffer: Buffer.from(await cachedResp.arrayBuffer()), fromCache: true };
    }
  }

  const genResp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt: buildPrompt(idea.trim(), options), size: '1024x1536', n: 1 })
  });
  if (!genResp.ok) throw new Error(`OpenAI generation failed: ${await genResp.text()}`);
  const genJson = await genResp.json();
  const b64 = genJson.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from generation API.');
  const imageBuffer = Buffer.from(b64, 'base64');

  // remove.bg is an AI subject-detector — it's trained to find a person,
  // animal, or product, and reliably confuses itself on abstract geometric
  // patterns (which have no "subject" to isolate). For those, skip it
  // entirely and keep the plain-white-background image as-is; the
  // client-side flood-fill trace (the same one already used for raw photo
  // uploads) handles a clean white background far more reliably than an
  // AI subject-detector guessing at a pattern that isn't a "thing."
  const isFlat2D = CHIP_CARVING_IDEAS.has(slug) || !!options.is2D;
  if (isFlat2D) {
    return { buffer: imageBuffer, fromCache: false };
  }

  const cleanedBuffer = await removeBackground(imageBuffer);
  return { buffer: cleanedBuffer, fromCache: false };
}

// Shared remove.bg call — used for AI-generated ideas (above) and for raw
// user-uploaded photos (see /api/remove-background in server.js), so an
// uploaded photo with a busy real-world background gets the same real
// background removal presets already get, instead of relying only on the
// client-side flood-fill approximation.
export async function removeBackground(imageBuffer) {
  const form = new FormData();
  form.append('image_file', new Blob([imageBuffer], { type: 'image/png' }), 'source.png');
  form.append('size', 'auto');
  const rmResp = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST', headers: { 'X-Api-Key': REMOVEBG_API_KEY }, body: form
  });
  if (!rmResp.ok) throw new Error(`remove.bg failed: ${await rmResp.text()}`);
  return Buffer.from(await rmResp.arrayBuffer());
}

export async function storeDesign(idea, buffer, { isPreset = false, sortOrder = null } = {}) {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  const slug = ideaSlug(idea);
  const path = `${slug}.png`;
  const { error: uploadErr } = await supabase.storage.from('designs').upload(path, buffer, { contentType: 'image/png', upsert: true });
  if (uploadErr) { console.error('Supabase upload error:', uploadErr); return { success: false, error: uploadErr.message || String(uploadErr) }; }
  const { error: dbErr } = await supabase.from('generated_designs').upsert({
    idea_slug: slug, idea_text: idea.trim(), image_path: path,
    is_preset: isPreset, sort_order: sortOrder
  });
  if (dbErr) { console.error('Supabase DB upsert error:', dbErr); return { success: false, error: dbErr.message || String(dbErr) }; }
  return { success: true };
}

// ---------------- Reference photo: "what this looks like carved" ----------------
// Pure inspiration, shown next to a selected preset — NOT part of the print
// template. Just ONE realistic photo, not multiple angles (multiple angles
// belong to the actual print templates below, not this preview).
//
// IMPORTANT: generated FROM the actual template artwork (image-to-image edit),
// not from a blind text prompt — so the carving keeps the same silhouette,
// pose and proportions as what the person is actually tracing.
function buildReferencePrompt(idea, options = {}) {
  const slug = ideaSlug(idea);
  const isBust = BUST_IDEAS.has(slug);
  const is2D = CHIP_CARVING_IDEAS.has(slug) || !!options.is2D;
  const guideMarkInstruction = isBust
    ? ` Since this is a portrait/bust, lightly sketch a few faint pencil-style guide marks directly `
      + `on the wood showing where the key features should be carved — a light centerline down the `
      + `middle of the face, and small guide marks at the eyes, nose, and mouth. These should look `
      + `like a carver's actual layout marks (thin, faint pencil lines), not part of the finished `
      + `carving itself.`
    : '';
  const subjectName = idea && idea.trim() ? idea.trim() : null;
  const openingLine = subjectName
    ? `The subject of this image is: ${subjectName}. Keep it EXACTLY that specific subject throughout — `
      + `do not swap it for a different, more common, or more generic animal or character just because `
      + `it might be easier or more familiar to render (for example, if the subject is a hippo, it must `
      + `stay recognizably a hippo — short legs, a wide barrel-shaped body, a broad flat snout — NOT a `
      + `bear or generic mammal shape). `
    : `Do not substitute a different, more common, or more generic subject than what's actually shown `
      + `in the reference image. `;
  const closingReminder = subjectName
    ? ` Before finishing, double-check: does this still clearly read as ${subjectName}, matching the `
      + `distinctive shape and features from the reference image, and not a generic substitute?`
    : '';

  if (is2D) {
    return `${openingLine}Reimagine that exact subject/pattern from this image as a real, flat, `
      + `hand-carved wooden relief panel or plaque — the design carved INTO a single flat board, `
      + `NOT a freestanding 3D sculpture or figure. Plain, unstained natural wood grain, visible `
      + `hand-tool carving marks and clean cut facets (a skilled hobbyist's style — NOT machine-`
      + `perfect, NOT professionally polished). Photographed straight-on or from a gentle angle `
      + `that still clearly shows the whole flat panel, soft natural lighting. Realistic photo, `
      + `no text, no watermark, no background clutter.${closingReminder}`;
  }

  return `${openingLine}Reimagine that exact subject from this image as a simple, hand-carved wooden `
    + `sculpture — keep the exact same silhouette, pose, proportions, and species/identity as the `
    + `reference image, just rendered in carved wood instead of a flat illustration. Plain, unstained `
    + `natural wood grain, visible hand-tool carving marks and facets (a beginner whittler's simple, `
    + `slightly rough style — NOT smooth, NOT intricately detailed, NOT professionally polished).`
    + `${guideMarkInstruction} Sitting on a plain wooden workbench, soft natural lighting, photographed `
    + `from a flattering three-quarter angle that shows the piece clearly. Realistic photo, no text, `
    + `no watermark, no background clutter.${closingReminder}`;
}

// Calls OpenAI's image-edit endpoint with the actual template artwork as input,
// so the result matches its silhouette instead of being invented from scratch.
// Exported for live use (uploads/search-generated ideas), in addition to the
// preset seeding pipeline below.
export async function generateReferenceImage(baseImageBuffer, idea, options = {}) {
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('image', new Blob([baseImageBuffer], { type: 'image/png' }), 'template.png');
  form.append('prompt', buildReferencePrompt(idea, options));
  form.append('size', '1024x1536');
  form.append('n', '1');

  const genResp = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: form
  });
  if (!genResp.ok) throw new Error(`OpenAI edit failed: ${await genResp.text()}`);
  const genJson = await genResp.json();
  const b64 = genJson.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from edit API.');
  return Buffer.from(b64, 'base64');
}

// Generates + stores the single reference photo for one idea, skipping if it
// already exists. Returns { success, skipped, error }.
export async function generateAndStoreReferenceImage(idea) {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  const slug = ideaSlug(idea);

  const { data: existing } = await supabase
    .from('generated_designs')
    .select('image_path, reference_image_path')
    .eq('idea_slug', slug)
    .maybeSingle();

  if (!existing?.image_path) {
    return { success: false, error: 'No template artwork found for this idea yet — run the preset seed first.' };
  }
  if (existing.reference_image_path) return { success: true, skipped: true };

  const { data: publicUrlData } = supabase.storage.from('designs').getPublicUrl(existing.image_path);
  const baseResp = await fetch(publicUrlData.publicUrl);
  if (!baseResp.ok) return { success: false, error: 'Could not download the template artwork to use as a reference.' };
  const baseImageBuffer = Buffer.from(await baseResp.arrayBuffer());

  try {
    const buffer = await generateReferenceImage(baseImageBuffer, idea);
    const path = `${slug}-reference.png`;
    const { error: uploadErr } = await supabase.storage.from('designs').upload(path, buffer, { contentType: 'image/png', upsert: true });
    if (uploadErr) return { success: false, error: uploadErr.message || String(uploadErr) };
    const { error: dbErr } = await supabase.from('generated_designs').update({ reference_image_path: path }).eq('idea_slug', slug);
    if (dbErr) return { success: false, error: `DB update failed: ${dbErr.message || dbErr}` };
    return { success: true, skipped: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ---------------- Template views: RIGHT and TOP ----------------
// Both are genuinely different artwork from the main (side-profile) template —
// not mirrors, not guesses — generated via image-edit using the actual
// template/uploaded artwork as input, so the subject and style stay
// consistent while the model is free to show real asymmetry (a curled trunk,
// a turned head, an asymmetric marking) that a mirror would miss. Output is
// trace-ready (plain background, no shading) like the main template, NOT the
// realistic "how this looks carved" reference photo above.
export function buildRightViewPrompt(idea) {
  const subjectLine = idea && idea.trim()
    ? `The subject of this image is: ${idea.trim()}. Keep it EXACTLY that specific subject — do not `
      + `substitute a different, more common, or more generic subject just because it might be `
      + `easier to render. If that description mentions any specific clothing, accessories, or `
      + `props (a tie, hat, glasses, jewelry, collar, etc.), those must be clearly visible in THIS `
      + `view too — do not drop or omit them just because the angle changed. If it describes an `
      + `action or pose (swimming, running, flying, sitting, jumping, etc.), that exact same `
      + `action/pose must carry over too — do not revert to a generic standing pose. `
    : '';
  return `${subjectLine}Reimagine that exact subject from this image as if the camera walked 90 `
    + `degrees around it to the subject's right side — a true right-side profile view, as if you `
    + `turned the subject (or walked around it) a quarter-turn from this front-facing view. Keep the `
    + `same pose/action and body orientation as the front image — only the camera angle changes, `
    + `not what the subject is doing. This is a genuinely different angle showing the side of the `
    + `subject, which may reveal real details or asymmetry not visible from the front (a curled `
    + `tail, a turned head, an asymmetric marking, etc.) — don't just reuse or mirror this image, `
    + `actually depict how that side would genuinely look from a 90-degree turn. Keep the exact `
    + `same subject, style, and proportions. The subject must be clearly and fully drawn — do NOT `
    + `leave it mostly blank, faint, or barely sketched. CRITICAL: leave generous empty margin on `
    + `all four sides — the entire subject must be fully visible with clear space around it and NOT `
    + `touching or extending past any edge of the image; scale it down if needed. `
    + `${BW_LINE_ART_INSTRUCTION} No watermark, no other objects.`;
}

export function buildLeftViewPrompt(idea) {
  const subjectLine = idea && idea.trim()
    ? `The subject of this image is: ${idea.trim()}. Keep it EXACTLY that specific subject — do not `
      + `substitute a different, more common, or more generic subject just because it might be `
      + `easier to render. If that description mentions any specific clothing, accessories, or `
      + `props (a tie, hat, glasses, jewelry, collar, etc.), those must be clearly visible in THIS `
      + `view too — do not drop or omit them just because the angle changed. If it describes an `
      + `action or pose (swimming, running, flying, sitting, jumping, etc.), that exact same `
      + `action/pose must carry over too — do not revert to a generic standing pose. `
    : '';
  return `${subjectLine}Reimagine that exact subject from this image as if the camera walked 90 `
    + `degrees around it to the subject's left side — a true left-side profile view, as if you `
    + `turned the subject (or walked around it) a quarter-turn from this front-facing view, in the `
    + `opposite direction from a right-side turn. Keep the same pose/action and body orientation as `
    + `the front image — only the camera angle changes, not what the subject is doing. This is a `
    + `genuinely different angle showing the side of the subject, which may reveal real details or `
    + `asymmetry not visible from the front (a curled tail, a turned head, an asymmetric marking, `
    + `etc.) — don't just reuse or mirror this image, actually depict how that side would genuinely `
    + `look from a 90-degree turn. Keep the exact same subject, style, and proportions. The subject `
    + `must be clearly and fully drawn — do NOT leave it mostly blank, faint, or barely sketched. `
    + `CRITICAL: leave generous empty margin on all four sides — the entire subject must be fully `
    + `visible with clear space around it and NOT touching or extending past any edge of the image; `
    + `scale it down if needed. ${BW_LINE_ART_INSTRUCTION} No watermark, no other objects.`;
}

export function buildBackViewPrompt(idea) {
  const subjectLine = idea && idea.trim()
    ? `The subject of this image is: ${idea.trim()}. Keep it EXACTLY that specific subject — do not `
      + `substitute a different, more common, or more generic subject just because it might be `
      + `easier to render. If that description mentions any specific clothing, accessories, or `
      + `props (a tie, hat, glasses, jewelry, collar, etc.), those must still clearly be that same `
      + `item as seen from behind (a hat's back/brim, a tie's knot from behind, a backpack strap, `
      + `etc.) — do not drop them just because the angle changed. If it describes an action or pose `
      + `(swimming, running, flying, sitting, jumping, etc.), that exact same action/pose must carry `
      + `over too — do not revert to a generic standing pose. `
    : '';
  return `${subjectLine}Reimagine that exact subject from this image as if the camera walked all the `
    + `way around it — a full 180-degree turn from this front-facing view — to look at it directly `
    + `from BEHIND. This is the BACK of the subject: the back of the head (NOT the face), the back `
    + `of the torso/body, the back of any clothing or accessories, and so on. Do NOT show the face `
    + `or any front-facing details, and do NOT simply reuse, flip, or mirror this front image — `
    + `actually depict how the back genuinely looks, including real details that would only be `
    + `visible from behind (the back of a hat or collar, a tail, the back of hair, a belt or strap `
    + `crossing the back, etc.). Keep the same pose/stance and body orientation as the front image — `
    + `only the camera angle changes, not what the subject is doing. Keep the exact same subject, `
    + `style, and proportions. The subject must be clearly and fully drawn — do NOT leave it mostly `
    + `blank, faint, or barely sketched. CRITICAL: leave generous empty margin on all four sides — `
    + `the entire subject must be fully visible with clear space around it and NOT touching or `
    + `extending past any edge of the image; scale it down if needed. `
    + `${BW_LINE_ART_INSTRUCTION} No watermark, no other objects.`;
}

export function buildTopViewPrompt() {
  return `Reimagine ONLY the subject from this image, redrawn as a genuine TOP-DOWN / BIRD'S-EYE `
    + `VIEW — imagine a camera positioned directly above the subject, pointing straight down at the `
    + `crown of its head (or the top of its back, for an animal), looking down its full length from `
    + `head/front to feet/tail. This is NOT a side view, NOT a three-quarter view, and NOT the same `
    + `image rotated — it is a completely different silhouette, as if you are floating above the `
    + `subject looking down: you should mainly see the top of the head or hat (as a rounded shape, `
    + `an oval or circle), the shoulders and top of the back, and little to no face, front torso, or `
    + `side profile, because a true overhead view hides those. For a standing human/animal figure, `
    + `the limbs will appear foreshortened or barely visible, tucked close to the outline, since `
    + `they are pointing away from the camera, not out to the sides. Think of it like a floor plan `
    + `or an aerial photo, not a portrait. Keep the same subject and general proportions as the `
    + `reference image, but the silhouette shape itself must be clearly different from a side profile. `
    + `CRITICAL: leave generous empty margin on all four sides — the entire subject must be fully `
    + `visible with clear space around it and NOT touching or extending past any edge of the image; `
    + `scale it down if needed. ${BW_LINE_ART_INSTRUCTION} No watermark, no other objects.`;
}

// "Describe an edit" — a person's own free-text instruction applied to their
// currently loaded design. Deliberately narrow: change ONLY what they asked
// for, preserve everything else exactly, so a small request ("make the ears
// bigger") doesn't turn into the model re-imagining the whole piece.
export function buildTweakPrompt(instruction) {
  return `Make ONLY this specific change to the image, and nothing else: ${instruction}. `
    + `Keep everything else about the image EXACTLY the same as it already is — same subject, `
    + `same species/identity, same pose, same style, same proportions, same composition, same `
    + `framing. Do not re-imagine, restyle, or redesign the piece; make the smallest edit that `
    + `satisfies the request. ${BW_LINE_ART_INSTRUCTION} No watermark, no other objects, no cropping.`;
}

// Shared primitive: OpenAI image-edit + remove.bg cleanup, given any base
// image and prompt. Used for both RIGHT and TOP, for both presets (batch,
// cached) and live uploads/search-generated ideas (on-demand, uncached).
export async function generateEditedTemplateView(baseImageBuffer, prompt) {
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('image', new Blob([baseImageBuffer], { type: 'image/png' }), 'source.png');
  form.append('prompt', prompt);
  form.append('size', '1024x1536');
  form.append('n', '1');

  const genResp = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: form
  });
  if (!genResp.ok) throw new Error(`OpenAI edit failed: ${await genResp.text()}`);
  const genJson = await genResp.json();
  const b64 = genJson.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from edit API.');
  const imageBuffer = Buffer.from(b64, 'base64');

  const form2 = new FormData();
  form2.append('image_file', new Blob([imageBuffer], { type: 'image/png' }), 'edited.png');
  form2.append('size', 'auto');
  const rmResp = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST', headers: { 'X-Api-Key': REMOVEBG_API_KEY }, body: form2
  });
  if (!rmResp.ok) throw new Error(`remove.bg failed: ${await rmResp.text()}`);
  return Buffer.from(await rmResp.arrayBuffer());
}

// ---------- Preset (batch, cached) versions ----------
async function generateAndStoreTemplateView(idea, viewName, prompt) {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  const slug = ideaSlug(idea);
  const col = `${viewName}_view_path`;

  const { data: existing } = await supabase
    .from('generated_designs')
    .select(`image_path, ${col}`)
    .eq('idea_slug', slug)
    .maybeSingle();

  if (!existing?.image_path) {
    return { success: false, error: 'No template artwork found for this idea yet — run the preset seed first.' };
  }
  if (existing[col]) return { success: true, skipped: true };

  const { data: publicUrlData } = supabase.storage.from('designs').getPublicUrl(existing.image_path);
  const baseResp = await fetch(publicUrlData.publicUrl);
  if (!baseResp.ok) return { success: false, error: 'Could not download the template artwork to use as a base image.' };
  const baseImageBuffer = Buffer.from(await baseResp.arrayBuffer());

  try {
    const buffer = await generateEditedTemplateView(baseImageBuffer, prompt);
    const path = `${slug}-${viewName}.png`;
    const { error: uploadErr } = await supabase.storage.from('designs').upload(path, buffer, { contentType: 'image/png', upsert: true });
    if (uploadErr) return { success: false, error: uploadErr.message || String(uploadErr) };
    const { error: dbErr } = await supabase.from('generated_designs').update({ [col]: path }).eq('idea_slug', slug);
    if (dbErr) return { success: false, error: `DB update failed: ${dbErr.message || dbErr}` };
    return { success: true, skipped: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function generateAndStoreRightView(idea) {
  return generateAndStoreTemplateView(idea, 'right', buildRightViewPrompt());
}
export async function generateAndStoreLeftView(idea) {
  return generateAndStoreTemplateView(idea, 'left', buildLeftViewPrompt());
}
export async function generateAndStoreBackView(idea) {
  return generateAndStoreTemplateView(idea, 'back', buildBackViewPrompt());
}
export async function generateAndStoreTopView(idea) {
  return generateAndStoreTemplateView(idea, 'top', buildTopViewPrompt());
}
