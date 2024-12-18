import { type Card, type GetIndexResponseBody } from "@/types/api/container/getIndex.ts"
import { parseTabInfoFromInitResponseBody, extractUserWeiboContainerId, extractCardInfosFromWeiboResponseBody, parseCardInfosToWeiboInfos, WeiboInfo, RetweetWeiboInfo } from "./parser.ts"
import { Effect, Option } from "effect"
import { ofetch } from "ofetch"
import { fetchBlogFullContent, fetchBlogFullContentEffect } from "./tweet/blogContent.ts"

/**
 * 匹配 fetch 错误
 * @param e 
 * @returns 
 */
export const matchFetchError = (e: Error | unknown): Error => {
    if (e instanceof TypeError) {
        return new Error(`fetch错误 - TypeError -网络故障或CORS配置错误: ${e.message}`)
    }

    if (e instanceof DOMException && e.name === 'AbortError') {
        return new Error('fetch 错误- AbortError - 请求被中止;可见 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/fetch#aborterror')
    }

    if (e instanceof DOMException && e.name === 'NotAllowedError') {
        return new Error('fetch 错误- NotAllowedError - 请求被拒绝;可见 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/fetch#notallowederror')
    }

    return new Error(`fetch 时发生错误 - 未知的错误: ${String(e)}`)
}

export const isWeiboFetchSuccess = (res: GetIndexResponseBody<{ kind: 'init' }> | GetIndexResponseBody<{ kind: 'weibo' }>): boolean => res.ok === 1

/**
 * 返回用于获取用户的 containerId 的 fetch
 * @param uid 
 * @returns 
 */
const weiboUserContainerIdFetchEffect = (uid: string) => Effect.tryPromise({
    try: async () => ofetch<GetIndexResponseBody<{ kind: 'init' }>>(`https://m.weibo.cn/api/container/getIndex`, {
        query: {
            type: 'uid',
            value: uid
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': `https://m.weibo.cn/u/${uid}`
        }
    }),
    catch: matchFetchError
})

export const weiboUserContainerIdFetch = (uid: string) => Effect.runPromise(weiboUserContainerIdFetchEffect(uid))

/**
 * 返回用于获取用户的最新微博的 fetch effect
 * @param uid 
 * @returns 
 */
export const weiboUserLatestWeiboFetchEffect = (uid: string) => (containerId: string) => Effect.tryPromise({
    try: () => ofetch<GetIndexResponseBody<{ kind: 'weibo' }>>(`https://m.weibo.cn/api/container/getIndex`, {
        query: {
            type: 'uid',
            value: uid,
            containerid: containerId
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': `https://m.weibo.cn/u/${uid}`
        }
    }),
    catch: matchFetchError
})

/**
 * 获取用户的最新微博
 * @param uid 
 * @returns 
 */
export const weiboUserLatestWeiboFetch = (uid: string) => (containerId: string) => Effect.runPromise(weiboUserLatestWeiboFetchEffect(uid)(containerId))

export const sampleFetchWeiboUserContainerData = () => weiboUserContainerIdFetchEffect('5576168164')

export const fetchUserLatestWeiboByUIDEffect = (uid: string) =>
        Effect.gen(function* () {
            // 获取原始的卡片数据
            const cardInfosOption = yield* weiboUserContainerIdFetchEffect(uid)
            const isSuccess = isWeiboFetchSuccess(cardInfosOption)
            if (!isSuccess) {
                return yield* Effect.fail(new Error('获取用户最新微博失败，因为新浪微博接口返回的 ok 状态码不为 1'))
            }
            const parsedTabInfo = parseTabInfoFromInitResponseBody(cardInfosOption)
            const extractedResult = extractUserWeiboContainerId(parsedTabInfo)
            if (Option.isNone(extractedResult)) {
                return yield* Effect.fail(new Error('获取用户最新微博失败，因为新浪微博接口返回的 ok 状态码不为 1'))
            }
            const containerId = extractedResult.value
            const weiboResponse = yield* weiboUserLatestWeiboFetchEffect(uid)(containerId)
            const cardInfos = extractCardInfosFromWeiboResponseBody(weiboResponse)
            const result = parseCardInfosToWeiboInfos(Option.getOrElse(cardInfos, () => []))
            return result
        })

/**
 * 根据用户的 UUID 获取用户的最新十条解析后的博文（一般是10条，但不保证，会随着接口变动而更改）
 * 请注意，该函数获得的博文 text 字段不一定是博文的原文。过长的原文会被截断。
 * @param uid 
 * @returns {Promise<WeiboInfo[]>} 返回解析的 WeiboInfo
 */
export const fetchUserLatestWeiboByUID = (uid: string) =>
    Effect.runPromise(fetchUserLatestWeiboByUIDEffect(uid))

const fetchUserLatestWeiboByUIDWithoutParsedEffect = (uid: string) =>
    Effect.gen(function* () {
        const initResponse = yield* weiboUserContainerIdFetchEffect(uid)

        if (!isWeiboFetchSuccess(initResponse)) {
            return yield* Effect.fail(new Error('获取用户最新微博失败，因为新浪微博接口返回的 ok 状态码不为 1，这个状态码是正常获��下应该具备的状态码'))
        }

        const tabInfo = parseTabInfoFromInitResponseBody(initResponse)
        const containerIdOption = extractUserWeiboContainerId(tabInfo)

        const containerId = Option.getOrNull(containerIdOption)
        if (containerId === null) {
            return yield* Effect.fail(new Error('获取 containerId 失败'))
        }
        const weiboResponse = yield* weiboUserLatestWeiboFetchEffect(uid)(containerId)

        const optionResult = extractCardInfosFromWeiboResponseBody(weiboResponse)
        return Option.getOrNull(optionResult)
    })

/**
 * 获取用户的最新十条博文的卡片数据（一般是10条，但不保证，会随着接口变动而更改），但是不进行解析
 * @param uid 
 * @returns 
 */
export const fetchUserLatestWeiboByUIDWithoutParsed = (uid: string) => Effect.runPromise(fetchUserLatestWeiboByUIDWithoutParsedEffect(uid))


/**
 * 获取用户的最新十条博文，并确保博文内容是完整的
 * @param uid 
 * @returns 
 */
export const fetchUserLatestWeiboByUIDEnsureFullTexted = (uid: string) => Effect.runPromise(
    Effect.gen(function* () {
        const weiboInfos = yield* fetchUserLatestWeiboByUIDEffect(uid)

        /**
         * 因为是引用传递，因此能够正确修改 weiboInfos 中的博文内容
         */
        for (const signleWeiboInfo of weiboInfos) {
            const blogId = signleWeiboInfo.weiboId
            const fullContent = yield* fetchBlogFullContentEffect(blogId)
            if (fullContent === null) {
                return yield* Effect.fail(new Error('获取博文全文失败'))
            }
            signleWeiboInfo.text = fullContent.thePostText
            if (fullContent.theRetweetedText !== undefined) {
                 if ('retweetedWeibo' in signleWeiboInfo && signleWeiboInfo.retweetedWeibo) {
                    signleWeiboInfo.retweetedWeibo.text = fullContent.theRetweetedText
                }
            }
        }

        return weiboInfos
    })
)

// const d = await fetchUserLatestWeiboByUIDEnsureFullTexted('7797535872')
