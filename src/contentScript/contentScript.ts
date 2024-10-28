import { Message } from './../utils/types'

class ProfileVisitor {
  constructor() {
    this.initializeListeners()
  }

  private initializeListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        if (message.action === 'getProfileLinks') {
          const links = this.getAllProfileLinks()

          chrome.runtime.sendMessage({
            action: 'getProfileLinks',
            data: links,
          })
        } else if (message.action === 'sendConnectRequest') {
          this.sendConnectionRequest()
            .then(() => sendResponse({ status: 'completed' }))
            .catch((error) =>
              sendResponse({ status: 'failed', error: error.toString() })
            )
          return true
        }
      }
    )
  }

  private getAllProfileLinks(): string[] {
    const cards = document.querySelectorAll('.entity-result__divider')
    const profileLinks: string[] = Array.from(cards)
      .map((card) => {
        const mainLink =
          card.querySelector<HTMLAnchorElement>('a.app-aware-link')
        if (mainLink?.href.includes('linkedin.com/in/')) {
          return mainLink.href
        }
        return null
      })
      .filter((href): href is string => href !== null)

    this.logToBackground('Extracted profile links:', profileLinks)
    return [...new Set(profileLinks)]
  }

  private async sendConnectionRequest(): Promise<void> {
    // Attempt to send a connection request
    try {
      const connectButton = document.querySelector(
        'button.artdeco-button[aria-label*="Invite"]'
      ) as HTMLButtonElement
      connectButton.click()

      // Wait for the modal to load
      await new Promise((resolve) => setTimeout(resolve, 4000))

      // Click the "Send without a note" button in the modal
      const modalButton = document.querySelector(
        'button[aria-label*="Send without a note"]'
      ) as HTMLButtonElement

      if (modalButton) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 + Math.random() * 3000)
        )
        modalButton.click()
        this.logToBackground('Pressed the send button on the modal')
      } else {
        this.logToBackground('Cannot find the send button on the modal')
      }
    } catch (error) {
      this.logToBackground('Failed to send connection request:', error)
    } finally {
      chrome.runtime.sendMessage({ action: 'connectRequestComplete' })
    }
  }

  private logToBackground(...messages: any[]): void {
    chrome.runtime.sendMessage({ action: 'log', data: messages })
  }
}

// Initialize the content script
new ProfileVisitor()
