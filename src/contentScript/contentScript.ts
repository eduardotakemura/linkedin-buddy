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
          console.log('sending the conection request!')
          this.sendConnectionRequest()
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
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Click the "Send without a note" button in the modal
      const modalButton = document.querySelector(
        'button[aria-label="Send without a note"]'
      ) as HTMLButtonElement
      if (modalButton) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 10000)
        )
        modalButton.click()
        console.log('Pressed the send button on the modal')
      } else {
        console.log('Cannot find the send button on the modal')
      }
    } catch (error) {
      console.info('Failed to send connection request:', error)
    } finally {
      // Notify background script that the connection request is complete
      chrome.runtime.sendMessage({ action: 'connectRequestComplete' })
    }
  }
}

// Initialize the content script
new ProfileVisitor()
