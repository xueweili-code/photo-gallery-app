import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

app.use(express.json())

app.get('/api/photos', async (req, res) => {
  const { query, page = 1 } = req.query
  if (!query) {
    return res.status(400).json({ error: 'query parameter is required' })
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?client_id=${UNSPLASH_API_KEY}&query=${encodeURIComponent(query)}&orientation=landscape&page=${page}`
    )
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Unsplash API error' })
    }
    const data = await response.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch images' })
  }
})

app.post('/api/photos/download', async (req, res) => {
  if (!UNSPLASH_API_KEY) {
    return res.status(500).json({ error: 'Unsplash API key is not configured' })
  }

  let downloadUrl
  try {
    downloadUrl = new URL(req.body?.downloadLocation)
  } catch {
    return res.status(400).json({ error: 'A valid download location is required' })
  }

  if (
    downloadUrl.protocol !== 'https:' ||
    downloadUrl.hostname !== 'api.unsplash.com' ||
    downloadUrl.username ||
    downloadUrl.password ||
    !/^\/photos\/[A-Za-z0-9_-]+\/download$/.test(downloadUrl.pathname)
  ) {
    return res.status(400).json({ error: 'Invalid Unsplash download location' })
  }

  downloadUrl.searchParams.set('client_id', UNSPLASH_API_KEY)

  try {
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Unsplash download event failed' })
    }
    res.sendStatus(204)
  } catch (error) {
    console.error('Failed to trigger Unsplash download event:', error)
    res.status(502).json({ error: 'Failed to contact Unsplash' })
  }
})

// Fallback to index.html for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
