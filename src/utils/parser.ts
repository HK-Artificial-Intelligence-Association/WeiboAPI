import { GetIndexResponseBody, IndexResponseType } from "@/types/api/container/getIndex.ts"
import { Either } from "fp-ts/lib/Either.js"
import { type Option, fromNullable } from "fp-ts/lib/Option.js"

export function multiply(a: number, b: number) {
  return a * b
}

type ContainerId = string
type IndexResponseKind = IndexResponseType['kind']

export type ParsedTabInfo = {
  [K in IndexResponseType['kind']]?: ContainerId
}



export const parseTabInfoFromInitResponseBody = (res: GetIndexResponseBody<{ kind: 'init' }>): ParsedTabInfo => {
  return res.data.tabsInfo.tabs.reduce((acc, tab) => {
    return {
      ...acc,
      [tab.tabKey]: tab.containerid
    }
  }, {} as ParsedTabInfo)
}

export const extractUserWeiboContainerId = (parsedTabInfo:ParsedTabInfo):Option<ContainerId> => fromNullable(parsedTabInfo.weibo)
