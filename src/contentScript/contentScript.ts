import { Message } from './../utils/messages';

class ProfileVisitor {
  constructor() {
    this.initializeListeners();
  }

  private initializeListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message: Message, sender, sendResponse) => {
        // Get Profiles Links
        if (message.action === 'getProfileLinks') {
          this.delay(10).then(() => {
            const links = this.getAllProfileLinks();

            chrome.runtime.sendMessage({
              action: 'getProfileLinks',
              data: links,
            });
          });
          // Send Connection Request
        } else if (message.action === 'sendConnectRequest') {
          this.sendConnectionRequest()
            .then((status) => {
              sendResponse({ status });
            })
            .catch((error) => {
              sendResponse({ status: 'failed', error: error.toString() });
            });
          return true;
          // Move to next page
        } else if (message.action === 'nextPage') {
          this.nextPage()
            .then(() => sendResponse({ status: 'completed' }))
            .catch((error) =>
              sendResponse({ status: 'failed', error: error.toString() })
            );
          return true;
        } else if (message.action === 'showSidePanel') {
          console.log(message);
          // Withdraw Connections
        } else if (message.action === 'withdrawConnections') {
          this.scrollToBottom()
            .then(() => this.getUserCards())
            .then((cards) => this.filterOldRequests(cards))
            .then((oldCards) => this.withdrawConnections(oldCards))
            .then(() => {
              sendResponse({ status: 'completed' });
            })
            .catch((error) => {
              sendResponse({ status: 'failed', error: error.toString() });
            });
          return true;
        }
      }
    );
  }

  private getAllProfileLinks(): string[] {
    const cards = document.querySelectorAll(
      'div[data-view-name="search-entity-result-universal-template"]'
    );
    console.log(cards);
    const profileLinks: string[] = Array.from(cards)
      .map((card) => {
        const mainLink = card.querySelector<HTMLAnchorElement>(
          'a[data-test-app-aware-link]'
        );
        if (mainLink?.href.includes('linkedin.com/in/')) {
          return mainLink.href;
        }
        return null;
      })
      .filter((href): href is string => href !== null);

    this.logToBackground('Extracted profile links:', profileLinks);
    return [...new Set(profileLinks)];
  }

  private async sendConnectionRequest(): Promise<{
    status: string;
    error?: string;
  }> {
    try {
      // Try to find the connect button on the main page
      var connectButton = document.querySelector(
        'button.artdeco-button--primary.artdeco-button[aria-label*="Invite"]'
      ) as HTMLButtonElement;

      if (connectButton) {
        connectButton.click();
      } else {
        // Try to find the more info button
        const moreButton = document.querySelector(
          'button.artdeco-button--secondary.artdeco-button[aria-label*="More"]'
        ) as HTMLButtonElement;

        // Quit if not found
        if (!moreButton) {
          throw new Error(
            'Connect button not found, then more info button also not found'
          );
        }
        moreButton.click();
        await this.delay(2);

        // Try to find the connect button
        const connectWindowButton = document.querySelector(
          'div.artdeco-dropdown__item[aria-label*="Invite"]'
        ) as HTMLElement;

        // Quit if not found
        if (!connectWindowButton) {
          throw new Error('Connect button not found in the window');
        }
        connectWindowButton.click();
      }

      // Wait for the modal to load
      await this.delay(4);

      const modalButton = document.querySelector(
        'button[aria-label*="Send without a note"]'
      ) as HTMLButtonElement;

      if (modalButton) {
        await this.delay(2 + Math.random() * 3);
        modalButton.click();
        this.logToBackground('Sent connection request.');
        return { status: 'completed' };
      } else {
        throw new Error('Modal button not found');
      }
    } catch (error) {
      this.logToBackground(
        'Failed to send connection request:',
        error?.toString()
      );
      return { status: 'failed', error: error?.toString() };
    }
  }

  private async nextPage(): Promise<void> {
    try {
      // Scroll to the bottom of the page
      await new Promise((resolve) => {
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(resolve, 2000);
      });

      // Find and click the next page button
      const nextButton = document.querySelector(
        'button.artdeco-button[aria-label*="Next"]'
      ) as HTMLButtonElement;
      nextButton.click();
    } catch (error) {
      this.logToBackground('An error occur: ', error);
    } finally {
      chrome.runtime.sendMessage({ action: 'nextPageComplete' });
    }
  }

  private async scrollToBottom(): Promise<void> {
    let lastHeight = document.body.scrollHeight;
    while (true) {
      window.scrollTo(0, document.body.scrollHeight);
      await this.delay(2); // Wait for new content to load

      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) {
        break; // Exit loop if no new content is loaded
      }
      lastHeight = newHeight;
    }
  }

  private getUserCards(): Promise<Element[]> {
    return new Promise((resolve) => {
      const cards = document.querySelectorAll('li.invitation-card');
      resolve(Array.from(cards));
    });
  }

  private filterOldRequests(cards: Element[]): Element[] {
    return cards.filter((card) => {
      const timeBadge = card.querySelector('span.time-badge');
      if (timeBadge) {
        const text = timeBadge.textContent || '';
        return text.includes('month') || text.includes('months');
      }
      return false;
    });
  }

  private async withdrawConnections(cards: Element[]): Promise<void> {
    for (const card of cards) {
      try {
        console.log('Attempting to withdraw connection for a card.');

        const withdrawButton = card.querySelector<HTMLButtonElement>(
          'button[aria-label^="Withdraw"]'
        );
        if (withdrawButton) {
          console.log('Withdraw button found, clicking...');
          withdrawButton.click();
          await this.delay(2); // Wait for modal to display

          const confirmButton = document.querySelector<HTMLButtonElement>(
            'button.artdeco-button--primary'
          );
          if (confirmButton) {
            console.log('Confirm button found, clicking...');
            confirmButton.click();
            await this.delay(4); // Wait for the withdrawal to process

            console.log('Successfully withdrew connection.');
          } else {
            console.warn('Confirm button not found.');
          }
        } else {
          console.warn('Withdraw button not found.');
        }
      } catch (error) {
        console.error('Error withdrawing connection:', error);
      }
    }
  }

  private delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  private logToBackground(...messages: any[]): void {
    chrome.runtime.sendMessage({ action: 'log', data: messages });
  }
}

new ProfileVisitor();
