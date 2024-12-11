import { ofetch } from 'ofetch'
import { Effect } from 'effect'


/**
 * 根据用户名搜索用户的 uid
 * @param username 
 * @returns 
 */
const searchForUserUIDEffect = (username: string) => 
  Effect.tryPromise({
    try:async () => {
      const encodedUsername = encodeURIComponent(username)
      const url = `https://m.weibo.cn/n/${encodedUsername}`
      const response = await ofetch<string>(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      const match = response.match(/"value":"(\d+)"/)
      if (match && match[1]) {
        return match[1] as string
      }
      return null
    },
    catch: (error) => new Error(`Failed to fetch UID: ${(error as Error).message}`)
  })

/**
 * 根据用户名搜索用户的 uid，如果是 null 表示搜索不到
 * @param username 
 * @returns 
 */
export const searchForUserUID = (username: string) => Effect.runPromise(searchForUserUIDEffect(username))