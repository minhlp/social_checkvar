export interface ITwitterFollowerRecord {
  name?: string
  profileLink?: string | null
  isVerifiedAccount?: boolean
  isFollowed?: boolean
}
export interface ITwitterProfile {
  name?: string
  profileLink?: string | null
  verifiedFollowers: number
  followers: number
  followerRecords: ITwitterFollowerRecord[]
}
