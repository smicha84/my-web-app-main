/**
 * Mock OpenAI service to generate app ideas without using the actual OpenAI API
 */

// Sample creative app ideas for different types of tweets
const mockAppIdeas = [
  {
    appName: "DreamTracker",
    tagline: "Turn your night dreams into daytime inspiration",
    description: "DreamTracker helps you record, analyze, and visualize patterns in your dreams. It uses AI to identify recurring themes and provides insights into your subconscious mind.",
    keyFeatures: [
      "Voice-to-text dream recording upon waking",
      "AI pattern recognition across dream journals",
      "Mood and emotion tracking correlated with dreams",
      "Community dream sharing and interpretation"
    ],
    targetAudience: "People interested in personal growth, psychology enthusiasts, and vivid dreamers",
    monetization: "Freemium model with subscription for advanced analytics and unlimited storage"
  },
  {
    appName: "FinderKeeper",
    tagline: "Never lose your essentials again",
    description: "FinderKeeper uses a combination of tiny Bluetooth tags, household mapping, and daily routine learning to help you locate commonly misplaced items like keys, wallets, and phones.",
    keyFeatures: [
      "Smart tracking tags with extended battery life",
      "Indoor positioning system with room-level accuracy",
      "Predictive suggestions based on your habits",
      "Voice-activated search through smart home integration"
    ],
    targetAudience: "Busy professionals, parents, and anyone who frequently misplaces items",
    monetization: "Hardware sales (tracking tags) with premium subscription for advanced features"
  },
  {
    appName: "PaceMatch",
    tagline: "Find your perfect running partner",
    description: "PaceMatch connects runners in the same area who have similar pace, distance goals, and running schedules, helping to make running a more social and motivating experience.",
    keyFeatures: [
      "Intelligent matching based on pace, distance, and schedule",
      "Real-time location sharing during group runs",
      "Gamification and challenges for running partners",
      "Performance analytics and improvement tracking"
    ],
    targetAudience: "Recreational runners, running club members, and fitness enthusiasts",
    monetization: "Free with premium subscription for advanced matching and analytics"
  },
  {
    appName: "FocusZone",
    tagline: "Transform any space into a productivity haven",
    description: "FocusZone helps remote workers establish structure in their day with customized work environments, focus timers, and distraction management techniques tailored to your home setup.",
    keyFeatures: [
      "Customizable focus sessions with environment controls",
      "Smart notification management during deep work",
      "Productivity analytics and improvement suggestions",
      "Integration with home smart devices for automatic 'focus mode'"
    ],
    targetAudience: "Remote workers, freelancers, and students working from home",
    monetization: "Subscription model with tiered pricing based on features"
  },
  {
    appName: "LinguaPartner",
    tagline: "Practice conversations, not just vocabulary",
    description: "LinguaPartner uses AI-powered virtual conversation partners to help language learners practice realistic dialogues in various scenarios, providing instant feedback on pronunciation and grammar.",
    keyFeatures: [
      "AI conversation partners with natural dialogue flow",
      "Scenario-based learning (restaurant, shopping, travel)",
      "Speech recognition with pronunciation feedback",
      "Vocabulary building through contextual conversation"
    ],
    targetAudience: "Language learners at intermediate level looking for conversation practice",
    monetization: "Subscription model with limited free conversations daily"
  }
];

/**
 * Get a mock app idea based on the tweet text
 * @param {Object} tweet - Tweet object from Twitter API
 * @returns {Object} Mock app idea
 */
const getMockAppIdea = (tweet) => {
  // Determine which mock idea to return based on the tweet content
  // This is a simple implementation - in reality you'd use NLP to match better
  const tweetText = tweet.text.toLowerCase();
  
  if (tweetText.includes('sleep') || tweetText.includes('dream')) {
    return mockAppIdeas[0]; // DreamTracker
  } else if (tweetText.includes('keys') || tweetText.includes('lost') || tweetText.includes('find')) {
    return mockAppIdeas[1]; // FinderKeeper
  } else if (tweetText.includes('run') || tweetText.includes('exercise') || tweetText.includes('fitness')) {
    return mockAppIdeas[2]; // PaceMatch
  } else if (tweetText.includes('work') || tweetText.includes('focus') || tweetText.includes('distract')) {
    return mockAppIdeas[3]; // FocusZone
  } else if (tweetText.includes('language') || tweetText.includes('learn') || tweetText.includes('speak')) {
    return mockAppIdeas[4]; // LinguaPartner
  } else {
    // Default to a random app idea if no good match
    const randomIndex = Math.floor(Math.random() * mockAppIdeas.length);
    return mockAppIdeas[randomIndex];
  }
};

module.exports = {
  mockAppIdeas,
  getMockAppIdea
};
