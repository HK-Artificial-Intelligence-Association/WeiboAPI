import { type WeiboInfo } from "./parser.ts";

/**
 * 解析结构化的数据为语义化的概括。
 * 将微博信息转化为形如 "XXX 在 2024-01-01 23:59 发布了一条微博，微博内容为："的句子。
 * 其中，
 * - 原创微博句式： "XXX 在 2024-01-01 23:59 发布了一条微博，微博内容为："
 * - 转发微博句式： "XXX 在 2024-01-01 23:59 转发了一条 XXX 于 2024-01-01 23:59 发布的微博。转发的微博内容为：；被转发的微博内容为："
 * @param weiboInfo 
 */
export const analyazeWeiboInfoToOneSentenceSummary = (weiboInfo:WeiboInfo) => {
    if(weiboInfo.action === 'tweet'){
        return `@${weiboInfo.user.name} 在 ${new Date(weiboInfo.createdAt).toLocaleString()} 发布了一条微博，微博内容为：\n ${weiboInfo.text}`
    } 
    return `@${weiboInfo.user.name} 在 ${new Date(weiboInfo.createdAt).toLocaleString()} 转发了一条 @${weiboInfo.retweetedWeibo.user.name} 于 ${new Date(weiboInfo.retweetedWeibo.createdAt).toLocaleString()} 发布的微博。转发的微博内容为：\n "${weiboInfo.text}" \n 被转发的微博内容为：\n "${weiboInfo.retweetedWeibo.text}"`

}