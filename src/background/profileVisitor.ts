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
      !this.state.isProfileLoaded
    )
      return
    this.state.isProfileLoaded = false

    if (this.state.currentIndex < this.state.profileLinks.length) {
      const nextProfile = this.state.profileLinks[this.state.currentIndex]
      this.state.currentIndex++

      const tab = await chrome.tabs.get(this.state.startingTabId)
      if (tab && tab.id) {
        console.log('Updating tab to visit next profile')
        await chrome.tabs.update(tab.id, { url: nextProfile })
      } else {
        console.warn('Failed to access this profile, moving to the next.')
        await this.visitNextProfile()
      }
    } else {
      this.state.isVisiting = false
      console.log('Finished Visiting Task.')
      this.cleanupWorkingTab()
    }
  }

  async navigateBack(retries: number = 3): Promise<void> {
    if (this.state.startingTabId === undefined) return
    try {
      const tab = await chrome.tabs.get(this.state.startingTabId)

      if (tab && tab.id) {
        await chrome.tabs.update(tab.id, { url: this.state.originalPage })
        console.log('Navigating back to the original page')
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
      console.log('Closing work tab.')
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
