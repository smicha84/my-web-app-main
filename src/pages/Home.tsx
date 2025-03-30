import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Alert, Snackbar } from '@mui/material';
import TweetCard from '../components/TweetCard';
import AppIdeaCard from '../components/AppIdeaCard';
import { getLatestTweet, generateAppIdea, Tweet, AppIdea, forceResetTwitterRateLimits } from '../services/api';

const Home: React.FC = () => {
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [appIdea, setAppIdea] = useState<AppIdea | null>(null);
  const [generatingIdea, setGeneratingIdea] = useState<boolean>(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);
  
  // Rate limit reset states
  const [resettingRateLimit, setResettingRateLimit] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const fetchLatestTweet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const latestTweet = await getLatestTweet();
      setTweet(latestTweet);
    } catch (err) {
      setError('Failed to fetch the latest tweet. Please check your Twitter API connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAppIdea = async () => {
    if (!tweet) return;
    
    console.log('STARTING APP IDEA GENERATION - Tweet:', JSON.stringify(tweet, null, 2));
    setGeneratingIdea(true);
    setIdeaError(null);
    
    try {
      // STEP 1: Send tweet text to backend
      console.log('SENDING TO BACKEND:', tweet.text);
      const idea = await generateAppIdea(tweet.text);
      
      // STEP 2: Decode what came back exactly
      console.log('RAW RESPONSE FROM BACKEND:', JSON.stringify(idea, null, 2));
      console.log('APP IDEA TYPE:', typeof idea);
      console.log('HAS APP_IDEA PROPERTY:', idea && 'app_idea' in idea);
      console.log('APP_IDEA TYPE:', idea && idea.app_idea ? typeof idea.app_idea : 'undefined/null');
      
      // STEP 3: Force correction if needed
      if (idea && typeof idea !== 'object') {
        console.error('CRITICAL ERROR: Response is not an object');
      } else if (idea && (!idea.app_idea || typeof idea.app_idea !== 'string')) {
        console.error('CRITICAL ERROR: app_idea missing or not a string', idea);
      }
      
      // STEP 4: Set state with whatever we got
      setAppIdea(idea);
      console.log('FINAL APP IDEA SET TO STATE:', JSON.stringify(idea, null, 2));
    } catch (err) {
      console.error('ERROR GENERATING APP IDEA:', err);
      setIdeaError('Failed to generate app idea. Please try again.');
    } finally {
      setGeneratingIdea(false);
    }
  };

  // Force reset the Twitter rate limits
  const handleForceResetRateLimit = async () => {
    setResettingRateLimit(true);
    try {
      const result = await forceResetTwitterRateLimits();
      console.log('Rate limit reset result:', result);
      setResetSuccess(true);
      // Try to fetch tweets again after rate limit reset
      setTimeout(() => fetchLatestTweet(), 1000);
    } catch (err) {
      console.error('Failed to reset rate limits:', err);
      setError('Failed to reset Twitter rate limits. Please try again later.');
    } finally {
      setResettingRateLimit(false);
    }
  };
  
  // Close the success notification
  const handleCloseResetNotification = () => {
    setResetSuccess(false);
  };

  useEffect(() => {
    fetchLatestTweet();
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Tweet to App Idea Generator
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Transform tweets into creative, non-boring app ideas using AI
        </Typography>
        
        {/* Force reset button for rate limits */}
        {error && error.includes('rate limit') && (
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleForceResetRateLimit}
            disabled={resettingRateLimit}
            sx={{ mt: 2, mb: 2 }}
          >
            {resettingRateLimit ? 'Resetting Rate Limits...' : 'Force Reset Twitter Rate Limits'}
          </Button>
        )}
      </Box>
      
      {/* Success notification */}
      <Snackbar open={resetSuccess} autoHideDuration={6000} onClose={handleCloseResetNotification}>
        <Alert onClose={handleCloseResetNotification} severity="success" sx={{ width: '100%' }}>
          Twitter rate limits successfully reset! Try fetching tweets now.
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <TweetCard
          tweet={tweet}
          loading={loading}
          error={error}
          onRefresh={fetchLatestTweet}
          onGenerate={handleGenerateAppIdea}
          generating={generatingIdea}
        />
        
        {ideaError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {ideaError}
          </Typography>
        )}
        
        <AppIdeaCard appIdea={appIdea} loading={generatingIdea} />
      </Box>
    </Container>
  );
};

export default Home;
