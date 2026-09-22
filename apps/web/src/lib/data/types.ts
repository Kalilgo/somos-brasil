import type {
  AppUser,
  Badge,
  Category,
  Idea,
  IdeaComment,
  IdeaStatus,
  IdeaWithRelations,
  ItineraryItem,
  LeaderboardRow,
  Reaction,
  Trip,
  TripSummary,
  UserBadge,
} from '@/types/db'

export interface CreateTripInput {
  name: string
  description?: string | null
  currency: Trip['currency']
  start_date?: string | null
  end_date?: string | null
  memberIds: string[]
}

export interface CreateIdeaInput {
  trip_id: string
  category_id: string
  user_id: string
  title: string
  description?: string | null
  link?: string | null
  image_url?: string | null
  price?: number | null
  currency: Trip['currency']
}

export interface ItineraryRow extends ItineraryItem {
  idea?: Idea | null
}

export interface ItineraryView {
  days: { day_number: number; items: ItineraryRow[] }[]
}

export interface LeaderboardResult {
  ranking: LeaderboardRow[]
  badges: (UserBadge & { badge?: Badge | null })[]
  newly_earned: (UserBadge & { badge?: Badge | null })[]
}

export interface MemberPlan {
  user_id: string
  arrival_date: string | null
  departure_date: string | null
  location: string | null
}

export type SetMemberPlanInput = Pick<MemberPlan, 'arrival_date' | 'departure_date' | 'location'>

export interface DataRepo {
  readonly kind: 'demo' | 'supabase'

  listUsers: () => Promise<AppUser[]>
  listCategories: () => Promise<Category[]>

  listTrips: () => Promise<Trip[]>
  getTrip: (tripId: string) => Promise<Trip | null>
  createTrip: (input: CreateTripInput) => Promise<Trip>
  updateTrip: (tripId: string, patch: Partial<Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'currency'>>) => Promise<Trip>
  getTripMembers: (tripId: string) => Promise<AppUser[]>
  listMemberPlans: (tripId: string) => Promise<MemberPlan[]>
  setMemberPlan: (tripId: string, userId: string, input: SetMemberPlanInput) => Promise<MemberPlan>

  listIdeas: (tripId: string) => Promise<IdeaWithRelations[]>
  createIdea: (input: CreateIdeaInput) => Promise<Idea>
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => Promise<Idea>
  deleteIdea: (ideaId: string) => Promise<void>

  upsertVote: (ideaId: string, userId: string, reaction: Reaction) => Promise<void>
  listComments: (ideaId: string) => Promise<(IdeaComment & { author?: AppUser | null })[]>
  addComment: (ideaId: string, userId: string, body: string) => Promise<IdeaComment>

  listItinerary: (tripId: string) => Promise<ItineraryView>
  addToItinerary: (tripId: string, ideaId: string, dayNumber: number) => Promise<ItineraryItem>
  removeFromItinerary: (itemId: string) => Promise<void>
  moveItineraryItem: (itemId: string, dayNumber: number, sortOrder: number) => Promise<void>

  getTripSummary: (tripId: string) => Promise<TripSummary>
  getLeaderboard: (tripId: string) => Promise<LeaderboardResult>
}

export function whereDiscarded(idea: IdeaWithRelations): boolean {
  return idea.status === 'discarded'
}