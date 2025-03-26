import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

const parseLinkedInSearchUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (!urlObj.pathname.includes('/search/results/people/')) {
      return null;
    }

    const searchParams = urlObj.searchParams;
    const keywords = searchParams.get('keywords');
    const page = searchParams.get('page');

    if (!keywords) {
      return null;
    }

    // Decode the URL-encoded string first
    const decodedKeywords = decodeURIComponent(keywords);
    // Keep the quotes in the display
    return {
      keywords: decodedKeywords,
      page: page ? `Page ${page}` : 'Page 1',
    };
  } catch {
    return null;
  }
};

const App: React.FC<{}> = () => {
  var [seed, setSeed] = useState<string>('');
  var [connectionLimit, setConnectionLimit] = useState(10); // around ~100 per week
  var [profileLimit, setProfileLimit] = useState(20);
  var [seedLinks, setSeedLinks] = useState<string[]>([]);

  useEffect(() => {
    const getSeedLinks = async () => {
      const seedLinks: string[] = await new Promise((resolve) => {
        chrome.storage.sync.get(['seedLinks'], (result) => {
          resolve(result.seedLinks || []);
        });
      });
      setSeedLinks(seedLinks);
    };
    getSeedLinks();
  }, []);

  const handleStartVisiting = () => {
    // Create new array first
    const updatedSeedLinks =
      seedLinks.length >= 5
        ? [seed, ...seedLinks.slice(0, 4)] // Keep only last 4 + new one
        : [seed, ...seedLinks]; // Add new one to existing list

    // Update both storage and state in sequence
    chrome.storage.sync.set({ seedLinks: updatedSeedLinks }, () => {
      // Only update state after storage is confirmed updated
      setSeedLinks(updatedSeedLinks);
      setSeed('');
    });

    // Start visiting
    chrome.storage.local.get(['task'], (response) => {
      if (!response.task.isVisiting) {
        chrome.runtime.sendMessage({
          action: 'startVisiting',
          data: { seed, connectionLimit, profileLimit },
        });
      }
    });
  };

  const handleStopVisiting = () => {
    chrome.storage.local.get(['task'], (response) => {
      if (response.task.isVisiting) {
        console.log('stopping!');
        chrome.runtime.sendMessage({ action: 'stopVisiting' });
      }
    });
  };

  const handleStartWithdrawConnections = () => {
    chrome.runtime.sendMessage({
      action: 'startWithdrawConnections',
    });
  };

  const handleStopWithdrawConnections = () => {
    chrome.runtime.sendMessage({
      action: 'stopWithdrawConnections',
    });
  };

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

        {seedLinks.length > 0 && (
          <div className="input-container">
            <h3>Last Seed Links</h3>
            {seedLinks.map((link) => {
              const searchInfo = parseLinkedInSearchUrl(link);
              return (
                <div
                  key={link}
                  className="seed-link-row"
                  onClick={() => setSeed(link)}
                >
                  <p>
                    {searchInfo ? (
                      <>
                        <span className="search-keywords">
                          {searchInfo.keywords}
                        </span>
                        <span className="search-page">{searchInfo.page}</span>
                      </>
                    ) : (
                      link
                    )}
                  </p>
                  <span
                    className="remove-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSeedLinks = seedLinks.filter((l) => l !== link);
                      setSeedLinks(newSeedLinks);
                      chrome.storage.sync.set({ seedLinks: newSeedLinks });
                    }}
                  >
                    ×
                  </span>
                </div>
              );
            })}
          </div>
        )}

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

        <div className="input-container">
          <h3>Profile Visiting Limit</h3>
          <input
            type="number"
            value={profileLimit}
            onChange={(event) => setProfileLimit(parseInt(event.target.value))}
          />
        </div>

        <div className="button-container">
          <button
            className="action-button"
            onClick={() => handleStartVisiting()}
          >
            Start Campaign
          </button>
          <button
            className="action-button"
            onClick={() => handleStopVisiting()}
          >
            Stop Campaign
          </button>
        </div>

        <h2 className="sub-heading">Withdraw Connections</h2>
        <div className="button-container">
          <button
            className="action-button"
            onClick={handleStartWithdrawConnections}
          >
            Start Withdrawal
          </button>
          <button
            className="action-button"
            onClick={handleStopWithdrawConnections}
          >
            Stop Withdrawal
          </button>
        </div>
      </form>
    </div>
  );
};

const container = document.createElement('div');
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);
