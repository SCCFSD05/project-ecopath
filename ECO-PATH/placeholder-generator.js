// Simple placeholder SVG generator
function generatePlaceholderSVG(width, height, text = "", bgColor = "#e2e8f0", textColor = "#64748b") {
  const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${bgColor}"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
                  fill="${textColor}" text-anchor="middle" dy=".3em">
                ${text || `${width}×${height}`}
            </text>
        </svg>
    `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// Replace placeholder.svg requests
document.addEventListener("DOMContentLoaded", () => {
  // Find all images with placeholder.svg src
  const placeholderImages = document.querySelectorAll('img[src*="placeholder.svg"]')

  placeholderImages.forEach((img) => {
    const src = img.src
    const url = new URL(src, window.location.origin)
    const params = new URLSearchParams(url.search)

    const width = params.get("width") || "300"
    const height = params.get("height") || "200"
    const query = params.get("query") || ""

    // Generate placeholder SVG
    const placeholderSVG = generatePlaceholderSVG(width, height, query)
    img.src = placeholderSVG
  })
})
