import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, Divider, Paper, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';
import { getAllAppIdeas, AppIdea } from '../services/api';

const Ideas: React.FC = () => {
  const [ideas, setIdeas] = useState<AppIdea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const allIdeas = await getAllAppIdeas();
        setIdeas(allIdeas);
      } catch (err) {
        setError('Failed to load ideas. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const getAppNameFromIdea = (ideaText: string): string => {
    const nameMatch = ideaText.match(/App Name:([^\n]*)/);
    return nameMatch ? nameMatch[1].trim() : 'Unnamed App Idea';
  };

  const getConceptSummary = (ideaText: string): string => {
    const summaryMatch = ideaText.match(/Concept Summary:([^-]*)/);
    return summaryMatch ? summaryMatch[1].trim() : 'No summary available';
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Previous App Ideas
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Browse all your previously generated app ideas
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : ideas.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No app ideas found. Generate some ideas first!</Typography>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Typography color="primary" sx={{ mt: 1 }}>
              Go to Generator
            </Typography>
          </Link>
        </Paper>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {ideas.map((idea, index) => (
            <React.Fragment key={idea.id}>
              <Paper sx={{ mb: 2, overflow: 'hidden' }}>
                <ListItem 
                  alignItems="flex-start" 
                  component={Link} 
                  to={`/idea/${idea.id}`}
                  sx={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  <ListItemText
                    primary={getAppNameFromIdea(idea.app_idea)}
                    secondary={
                      <>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Based on tweet: {idea.tweet_text.length > 100 ? idea.tweet_text.substring(0, 100) + '...' : idea.tweet_text}
                        </Typography>
                        <Typography component="span" variant="body2">
                          {getConceptSummary(idea.app_idea)}
                        </Typography>
                        <Typography component="span" variant="caption" display="block" sx={{ mt: 1 }}>
                          Created: {new Date(idea.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </Paper>
              {index < ideas.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  );
};

export default Ideas;
