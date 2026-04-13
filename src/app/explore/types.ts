import React from "react"

export interface Person {
  id: number
  name: string
  age: number
  occupation: string
  company: string
  city: string
  area: string
  bio: string
  imageUrl: string
  matchScore: number
  tags: string[]
  budget: number
  intent: "join_room" | "have_room" | "team_up"
  prompts?: { question: string; answer: string }[]
  lifestyle?: string[]
}

export interface BaseFeedItem {
  id: string
  type: "person" | "room" | "group" | "insight" | "event" | "nudge"
}

export interface PersonItem extends BaseFeedItem {
  type: "person"
  person: Person
}

export interface RoomItem extends BaseFeedItem {
  type: "room"
  title: string
  price: number
  spotsLeft: number
  totalSpots: number
  area: string
  city: string
  imageUrl: string
  tags: string[]
}

export interface GroupItem extends BaseFeedItem {
  type: "group"
  matchScore: number
  members: { name: string; imageUrl: string }[]
  tags: string[]
}

export interface InsightItem extends BaseFeedItem {
  type: "insight"
  targetName: string
  pros: string[]
}

export interface EventItem extends BaseFeedItem {
  type: "event"
  title: string
  date: string
  location: string
  attendees: number
  imageUrl: string
}

export interface NudgeItem extends BaseFeedItem {
  type: "nudge"
  title: string
  description: string
  actionLabel: string
}

export type FeedItem = PersonItem | RoomItem | GroupItem | InsightItem | EventItem | NudgeItem
