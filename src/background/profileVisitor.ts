import { ProfileVisitorState } from './../utils/types'

export class ProfileVisitor {
  private state: ProfileVisitorState

  constructor(state: ProfileVisitorState) {
    this.state = state
  }

  async visitNextProfile(): Promise<void> {
    if (
      !this.state.isVisiting ||
      this.state.startingTabId === undefined ||
      !this.state.isProfileLoaded ||
      this.state.visitedCount >= this.state.visitingLimit
    )
      return
    this.state.isProfileLoaded = false
    const tab = await chrome.tabs.get(this.state.startingTabId)
    // Retrieve visited profiles array
    const visitedProfiles: string[] = await new Promise((resolve) => {
      chrome.storage.sync.get(['visitedProfiles'], (result) => {
        resolve(result.visitedProfiles || [])
      })
    })

    // Check if there's still links to visit
    if (this.state.currentIndex < this.state.profileLinks.length) {
      const nextProfile = this.state.profileLinks[this.state.currentIndex]
      this.state.currentIndex++
      // Skip if already visited this profile
      if (visitedProfiles.includes(nextProfile)) {
        console.log(
          `Profile ${nextProfile} has already been visited. Skipping.`
        )
        this.state.isProfileLoaded = true
        this.visitNextProfile()
      } else if (tab && tab.id) {
        // Save profile to visitedProfiles, and move to profile page
        chrome.storage.sync.set({
          visitedProfiles: [...visitedProfiles, nextProfile],
        })
        this.state.visitedCount++
        await chrome.tabs.update(tab.id, { url: nextProfile })
      } else {
        console.warn('Failed to access this profile, moving to the next.')
        await this.visitNextProfile()
      }
      // Else, move to next page
    } else {
      const tab = await chrome.tabs.get(this.state.startingTabId)
      await chrome.tabs.sendMessage(tab.id!, { action: 'nextPage' })
      await this.delay(5, 5)
      this.state.movingToNextPage = true
      this.state.isProfileLoaded = true
      // Get links for this page
      await chrome.tabs.sendMessage(tab.id!, { action: 'getProfileLinks' })
    }
  }

  async navigateBack(retries: number = 3): Promise<void> {
    if (this.state.startingTabId === undefined) return
    try {
      const tab = await chrome.tabs.get(this.state.startingTabId)

      if (tab && tab.id) {
        await chrome.tabs.update(tab.id, { url: this.state.originalPage })
      } else if (retries > 0) {
        console.warn(
          `No active tab found, retrying in 3 seconds... (${retries} retries left)`
        )
        await this.delay(3)
        await this.navigateBack(retries - 1)
      } else {
        console.error('Failed to navigate back. Moving to the next profile.')
        await chrome.tabs.goBack()
        await this.delay(10, 30)
        this.visitNextProfile()
      }
    } catch (error) {
      console.error('Error in navigateBack:', error)
      if (retries > 0) {
        console.warn(
          `Retrying navigateBack in 3 seconds... (${retries} retries left)`
        )
        await this.delay(3)
        await this.navigateBack(retries - 1)
      } else {
        console.error('Failed to navigate back. Ending visit.')
        this.visitNextProfile()
      }
    }
  }

  async cleanupWorkingTab(): Promise<void> {
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

  delay(min: number, max: number = min): Promise<void> {
    min = min * 1000
    max = max * 1000
    return new Promise((resolve) =>
      setTimeout(resolve, min + Math.random() * (max - min))
    )
  }
}
