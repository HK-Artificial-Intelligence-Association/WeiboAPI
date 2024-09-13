import { GetIndexResponseBody } from "@/types/api/container/getIndex.ts"

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
    
    if (e instanceof Error) {
        return new Error(`fetch 错误: ${e.message}`)
    }
    
    return new Error(`fetch 错误 - 未知的错误: ${String(e)}`)
}

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

export const weiboUserLatestWeiboFetch = (uid:string) => (containerId:string):Promise<GetIndexResponseBody<{ kind:'weibo' }>> => fetch(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}&containerid=${containerId}`,{
    method:'GET',
    headers:{
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer':`https://m.weibo.cn/u/${uid}`,
    }
}).then(res=>res.json()).catch(matchFetchError)

export const sampleFetchWeiboUserContainerData = () => weiboUserContainerIdFetch('5576168164')
