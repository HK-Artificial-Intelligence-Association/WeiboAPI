import { Mblog, type Card, type GetIndexResponseBody, type IndexResponseType } from "@/types/api/container/getIndex.ts"
import { Option } from "effect"

export function multiply(a: number, b: number) {
  return a * b
}

type ContainerId = string

export type ParsedTabInfo = {
  [K in IndexResponseType['kind']]?: ContainerId
}

/**
 * 目前看起来只有发原创推文和转发推文的情况
 */
export type WeiboUserActionType = 'tweet' | 'retweet'

export type ParsedWeiboUserInfo = {
  id: number,
  name: string,
  avatar: string,
  description: string
}

export type BaseWeiboInfo = {
  action: WeiboUserActionType
  user: ParsedWeiboUserInfo
  /**
   * 微博文本，包括富文本格式
   */
  text: string
  /**
   * 微博原始文本
   */
  rawText: string
  /**
   * 评论数
   */
  commentsCount: number
  /**
   * 转发数
   */
  retweetCount: number
  /**
   * 点赞数
   */
  attitudesCount: number
  createdAt: string
  /**
   * 博文 Id
   */
  weiboId: string
  /**
   * 发微博的Ip定位
   */
  region?: string
}

/**
 * 原创推文
 */
export type OrginalWeiboInfo = BaseWeiboInfo & {
  action: 'tweet'
}

/**
 * 转发的推文
 */
export type RetweetWeiboInfo = BaseWeiboInfo & {
  action: 'retweet'
  retweetedWeibo: OrginalWeiboInfo
}

export type WeiboInfo = OrginalWeiboInfo | RetweetWeiboInfo


/**
 * 从 init 响应体中解析出 tab 信息,通过 tab 信息中的 ContainerId 获取用户主页中不同分类的微博信息（精选、微博、视频、相册等）
 * @param res 
 * @returns 
 */
export const parseTabInfoFromInitResponseBody = (res: GetIndexResponseBody<{ kind: 'init' }>): ParsedTabInfo => {
  return res.data.tabsInfo.tabs.reduce((acc, tab) => {
    return {
      ...acc,
      [tab.tabKey]: tab.containerid
    }
  }, {} as ParsedTabInfo)
}

export const extractUserWeiboContainerId = (parsedTabInfo: ParsedTabInfo): Option.Option<ContainerId> => 
  Option.fromNullable(parsedTabInfo.weibo)

export const extractCardInfosFromWeiboResponseBody = (res: GetIndexResponseBody<{ kind: 'weibo' }>): Option.Option<Card[]> => 
  Option.fromNullable(res.data.cards)

export const isWeiboBeBlocked = (weibo: Mblog): boolean => weibo.visible.list_id != 0

/**
 * 将卡片信息解析为微博推文信息
 * 需要注意的是微博可能会存在被屏蔽的问题
 * @param cardInfos 
 * @returns 
 */
export const parseCardInfosToWeiboInfos = (cardInfos: Card[]): WeiboInfo[] => {
  return cardInfos
    .filter((card) => card.card_type === 9)
    .map((card, index) => {
      try {
        if (isWeiboBeBlocked(card.mblog)) {
          return null
        }
        const baseInfo = {
          user: {
            id: card.mblog.user.id,
            name: card.mblog.user.screen_name,
            avatar: card.mblog.user.avatar_hd,
            description: card.mblog?.user.description
          },
          text: card.mblog.text,
          rawText: card.mblog.raw_text,
          attitudesCount: card.mblog.attitudes_count,
          commentsCount: card.mblog.comments_count,
          retweetCount: card.mblog.reposts_count,
          createdAt: card.mblog.created_at,
          weiboId: card.mblog.id,
          region: card.mblog.region_name
        }

        if (card.mblog?.retweeted_status && !isWeiboBeBlocked(card.mblog?.retweeted_status)) {
          return {
            ...baseInfo,
            action: 'retweet' as const,
            retweetedWeibo: {
              action: 'tweet' as const,
              user: {
                id: card.mblog.retweeted_status.user.id,
                name: card.mblog.retweeted_status.user.screen_name,
                avatar: card.mblog.retweeted_status.user.avatar_hd,
                description: card.mblog.retweeted_status.user.description
              },
              text: card.mblog.retweeted_status.text,
              rawText: card.mblog.retweeted_status.raw_text,
              commentsCount: card.mblog.retweeted_status.comments_count,
              retweetCount: card.mblog.retweeted_status.reposts_count,
              attitudesCount: card.mblog.retweeted_status.attitudes_count,
              createdAt: card.mblog.retweeted_status.created_at,
              weiboId: card.mblog.retweeted_status.id,
              region: card.mblog.retweeted_status.region_name
            }
          }
        }

        if(card.mblog?.retweeted_status && isWeiboBeBlocked(card.mblog.retweeted_status)) {
          return {
            ...baseInfo,
            action: 'retweet' as const,
            retweetedWeibo: {
              ...baseInfo,
              action: 'tweet' as const,
              text: '该微博已被屏蔽',
              rawText: '该微博已被屏蔽',
              commentsCount: 0,
              retweetCount: 0,
              attitudesCount: 0,
              createdAt: card.mblog.retweeted_status.created_at,
              weiboId: card.mblog.retweeted_status.id,
            }
          }
        }

        return {
          ...baseInfo,
          action: 'tweet' as const
        }

      } catch (error) {
        throw new Error(`解析第 ${index + 1} 个微博信息时出错:${error} \n  微博text:${card.mblog?.text}`)
      }
    })
    .filter(Boolean) as WeiboInfo[]
}