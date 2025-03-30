import { useState, useEffect, useRef } from 'react';
import DiagnosticTest from './components/DiagnosticTest';
import { getMultipleTweets, getCachedTweets, generateAppIdea, getAllAppIdeas, getRateLimitStatus, AppIdea, Tweet, RateLimitInfo } from './services/api';
import PromptEditor from './components/PromptEditor';
import AppIdeaCard from './components/AppIdeaCard';

// Extended Tweet interface to include media
interface ExtendedTweet extends Tweet {
  media?: {
    type: string;
    url?: string;
    preview_image_url?: string;
    height?: number;
    width?: number;
  }[];
}

function App() {
  const [tweet, setTweet] = useState<ExtendedTweet | null>(null);
  const [isLoadingTweet, setIsLoadingTweet] = useState(false);
  const [appIdea, setAppIdea] = useState<AppIdea | null>(null);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<AppIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedPromptId, setSelectedPromptId] = useState<number | undefined>(undefined);
  
  // New state for multiple tweets functionality
  const [tweets, setTweets] = useState<ExtendedTweet[]>([]);
  const [currentTweetIndex, setCurrentTweetIndex] = useState(0);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const rateLimitTimerRef = useRef<number | null>(null);
  
  // State for the current time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const clockTimerRef = useRef<number | null>(null);
  
  // State for the countdown display
  const [remainingTimeDisplay, setRemainingTimeDisplay] = useState<number>(0);

  // State to track if we're currently refreshing the API status
  const [isRefreshingApi, setIsRefreshingApi] = useState(false);
  
  // Function to fetch rate limit status with visual feedback
  const fetchRateLimitStatus = async () => {
    setIsRefreshingApi(true); // Start loading state
    setError(null); // Clear any previous errors
    
    try {
      console.log('Frontend: Manually refreshing rate limit status...');
      // Force a non-cached request
      const status = await getRateLimitStatus();
      setRateLimit(status);
      console.log('Rate limit status updated successfully:', status);
    } catch (error: any) {
      console.error('Error fetching rate limit status:', error);
      // Show the error to the user
      setError(`Failed to refresh API status: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRefreshingApi(false); // End loading state
    }
  };
  
  // Start polling for rate limit updates
  const startRateLimitPolling = () => {
    // Clear existing timer if any
    if (rateLimitTimerRef.current) {
      window.clearInterval(rateLimitTimerRef.current);
    }
    
    // Initial fetch
    fetchRateLimitStatus();
    
    // Set up interval - check every 15 seconds
    rateLimitTimerRef.current = window.setInterval(() => {
      fetchRateLimitStatus();
    }, 15000);
  };

  // Update the clock every second
  const startClock = () => {
    // Update immediately
    setCurrentTime(new Date());
    
    // Update every second
    clockTimerRef.current = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
  };
  
  // Format time to HH:MM:SS
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Update the remaining time countdown every second when rate limited
  useEffect(() => {
    if (!rateLimit) return;
    
    // Initialize with the server-provided remaining time
    setRemainingTimeDisplay(rateLimit.remainingTime);
    
    // Only set up countdown if we're rate limited
    if (rateLimit.limited) {
      const countdownTimer = window.setInterval(() => {
        setRemainingTimeDisplay(prev => {
          if (prev <= 1) {
            // Time's up - trigger a new rate limit status check
            fetchRateLimitStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => window.clearInterval(countdownTimer);
    }
  }, [rateLimit]);

  // Fetch saved ideas and start rate limit polling when the app loads
  useEffect(() => {
    const fetchSavedIdeas = async () => {
      try {
        setIsLoadingIdeas(true);
        const response = await getAllAppIdeas();
        setSavedIdeas(response);
      } catch (err) {
        console.error('Error loading saved ideas:', err);
      } finally {
        setIsLoadingIdeas(false);
      }
    };

    fetchSavedIdeas();
    startRateLimitPolling();
    startClock();
    
    // Clean up timers on component unmount
    return () => {
      if (rateLimitTimerRef.current) {
        window.clearInterval(rateLimitTimerRef.current);
      }
      if (clockTimerRef.current) {
        window.clearInterval(clockTimerRef.current);
      }
    };
  }, []);

  // The original handleFetchTweet function has been replaced with handleFetchTweets
  // which provides multiple tweets with rate limit information

  // State to track tweet source (API or cache)
  const [tweetSource, setTweetSource] = useState<string | undefined>(undefined);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | undefined>(undefined);

  // Function to fetch multiple tweets from the API
  const handleFetchTweets = async () => {
    try {
      // CRITICAL: Clear all existing app ideas when fetching new tweets
      setAppIdea(null);
      setSavedIdeas([]);
      
      setError(null);
      setIsLoadingTweet(true);
      console.log('%c FETCHING NEW TWEETS - CLEARING ALL IDEAS', 'color: red; font-weight: bold; font-size: 16px');
      const response = await getMultipleTweets();
      console.log(`App: Successfully received ${response.tweets.length} tweets`);
      
      // Store tweets in state
      const fetchedTweets = response.tweets as ExtendedTweet[];
      setTweets(fetchedTweets);
      setRateLimit(response.rateLimit);
      setCurrentTweetIndex(0); // Reset to first tweet
      setTweetSource(response.source);
      setCacheTimestamp(response.cacheTimestamp);
      
      // CRITICAL: Set the tweet state to the EXACT reference from the array
      if (fetchedTweets.length > 0) {
        console.log('Setting initial tweet:', fetchedTweets[0].text);
        setTweet(fetchedTweets[0]);
      } else {
        setTweet(null);
      }
    } catch (err: any) {
      console.error('App: Error fetching tweets:', err);
      
      // Check if it's a rate limit error
      if (err.isRateLimit || err.response?.status === 429) {
        const resetTime = err.rateLimit?.resetTime || 0;
        const resetDate = new Date(resetTime * 1000);
        const resetInMinutes = Math.ceil((resetTime - Math.floor(Date.now() / 1000)) / 60);
        
        setError(`Twitter API rate limit exceeded. Resets in ${resetInMinutes} minutes (${resetDate.toLocaleTimeString()}).`);
        setRateLimit(err.rateLimit || {
          limited: true,
          resetTime: Math.floor(Date.now() / 1000) + 900,
          remainingTime: 900,
          remainingRequests: 0
        });
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Twitter API authentication error. Please check your API credentials.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Network may be slow or server unresponsive.');
      } else {
        setError(`Failed to fetch tweets: ${err.message || 'Unknown error'}. Please try again.`);
      }
      
      setTweets([]);
      setTweet(null);
    } finally {
      setIsLoadingTweet(false);
    }
  };
  
  // Function to fetch tweets from cache without hitting the API
  const handleFetchCachedTweets = async () => {
    try {
      // CRITICAL: Clear all existing app ideas when fetching cached tweets too
      setAppIdea(null);
      setSavedIdeas([]);
      
      setError(null);
      setIsLoadingTweet(true);
      console.log('%c FETCHING CACHED TWEETS - CLEARING ALL IDEAS', 'color: red; font-weight: bold; font-size: 16px');
      const response = await getCachedTweets();
      console.log(`App: Successfully received ${response.tweets.length} cached tweets`);
      
      // Use a consistent approach - store in a local variable first
      const cachedTweets = response.tweets as ExtendedTweet[];
      setTweets(cachedTweets);
      setRateLimit(response.rateLimit);
      setCurrentTweetIndex(0); // Reset to first tweet
      setTweetSource(response.source);
      setCacheTimestamp(response.cacheTimestamp);
      
      // CRITICAL: Set the tweet state to the EXACT reference from the array
      if (cachedTweets.length > 0) {
        console.log('Setting initial cached tweet:', cachedTweets[0].text);
        setTweet(cachedTweets[0]);
      } else {
        setTweet(null);
      }
    } catch (err: any) {
      console.error('App: Error fetching cached tweets:', err);
      setError(`Failed to fetch cached tweets: ${err.message || 'Unknown error'}. Cache may be empty.`);
      setTweets([]);
      setTweet(null);
    } finally {
      setIsLoadingTweet(false);
    }
  };
  
  // Navigation functions for tweet slideshow
  const goToNextTweet = () => {
    if (tweets.length === 0) return;
    const nextIndex = (currentTweetIndex + 1) % tweets.length;
    setCurrentTweetIndex(nextIndex);
    
    // Set the tweet state to the EXACT object from the tweets array to maintain reference integrity
    const nextTweet = tweets[nextIndex];
    setTweet(nextTweet);
    
    // Clear any existing app idea when changing tweets
    setAppIdea(null);
    console.log('Navigated to next tweet:', nextTweet.text);
  };
  
  const goToPreviousTweet = () => {
    if (tweets.length === 0) return;
    const prevIndex = (currentTweetIndex - 1 + tweets.length) % tweets.length;
    setCurrentTweetIndex(prevIndex);
    
    // Set the tweet state to the EXACT object from the tweets array to maintain reference integrity
    const prevTweet = tweets[prevIndex];
    setTweet(prevTweet);
    
    // Clear any existing app idea when changing tweets
    setAppIdea(null);
    console.log('Navigated to previous tweet:', prevTweet.text);
  };
  
  // Helper to format time remaining until rate limit reset
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Final comprehensive solution that ensures correct tweet synchronization
  const handleGenerateIdea = async () => {
    console.log('%c STARTING APP IDEA GENERATION', 'background-color: red; color: white; font-size: 16px; font-weight: bold; padding: 5px');
    console.log('Current state: tweets.length =', tweets.length, 'currentTweetIndex =', currentTweetIndex);
    
    if (tweets.length === 0) {
      const errorMessage = 'No tweets available. Please fetch tweets first.';  
      console.error(errorMessage);
      setError(errorMessage);
      return;
    }
    
    // EXPLICITLY get the tweet directly from the tweets array using the current index
    // This is the ONLY source of truth we should be using
    const tweetToUse = tweets[currentTweetIndex]; 
    
    // Validate tweet exists and has text
    if (!tweetToUse || !tweetToUse.text) {
      const errorMessage = `Invalid tweet at index ${currentTweetIndex}.`;
      console.error(errorMessage, { tweetToUse });
      setError(errorMessage);
      return;
    }

    try {
      // Clear all state first
      setAppIdea(null);
      setError(null);
      setIsGeneratingIdea(true);
      
      // Capture tweet information explicitly
      const tweetIndex = currentTweetIndex;
      const tweetId = tweetToUse.id;
      const rawTweetText = tweetToUse.text;
      
      // Print critical debugging info
      console.log('%c TWEET BEING USED FOR GENERATION:', 'background-color: blue; color: white; font-weight: bold');
      console.log(`Index: ${tweetIndex} | ID: ${tweetId}`);
      console.log(`Text: "${rawTweetText}"`);
      
      // Create unique request identifier to prevent caching
      const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Combine with tweet text to create a guaranteed unique input
      const cacheBustingText = `${rawTweetText} [UNIQUE:${nonce}]`;
      
      console.log('%c SENDING API REQUEST WITH TEXT:', 'background-color: purple; color: white');
      console.log(cacheBustingText);
      
      // Make API call with the unique text
      console.log(`Making API call at ${new Date().toISOString()}`);
      const result = await generateAppIdea(cacheBustingText, selectedPromptId);
      
      // Create a fresh result object
      console.log('API call succeeded, creating clean result object');
      // CRITICAL: The tweet_text property MUST match the current tweet text
      // This is the property that AppIdeaCard uses to verify tweet match
      const freshResult = {
        ...result,
        id: Date.now(), // Using a number to satisfy the type constraint
        tweet_text: rawTweetText, // CRITICAL: This is the field AppIdeaCard uses for validation
        source_tweet_index: tweetIndex,
        source_tweet_id: tweetId,
        generation_timestamp: new Date().toISOString()
      };
      
      console.log('%c APP IDEA GENERATED SUCCESSFULLY', 'background-color: green; color: white; font-weight: bold');
      console.log('Result:', freshResult);
      
      // Update app state
      setAppIdea(freshResult);
      
      // Replace saved ideas collection entirely
      setSavedIdeas([freshResult]);
      
      // Also update the tweet reference to ensure they stay in sync
      // This step fixes any potential reference discrepancies
      setTweet(tweetToUse);
      
    } catch (err: any) {
      console.error('Error generating app idea:', err);
      setError(`Failed to generate an app idea: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  // Common button style
  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#1d9bf0',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '5px'
  };

  // Card style for tweets and ideas
  const cardStyle = {
    padding: '15px',
    margin: '15px 0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: 'white'
  };

  // Tab style
  const tabStyle = (isActive: boolean) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#1d9bf0' : '#f1f1f1',
    color: isActive ? 'white' : 'black',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    margin: '0 5px'
  });

  // Add a flag to show diagnostics
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Show diagnostic test if the flag is true
  if (showDiagnostics) {
    return (
      <div style={{ padding: '20px' }}>
        <DiagnosticTest />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#1d9bf0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setShowDiagnostics(false)}
          >
            Continue to Main App
          </button>
        </div>
      </div>
    );
  }

  // The regular app UI
  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#1d9bf0' }}>Tweet to App Idea Generator</h1>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <p>This app generates creative app ideas based on tweets from your Twitter/X feed.</p>
        
        {/* API Status section with clock and rate limit */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {/* Official clock */}
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center'
          }}>
            🕒 {formatTime(currentTime)}
          </div>
          
          {/* Manual Refresh Button with loading state */}
          <button 
            onClick={fetchRateLimitStatus}
            disabled={isRefreshingApi}
            style={{
              backgroundColor: isRefreshingApi ? '#cccccc' : '#1d9bf0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: isRefreshingApi ? 'wait' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              opacity: isRefreshingApi ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {isRefreshingApi ? '⏳ Refreshing...' : '🔄 Refresh API Status'}
          </button>
          
          {/* Error message display */}
          {error && (
            <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '8px', padding: '4px 8px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          {/* Rate limit status monitor - Enhanced with more details */}
          <div style={{ 
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: rateLimit?.limited ? '#fff4e5' : '#e8f5e9',
            border: `1px solid ${rateLimit?.limited ? '#ffcc80' : '#a5d6a7'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.9rem',
            color: rateLimit?.limited ? '#e65100' : '#2e7d32',
            fontWeight: 'bold',
            minWidth: '300px'
          }}>
            {rateLimit ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{rateLimit.limited ? '⚠️ Rate Limited' : '✅ API Available'}</span>
                  {rateLimit.limited ? (
                    <span style={{ fontFamily: 'monospace' }}>Resets in {formatTimeRemaining(remainingTimeDisplay)}</span>
                  ) : (
                    <span style={{ fontFamily: 'monospace' }}>{rateLimit.remainingRequests} calls remaining</span>
                  )}
                </div>

                <div style={{ 
                  fontSize: '0.8rem',
                  fontWeight: 'normal',
                  borderTop: `1px dashed ${rateLimit.limited ? '#ffcc80' : '#a5d6a7'}`,
                  paddingTop: '6px',
                  marginTop: '2px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div><strong>Rate Limit Details:</strong></div>
                  <div>• Reset Time: {new Date(rateLimit.resetTime * 1000).toLocaleString()}</div>
                  <div>• Remaining Requests: {rateLimit.remainingRequests} of 15</div>
                  <div>• Rate Window: 15 minutes</div>
                  <div>• Reset Timestamp: {rateLimit.resetTime}</div>

                </div>
              </>
            ) : (
              '⏳ Checking API status...'
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <button 
          style={tabStyle(activeTab === 'generate')}
          onClick={() => setActiveTab('generate')}
        >
          Generate New Idea
        </button>
        <button 
          style={tabStyle(activeTab === 'saved')}
          onClick={() => setActiveTab('saved')}
        >
          Saved Ideas ({savedIdeas.length})
        </button>
      </div>

      {/* Error Messages */}
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffeeee', 
          border: '1px solid #ff5555',
          borderRadius: '4px',
          marginBottom: '15px',
          color: '#cc0000'
        }}>
          {error}
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div>
          <div style={{ 
            marginTop: '20px',
            padding: '20px', 
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h2>Step 1: Customize Prompt & Browse Tweets</h2>
            
            {/* Prompt Editor Component */}
            <div style={{ marginBottom: '20px' }}>
              <PromptEditor onSelectPrompt={setSelectedPromptId} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <button 
                style={buttonStyle}
                onClick={handleFetchTweets}
                disabled={isLoadingTweet}
              >
                {isLoadingTweet ? 'Loading...' : 'Fetch Tweets'}
              </button>
              <button 
                style={{...buttonStyle, backgroundColor: '#4db6ac'}}
                onClick={handleFetchCachedTweets}
                disabled={isLoadingTweet}
              >
                {isLoadingTweet ? 'Loading...' : 'Review Cache'}
              </button>
            </div>
            
            {/* Show a message when fetch was attempted but no tweets were found */}
            {!isLoadingTweet && tweets.length === 0 && (
              <div style={{ 
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                marginBottom: '15px',
                color: '#495057',
                textAlign: 'center'
              }}>
                <p>No tweets were found. This could be because:</p>
                <ul style={{ textAlign: 'left', paddingLeft: '30px' }}>
                  <li>Your Twitter timeline is currently empty</li>
                  <li>The API returned no results</li>
                  <li>There was an error retrieving tweets</li>
                </ul>
                <p>Try again later or check your API connection.</p>
              </div>
            )}
            
            {tweets.length > 0 && (
              <div style={cardStyle}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div>
                    <h3>Tweet Browser</h3>
                    {tweetSource && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: tweetSource === 'cache' ? '#4db6ac' : '#2196f3',
                        fontStyle: 'italic'
                      }}>
                        Source: {tweetSource === 'cache' ? 'Cache' : 'API'}
                        {cacheTimestamp && tweetSource === 'cache' && (
                          <span> (from {new Date(cacheTimestamp).toLocaleString()})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                      onClick={goToPreviousTweet}
                      disabled={tweets.length <= 1}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f1f1f1',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: tweets.length > 1 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      &lt; Previous
                    </button>
                    <span>
                      {currentTweetIndex + 1} of {tweets.length}
                    </span>
                    <button 
                      onClick={goToNextTweet}
                      disabled={tweets.length <= 1}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f1f1f1',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: tweets.length > 1 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
                <p style={{ 
                  padding: '10px', 
                  backgroundColor: '#f5f8fa', 
                  borderRadius: '4px',
                  border: '1px solid #e1e8ed'
                }}>
                  {tweet?.text}
                </p>
                
                {/* Display tweet images if available */}
                {tweet?.media && tweet.media.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    {tweet.media.map((media, index) => (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        {(media.type === 'photo' || media.type === 'animated_gif') && (
                          <img 
                            src={media.url || media.preview_image_url} 
                            alt="Tweet media" 
                            style={{ 
                              maxWidth: '100%', 
                              borderRadius: '8px',
                              border: '1px solid #e1e8ed'
                            }} 
                          />
                        )}
                        {media.type === 'video' && media.preview_image_url && (
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={media.preview_image_url} 
                              alt="Video thumbnail" 
                              style={{ 
                                maxWidth: '100%', 
                                borderRadius: '8px',
                                border: '1px solid #e1e8ed'
                              }} 
                            />
                            <div style={{ 
                              position: 'absolute', 
                              top: '50%', 
                              left: '50%', 
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: 'rgba(0,0,0,0.7)',
                              borderRadius: '50%',
                              width: '60px',
                              height: '60px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <div style={{ 
                                width: '0', 
                                height: '0', 
                                borderTop: '10px solid transparent',
                                borderBottom: '10px solid transparent',
                                borderLeft: '20px solid white',
                                marginLeft: '5px'
                              }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {tweet?.created_at && (
                  <p style={{ fontSize: '0.8rem', color: '#657786' }}>
                    Posted: {new Date(tweet.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: '20px',
            padding: '20px', 
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h2>Step 2: Generate App Idea</h2>
            <button 
              style={{
                ...buttonStyle,
                backgroundColor: tweet ? '#1d9bf0' : '#cccccc',
                cursor: tweet ? 'pointer' : 'not-allowed'
              }}
              onClick={handleGenerateIdea}
              disabled={!tweet || isGeneratingIdea}
            >
              {isGeneratingIdea ? 'Generating...' : 'Generate App Idea'}
            </button>
            
            {/* Use the dedicated AppIdeaCard component to show the raw app idea */}
            <AppIdeaCard 
              appIdea={appIdea} 
              loading={isGeneratingIdea} 
              currentTweetText={tweet?.text}
            />
          </div>
        </div>
      )}

      {/* Saved Ideas Tab */}
      {activeTab === 'saved' && (
        <div>
          <h2>Your Saved App Ideas</h2>
          {isLoadingIdeas ? (
            <p>Loading saved ideas...</p>
          ) : savedIdeas.length === 0 ? (
            <p>No saved ideas yet. Generate your first app idea!</p>
          ) : (
            savedIdeas.map(idea => {
              // Safely parse the JSON string from the database
              let parsedIdea;
              try {
                parsedIdea = typeof idea.app_idea === 'string'
                  ? JSON.parse(idea.app_idea)
                  : idea.app_idea;
              } catch (error) {
                console.error('Error parsing saved idea:', error);
                parsedIdea = { error: 'Could not parse idea data' };
              }
              
              // Handle different JSON structure formats
              const appName = parsedIdea.appName || parsedIdea.AppName || parsedIdea['App Name'] || 'Unnamed App';
              const tagline = parsedIdea.tagline || parsedIdea.Tagline || parsedIdea['Tagline'] || 'No tagline available';
              
              return (
                <div key={idea.id} style={{
                  ...cardStyle,
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ color: '#1d9bf0', margin: '0 0 10px 0' }}>{appName}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#657786', margin: '0' }}>
                      Created: {new Date(idea.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <p><em>"{tagline}"</em></p>
                  
                  <p><strong>Based on tweet:</strong></p>
                  <p style={{ 
                    padding: '10px', 
                    backgroundColor: '#f5f8fa', 
                    borderRadius: '4px',
                    border: '1px solid #e1e8ed',
                    fontSize: '0.9rem'
                  }}>
                    {idea.tweet_text}
                  </p>
                  
                  <button 
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#6e7c8c',
                      fontSize: '14px',
                      padding: '8px 15px'
                    }}
                    onClick={() => setActiveTab('generate')}
                  >
                    Generate New Idea
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default App;
