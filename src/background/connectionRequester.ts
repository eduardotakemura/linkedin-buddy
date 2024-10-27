export class ConnectionRequester {
  private tabId: number

  constructor(tabId: number) {
    this.tabId = tabId
  }

  public async sendConnectionRequestToContent(): Promise<void> {
    try {
      const tab = await chrome.tabs.get(this.tabId)
      if (!tab) {
        console.error(`Tab with ID ${this.tabId} not found`)
        return
      }

      // Send the connection request message to the content script
      chrome.tabs.sendMessage(this.tabId, { action: 'sendConnectRequest' })
      console.log('Connection request message sent to content script')
    } catch (error) {
      console.error('Failed to send connection request message:', error)
    }
  }
}
