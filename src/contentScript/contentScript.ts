chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoConnect') {
    autoConnect()
  }
})

async function autoConnect() {
  // Find all "Connect" buttons on screen
  const connectButtons = document.querySelectorAll(
    'ul.reusable-search__entity-result-list button.artdeco-button[aria-label*="Invite"]'
  ) as NodeListOf<HTMLButtonElement>

  for (const button of connectButtons) {
    // Set random delay and click the button
    const delay = 2000 + Math.random() * 20000
    await new Promise((resolve) => setTimeout(resolve, delay))
    button.click()

    // Wait, select the send button on the modal, set a random delay and click it
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const sendButton = document.querySelector(
      'button[aria-label="Send without a note"]'
    ) as HTMLButtonElement
    if (sendButton) {
      const delay = 1000 + Math.random() * 10000
      await new Promise((resolve) => setTimeout(resolve, delay))
      sendButton.click()
    }
  }
}
