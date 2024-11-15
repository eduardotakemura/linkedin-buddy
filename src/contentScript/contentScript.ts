import { Message } from './../utils/messages'

class ProfileVisitor {
  constructor() {
    this.initializeListeners()
  }

  private initializeListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        // Get Profiles Links
        if (message.action === 'getProfileLinks') {
          const links = this.getAllProfileLinks()

          chrome.runtime.sendMessage({
            action: 'getProfileLinks',
            data: links,
          })
          // Send Connection Request
        } else if (message.action === 'sendConnectRequest') {
          this.sendConnectionRequest()
            .then(() => sendResponse({ status: 'completed' }))
            .catch((error) =>
              sendResponse({ status: 'failed', error: error.toString() })
            )
          return true
          // Move to next page
        } else if (message.action === 'nextPage') {
          console.log('next page')
          this.nextPage()
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
    try {
      const connectButton = document.querySelector(
        'button.artdeco-button--primary.artdeco-button[aria-label*="Invite"]'
      ) as HTMLButtonElement
      connectButton.click()

      // Wait for the modal to load
      await new Promise((resolve) => setTimeout(resolve, 4000))

      const modalButton = document.querySelector(
        'button[aria-label*="Send without a note"]'
      ) as HTMLButtonElement

      if (modalButton) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 + Math.random() * 3000)
        )
        modalButton.click()
        this.logToBackground('Sent connection request.')
      } else {
        this.logToBackground(
          'Cannot find the modal button. Request was not sent.'
        )
      }
    } catch (error) {
      this.logToBackground('Failed to send connection request:', error)
    } finally {
      chrome.runtime.sendMessage({ action: 'connectRequestComplete' })
    }
  }

  private async nextPage(): Promise<void> {
    try {
      // Scroll to the bottom of the page
      await new Promise((resolve) => {
        window.scrollTo(0, document.body.scrollHeight)
        setTimeout(resolve, 2000)
      })

      // Find and click the next page button
      const nextButton = document.querySelector(
        'button.artdeco-button[aria-label*="Next"]'
      ) as HTMLButtonElement
      nextButton.click()
    } catch (error) {
      this.logToBackground('An error occur: ', error)
    } finally {
      chrome.runtime.sendMessage({ action: 'nextPageComplete' })
    }
  }

  private logToBackground(...messages: any[]): void {
    chrome.runtime.sendMessage({ action: 'log', data: messages })
  }
}

new ProfileVisitor()
