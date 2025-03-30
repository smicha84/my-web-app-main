const OpenAI = require('openai');
const db = require('../db');

/**
 * Initialize the OpenAI client with API key
 */
const initOpenAI = () => {
  try {
    // Initialize with the API key from environment variables
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION_ID,
      projectId: process.env.OPENAI_PROJECT_ID
    });
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
};

/**
 * Get the default prompt from the database
 * @returns {Promise<string>} The default prompt template
 */
const getDefaultPrompt = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT content FROM prompts WHERE is_default = 1', (err, row) => {
      if (err) {
        console.error('Error getting default prompt:', err);
        // Use hardcoded fallback if database fails
        return resolve(`
Generate a creative mobile app idea based on the following tweet:
"{{tweet}}"

Please provide the following in your response:
1. App Name: A catchy name for the app
2. Tagline: A brief, memorable description (20 words or less)
3. Description: A short description of what the app does (100 words or less)
4. Key Features: List 3-5 key features of the app
5. Target Audience: Who would use this app
6. Potential Monetization: How could this app make money

Format the response as JSON without any additional text.
`);
      }
      
      if (!row) {
        console.warn('No default prompt found in database. Using fallback prompt.');
        // Use hardcoded fallback if no default prompt exists
        return resolve(`
Generate a creative mobile app idea based on the following tweet:
"{{tweet}}"

Please provide the following in your response:
1. App Name: A catchy name for the app
2. Tagline: A brief, memorable description (20 words or less)
3. Description: A short description of what the app does (100 words or less)
4. Key Features: List 3-5 key features of the app
5. Target Audience: Who would use this app
6. Potential Monetization: How could this app make money

Format the response as JSON without any additional text.
`);
      }
      
      resolve(row.content);
    });
  });
};

/**
 * Validate the completeness of a response
 * @param {string} response - The raw text response
 * @returns {Object} Validation result with isComplete flag and missingSections
 */
function validateResponseCompleteness(response) {
  // Define all required sections and their regex patterns
  const requiredSections = [
    { name: 'conceptTone', regex: /1\. Concept Tone:([^\n]+)/i, title: "Concept Tone" },
    { name: 'appName', regex: /2\. App Name:([^\n]+)/i, title: "App Name" },
    { name: 'tagline', regex: /3\. Evocative Tagline:([^\n]+)/i, title: "Evocative Tagline" },
    { name: 'description', regex: /4\. Core Concept[^:]*:([^\n]+(?:\n(?!5\.)[^\n]+)*)/i, title: "Core Concept" },
    { name: 'features', regex: /5\. Standout Features[^:]*:([^\n]+(?:\n(?!6\.)[^\n]+)*)/i, title: "Standout Features" },
    { name: 'audience', regex: /6\. Ideal Users[^:]*:([^\n]+(?:\n(?!7\.)[^\n]+)*)/i, title: "Ideal Users" },
    { name: 'valueProp', regex: /7\. Value Proposition[^:]*:([^\n]+(?:\n(?!8\.)[^\n]+)*)/i, title: "Value Proposition" },
    { name: 'monetization', regex: /8\. Sustainable Growth[^:]*:([^\n]+(?:\n(?!9\.)[^\n]+)*)/i, title: "Sustainable Growth" }
  ];
  
  // Check each section for substantial content (more than placeholders)
  const missingSections = [];
  
  for (const section of requiredSections) {
    const match = response.match(section.regex);
    const content = match && match[1] ? match[1].trim() : '';
    
    // Check if content is missing or just a placeholder
    const isPlaceholder = /^(no|none|not|app name|n\/a|missing|not available)/i.test(content) || content.length < 3;
    
    if (!content || isPlaceholder) {
      missingSections.push(section);
    }
  }
  
  return {
    isComplete: missingSections.length === 0,
    missingSections
  };
}

/**
 * Generate missing sections for an incomplete response
 * @param {Object} tweet - Tweet object containing tweet text
 * @param {Array} missingSections - Array of missing section objects
 * @returns {Promise<string>} Generated content for missing sections
 */
async function generateMissingSections(tweet, missingSections) {
  if (missingSections.length === 0) return null;
  
  const openai = initOpenAI();
  
  // Create a targeted prompt for just the missing sections
  const missingSectionTitles = missingSections.map(s => s.title).join(", ");
  
  const prompt = `
  You are a creative app idea assistant focusing ONLY on generating the following missing 
  sections for an app concept based on this tweet: "${tweet.text}"

  For each section, provide thoughtful, creative, and specific content.
  
  ONLY INCLUDE THESE SECTIONS - DO NOT create any other sections:
  ${missingSections.map(s => `${s.name}: ${s.title}`).join('\n')}
  
  Format your response using the exact section headers as provided above.
  `;
  
  console.log('GENERATING MISSING SECTIONS:', missingSectionTitles);
  console.log('TARGETED PROMPT:', prompt);
  
  const response = await openai.chat.completions.create({
    model: "chatgpt-4o-latest",
    messages: [
      { 
        role: "system", 
        content: "You are a specialized assistant that generates only the MISSING sections of app ideas with extreme creativity and detail. Never use placeholder text." 
      },
      { role: "user", content: prompt }
    ],
    temperature: 1.1, // Slightly higher temperature for creativity
    max_tokens: 2000,
    response_format: { type: "text" }
  });
  
  const fillerContent = response.choices[0].message.content;
  console.log('GENERATED FILLER CONTENT:', fillerContent);
  
  return fillerContent;
}

/**
 * Merge original response with filler content for missing sections
 * @param {string} initialResponse - The original response text
 * @param {string} fillers - The generated filler content
 * @returns {string} Merged complete response
 */
function mergeResponses(initialResponse, fillers) {
  if (!fillers) return initialResponse;
  
  let mergedContent = initialResponse;
  
  // For each missing section, insert content from fillers
  const sectionMarkers = [
    { pattern: /1\. Concept Tone:/i, content: /Concept Tone:([^\n]+)/i },
    { pattern: /2\. App Name:/i, content: /App Name:([^\n]+)/i },
    { pattern: /3\. Evocative Tagline:/i, content: /Evocative Tagline:([^\n]+)/i },
    { pattern: /4\. Core Concept \(Description\):/i, content: /Core Concept[^:]*:([^\n]+(?:\n(?!\d\.)[^\n]+)*)/i },
    { pattern: /5\. Standout Features \(Key Features\):/i, content: /Standout Features[^:]*:([^\n]+(?:\n(?!\d\.)[^\n]+)*)/i },
    { pattern: /6\. Ideal Users \(Target Audience\):/i, content: /Ideal Users[^:]*:([^\n]+(?:\n(?!\d\.)[^\n]+)*)/i },
    { pattern: /7\. Value Proposition \(Unique Selling Point - USP\):/i, content: /Value Proposition[^:]*:([^\n]+(?:\n(?!\d\.)[^\n]+)*)/i },
    { pattern: /8\. Sustainable Growth \(Potential Monetization\):/i, content: /Sustainable Growth[^:]*:([^\n]+(?:\n(?!\d\.)[^\n]+)*)/i }
  ];
  
  // Extract sections from filler content
  for (const marker of sectionMarkers) {
    const contentMatch = fillers.match(marker.content);
    if (!contentMatch || !contentMatch[1]) continue;
    
    const fillerContent = contentMatch[1].trim();
    if (!fillerContent) continue;
    
    // Find placeholder or empty section in original content
    const placeholderRegex = new RegExp(
      `(${marker.pattern.source}[^\\n]*)(\\s*(?:No [^\\n]*available|App Name|N\\/A|Not specified)[^\\n]*)?`, 
      'i'
    );
    
    // Replace placeholder with filler content
    if (placeholderRegex.test(mergedContent)) {
      mergedContent = mergedContent.replace(placeholderRegex, `$1 ${fillerContent}`);
    }
  }
  
  return mergedContent;
}

/**
 * Generate an app idea based on a tweet
 * @param {Object} tweet - Tweet object from Twitter API
 * @param {number} [promptId] - Optional ID of the prompt to use
 * @returns {Promise<Object>} Generated app idea
 */
const generateAppIdea = async (tweet, promptId) => {
  try {
    const openai = initOpenAI();
    
    // Get the prompt content based on the promptId or use default
    let promptTemplate;
    
    if (promptId) {
      // Get specific prompt by ID
      try {
        await new Promise((resolve, reject) => {
          db.get('SELECT content FROM prompts WHERE id = ?', [promptId], (err, row) => {
            if (err) {
              console.error(`Error getting prompt with ID ${promptId}:`, err);
              return reject(err);
            }
            
            if (!row) {
              console.warn(`Prompt with ID ${promptId} not found. Using default prompt instead.`);
              return resolve(null);
            }
            
            promptTemplate = row.content;
            resolve(promptTemplate);
          });
        });
      } catch (error) {
        console.error('Error fetching specific prompt:', error);
        // Fall through to use default prompt
      }
    }
    
    // If no promptId specified or fetching specific prompt failed, use default
    if (!promptTemplate) {
      promptTemplate = await getDefaultPrompt();
    }
    
    // For testing, log the actual prompt being used
    console.log('Using prompt template:', promptTemplate);
    
    // Replace {{tweet}} placeholder with actual tweet text
    const prompt = promptTemplate.replace('{{tweet}}', tweet.text);

    console.log('Calling OpenAI API...');
    // Using model and prompt exactly as specified by user
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o model
      messages: [
        { 
          role: "system", 
          content: `You are a creative app idea generator based on tweets. You MUST follow the structured output format exactly, providing content for EVERY section. Never skip a section and always provide meaningful content for taglines, features, and value propositions. If you're uncertain about a section, be creative rather than leaving it blank.` 
        },
        { role: "user", content: `Hello Creative AI,

You've encountered a fleeting digital moment, a thought captured in a tweet:

"${tweet.text}"

This isn't just 140/280 characters; it's a potential catalyst, a hint of an unmet need, a desire, a unique perspective, or perhaps a moment ripe for satire, waiting to be explored. Your challenge is to channel the core sentiment, idea, or problem expressed in this tweet and forge it into an imaginative and compelling mobile application concept.

Crucially, your mission is to aggressively avoid the generic, the mundane, and the predictable. Push the boundaries hard! How can this tweet inspire something genuinely novel, surprising, delightful, wildly unconventional, gleefully absurd, full-on sarcastic, or even playfully disruptive? Think far beyond safe or practical – embrace ideas that are unexpected, hilariously impractical, defy logic, embody sharp sarcasm, or explore the tweet's theme from a completely bonkers angle. Don't be afraid to be weird or witty!

Dream big, embrace the chaos or the critique, and consider the user experience (even if that experience is pure absurdity or cutting irony). Craft a concept that feels both inspired by the tweet and truly unforgettable.

Output Requirements:

Please provide the following details for the app concept, formatted clearly as plain text under the specified headings:

1. Concept Tone:
As the very first line of your response, state the single best keyword from the following list that most accurately describes the dominant spirit or tone of your generated app concept: Novel, Surprising, Delightful, Wildly Unconventional, Gleefully Absurd, Full-on Sarcastic, Playfully Disruptive.

2. App Name:
Invent a catchy, memorable, and relevant name for the app that hints at its unique, potentially off-the-wall or sarcastic angle. Follow this with a brief explanation (1-2 sentences) why this name fits the distinctive concept.

3. Evocative Tagline:
Create a short, impactful tagline (max 15 words) that captures the app's unique promise (or lack thereof, sarcastically) and sparks intense curiosity, bemusement, or knowing cynicism, steering clear of clichés.

4. Core Concept (Description):
Write a concise description (under 100 words) in the app's unique voice. It should outline what the app does, the problem it solves (or mocks!), or the value it offers, while simultaneously embodying the same tone indicated by your Concept Tone label above. Make the description itself a demonstration of the app's spirit.

5. Standout Features (Key Features):
List 3-5 specific, boldly innovative, unconventional, or pointedly sarcastic, and user-centric features. Think beyond standard app functionalities – what makes the experience uniquely captivating, bizarre, ironically useful, or solves/highlights the core problem in a radically different, humorous, or critical way? Avoid listing basic features.

6. Ideal Users (Target Audience):
Describe the primary target audience. Who would be most intrigued, amused, or validated by this specific, unconventional, potentially sarcastic app? What are their relevant characteristics, needs, sense of humor, or perhaps shared frustrations that make them a perfect fit?

7. Value Proposition (Unique Selling Point - USP):
Clearly articulate what makes this app dramatically different. What is its single biggest, compelling (or perhaps ironically compelling) draw that ensures it cuts through the noise and avoids being 'just another app'? Is its value its function, its commentary, or its sheer audacity?

8. Sustainable Growth (Potential Monetization):
Suggest 1-3 realistic or perhaps satirically appropriate, user-friendly strategies for how the app could generate revenue (or maybe social commentary?). Consider models that align with the app's unique, possibly absurd or sarcastic, value proposition.

CRITICAL FORMATTING REQUIREMENTS: You MUST include ALL 8 sections with detailed content for each. Never leave a section empty or with placeholder text. Structure your entire response as plain text using the exact headings provided above (e.g., "1. Concept Tone:", "2. App Name:", etc.). For the Value Proposition and Features sections, be especially detailed and creative. Do not use JSON formatting. Provide no additional explanatory text before the "1. Concept Tone:" line or after the final section.` }
      ],
      temperature: 1.0,
      max_tokens: 8000, // Maximum capacity - ensure complete, detailed responses
      response_format: { type: "text" } // Changed to text format as requested
    });
    
    // CRITICAL: Log the raw response in full detail
    const rawContent = response.choices[0].message.content;
    console.log('================================================');
    console.log('RAW OPENAI RESPONSE BEGIN');
    console.log(rawContent);
    console.log('RAW OPENAI RESPONSE END');
    console.log('================================================');
    
    // *** SELF-HEALING SYSTEM STARTS HERE ***
    
    // 1. Validate the response to check for completeness
    const validation = validateResponseCompleteness(rawContent);
    console.log('VALIDATION RESULT:', validation.isComplete);
    console.log('MISSING SECTIONS:', validation.missingSections.map(s => s.title));
    
    let finalContent = rawContent;
    
    // 2. If response is incomplete, generate missing sections and merge
    if (!validation.isComplete) {
      console.log('DETECTED INCOMPLETE SECTIONS - ACTIVATING SELF-HEALING');
      // Generate the missing sections
      const fillerContent = await generateMissingSections(tweet, validation.missingSections);
      
      // Merge the original content with the filler content
      if (fillerContent) {
        finalContent = mergeResponses(rawContent, fillerContent);
        console.log('SELF-HEALING COMPLETE - MERGED CONTENT CREATED');
      }
    }
    
    // For client-side debugging, include the original tweet text
    // to verify matching between tweets and generated ideas
    return {
      app_idea: finalContent,
      tweet_text: tweet.text
    };
  } catch (error) {
    console.error('Error generating app idea:', error);
    throw error; // Throw error instead of using fallback
  }
};

module.exports = { generateAppIdea };
