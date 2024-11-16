import { ProfileVisitorState } from '../utils/types'
export class ConnectionRequester {
  private tabId: number
  private state: ProfileVisitorState

  constructor(tabId: number, state: ProfileVisitorState) {
    this.tabId = tabId
    this.state = state
  }

  public async sendConnectionRequestToContent(): Promise<void> {
    try {
      const tab = await chrome.tabs.get(this.tabId)
      if (!tab) {
        console.error(`Tab with ID ${this.tabId} not found`)
        return
      }

      // Send the connection request message to the content script
      const response = await chrome.tabs.sendMessage(this.tabId, {
        action: 'sendConnectRequest',
      })
      console.log(response.status)
      if (response.status.status === 'completed') {
        this.state.connectionCount++
        console.log(`Sent ${this.state.connectionCount} connection requests.`)
        if (this.state.connectionCount >= this.state.connectionLimit) {
          console.log('Connection limit reached. Stopping campaign.')
          await this.cleanupWorkingTab()
        }
      } else if (response?.status.status === 'failed') {
        console.warn(`Failed to send connection request: ${response.error}`)
      }
    } catch (error) {
      console.error('Failed to send connection request message:', error)
    }
  }

  private async cleanupWorkingTab(): Promise<void> {
    if (this.state.startingTabId !== undefined) {
      await chrome.tabs.remove(this.state.startingTabId)
      this.state.startingTabId = undefined
      this.state.isVisiting = false
      chrome.storage.local.set({ task: this.state })
      console.log('Closing Campaign Tab.')
      console.log(
        `Campaign Report: Visited ${this.state.visitedCount} profiles, Sent ${this.state.connectionCount} connection requests.`
      ) // Log report

      // Reset counters
      this.state.visitedCount = 0
      this.state.connectionCount = 0
    }
  }
}
