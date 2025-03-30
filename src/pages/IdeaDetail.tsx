import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, Paper, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAppIdeaById, AppIdea } from '../services/api';
import AppIdeaCard from '../components/AppIdeaCard';

const IdeaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [idea, setIdea] = useState<AppIdea | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdea = async () => {
      if (!id) return;
      
      try {
        const fetchedIdea = await getAppIdeaById(parseInt(id));
        setIdea(fetchedIdea);
      } catch (err) {
        setError('Failed to load the app idea. It might not exist or has been removed.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIdea();
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !idea) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Button 
            component={Link} 
            to="/ideas"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 3 }}
          >
            Back to Ideas
          </Button>
          
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" gutterBottom>
              {error || 'App idea not found'}
            </Typography>
            <Typography>
              The app idea you're looking for could not be found.
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button 
          component={Link} 
          to="/ideas"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          Back to Ideas
        </Button>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Original Tweet</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {idea.tweet_text}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Generated on: {new Date(idea.created_at).toLocaleString()}
          </Typography>
        </Paper>
        
        <AppIdeaCard appIdea={idea} loading={false} />
      </Box>
    </Container>
  );
};

export default IdeaDetail;
