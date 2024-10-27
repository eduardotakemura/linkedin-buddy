import { Message } from './../utils/types'

async function autoConnect() {
  // Find all "Connect" buttons on screen
  const connectButtons = document.querySelectorAll(
    'ul.reusable-search__entity-result-list button.artdeco-button[aria-label*="Invite"]'
  ) as NodeListOf<HTMLButtonElement>

  for (const button of connectButtons) {
    // Set random delay and click the button
    const delay = 2000 + Math.random() * 20000
    await new Promise((resolve) => setTimeout(resolve, delay))
    button.click()

    // Wait, select the send button on the modal, set a random delay and click it
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const sendButton = document.querySelector(
      'button[aria-label="Send without a note"]'
    ) as HTMLButtonElement
    if (sendButton) {
      const delay = 1000 + Math.random() * 10000
      await new Promise((resolve) => setTimeout(resolve, delay))
      sendButton.click()
    }
  }
}

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
      console.error('Failed to send connection request:', error)
    } finally {
      // Notify background script that the connection request is complete
      chrome.runtime.sendMessage({ action: 'connectRequestComplete' })
    }
  }
}

// Initialize the content script
new ProfileVisitor()
