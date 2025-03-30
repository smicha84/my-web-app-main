import axios from 'axios';
import { ENDPOINTS } from '../config';

// Types
export interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  attachments?: {
    media_keys: string[];
  };
  media?: {
    type: string;
    url?: string;
    preview_image_url?: string;
    height?: number;
    width?: number;
    media_key?: string;
  }[];
}

export interface Prompt {
  id?: number;
  name: string;
  content: string;
  is_default?: boolean;
  created_at?: string;
}

export interface AppIdea {
  id: number;
  tweet_text: string;
  app_idea: string;
  created_at: string;
  
  // Structured fields parsed from app_idea string
  appName?: string;
  tagline?: string;
  description?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  monetization?: string;
  uniqueValue?: string;
}

export interface RateLimitInfo {
  limited: boolean;
  resetTime: number;
  remainingTime: number;
  remainingRequests: number;
}

export interface TweetsResponse {
  tweets: Tweet[];
  rateLimit: RateLimitInfo;
  source?: string;
  cacheTimestamp?: string;
}

// Twitter API - Single tweet (legacy)
export const getLatestTweet = async (): Promise<Tweet> => {
  try {
    console.log('Frontend: Requesting latest tweet from:', ENDPOINTS.TWITTER.LATEST);
    const response = await axios.get(ENDPOINTS.TWITTER.LATEST, {
      // Add timestamp to prevent caching issues
      params: { _t: new Date().getTime() },
      // Increase timeout to handle potential network delays
      timeout: 15000
    });
    
    console.log('Frontend: Received response:', response.status, response.statusText);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('Frontend: Successfully parsed tweet data, ID:', response.data.data.id);
      return response.data.data;
    } else {
      console.error('Frontend: Invalid response format:', response.data);
      throw new Error('Invalid response format from Twitter API');
    }
  } catch (error: any) {
    // More detailed error logging
    console.error('Frontend: Error fetching latest tweet:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Get rate limit status only
export const getRateLimitStatus = async (): Promise<RateLimitInfo> => {
  try {
    console.log('Frontend: Requesting rate limit status from:', ENDPOINTS.TWITTER.RATE_LIMIT);
    const response = await axios.get(ENDPOINTS.TWITTER.RATE_LIMIT, {
      // Add timestamp to prevent caching issues
      params: { _t: new Date().getTime() },
      // Use shorter timeout since this is a lightweight call
      timeout: 5000
    });
    
    console.log('Frontend: Received rate limit status:', response.status, response.statusText);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('Frontend: Successfully parsed rate limit data');
      return response.data.data;
    } else {
      console.error('Frontend: Invalid response format for rate limit:', response.data);
      throw new Error('Invalid response format from Twitter API');
    }
  } catch (error: any) {
    // More detailed error logging
    console.error('Frontend: Error fetching rate limit status:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Get multiple tweets with rate limit info
export const getMultipleTweets = async (): Promise<TweetsResponse> => {
  try {
    console.log('Frontend: Requesting multiple tweets from:', ENDPOINTS.TWITTER.TWEETS);
    const response = await axios.get(ENDPOINTS.TWITTER.TWEETS, {
      // Add timestamp to prevent caching issues
      params: { _t: new Date().getTime() },
      // Increase timeout to handle potential network delays
      timeout: 15000
    });
    
    console.log('Frontend: Received response:', response.status, response.statusText);
    
    if (response.data && response.data.success && response.data.data) {
      const { tweets, rateLimit, source, cacheTimestamp } = response.data.data;
      console.log(`Frontend: Successfully parsed ${tweets.length} tweets and rate limit info`);
      return { tweets, rateLimit, source, cacheTimestamp };
    } else {
      console.error('Frontend: Invalid response format:', response.data);
      throw new Error('Invalid response format from Twitter API');
    }
  } catch (error: any) {
    // Handle rate limit errors specifically
    if (error.response?.status === 429) {
      const rateLimit = error.response.data?.rateLimit || {
        limited: true,
        resetTime: Math.floor(Date.now() / 1000) + 900,
        remainingTime: 900,
        remainingRequests: 0
      };
      
      throw {
        ...error,
        isRateLimit: true,
        rateLimit
      };
    }
    
    // More detailed error logging
    console.error('Frontend: Error fetching multiple tweets:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Force reset the Twitter rate limits when stuck
export const forceResetTwitterRateLimits = async (): Promise<RateLimitInfo> => {
  try {
    console.log('Frontend: Forcing reset of Twitter rate limits:', ENDPOINTS.TWITTER.FORCE_RESET);
    const response = await axios.post(ENDPOINTS.TWITTER.FORCE_RESET);
    
    console.log('Frontend: Rate limits reset response:', response.status, response.statusText);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('Frontend: Successfully reset rate limits:', response.data.data);
      return response.data.data;
    } else {
      console.error('Frontend: Invalid force reset response format:', response.data);
      throw new Error('Invalid response format from force reset endpoint');
    }
  } catch (error: any) {
    console.error('Frontend: Error resetting rate limits:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Get cached tweets without hitting the Twitter API
export const getCachedTweets = async (): Promise<TweetsResponse> => {
  try {
    console.log('Frontend: Requesting cached tweets');
    const response = await axios.get(ENDPOINTS.TWITTER.BASE + '/cached-tweets', {
      // Add timestamp to prevent browser caching
      params: { _t: new Date().getTime() },
      timeout: 10000
    });
    
    console.log('Frontend: Received cached tweets response:', response.status, response.statusText);
    
    if (response.data && response.data.success && response.data.data) {
      const { tweets, rateLimit, source, cacheTimestamp } = response.data.data;
      console.log(`Frontend: Successfully parsed ${tweets.length} cached tweets from ${cacheTimestamp || 'unknown time'}`);
      return { tweets, rateLimit, source, cacheTimestamp };
    } else {
      console.error('Frontend: Invalid cached tweets response format:', response.data);
      throw new Error('Invalid response format from cached tweets endpoint');
    }
  } catch (error: any) {
    // More detailed error logging
    console.error('Frontend: Error fetching cached tweets:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// App Ideas API
export const generateAppIdea = async (tweetText: string, promptId?: number): Promise<AppIdea> => {
  try {
    console.log('📊 API CALL: generateAppIdea with tweet:', tweetText);
    console.log('📊 ENDPOINT:', ENDPOINTS.IDEAS.GENERATE);
    
    // Create a proper tweet object as expected by the backend
    const fakeTweet = {
      id: 'frontend-generated-' + Date.now(),
      text: tweetText,
      created_at: new Date().toISOString()
    };
    
    console.log('📊 REQUEST BODY:', { tweet: fakeTweet, promptId });
    
    // Make the API call
    const response = await axios.post(ENDPOINTS.IDEAS.GENERATE, { tweet: fakeTweet, promptId });
    
    // Log raw response for debugging
    console.log('📊 RAW RESPONSE STATUS:', response.status);
    console.log('📊 RAW RESPONSE DATA:', JSON.stringify(response.data, null, 2));
    
    if (!response.data) {
      console.error('❌ CRITICAL ERROR: Response has no data');
      throw new Error('Empty response from server');
    }
    
    if (!response.data.success) {
      console.error('❌ SERVER ERROR:', response.data.error || 'Unknown error');
      throw new Error(response.data.error || 'Server reported failure');
    }
    
    if (!response.data.data) {
      console.error('❌ MISSING DATA: Response success=true but no data field');
      throw new Error('Missing data field in response');
    }
    
    // Extract the app idea from the response
    const appIdeaData = response.data.data;
    console.log('📊 EXTRACTED APP IDEA DATA:', JSON.stringify(appIdeaData, null, 2));
    console.log('📊 DATA TYPE:', typeof appIdeaData);
    console.log('📊 DATA KEYS:', Object.keys(appIdeaData));
    
    // Check for different response structures
    if (appIdeaData.appIdea) {
      console.log('📊 FOUND NESTED appIdea PROPERTY');
      console.log('📊 appIdea TYPE:', typeof appIdeaData.appIdea);
      
      // Parse app idea field if needed
      let appIdeaObj = appIdeaData.appIdea;
      
      // Convert the app idea to a string if it's not already
      const appIdeaString = typeof appIdeaObj === 'string' 
        ? appIdeaObj 
        : JSON.stringify(appIdeaObj);
      
      console.log('📊 RETURNING NESTED STRUCTURE');
      return {
        id: appIdeaData.id || 0,
        tweet_text: appIdeaData.tweet?.text || '',
        app_idea: appIdeaString,
        created_at: new Date().toISOString()
      };
    }
    
    if (appIdeaData.app_idea) {
      console.log('📊 FOUND DIRECT app_idea PROPERTY');
      console.log('📊 app_idea TYPE:', typeof appIdeaData.app_idea);
      console.log('📊 RETURNING DIRECT STRUCTURE');
      
      // Parse the app_idea string into structured format
      const appIdeaStr = appIdeaData.app_idea;
      console.log('🔍 FULL APP IDEA STRING:\n', appIdeaStr);
      
      // Simple direct string extraction based on exact format from API
      // Extract string between two markers (or end of string)
      const getSection = (text: string, marker: string, endMarkers: string[] = []): string | null => {
        try {
          // Exact match for section name with newline  
          const startIdx = text.indexOf(marker + ':');
          if (startIdx === -1) return null;
          
          // Find the content start (after the colon and whitespace)
          const contentStartIdx = startIdx + marker.length + 1;
          let contentEndIdx = text.length;
          
          // Find the earliest end marker after the start position
          for (const endMarker of endMarkers) {
            const markerIdx = text.indexOf('\n' + endMarker + ':', contentStartIdx);
            if (markerIdx !== -1 && markerIdx < contentEndIdx) {
              contentEndIdx = markerIdx;
            }
          }
          
          // Extract the content
          const content = text.substring(contentStartIdx, contentEndIdx).trim();
          console.log(`✅ Extracted "${marker}": ${content.length > 30 ? content.substring(0, 30) + '...' : content}`);
          return content;
        } catch (err) {
          console.error(`❌ Error extracting section ${marker}:`, err);
          return null;
        }
      };
      
      // Get all possible section headers in the text
      const getSectionHeaders = (text: string): string[] => {
        const lines = text.split('\n');
        return lines
          .filter(line => line.includes(':')) 
          .map(line => {
            const colonIdx = line.indexOf(':');
            return colonIdx > 0 ? line.substring(0, colonIdx).trim() : null;
          })
          .filter(Boolean) as string[];
      };
      
      // Get all section names from the app idea
      const sectionNames = getSectionHeaders(appIdeaStr);
      console.log('📋 Found sections:', sectionNames);
      
      // Define all possible section names for each field
      const allSections = sectionNames.filter(name => name !== '');
      
      // Extract each section directly using the actual section names
      const appNameMatch = getSection(appIdeaStr, 'App Name', allSections);
      
      // Try different names for tagline
      const taglineMatch = 
        getSection(appIdeaStr, 'Concept Summary', allSections) || 
        getSection(appIdeaStr, 'Tagline', allSections);
      
      // Try different names for description
      const descriptionMatch = 
        getSection(appIdeaStr, 'Detailed Description', allSections) || 
        getSection(appIdeaStr, 'Description', allSections);
      
      // Try different names for features
      const featuresText = 
        getSection(appIdeaStr, 'Core Features', allSections) || 
        getSection(appIdeaStr, 'Key Features', allSections) || 
        getSection(appIdeaStr, 'Features', allSections);
      
      // Try different names for audience
      const audienceMatch = 
        getSection(appIdeaStr, 'Target Users', allSections) || 
        getSection(appIdeaStr, 'Target Audience', allSections);
      
      // Try different names for monetization
      const monetizationMatch = 
        getSection(appIdeaStr, 'Monetization', allSections) || 
        getSection(appIdeaStr, 'Revenue Model', allSections);
      
      // Try different names for unique value
      const reasonMatch = 
        getSection(appIdeaStr, "Why It's Not Boring", allSections) || 
        getSection(appIdeaStr, 'Unique Value', allSections);
      
      // Extract features as array with more robust parsing
      let keyFeatures: string[] = [];
      if (featuresText) {
        console.log('📋 FEATURES TEXT RAW:\n', featuresText);
        
        // Split by newlines and clean each line
        const lines = featuresText.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
        
        // Process each line to extract bullet points
        for (const line of lines) {
          // Remove bullet points, dashes, or numbered lists
          const cleaned = line.replace(/^[-•*]\s*|^\d+\.\s*|^\(\d+\)\s*/g, '').trim();
          if (cleaned) {
            keyFeatures.push(cleaned);
          }
        }
        
        console.log('📋 PARSED FEATURES:', keyFeatures);
      }
      
      // Create structured app idea object with proper fallbacks and DEBUGGABLE OUTPUT
      const structuredAppIdea = {
        id: appIdeaData.id,
        tweet_text: appIdeaData.tweet_text,
        created_at: appIdeaData.created_at,
        app_idea: appIdeaStr,  // Keep original string too
        
        // Parsed fields for UI components - MUST BE EXPLICITLY DEFINED IN AppIdea INTERFACE
        appName: appNameMatch || "App Name Not Available",
        tagline: taglineMatch || "Tagline Not Available",
        description: descriptionMatch || "Description Not Available",
        keyFeatures: keyFeatures.length > 0 ? keyFeatures : [],
        targetAudience: audienceMatch || "Target Audience Not Available",
        monetization: monetizationMatch || "Monetization Not Available",
        uniqueValue: reasonMatch || "Unique Value Not Available"
      };
      
      // CRITICAL: Make a copy to ensure the object is fully updated before return
      const result = {...structuredAppIdea};
      
      console.log('⚠️ FINAL OBJECT OUTPUT ⚠️');
      console.log(JSON.stringify(result, null, 2));
      
      // THIS IS THE OBJECT THAT WILL BE DISPLAYED - make sure all fields are present
      return result;
    }
    
    console.error('❌ UNKNOWN DATA STRUCTURE:', appIdeaData);
    throw new Error('Unknown response data structure');
  } catch (error) {
    console.error('Error generating app idea:', error);
    throw error;
  }
};

export const getAllAppIdeas = async (): Promise<AppIdea[]> => {
  try {
    const response = await axios.get(ENDPOINTS.IDEAS.GET_ALL);
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      throw new Error('Invalid response format from get all ideas API');
    }
  } catch (error) {
    console.error('Error fetching app ideas:', error);
    throw error;
  }
};

export const getAppIdeaById = async (id: number): Promise<AppIdea> => {
  try {
    const response = await axios.get(ENDPOINTS.IDEAS.GET_BY_ID(id));
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(`Invalid response format from get idea by id API for id ${id}`);
    }
  } catch (error) {
    console.error(`Error fetching app idea with id ${id}:`, error);
    throw error;
  }
};

// Prompt API calls
export const getPrompts = async (): Promise<Prompt[]> => {
  try {
    const response = await axios.get(ENDPOINTS.PROMPTS.GET_ALL);
    return response.data;
  } catch (error) {
    console.error('Error fetching prompts:', error);
    throw error;
  }
};

export const getDefaultPrompt = async (): Promise<Prompt> => {
  try {
    const response = await axios.get(ENDPOINTS.PROMPTS.DEFAULT);
    return response.data;
  } catch (error) {
    console.error('Error fetching default prompt:', error);
    throw error;
  }
};

export const getPrompt = async (id: number): Promise<Prompt> => {
  try {
    const response = await axios.get(ENDPOINTS.PROMPTS.GET_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching prompt with id ${id}:`, error);
    throw error;
  }
};

export const createPrompt = async (prompt: Prompt): Promise<Prompt> => {
  try {
    const response = await axios.post(ENDPOINTS.PROMPTS.CREATE, prompt);
    return response.data;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
};

export const updatePrompt = async (id: number, prompt: Prompt): Promise<Prompt> => {
  try {
    const response = await axios.put(ENDPOINTS.PROMPTS.UPDATE(id), prompt);
    return response.data;
  } catch (error) {
    console.error(`Error updating prompt with id ${id}:`, error);
    throw error;
  }
};

export const deletePrompt = async (id: number): Promise<void> => {
  try {
    await axios.delete(ENDPOINTS.PROMPTS.DELETE(id));
  } catch (error) {
    console.error(`Error deleting prompt with id ${id}:`, error);
    throw error;
  }
};
