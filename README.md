# Tweet to App Idea Generator

A web application that takes tweets and generates app ideas based on them, with a dedicated viewer for saved tweet-idea pairs.

## Project Structure

- **Frontend**: React application with Material UI components
- **Backend**: Node.js Express server with API endpoints
- **Standalone Viewer**: Dedicated page for viewing saved tweet-idea pairs

## Features

- Generate app ideas from tweets
- Save tweet-idea pairs
- View saved pairs in a dedicated viewer
- Dark/light mode support

## Setup

1. Install dependencies:
```bash
npm install
cd backend && npm install
```

2. Start backend server:
```bash
cd backend && node index.js
```

3. Start frontend:
```bash
npm start
```

4. Access the application:
- Main app: http://localhost:3001
- Pairs viewer: http://localhost:3001/pairs-viewer

## API Endpoints

- `/api/twitter`: Endpoints for Twitter interactions
- `/api/ideas`: Endpoints for app idea generation
- `/api/prompts`: Endpoints for managing prompts
- `/api/pairs`: Endpoints for accessing saved tweet-idea pairs
