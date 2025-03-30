const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Connect to the SQLite database
const db = new sqlite3.Database('./tweetIdeas.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// The new default prompt content
const newDefaultPrompt = {
  "prompt_name": "Tweet-to-App Concept Generator (Labeled Hyper-Creative Edition)",
  "description": "A prompt designed to inspire the creation of *radically innovative, unexpected, potentially absurd, or sharply sarcastic* mobile app concepts derived from the essence of a single tweet. It challenges the AI to label its concept with a primary tone, aggressively push creative boundaries, defy convention, avoid generic solutions, and ensure the generated description itself embodies the requested tone.",
  "prompt_template": [
    {
      "type": "instruction",
      "text": "Subject: ✨ Unleash Wild & Witty Innovation: Transform This Tweet into a Mind-Bending App Concept! ✨\n\nHello Creative AI,\n\nYou've encountered a fleeting digital moment, a thought captured in a tweet:\n\n\"{{tweet}}\"\n\nThis isn't just 140/280 characters; it's a potential catalyst, a hint of an unmet need, a desire, a unique perspective, or perhaps a moment ripe for satire, waiting to be explored. Your challenge is to channel the core sentiment, idea, or problem expressed in this tweet and forge it into an imaginative and compelling mobile application concept.\n\n**Crucially, your mission is to aggressively avoid the generic, the mundane, and the predictable. Push the boundaries *hard*! How can this tweet inspire something genuinely *novel*, *surprising*, *delightful*, *wildly unconventional*, *gleefully absurd*, *full-on sarcastic*, or even *playfully disruptive*? Think far beyond safe or practical – embrace ideas that are unexpected, hilariously impractical, defy logic, embody sharp sarcasm, or explore the tweet's theme from a completely bonkers angle. Don't be afraid to be weird or witty!**\n\nDream big, embrace the chaos or the critique, and consider the user experience (even if that experience is pure absurdity or cutting irony). Craft a concept that feels both inspired by the tweet and truly *unforgettable*."
    },
    {
      "type": "output_specification",
      "title": "Output Requirements:",
      "items": [
        "**Concept Tone Label:** As the very first key-value pair in your JSON response, include \"Concept Tone\": \"<Chosen Keyword>\". Choose the *single best* keyword from the list [`Novel`, `Surprising`, `Delightful`, `Wildly Unconventional`, `Gleefully Absurd`, `Full-on Sarcastic`, `Playfully Disruptive`] that most accurately describes the dominant spirit or tone of your generated app concept.",
        "**App Name:** Invent a catchy, memorable, and relevant name for the app that hints at its unique, potentially off-the-wall or sarcastic angle. Briefly explain *why* this name fits the *distinctive* concept (1-2 sentences).",
        "**Evocative Tagline:** Create a short, impactful tagline (max 15 words) that captures the app's *unique* promise (or lack thereof, sarcastically) and sparks *intense* curiosity, bemusement, or knowing cynicism, steering clear of clichés.",
        "**Core Concept (Description):** Write a concise description (under 100 words) *in the app's unique voice*. It should outline what the app does, the problem it solves (or mocks!), or the value it offers, while **simultaneously *embodying* the same tone indicated by your `Concept Tone` label**. Make the description itself a demonstration of the app's spirit.",
        "**Standout Features (Key Features):** List 3-5 specific, **boldly innovative, unconventional, or pointedly sarcastic**, and user-centric features. Think beyond standard app functionalities – what makes the *experience* uniquely captivating, bizarre, ironically useful, or solves/highlights the core problem in a *radically different, humorous, or critical* way? Avoid listing basic features.",
        "**Ideal Users (Target Audience):** Describe the primary target audience. Who would be most *intrigued, amused, or validated* by this *specific, unconventional, potentially sarcastic* app? What are their relevant characteristics, needs, sense of humor, or perhaps shared frustrations that make them a perfect fit?",
        "**Value Proposition (Unique Selling Point - USP):** Clearly articulate what makes this app dramatically different. What is its single biggest, *compelling (or perhaps ironically compelling)* draw that ensures it cuts through the noise and avoids being 'just another app'? Is its value its function, its commentary, or its sheer audacity?",
        "**Sustainable Growth (Potential Monetization):** Suggest 1-3 realistic or *perhaps satirically appropriate*, user-friendly strategies for how the app could generate revenue (or maybe social commentary?). Consider models that align with the app's unique, possibly absurd or sarcastic, value proposition."
      ]
    },
    {
      "type": "output_format",
      "instruction": "Please structure your entire response as a single, clean JSON object, starting with the `Concept Tone` key as specified above. Ensure all subsequent keys match the requirement titles (e.g., `App Name`, `Evocative Tagline`, etc.). Provide no additional explanatory text outside the JSON structure."
    }
  ],
  "placeholder_variable": "{{tweet}}"
};

// Insert the new default prompt
db.run(
  'INSERT INTO prompts (name, content, is_default) VALUES (?, ?, 1)',
  [
    newDefaultPrompt.prompt_name,
    JSON.stringify(newDefaultPrompt)
  ],
  function(err) {
    if (err) {
      console.error('Error inserting default prompt:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('New default prompt inserted successfully with ID:', this.lastID);
    
    // Close the database connection
    db.close();
  }
);
