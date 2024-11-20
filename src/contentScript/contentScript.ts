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
            .then((status) => {
              sendResponse({ status })
            })
            .catch((error) => {
              sendResponse({ status: 'failed', error: error.toString() })
            })
          return true
          // Move to next page
        } else if (message.action === 'nextPage') {
          this.nextPage()
            .then(() => sendResponse({ status: 'completed' }))
            .catch((error) =>
              sendResponse({ status: 'failed', error: error.toString() })
            )
          return true
        } else if (message.action === 'showSidePanel') {
          console.log(message)
        }
      }
    )
  }

  private getAllProfileLinks(): string[] {
    const cards = document.querySelectorAll('.entity-result__divider')
    console.log(cards)
    const profileLinks: string[] = Array.from(cards)
      .map((card) => {
        const mainLink = card.querySelector<HTMLAnchorElement>(
          'span.entity-result__title-text > a'
        )
        if (mainLink?.href.includes('linkedin.com/in/')) {
          return mainLink.href
        }
        return null
      })
      .filter((href): href is string => href !== null)

    this.logToBackground('Extracted profile links:', profileLinks)
    return [...new Set(profileLinks)]
  }

  private async sendConnectionRequest(): Promise<{
    status: string
    error?: string
  }> {
    try {
      const connectButton = document.querySelector(
        'button.artdeco-button--primary.artdeco-button[aria-label*="Invite"]'
      ) as HTMLButtonElement

      if (!connectButton) {
        throw new Error('Connect button not found')
      }
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
        return { status: 'completed' }
      } else {
        this.logToBackground(
          'Cannot find the modal button. Request was not sent.'
        )
        throw new Error('Modal button not found')
      }
    } catch (error) {
      this.logToBackground('Failed to send connection request:', error)
      return { status: 'failed', error: error?.toString() }
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
