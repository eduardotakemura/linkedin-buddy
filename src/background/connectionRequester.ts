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
      const response = await chrome.tabs.sendMessage(this.tabId, {
        action: 'sendConnectRequest',
      })
      if (response.status !== 'completed') {
        console.log('Connection request failed:', response.error)
      }
    } catch (error) {
      console.error('Failed to send connection request message:', error)
    }
  }
}
