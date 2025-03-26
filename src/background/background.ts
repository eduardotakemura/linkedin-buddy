import { ProfileVisitorState } from './../utils/types';
import { ProfileVisitor } from './profileVisitor';
import { ConnectionRequester } from './connectionRequester';
import { ConnectionWithdrawer } from './connectionWithdrawer';
import { ConnectionWithdrawerState } from '../utils/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'comment',
    title: 'Create Comment',
    contexts: ['selection'],
  });
  chrome.contextMenus.onClicked.addListener((event) => {
    if (event.menuItemId === 'comment' && event.selectionText) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          console.log(event.selectionText);
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'showSidePanel',
            selectionText: event.selectionText,
          });
        }
      });
    }
  });
});

class ProfileVisitorBackground {
  private state: ProfileVisitorState = {
    profileLinks: [],
    currentIndex: 0,
    isVisiting: false,
    originalPage: '',
    isProfileLoaded: true,
    movingToNextPage: false,
    visitCount: 0,
    visitLimit: 0,
    connectionCount: 0,
    connectionLimit: 0,
  };
  private profileVisitor: ProfileVisitor;

  constructor() {
    this.profileVisitor = new ProfileVisitor(this.state);
    this.initializeListeners();
    chrome.storage.local.set({ task: this.state });
  }

  initializeListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        // Starting Campaign Loop
        if (message.action === 'startVisiting') {
          this.state.connectionLimit = message.data.connectionLimit;
          this.state.visitLimit = message.data.profileLimit;
          this.startVisitingProcess(message.data.seed);

          // Stop Campaign Trigger
        } else if (message.action === 'stopVisiting') {
          console.log('Manual Stop Triggered');
          this.profileVisitor.cleanupWorkingTab();
          console.log(
            `Manual Stop Report: Visited ${this.state.visitCount} profiles, Sent ${this.state.connectionCount} connection requests.`
          );
          // Reset counters
          this.state.visitCount = 0;
          this.state.connectionCount = 0;

          // Query contentScript for links of current page
        } else if (message.action === 'getProfileLinks') {
          var currentLinks = message.data;

          if (this.state.movingToNextPage) {
            this.state.profileLinks.push(...currentLinks);
          } else {
            this.state.profileLinks = currentLinks;
          }
          this.state.originalPage = sender.tab?.url || '';
          this.profileVisitor.visitNextProfile();

          // Logs messages coming from the script
        } else if (message.action === 'log') {
          console.log('Content Script Log:', ...message.data);
        }

        if (message.action === 'startWithdrawConnections') {
          const state: ConnectionWithdrawerState = {
            isWithdrawing: false,
            startingTabId: undefined,
            withdrawalCount: 0,
          };

          const withdrawer = new ConnectionWithdrawer(state);
          withdrawer.startWithdrawingProcess();
          sendResponse({ status: 'withdrawalStarted' });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        sendResponse({ error });
      }
    });

    // Listener to catch pages update
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (
        changeInfo.status === 'complete' &&
        this.state.isVisiting &&
        tabId === this.state.startingTabId
      ) {
        this.handlePageLoad(tab.url || '');
      }
    });
  }

  private async startVisitingProcess(seedLink: string): Promise<void> {
    console.log('Starting Campaign');
    console.log(
      `Seed Link: ${seedLink}, Connection Limit: ${this.state.connectionLimit}, Visiting Limit: ${this.state.visitLimit}`
    );
    this.state.isVisiting = true;
    this.state.currentIndex = 0;
    this.state.visitCount = 0;
    this.state.connectionCount = 0;
    chrome.storage.local.set({ task: this.state });

    // Popup new pinned tab
    const tab = await chrome.tabs.create({
      url: seedLink,
      active: false,
      pinned: true,
    });

    if (tab.id) {
      this.state.startingTabId = tab.id;
      this.state.originalPage = seedLink;
      this.waitForContentScript(tab.id);
    }
  }

  async waitForContentScript(tabId: number) {
    const maxRetries = 20;
    let attempts = 0;

    // Check if content had loaded, retry for 60 seconds if not
    while (attempts < maxRetries) {
      if (!this.state.isVisiting) break; // Check for manual stop
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'getProfileLinks' });
        break;
      } catch {
        attempts++;
        await this.profileVisitor.delay(3);
      }
    }
    // Exit if retries are exhausted
    if (attempts === maxRetries) {
      console.error(
        'Failed to connect to content script after multiple attempts.'
      );
      await this.profileVisitor.cleanupWorkingTab();
    }
  }

  private async handlePageLoad(url: string): Promise<void> {
    if (!this.state.isVisiting || this.state.startingTabId === undefined)
      return;

    const isProfile = url.includes('/in/');
    const isOriginalPage = url === this.state.originalPage;

    const tab = await chrome.tabs.get(this.state.startingTabId);
    if (!tab || tab.url !== url) return;

    if (isProfile) {
      // Wait for the page load
      await this.profileVisitor.delay(10, 30);

      // Send connection request
      const connectionRequester = new ConnectionRequester(
        this.state.startingTabId,
        this.state
      );
      await connectionRequester.sendConnectionRequestToContent();
      await this.profileVisitor.delay(2, 5);

      // Back to previous page
      this.state.isProfileLoaded = true;
      await this.profileVisitor.navigateBack();
    } else if (isOriginalPage) {
      await this.profileVisitor.delay(10, 20);
      this.profileVisitor.visitNextProfile();
    }
  }
}

// Initialize the background script
new ProfileVisitorBackground();
