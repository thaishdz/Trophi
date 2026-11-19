import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiResponse, createQueryWrapper } from '../test/queryWrapper'
import { useFollowedAchievements } from './useFollowedAchievements'

vi.mock('../config', () => ({ API_URL: 'http://api.test/' }))

const GAME_ID = 1151640
const fetchMock = vi.fn()

// The server's list of followed apinames, updated by PUT and DELETE like the real API
let followedOnServer: string[]

beforeEach(() => {
  followedOnServer = ['ACH_FIRST']
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const achievement = decodeURIComponent(url.split(`follows/${GAME_ID}/`)[1] ?? '')
    if (init?.method === 'PUT') followedOnServer = [...followedOnServer, achievement]
    if (init?.method === 'DELETE') followedOnServer = followedOnServer.filter((a) => a !== achievement)
    return apiResponse({ achievements: followedOnServer })
  })
  vi.stubGlobal('fetch', fetchMock)
})

const renderFollowed = async () => {
  const { wrapper } = createQueryWrapper()
  const hook = renderHook(() => useFollowedAchievements(GAME_ID), { wrapper })
  await waitFor(() => expect(hook.result.current.followed.has('ACH_FIRST')).toBe(true))
  return hook
}

describe('useFollowedAchievements', () => {
  it('loads the followed achievements of the game', async () => {
    const { result } = await renderFollowed()

    expect([...result.current.followed]).toEqual(['ACH_FIRST'])
    expect(fetchMock).toHaveBeenCalledWith(`http://api.test/follows/${GAME_ID}`, expect.objectContaining({ method: 'GET' }))
  })

  it('marks an achievement as followed before the server answers', async () => {
    const { result } = await renderFollowed()
    let answer: (response: Response) => void = () => {}
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve }))

    act(() => result.current.toggle('ACH BOSS'))

    await waitFor(() => expect(result.current.followed.has('ACH BOSS')).toBe(true))
    expect(fetchMock).toHaveBeenLastCalledWith(
      `http://api.test/follows/${GAME_ID}/ACH%20BOSS`,
      expect.objectContaining({ method: 'PUT' }),
    )

    followedOnServer = ['ACH_FIRST', 'ACH BOSS']
    answer(apiResponse({ achievements: followedOnServer }))
    await waitFor(() => expect(result.current.followed.has('ACH BOSS')).toBe(true))
  })

  it('unfollows a followed achievement with DELETE', async () => {
    const { result } = await renderFollowed()

    act(() => result.current.toggle('ACH_FIRST'))

    await waitFor(() => expect(result.current.followed.has('ACH_FIRST')).toBe(false))
    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/follows/${GAME_ID}/ACH_FIRST`,
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('rolls back at once if the server rejects the change, without waiting for the reload', async () => {
    const { result } = await renderFollowed()
    let answer: (response: Response) => void = () => {}
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve }))

    act(() => result.current.toggle('ACH BOSS'))
    await waitFor(() => expect(result.current.followed.has('ACH BOSS')).toBe(true))

    // The reload that follows the failure never answers: only the rollback can restore the list
    fetchMock.mockImplementation(() => new Promise(() => {}))
    answer(apiResponse(null, { ok: false }))

    await waitFor(() => expect(result.current.followed.has('ACH BOSS')).toBe(false))
    expect([...result.current.followed]).toEqual(['ACH_FIRST'])
  })

  it('reports the failure once the list is reloaded', async () => {
    const { result } = await renderFollowed()
    fetchMock.mockResolvedValueOnce(apiResponse(null, { ok: false }))

    act(() => result.current.toggle('ACH BOSS'))

    await waitFor(() => expect(result.current.failed).toBe(true))
    expect([...result.current.followed]).toEqual(['ACH_FIRST'])
  })
})
