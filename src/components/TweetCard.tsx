import React from 'react';
import { Card, CardContent, Typography, Button, CircularProgress, Box } from '@mui/material';
import { Tweet } from '../services/api';

interface TweetCardProps {
  tweet: Tweet | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGenerate: () => void;
  generating: boolean;
}

const TweetCard: React.FC<TweetCardProps> = ({ 
  tweet, 
  loading, 
  error, 
  onRefresh, 
  onGenerate,
  generating
}) => {
  return (
    <Card sx={{ maxWidth: 600, width: '100%', mb: 3 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Latest Tweet
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="outlined" onClick={onRefresh}>
              Try Again
            </Button>
          </Box>
        ) : tweet ? (
          <>
            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              {tweet.text}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Generating App Idea...
                </>
              ) : (
                'Generate App Idea'
              )}
            </Button>
          </>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No tweets found. Try refreshing or check your Twitter API connection.
            </Typography>
            <Button variant="outlined" onClick={onRefresh}>
              Refresh
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TweetCard;
