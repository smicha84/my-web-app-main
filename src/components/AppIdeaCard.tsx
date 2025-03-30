import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { AppIdea } from '../services/api';

interface AppIdeaCardProps {
  appIdea: AppIdea | null;
  loading: boolean;
  currentTweetText?: string;
}

/**
 * Dead-simple component that just shows the raw OpenAI response
 */
const AppIdeaCard: React.FC<AppIdeaCardProps> = ({ appIdea, loading }) => {
  // Loading state
  if (loading) {
    return (
      <Card sx={{ maxWidth: 800, width: '100%', my: 2 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Generating App Idea...
          </Typography>
          <Typography color="text.secondary">
            Please wait while we transform the tweet into an innovative app concept.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // No app idea state
  if (!appIdea) {
    return (
      <Card sx={{ maxWidth: 800, width: '100%', my: 2 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No App Idea Generated
          </Typography>
          <Typography color="text.secondary">
            Click "Generate App Idea" to create a concept based on the current tweet.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ maxWidth: 800, width: '100%', my: 2 }}>
      <CardContent>
        {/* App Info Section */}
        <Box sx={{ bgcolor: '#e1f5fe', p: 2, mb: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" component="div" fontWeight="bold">
            App Idea Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>App Idea ID:</strong> {appIdea.id || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Generated at:</strong> {appIdea.created_at || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>For Tweet:</strong> {appIdea.tweet_text || 'N/A'}
          </Typography>
        </Box>

        {/* RAW TEXT DISPLAY */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Raw OpenAI Response:  
        </Typography>
        
        <Box sx={{ 
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace', 
          bgcolor: '#f5f5f5', 
          p: 2, 
          borderRadius: 1,
          overflow: 'auto',
          maxHeight: '600px',
          border: '1px solid #ddd'
        }}>
          {appIdea.app_idea || 'No response available'}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppIdeaCard;
