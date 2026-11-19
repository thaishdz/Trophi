import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiResponse, createQueryWrapper } from '../test/queryWrapper'
import { TrackedGame, useTrackGame, useTrackedGames } from './useTrackedGames'

vi.mock('../config', () => ({ API_URL: 'http://api.test/' }))

const SAVED: TrackedGame = { gameId: 1, gameName: 'Hades' }
const NEW: TrackedGame = { gameId: 2, gameName: 'Celeste' }
const fetchMock = vi.fn()

// The server's tracked games, most recent first, updated by PUT and DELETE like the real API
let trackedOnServer: TrackedGame[]

beforeEach(() => {
  trackedOnServer = [SAVED]
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const gameId = Number(url.split('tracked-games/')[1])
    if (init?.method === 'PUT') trackedOnServer = [NEW, ...trackedOnServer]
    if (init?.method === 'DELETE') trackedOnServer = trackedOnServer.filter((g) => g.gameId !== gameId)
    return apiResponse(init?.method === 'GET' ? trackedOnServer : null)
  })
  vi.stubGlobal('fetch', fetchMock)
})

// Both hooks share the same cache, as the game page and the dashboard do
const renderTracked = async (gameId: number) => {
  const { wrapper } = createQueryWrapper()
  const hook = renderHook(() => ({ list: useTrackedGames(), game: useTrackGame(gameId) }), { wrapper })
  await waitFor(() => expect(hook.result.current.list.data).toEqual([SAVED]))
  return hook
}

describe('useTrackGame', () => {
  it('tells whether the game is tracked', async () => {
    const saved = await renderTracked(SAVED.gameId)
    const other = await renderTracked(NEW.gameId)

    expect(saved.result.current.game.tracked).toBe(true)
    expect(other.result.current.game.tracked).toBe(false)
  })

  it('puts a newly tracked game first before the server answers', async () => {
    const { result } = await renderTracked(NEW.gameId)
    let answer: (response: Response) => void = () => {}
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve }))

    act(() => result.current.game.toggle(NEW))

    await waitFor(() => expect(result.current.list.data).toEqual([NEW, SAVED]))
    expect(result.current.game.tracked).toBe(true)
    expect(fetchMock).toHaveBeenLastCalledWith('http://api.test/tracked-games/2', expect.objectContaining({ method: 'PUT' }))

    trackedOnServer = [NEW, SAVED]
    answer(apiResponse(null))
    await waitFor(() => expect(result.current.list.data).toEqual([NEW, SAVED]))
  })

  it('removes a tracked game with DELETE', async () => {
    const { result } = await renderTracked(SAVED.gameId)

    act(() => result.current.game.toggle(SAVED))

    await waitFor(() => expect(result.current.list.data).toEqual([]))
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/tracked-games/1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('rolls back at once if the server rejects the change, without waiting for the reload', async () => {
    const { result } = await renderTracked(NEW.gameId)
    let answer: (response: Response) => void = () => {}
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { answer = resolve }))

    act(() => result.current.game.toggle(NEW))
    await waitFor(() => expect(result.current.list.data).toEqual([NEW, SAVED]))

    // The reload that follows the failure never answers: only the rollback can restore the list
    fetchMock.mockImplementation(() => new Promise(() => {}))
    answer(apiResponse(null, { ok: false }))

    await waitFor(() => expect(result.current.list.data).toEqual([SAVED]))
    expect(result.current.game.tracked).toBe(false)
  })

  it('reports the failure once the list is reloaded', async () => {
    const { result } = await renderTracked(NEW.gameId)
    fetchMock.mockResolvedValueOnce(apiResponse(null, { ok: false }))

    act(() => result.current.game.toggle(NEW))

    await waitFor(() => expect(result.current.game.failed).toBe(true))
    expect(result.current.list.data).toEqual([SAVED])
  })
})
