import { type Card, type GetIndexResponseBody } from "@/types/api/container/getIndex.ts"
import { parseTabInfoFromInitResponseBody, extractUserWeiboContainerId, extractCardInfosFromWeiboResponseBody, parseCardInfosToWeiboInfos, WeiboInfo } from "./parser.ts"
import { match } from "fp-ts/lib/Option.js"

/**
 * 匹配 fetch 错误
 * @param e 
 * @returns 
 */
export const matchFetchError = (e:Error):Error =>{
    if (e instanceof TypeError) {
        return new Error(`fetch错误 - TypeError -网络故障或CORS配置错误: ${e.message}`)
    }
    
    if (e instanceof DOMException && e.name === 'AbortError') {
        return new Error('fetch 错误- AbortError - 请求被中止;可见 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/fetch#aborterror')
    }

    if(e instanceof DOMException && e.name === 'NotAllowedError'){
        return new Error('fetch 错误- NotAllowedError - 请求被拒绝;可见 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/fetch#notallowederror')
    }
    
    return new Error(`fetch 时发生错误 - 未知的错误: ${String(e)}`)
}

export const isWeiboFetchSuccess = (res:GetIndexResponseBody<{ kind:'init' }> | GetIndexResponseBody<{ kind:'weibo' }>):boolean => res.ok === 1

/**
 * 返回用于获取用户的 containerId 的 fetch
 * @param uid 
 * @returns 
 */
export const weiboUserContainerIdFetch = (uid:string):Promise<GetIndexResponseBody<{ kind:'init' }>> => fetch(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}`,{
    method:'GET',
    headers:{
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer':`https://m.weibo.cn/u/${uid}`,
    }
}).then(res=>res.json()).catch(matchFetchError)

/**
 * 返回用于获取用户的最新微博的 fetch
 * @param uid 
 * @returns 
 */
export const weiboUserLatestWeiboFetch = (uid:string) => (containerId:string):Promise<GetIndexResponseBody<{ kind:'weibo' }>> => fetch(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}&containerid=${containerId}`,{
    method:'GET',
    headers:{
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer':`https://m.weibo.cn/u/${uid}`,
    }
}).then(res=>res.json()).catch(matchFetchError)

export const sampleFetchWeiboUserContainerData = () => weiboUserContainerIdFetch('5576168164')

/**
 * 根据用户的 UUID 获取用户的最新十条博文（一般是10条，但不保证，会随着接口变动而更改）
 * @param uid 
 * @returns {Promise<WeiboInfo[]>} 返回解析的 WeiboInfo
 */
export const fetchUserLatestWeiboByUID = (uid:string):Promise<WeiboInfo[]> => 
    fetchUserLatestWeiboByUIDWithoutParsed(uid)
    .then(
        (opinionOfCardInfos) => match(
            () => Promise.reject(new Error('获取 cardInfos 失败')),
            (cardInfos:Card[]) => Promise.resolve(parseCardInfosToWeiboInfos(cardInfos)).catch(
                () => Promise.reject(new Error('解析 cardInfos 失败'))
            )
        )(opinionOfCardInfos)
    )

/**
 * 获取用户的最新十条博文的卡片数据（一般是10条，但不保证，会随着接口变动而更改），但是不进行解析
 * @param uid 
 * @returns 
 */
export const fetchUserLatestWeiboByUIDWithoutParsed = (uid:string) => 
    weiboUserContainerIdFetch(uid)
    .then(
        (res) => isWeiboFetchSuccess(res) ? Promise.resolve(res) : Promise.reject(new Error('获取用户最新微博失败，因为新浪微博接口返回的 ok 状态码不为 1'))
    )
    .then(parseTabInfoFromInitResponseBody)
    .then(extractUserWeiboContainerId)
    .then(
        (opinionOfContainerId) => match(
            () => Promise.reject(new Error('获取 containerId 失败')),
            (containerId:string) => weiboUserLatestWeiboFetch(uid)(containerId)
        )(opinionOfContainerId)
    ).then(extractCardInfosFromWeiboResponseBody)