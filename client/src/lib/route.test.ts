import { describe, expect, it } from 'vitest'
import { parseRoute } from './route'

describe('parseRoute', () => {
  it('opens the library', () => {
    expect(parseRoute('/library')).toEqual({ view: 'library' })
    expect(parseRoute('/library/')).toEqual({ view: 'library' })
  })

  it('opens the page of a game', () => {
    expect(parseRoute('/library/1151640')).toEqual({ view: 'game', gameId: 1151640 })
    expect(parseRoute('/library/1151640/')).toEqual({ view: 'game', gameId: 1151640 })
  })

  it('opens an achievement and decodes its apiname', () => {
    expect(parseRoute('/library/1151640/achievements/ACH_BEAT%20GAME')).toEqual({
      view: 'achievement',
      gameId: 1151640,
      achievementId: 'ACH_BEAT GAME',
    })
  })

  it('opens the profile', () => {
    expect(parseRoute('/profile')).toEqual({ view: 'profile' })
  })

  it('falls back to the dashboard for any other path', () => {
    expect(parseRoute('/')).toEqual({ view: 'dashboard' })
    expect(parseRoute('/dashboard')).toEqual({ view: 'dashboard' })
    expect(parseRoute('/games/1151640')).toEqual({ view: 'dashboard' })
  })

  it('does not treat a non-numeric id as a game', () => {
    expect(parseRoute('/library/abc')).toEqual({ view: 'library' })
    expect(parseRoute('/library/0')).toEqual({ view: 'library' })
  })
})
