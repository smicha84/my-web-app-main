const axios = require('axios');

// Function to generate app idea from a tweet using Claude
const generateAppIdeaWithClaude = async (tweetText) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Generate a creative, unique, and non-boring app idea based on this tweet: "${tweetText}".
            
            The app idea should be:
            1. Descriptive and well-developed (at least 200 words)
            2. Creative and unexpected - avoid obvious or mundane ideas
            3. Either funny, sarcastic, edgy (even 18+), kid-friendly, or professional - choose ONE tone that fits best
            4. Include a catchy name, core features, target audience, and monetization strategy
            5. Most importantly: BE BOLD AND NOT BORING
            
            Format your response with these headings:
            - App Name:
            - Concept Summary: (1-2 sentences)
            - Detailed Description:
            - Core Features:
            - Target Users:
            - Monetization:
            - Why It's Not Boring:`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.LLM_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error generating app idea with Claude:', error);
    throw new Error('Failed to generate app idea');
  }
};

// Alternative implementation using OpenAI's API
const generateAppIdeaWithOpenAI = async (tweetText) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative, edgy app idea generator that creates unique, non-boring app concepts.'
          },
          {
            role: 'user',
            content: `Generate a creative, unique, and non-boring app idea based on this tweet: "${tweetText}".
            
            The app idea should be:
            1. Descriptive and well-developed (at least 200 words)
            2. Creative and unexpected - avoid obvious or mundane ideas
            3. Either funny, sarcastic, edgy (even 18+), kid-friendly, or professional - choose ONE tone that fits best
            4. Include a catchy name, core features, target audience, and monetization strategy
            5. Most importantly: BE BOLD AND NOT BORING
            
            Format your response with these headings:
            - App Name:
            - Concept Summary: (1-2 sentences)
            - Detailed Description:
            - Core Features:
            - Target Users:
            - Monetization:
            - Why It's Not Boring:`
          }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LLM_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating app idea with OpenAI:', error);
    throw new Error('Failed to generate app idea');
  }
};

// Use Claude by default, fallback to OpenAI
const generateAppIdea = async (tweetText) => {
  try {
    return await generateAppIdeaWithClaude(tweetText);
  } catch (error) {
    console.log('Falling back to OpenAI after Claude error:', error.message);
    return await generateAppIdeaWithOpenAI(tweetText);
  }
};

module.exports = { generateAppIdea };
