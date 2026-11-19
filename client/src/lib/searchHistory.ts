import { useSyncExternalStore } from 'react'
import { GameData } from '../types/game'

// What the dashboard needs from a search result (the full result carries every locked achievement)
export type GameSummary = {
  gameId: number
  gameName: string
  cover?: string
  coverFallback?: string
  total: number
  unlocked: number
}

export type SearchEntry = {
  query: string
  searchedAt: number
  game: GameSummary
}

const STORAGE_KEY = 'trophi:search-history'
const MAX_ENTRIES = 8

function read(): SearchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Tiny external store so the dashboard updates when SearchBox records a search
let entries: SearchEntry[] = read()
const listeners = new Set<() => void>()

function commit(next: SearchEntry[]) {
  entries = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be blocked; the history then lasts until the page closes
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function summarize(game: GameData): GameSummary {
  return {
    gameId: game.gameId,
    gameName: game.gameName,
    cover: game.cover,
    coverFallback: game.coverFallback,
    total: game.totalGameAchievements,
    // `achievements` only holds the locked ones
    unlocked: game.totalGameAchievements - game.achievements.length,
  }
}

// A game appears once: searching it again moves it to the front
export function recordSearch(query: string, game: GameData) {
  const entry: SearchEntry = { query, searchedAt: Date.now(), game: summarize(game) }
  commit([entry, ...entries.filter((e) => e.game.gameId !== game.gameId)].slice(0, MAX_ENTRIES))
}

// Makes a past search the current game again
export function promoteSearch(gameId: number) {
  const found = entries.find((e) => e.game.gameId === gameId)
  if (!found) return
  commit([{ ...found, searchedAt: Date.now() }, ...entries.filter((e) => e.game.gameId !== gameId)])
}

export function useSearchHistory() {
  return useSyncExternalStore(subscribe, () => entries)
}
