import { createRoot } from 'react-dom/client'
import './popup.css'

const App: React.FC<{}> = () => {
  const handleClick = async (task: string) => {
    try {
      chrome.runtime.sendMessage({ action: task })
    } catch (error) {
      console.error('Error in handleClick:', error)
    }
  }

  return (
    <div className="main-container">
      <h1>LinkedIn Buddy</h1>
      <h3>How I may help you today?</h3>
      <button id="autoConnect" onClick={() => handleClick('autoConnect')}>
        Auto Connect
      </button>
      <button id="visitProfile" onClick={() => handleClick('startVisiting')}>
        Start Visiting Profile
      </button>
      <button id="visitProfile" onClick={() => handleClick('stopVisiting')}>
        Stop Visiting Profile
      </button>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)

const root = createRoot(container)
root.render(<App />)
