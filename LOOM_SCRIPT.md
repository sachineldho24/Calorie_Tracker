Most calorie trackers make you do the hard work. You search for foods, you manually enter grams, you guess at restaurant meals — and by day three, you've given up.

CalSnap flips that. You point your camera at a plate of dosa and sambar, and within three seconds you have per-item calorie and macro breakdowns. You type "bowl of dal rice with yogurt" in plain English and the AI parses every ingredient. And while you're figuring out what to eat next, a personalised AI coach — one that actually remembers your allergies and your cooking skill level — suggests exactly what fits your remaining macros today.

Let me show you how it all works.

---

First time you open CalSnap, you go through a clean four-step setup. Step one: your current weight and your target. I'm at 59 kilos, trying to get to 65 — building muscle.

Step two captures your height, age, and sex. This feeds into the Mifflin–St Jeor equation under the hood — the gold-standard BMR formula — so your calorie target isn't just a generic number, it's actually calculated for your body.

Step three: activity level. I'll pick Sedentary for now.

And here's where it clicks. CalSnap computes your full macro split on the fly — 2,270 calories, 170 grams of protein, 227 carbs, 76 fat — adjusted for the Build Muscle goal with a 300-calorie surplus. One tap, and you're tracking.

---

The home screen gives you the full picture at a glance. The calorie ring at the top is your progress dial — it fills as you log meals. Below that: eaten, remaining, and budget in three numbers.

The Health Impact card is something I haven't seen in any other tracker. It estimates the healthy-life minutes you've gained today based on your protein intake — backed by the University of Michigan Health Nutritional Index study — plus your CO₂ footprint for the day. It's motivational, it's different, and it updates live every time you log a meal.

And then the AI Coach card. Right now it's lunch time, so it's showing a Lunch Idea — a Nadan Chicken Pepper Fry — complete with macros, ingredients, and a personalised reason why this specific meal fits my remaining 170 grams of protein today.

---

Let me log a meal. I'll tap the scan button. Notice the input options along the bottom — Gallery, Voice, Camera, Manual, Barcode. Five ways to log, all from one screen.

I'll grab a photo I took earlier — three dosas and a bowl of sambar.

The moment the photo lands, Gemini Vision starts analysing. You can see the "Analyzing food" indicator live. No spinner hiding behind a static screen — it's real-time.

Three seconds later: Plain Dosa — 3 medium pieces, 420 calories, 9 grams of protein, 78 carbs, 10 fat. Sambar — one small bowl, 90 calories. The AI even flagged a note: "analysis assumes three plain dosas and a standard serving of vegetable sambar — calories may increase if ghee was used." That kind of contextual awareness is what makes this feel like a real nutrition coach, not just a lookup table.

I can edit any value, add items, assign it to a meal slot — and hit Save to Diary.

---

Now here's the feature that's genuinely novel. Tap Voice on the scan screen and you get a plain text field that says "What did you eat?"

You just type it out. "Dal rice with plain yogurt." Hit Parse with AI — and the same pipeline that reads photos now reads language. It returns per-item calories and macros, a confidence level, and any assumptions it made. From there it flows straight into the review screen — same UI, same save flow. Zero extra plumbing.

---

Back on the home screen. I tap "How to make it" on the Nadan Chicken suggestion.

The AI generates a complete recipe on the fly — prep time, total time, ingredients, five numbered steps each with a duration and a pro tip. This is generated fresh every time using the Groq free-tier API, which means it's fast, it's free, and it respects everything the AI knows about me.

Speaking of which — the AI learns. If I tap "Not feeling this?" I get four options: Allergic, Don't like, Not now, Loved it. Each reaction writes to a persistent memory store on the device. Allergies are never suggested again. "Loved it" boosts similar meals. And critically — this memory is model-agnostic. It's injected as plain text into every prompt, so it works regardless of whether you switch to Groq, Gemini, or a custom local model tomorrow. No cloud sync, no model-side memory required. It just works.

---

There's also a Pantry Mode built into the AI Coach card. You type what's actually in your fridge — chicken, eggs, rice, spinach — and the AI is now constrained to suggest only meals from those ingredients. No suggestions that require a trip to the supermarket. This is the kind of practical feature that makes the difference between an app people try and an app people actually use every single day.

---

The Progress tab tracks your streak, plus a weekly calorie chart with a dashed target line, current versus target weight, and a summary grid. Clean, readable, no clutter.

Profile shows your full macro breakdown alongside your body stats. Everything calculated, nothing guessed.

---

Under the hood, CalSnap is built on Expo SDK 51 with the new React Native architecture enabled. TypeScript strict mode throughout. All data lives on the device — fully offline, no account required, nothing goes to a server.

The AI layer is provider-abstracted: Gemini for vision, Groq's free tier for text, or you can point it at any OpenAI-compatible endpoint — local Ollama, OpenRouter, whatever you want. The app falls back gracefully if a provider is unavailable, so it always works.

Every AI call is hardened: sanitised outputs, numeric range guards on calories and macros, retry logic, and a fallback response object so no crash ever surfaces to the user.

CalSnap is what I believe a modern AI-native mobile app should feel like: fast, personal, honest about what it knows and doesn't know, and actually useful on day fifty — not just day one.

Thank you for watching.
