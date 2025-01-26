import { ConnectionWithdrawerState } from '../utils/types';

export class ConnectionWithdrawer {
  private state: ConnectionWithdrawerState;

  constructor(state: ConnectionWithdrawerState) {
    this.state = state;
  }

  public async startWithdrawingProcess(): Promise<void> {
    console.log('Starting Connection Withdraw Process');
    this.state.isWithdrawing = true;
    chrome.storage.local.set({ task: this.state });

    // Open a new pinned tab for the LinkedIn sent invitations page
    const tab = await chrome.tabs.create({
      url: 'https://www.linkedin.com/mynetwork/invitation-manager/sent/',
      active: true,
      pinned: true,
    });

    if (tab.id) {
      this.state.startingTabId = tab.id;
      this.waitForContentScript(tab.id);
    }
  }

  private async waitForContentScript(tabId: number) {
    const maxRetries = 20;
    let attempts = 0;

    // Check if content has loaded, retry for 60 seconds if not
    while (attempts < maxRetries) {
      if (!this.state.isWithdrawing) break; // Check for manual stop
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'withdrawConnections' });
        break;
      } catch {
        attempts++;
        await this.delay(3);
      }
    }
    // Exit if retries are exhausted
    if (attempts === maxRetries) {
      console.error(
        'Failed to connect to content script after multiple attempts.'
      );
      await this.cleanupWorkingTab();
    }
  }

  private async cleanupWorkingTab(): Promise<void> {
    if (this.state.startingTabId !== undefined) {
      await chrome.tabs.remove(this.state.startingTabId);
      this.state.startingTabId = undefined;
      this.state.isWithdrawing = false;
      chrome.storage.local.set({ task: this.state });
      console.log('Closing Withdraw Tab.');
    }
  }

  private delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
}
