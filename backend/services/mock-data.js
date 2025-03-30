/**
 * Mock data for testing when API credentials are not set up
 */

// Sample mock tweets for testing without Twitter API
const mockTweets = [
  {
    id: '1234567890',
    text: 'Just saw someone use AI to analyze their sleep patterns and provide personalized recommendations. The future of healthcare is here!',
    created_at: '2025-03-25T12:30:45.000Z',
    author_id: '12345'
  },
  {
    id: '0987654321',
    text: 'Frustrated with how much time I waste looking for my keys, wallet, and phone every morning. There has to be a better way!',
    created_at: '2025-03-24T09:15:32.000Z',
    author_id: '67890'
  },
  {
    id: '1122334455',
    text: 'Just finished a 5K run in the park. Wish there was an app that could connect me with other runners in my area with similar pace and goals!',
    created_at: '2025-03-23T16:20:18.000Z',
    author_id: '54321'
  },
  {
    id: '5544332211',
    text: 'Working remotely has its challenges. Hard to stay focused with so many distractions at home.',
    created_at: '2025-03-22T14:45:10.000Z',
    author_id: '09876'
  },
  {
    id: '9988776655',
    text: 'Learning a new language is tough. Would love a more engaging way to practice conversations than traditional apps offer.',
    created_at: '2025-03-21T11:05:22.000Z',
    author_id: '13579'
  }
];

// Get a random mock tweet
const getRandomMockTweet = () => {
  const randomIndex = Math.floor(Math.random() * mockTweets.length);
  return mockTweets[randomIndex];
};

module.exports = {
  mockTweets,
  getRandomMockTweet
};
