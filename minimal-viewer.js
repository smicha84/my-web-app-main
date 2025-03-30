// Bare minimum HTTP server with zero dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTML file content - all contained in a single file
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tweet-Idea Pairs Viewer</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
    h1 { color: #1d9bf0; }
    .pair { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 8px; background: white; }
    .tweet { background: #f5f8fa; padding: 10px; border-radius: 4px; border: 1px solid #e1e8ed; margin-bottom: 10px; }
    .idea { background: #f0f7ff; padding: 10px; border-radius: 4px; border: 1px solid #cfe2ff; white-space: pre-wrap; }
    .app-name { color: #0066cc; font-weight: bold; }
    .error { background: #ffeeee; padding: 15px; border-radius: 4px; color: #cc0000; }
    .loading { text-align: center; padding: 30px; }
  </style>
</head>
<body>
  <h1>Saved Tweet-Idea Pairs</h1>
  <div id="pairs-container" class="loading">Loading your saved pairs...</div>

  <script>
    const container = document.getElementById('pairs-container');
    
    // Fetch data from your existing API
    fetch('http://localhost:3002/api/pairs')
      .then(response => {
        if (!response.ok) {
          throw new Error(\`API error: \${response.status}\`);
        }
        return response.json();
      })
      .then(data => {
        if (!data || !data.length) {
          container.innerHTML = '<div>No saved pairs found</div>';
          return;
        }
        
        // Clear loading state
        container.className = '';
        container.innerHTML = \`<div>Found \${data.length} saved pairs</div>\`;
        
        // Render each pair
        data.forEach((pair, i) => {
          const div = document.createElement('div');
          div.className = 'pair';
          
          const tweetText = pair.tweet_text || 'No tweet text';
          
          // Extract app idea from the correct nested structure
          let appIdea = 'No app idea';
          let appName = '';
          
          if (pair.app_idea_json) {
            if (typeof pair.app_idea_json === 'string') {
              try {
                const parsed = JSON.parse(pair.app_idea_json);
                appIdea = parsed.app_idea || 'No app idea';
                appName = parsed.appName || '';
              } catch (e) {
                console.error('Failed to parse app_idea_json string:', e);
              }
            } else if (typeof pair.app_idea_json === 'object') {
              appIdea = pair.app_idea_json.app_idea || 'No app idea';
              appName = pair.app_idea_json.appName || '';
            }
          }
          
          div.innerHTML = \`
            <h3>Pair #\${i+1}</h3>
            <div class="tweet">\${tweetText}</div>
            <div class="idea">
              \${appName ? \`<div class="app-name">\${appName}</div>\` : ''}
              \${appIdea}
            </div>
          \`;
          
          container.appendChild(div);
        });
      })
      .catch(error => {
        container.innerHTML = \`
          <div class="error">
            <h3>Error</h3>
            <p>\${error.message}</p>
            <p>Make sure your backend API is running on port 3002</p>
          </div>
        \`;
        console.error('Error:', error);
      });
  </script>
</body>
</html>`;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Serve HTML
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(htmlContent);
});

// Start server on port 3456 (unlikely to conflict with anything)
const PORT = 3456;
server.listen(PORT, () => {
  console.log(`Minimal viewer running at: http://localhost:${PORT}`);
  console.log('This runs completely standalone and does not modify your existing app');
});
