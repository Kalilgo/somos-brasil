export type Reaction = '🔥' | '❤️' | '😐' | '🙅'
export type IdeaStatus = 'proposal' | 'discussing' | 'confirmed' | 'discarded'
export type TripStatus = 'planning' | 'confirmed' | 'done'
export type Currency = 'USD' | 'BRL' | 'ARS' | 'MXN' | 'EUR'

export interface AppUser {
  id: string
  name: string
  emoji: string
  color: string
  bio: string | null
  sort_order: number
  created_at: string
}

export interface Trip {
  id: string
  name: string
  description: string | null
  currency: Currency
  start_date: string | null
  end_date: string | null
  status: TripStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface TripMember {
  trip_id: string
  user_id: string
  joined_at: string
  arrival_date: string | null
  departure_date: string | null
}

export interface Category {
  id: string
  slug: string
  name: string
  emoji: string
  color: string
  sort_order: number
}

export interface Idea {
  id: string
  trip_id: string
  category_id: string
  user_id: string
  title: string
  description: string | null
  link: string | null
  image_url: string | null
  price: number | null
  currency: Currency
  status: IdeaStatus
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  idea_id: string
  user_id: string
  reaction: Reaction
  created_at: string
}

export interface IdeaComment {
  id: string
  idea_id: string
  user_id: string
  body: string
  created_at: string
}

export interface ItineraryItem {
  id: string
  trip_id: string
  idea_id: string
  day_number: number
  sort_order: number
  notes: string | null
  added_by: string
  created_at: string
}

export interface Badge {
  id: string
  key: string
  name: string
  description: string
  emoji: string
  color: string
  criteria: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
}

export type VoteCounts = Record<Reaction, number>

export interface IdeaWithRelations extends Idea {
  category?: Pick<Category, 'id' | 'slug' | 'name' | 'emoji' | 'color'> | null
  proposer?: AppUser | null
  votes: Vote[]
  vote_counts: VoteCounts
  comments_count: number
  my_vote: Reaction | null
  in_itinerary: boolean
}

export interface LeaderboardRow {
  user_id: string
  name: string
  emoji: string
  color: string
  score: number
  ideas: number
  votes: number
  comments: number
  streak_days: number
}

export interface TripSummary {
  totals_per_category: {
    category_id: string
    slug: string
    name: string
    emoji: string
    color: string
    total: number | null
    count: number
  }[]
  totals_per_currency: { currency: Currency; total: number | null }[]
  per_person: { currency: Currency; total: number | null; per_member: number | null }[]
  confirmed_count: number
  member_count: number
  trip_currency: Currency
}