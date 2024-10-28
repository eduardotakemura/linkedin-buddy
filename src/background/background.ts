import { ProfileVisitorState, Message } from './../utils/types'
import { ProfileVisitor } from './profileVisitor'
import { ConnectionRequester } from './connectionRequester'

class ProfileVisitorBackground {
  private state: ProfileVisitorState = {
    visitedProfiles: [],
    profileLinks: [],
    currentIndex: 0,
    isVisiting: false,
    originalPage: '',
    isProfileLoaded: true,
  }
  private profileVisitor: ProfileVisitor

  constructor() {
    this.profileVisitor = new ProfileVisitor(this.state)
    this.initializeListeners()
  }

  initializeListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.action === 'startVisiting') {
          this.startVisitingProcess(message.data.seedLink)
        } else if (message.action === 'stopVisiting') {
          console.log('Manual Stop Triggered')
          this.state.isVisiting = false
          this.profileVisitor.cleanupWorkingTab()
        } else if (message.action === 'getProfileLinks') {
          this.state.profileLinks = message.data
          this.state.originalPage = sender.tab?.url || ''
          this.profileVisitor.visitNextProfile()
        } else if (message.action === 'log') {
          console.log('Content Script Log:', ...message.data)
        }
      } catch (error) {
        console.error('Error processing message:', error)
        sendResponse({ error })
      }
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (
        changeInfo.status === 'complete' &&
        this.state.isVisiting &&
        tabId === this.state.startingTabId
      ) {
        this.handlePageLoad(tab.url || '')
      }
    })
  }

  private async startVisitingProcess(seedLink: string): Promise<void> {
    console.log('Starting visiting process')
    this.state.isVisiting = true
    this.state.currentIndex = 0

    const tab = await chrome.tabs.create({
      url: seedLink,
      active: false,
      pinned: true,
    })

    if (tab.id) {
      this.state.startingTabId = tab.id
      this.state.originalPage = seedLink
      this.waitForContentScript(tab.id)
    }
  }

  private async waitForContentScript(tabId: number) {
    const maxRetries = 20
    let attempts = 0

    while (attempts < maxRetries) {
      // Check if the content is ready
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'getProfileLinks' })
        console.log('Content script is ready')
        break
      } catch {
        console.info(
          `Retrying connection to content script (Attempt ${attempts + 1})`
        )
        attempts++
        await this.profileVisitor.delay(3)
      }
    }
    // Exit if retries are exhausted
    if (attempts === maxRetries) {
      console.error(
        'Failed to connect to content script after multiple attempts.'
      )
      await this.profileVisitor.cleanupWorkingTab()
    }
  }

  private async handlePageLoad(url: string): Promise<void> {
    if (!this.state.isVisiting || this.state.startingTabId === undefined) return

    const isProfile = url.includes('/in/')
    const isOriginalPage = url === this.state.originalPage

    const tab = await chrome.tabs.get(this.state.startingTabId)
    if (!tab || tab.url !== url) return

    if (isProfile) {
      console.log('On profile page, waiting before navigating back')

      // Wait for the page to load
      await this.profileVisitor.delay(5, 30)

      // Send connection request
      const connectionRequester = new ConnectionRequester(
        this.state.startingTabId
      )
      await connectionRequester.sendConnectionRequestToContent()
      await this.profileVisitor.delay(2, 5)

      // Back to previous page
      this.state.isProfileLoaded = true
      this.state.visitedProfiles.push(url)
      await this.profileVisitor.navigateBack()
    } else if (isOriginalPage) {
      console.log('Back to original page, visiting next profile')
      await this.profileVisitor.delay(10, 20)
      this.profileVisitor.visitNextProfile()
    }
  }
}

// Initialize the background script
new ProfileVisitorBackground()
