export interface Message {
  action:
    | 'startVisiting'
    | 'stopVisiting'
    | 'getProfileLinks'
    | 'profileVisited'
    | 'sendConnectRequest'
    | 'connectRequestComplete'
    | 'nextPage'
  data?: any
}
