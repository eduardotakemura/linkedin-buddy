export interface ProfileVisitorState {
  visitedProfiles: string[]
  profileLinks: string[]
  currentIndex: number
  isVisiting: boolean
  originalPage: string
  startingTabId?: number
  isProfileLoaded: boolean
}

export interface Message {
  action:
    | 'startVisiting'
    | 'stopVisiting'
    | 'getProfileLinks'
    | 'profileVisited'
    | 'sendConnectRequest'
    | 'connectRequestComplete'
  data?: any
}
