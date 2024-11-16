import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'

const App: React.FC<{}> = () => {
  var [seed, setSeed] = useState<string>('')
  var [connectionLimit, setConnectionLimit] = useState(15) // around ~100 per week

  const handleStartVisiting = () => {
    chrome.storage.local.get(['task'], (response) => {
      if (!response.task.isVisiting) {
        chrome.runtime.sendMessage({
          action: 'startVisiting',
          data: { seed, connectionLimit },
        })
      }
    })
  }

  const handleStopVisiting = () => {
    chrome.storage.local.get(['task'], (response) => {
      if (response.task.isVisiting) {
        console.log('stopping!')
        chrome.runtime.sendMessage({ action: 'stopVisiting' })
      }
    })
  }

  return (
    <div className="main-container">
      <h1>LinkedIn Assistant</h1>
      <h2>Launch Campaign</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="input-container">
          <h3>Seed Link</h3>
          <input
            type="text"
            placeholder="Enter LinkedIn profile URL"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
          />
        </div>

        <div className="input-container">
          <h3>Connection Limit</h3>
          <input
            type="number"
            value={connectionLimit}
            onChange={(event) =>
              setConnectionLimit(parseInt(event.target.value))
            }
          />
        </div>

        <div className="button-container">
          <button id="visitProfile" onClick={() => handleStartVisiting()}>
            Start Campaign
          </button>
          <button id="visitProfile" onClick={() => handleStopVisiting()}>
            Stop Campaign
          </button>
        </div>
      </form>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)

const root = createRoot(container)
root.render(<App />)
