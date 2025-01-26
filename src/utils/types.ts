export interface ProfileVisitorState {
  profileLinks: string[];
  currentIndex: number;
  isVisiting: boolean;
  originalPage: string;
  startingTabId?: number;
  isProfileLoaded: boolean;
  movingToNextPage: boolean;
  visitedCount: number;
  connectionCount: number;
  connectionLimit: number;
}

export interface ConnectionWithdrawerState {
  isWithdrawing: boolean;
  startingTabId?: number;
  withdrawalCount: number;
}
