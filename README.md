# Pixplore

A searchable photo gallery built with React, Vite, and Express, powered by the Unsplash API.

Search for any topic to browse a full-screen photo gallery. Navigate through images using the thumbnail carousel and arrow controls.

## Features

- Search photos by keyword (click the button or press Enter)
- Full-screen background image that updates on selection
- Thumbnail carousel with hover preview and click-to-select
- Arrow navigation between photos, auto-loads next/previous page at boundaries
- Download the currently selected photo with photographer attribution
- Loading indicator and error feedback
- API key secured on the backend — never exposed to the client

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| API | [Unsplash Photos API](https://unsplash.com/developers) |

## Project Structure

```
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main component
│   └── App.css         # Styles
├── server.js           # Express proxy server
├── vite.config.js      # Vite config with dev proxy
├── .env.example        # Template for environment variables
├── .gitignore          # Excludes dependencies, build output, and secrets
├── index.html          # Vite HTML entry point
└── package.json        # Scripts and dependencies
```

The React/Vite app is the maintained version. The old standalone HTML/JavaScript implementation has been removed so there is one clear application entry point.

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Unsplash developer account](https://unsplash.com/developers) to get an API key

### Installation

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

3. Add your Unsplash API key to `.env`:

```
UNSPLASH_API_KEY=your_api_key_here
```

### Running

Start both frontend and backend together (development):

```bash
npm run dev:all
```

Or start them separately:

```bash
# Frontend (http://localhost:5173)
npm run dev

# Backend (http://localhost:3001)
npm run server
```

### Production Deployment

1. Build the frontend:

```bash
npm run build
```

2. Start the server (serves both the API and the built frontend):

```bash
npm start
```

The app will be available on `http://localhost:3001`. Set the `PORT` environment variable to change the port.

## API

The Express server exposes these endpoints:

```
GET /api/photos?query=<city>&page=<number>
POST /api/photos/download
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| query | string | yes | Search term |
| page | number | no | Page number, defaults to 1 |

The download endpoint accepts the selected photo's Unsplash `links.download_location` and registers the download event without exposing the API key to the browser.

## License

MIT
