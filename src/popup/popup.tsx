import { createRoot } from 'react-dom/client'
import './popup.css'

const App: React.FC<{}> = () => {
  const handleAutoConnectClick = () => {
    console.log('autoconnect clicked')
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id!, { action: 'autoConnect' })
      }
    )
  }

  return (
    <div className="main-container">
      <h1>LinkedIn Buddy</h1>
      <h3>How I may help you today?</h3>
      <button id="autoConnect" onClick={handleAutoConnectClick}>
        Auto Connect
      </button>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)

const root = createRoot(container)
root.render(<App />)
