import { useState, useEffect, useRef } from 'react'
import './App.css'

export default function App() {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState([])
  const [bgUrl, setBgUrl] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const currentQueryRef = useRef('macbook')
  const preUrlRef = useRef(null)
  const galleryRef = useRef(null)

  const fetchData = async (city, targetPage = 1, landAtEnd = false) => {
    const searchCity = city || 'macbook'
    currentQueryRef.current = searchCity
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/photos?query=${encodeURIComponent(searchCity)}&page=${targetPage}`
      )
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        setImages(data.results)
        setPage(targetPage)
        const startIndex = landAtEnd ? data.results.length - 1 : 0
        setBgUrl(data.results[startIndex].urls.full)
        setSelectedIndex(startIndex)
        preUrlRef.current = null
      } else {
        setError('No images found.')
      }
    } catch (e) {
      setError('Failed to load images. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const navigate = (dir) => {
    if (images.length === 0) return
    // at last image going forward → fetch next page
    if (dir === 1 && selectedIndex === images.length - 1) {
      fetchData(currentQueryRef.current, page + 1, false)
      return
    }
    // at first image going back → fetch previous page (land at end)
    if (dir === -1 && selectedIndex === 0 && page > 1) {
      fetchData(currentQueryRef.current, page - 1, true)
      return
    }
    const newIndex = selectedIndex + dir
    if (newIndex < 0 || newIndex >= images.length) return
    setBgUrl(images[newIndex].urls.full)
    setSelectedIndex(newIndex)
    preUrlRef.current = null
    if (galleryRef.current) {
      const thumb = galleryRef.current.children[newIndex]
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  useEffect(() => {
    fetchData('macbook')
  }, [])

  const handleSearch = () => {
    const city = query.trim().toLowerCase()
    if (city) fetchData(city, 1)
  }

  const handleKeyUp = (e) => {
    if (e.key === 'Enter' && query.trim().length) {
      handleSearch()
    }
  }

  const handleThumbnailClick = (index) => {
    setBgUrl(images[index].urls.full)
    setSelectedIndex(index)
    preUrlRef.current = null
    if (galleryRef.current) {
      const thumb = galleryRef.current.children[index]
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  const handleMouseEnter = (index) => {
    if (!preUrlRef.current) {
      preUrlRef.current = bgUrl
    }
    setBgUrl(images[index].urls.full)
  }

  const handleGalleryMouseLeave = () => {
    if (preUrlRef.current) {
      setBgUrl(preUrlRef.current)
      preUrlRef.current = null
    }
  }

  const handleDownload = async () => {
    const image = images[selectedIndex]
    if (!image || downloading) return

    setDownloading(true)
    setError('')
    try {
      const eventResponse = await fetch('/api/photos/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: image.links.download_location }),
      })
      if (!eventResponse.ok) {
        const contentType = eventResponse.headers.get('content-type') || ''
        const data = contentType.includes('application/json')
          ? await eventResponse.json()
          : null
        if (eventResponse.status === 404) {
          throw new Error('Download service is unavailable. Restart the app with npm run dev:all and try again.')
        }
        throw new Error(data?.error || `Failed to register the download (${eventResponse.status}).`)
      }

      const imageResponse = await fetch(image.urls.full)
      if (!imageResponse.ok) throw new Error('Failed to download the image.')

      const blob = await imageResponse.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `pixplore-${image.id}.jpg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      setError(error.message || 'Failed to download the image. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="app"
      style={{
        backgroundImage: bgUrl ? `url('${bgUrl}')` : '',
      }}
    >
      <div className="searchBar">
        <input
          type="text"
          id="input"
          placeholder="Search photos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyUp={handleKeyUp}
        />
        <button id="search" onClick={handleSearch}>search</button>
      </div>

      {images[selectedIndex] && (
        <div className="photoActions">
          <button
            className="downloadBtn"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download photo'}
          </button>
          <div className="photoCredit">
            Photo by{' '}
            <a
              href={images[selectedIndex].user.links.html}
              target="_blank"
              rel="noreferrer"
            >
              {images[selectedIndex].user.name}
            </a>
            {' '}on{' '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer">
              Unsplash
            </a>
          </div>
        </div>
      )}

      {loading && <div className="loadingOverlay">Loading...</div>}
      {error && <div className="errorMsg">{error}</div>}

      <div id="galleryWrapper">
        <button
          className="arrowBtn"
          onClick={() => navigate(-1)}
          disabled={page === 1 && selectedIndex === 0}
        >&#8249;</button>
        <div id="gallery" ref={galleryRef} onMouseLeave={handleGalleryMouseLeave}>
        {images.map((img, i) => (
          <div
            key={img.id}
            data-index={i}
            className={i === selectedIndex ? 'selected' : ''}
            style={{
              backgroundImage: `url('${img.urls.regular}')`,
            }}
            onClick={() => handleThumbnailClick(i)}
            onMouseEnter={() => handleMouseEnter(i)}
          />
        ))}
        </div>
        <button className="arrowBtn" onClick={() => navigate(1)}>&#8250;</button>
      </div>
    </div>
  )
}
