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
  }
  private profileVisitor: ProfileVisitor

  constructor() {
    this.profileVisitor = new ProfileVisitor(this.state)
    this.initializeListeners()
  }

  initializeListeners() {
    console.log('Background service worker initialized')

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Background received message:', message)

      try {
        if (message.action === 'startVisiting') {
          this.startVisitingProcess()
        } else if (message.action === 'stopVisiting') {
          console.log('Stopping')
          this.state.isVisiting = false
        } else if (message.action === 'getProfileLinks') {
          console.log('Received profile links:', message.data)
          this.state.profileLinks = message.data
          this.state.originalPage = sender.tab?.url || ''
          this.profileVisitor.visitNextProfile()
        }
      } catch (error) {
        console.error('Error processing message:', error)
        sendResponse({ error })
      }
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && this.state.isVisiting) {
        this.handlePageLoad(tab.url || '')
      }
    })
  }

  private async startVisitingProcess(): Promise<void> {
    console.log('Starting visiting process')
    this.state.isVisiting = true
    this.state.currentIndex = 0

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) {
      this.state.startingTabId = tab.id
      chrome.tabs.sendMessage(tab.id, { action: 'getProfileLinks' })
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
      await this.profileVisitor.delay(10000 + Math.random() * 10000)

      // Send connection request
      const connectionRequester = new ConnectionRequester(
        this.state.startingTabId
      )
      await connectionRequester.sendConnectionRequestToContent()

      // Last delay
      await this.profileVisitor.delay(10000 + Math.random() * 10000)

      // Back to previous page
      this.state.visitedProfiles.push(url)
      await this.profileVisitor.navigateBack()
    } else if (isOriginalPage) {
      console.log('Back to original page, visiting next profile')
      await this.profileVisitor.delay(3000 + Math.random() * 2000)
      this.profileVisitor.visitNextProfile()
    }
  }

  // private async sendConnectionRequestToContent(tabId: number): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     // Set up a one-time response listener for the content script's reply
  //     const responseHandler = (message: Message) => {
  //       if (message.action === 'connectRequestComplete') {
  //         chrome.runtime.onMessage.removeListener(responseHandler) // Remove listener after receiving response
  //         console.log('Connection request completed')
  //         resolve()
  //       }
  //     }
  //     chrome.runtime.onMessage.addListener(responseHandler)

  //     // Send the connect request message to content script
  //     chrome.tabs.sendMessage(tabId, { action: 'sendConnectRequest' })
  //     console.log('Sent the connection request')
  //   })
  // }
}

// Initialize the background script
new ProfileVisitorBackground()
