import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import TwitterIcon from '@mui/icons-material/Twitter';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TwitterIcon sx={{ mr: 1 }} />
          <span>Tweet to App Idea</span>
        </Typography>
        
        <Box>
          <Button 
            component={Link} 
            to="/" 
            color="inherit" 
            startIcon={<TwitterIcon />}
            sx={{ 
              mr: 2,
              fontWeight: location.pathname === '/' ? 'bold' : 'normal',
              textDecoration: location.pathname === '/' ? 'underline' : 'none'
            }}
          >
            Generator
          </Button>
          
          <Button 
            component={Link} 
            to="/ideas" 
            color="inherit"
            startIcon={<LightbulbIcon />}
            sx={{ 
              fontWeight: location.pathname === '/ideas' ? 'bold' : 'normal',
              textDecoration: location.pathname === '/ideas' ? 'underline' : 'none'
            }}
          >
            App Ideas
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
