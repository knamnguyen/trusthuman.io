import React from 'react'
import ReactDOM from 'react-dom/client'
import { LinkedInPreviewTool } from './linkedin-preview-tool'
import '~/app/globals.css' // Import global styles

export function mountLinkedInPreview(rootSelector = '#linkedin-preview-root') {
    let mountPoint = document.querySelector(rootSelector)
    if (!mountPoint) {
        mountPoint = document.createElement('div')
        mountPoint.id = 'linkedin-preview-root'
        // Insert at the top of body (before first child, or append if body is empty)
        if (document.body.firstChild) {
            document.body.insertBefore(mountPoint, document.body.firstChild)
        } else {
            document.body.appendChild(mountPoint)
        }
    }
    // Add scoping class to prevent CSS conflicts with host site
    mountPoint.classList.add('ek-component-container')
    ReactDOM.createRoot(mountPoint).render(React.createElement(LinkedInPreviewTool))
}

// Export component for direct use
export { LinkedInPreviewTool } from './linkedin-preview-tool'

// Auto-mount when script loads
// Creates mount point automatically if it doesn't exist
function autoMount() {
    mountLinkedInPreview()
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoMount)
    } else {
        autoMount()
    }
}

