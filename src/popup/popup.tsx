import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

const App: React.FC<{}> = () => {
  const [seed, setSeed] = useState<string>('')
  const [isRunning, setRunning] = useState<boolean>(false)

  const handleStartVisiting = () => {
    chrome.runtime.sendMessage({
      action: 'startVisiting',
      data: { seedLink: seed },
    })
  }
  const handleStopVisiting = () => {
    chrome.runtime.sendMessage({ action: 'stopVisiting' })
  }

  return (
    <div className="main-container">
      <h1>LinkedIn Buddy</h1>
      <h3>How I may help you today?</h3>
      <input
        placeholder="Insert the seed link"
        value={seed}
        onChange={(event) => setSeed(event.target.value)}
      />
      <button id="visitProfile" onClick={() => handleStartVisiting()}>
        Start Visiting Profile
      </button>
      <button id="visitProfile" onClick={() => handleStopVisiting()}>
        Stop Visiting Profile
      </button>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)

const root = createRoot(container)
root.render(<App />)
