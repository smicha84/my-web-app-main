const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tweetIdeas.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create the ideas table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_text TEXT NOT NULL,
      tweet_created_at TEXT,
      app_idea TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating ideas table:', err.message);
      } else {
        console.log('Ideas table is ready.');
      }
    });
    
    // Create the prompts table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating prompts table:', err.message);
      } else {
        console.log('Prompts table is ready.');
        
        // Check if we need to insert the default prompt
        db.get("SELECT * FROM prompts WHERE is_default = 1", (err, row) => {
          if (err) {
            console.error('Error checking for default prompt:', err.message);
          } else if (!row) {
            // Insert the default prompt if it doesn't exist
            const defaultPrompt = `
Generate a creative mobile app idea based on the following tweet:
"{{tweet}}"

Please provide the following in your response:
1. App Name: A catchy name for the app
2. Tagline: A brief, memorable description (20 words or less)
3. Description: A short description of what the app does (100 words or less)
4. Key Features: List 3-5 key features of the app
5. Target Audience: Who would use this app
6. Potential Monetization: How could this app make money

Format the response as JSON without any additional text.
`;
            
            db.run(`INSERT INTO prompts (name, content, is_default) VALUES (?, ?, 1)`, 
              ['Default Prompt', defaultPrompt], 
              (err) => {
                if (err) {
                  console.error('Error inserting default prompt:', err.message);
                } else {
                  console.log('Default prompt inserted successfully.');
                }
              }
            );
          }
        });
      }
    });
  }
});

module.exports = db;
