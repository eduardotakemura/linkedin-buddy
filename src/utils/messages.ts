export interface Message {
  action:
    | 'startVisiting'
    | 'stopVisiting'
    | 'getProfileLinks'
    | 'profileVisited'
    | 'sendConnectRequest'
    | 'connectRequestComplete'
    | 'nextPage'
    | 'showSidePanel'
    | 'withdrawConnections';
  data?: any;
}
