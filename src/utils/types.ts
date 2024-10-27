export interface ProfileVisitorState {
  visitedProfiles: string[]
  profileLinks: string[]
  currentIndex: number
  isVisiting: boolean
  originalPage: string
  startingTabId?: number
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
