import { ofetch } from 'ofetch'
import { Effect } from 'effect'
import { RenderData } from '@/types/api/detail/renderData.ts'

/**
 * 根据博文 ID 获取 render_data
 * @param blogId 
 * @returns 
 */
const fetchBlogRenderDataEffect = (blogId: string) => 
  Effect.tryPromise({
    try: async () => {
      const url = `https://m.weibo.cn/detail/${blogId}`
      const response = await ofetch<string>(url)
      
      // 匹配包含 config 和 $render_data 的完整 script 块
      const scriptMatch = response.match(
        /<script>\s*var config = {[\s\S]*?var \$render_data = (\[[\s\S]*?\])\[0\]/
      )
      
      if (scriptMatch?.[1]) {
        return JSON.parse(scriptMatch[1]) as RenderData
      }
      return null
    },
    catch: (error) => new Error(`Failed to fetch render data: ${(error as Error).message}`)
  })

/**
 * 根据博文 ID 获取 render_data，如果是 null 表示获取失败
 * @param blogId 
 * @returns 
 */
export const fetchBlogRenderData = (blogId: string) => Effect.runPromise(fetchBlogRenderDataEffect(blogId))

/**
 * 传入博文详情页内容，返回博文的正文内容，如果博文是转发别人的博文，theRetweetedText 字段会存在值，否则是 undefined
 * @param renderData 
 * @returns 
 */
const getBlogTrueContent = (renderData: RenderData) => {
    const thePostText = renderData[0].status.text
    const thePostId = renderData[0].status.id
    const thePostUserInfo = renderData[0].status.user
    const thePostMetaData = renderData[0].status
    /**
     * 如果博文是转发别人的博文，那么被转发的博文内容会包含在 retweeted_status 中
     */
    const theRetweetedText = renderData[0].status?.retweeted_status?.text
    const theRetweetedPostId = renderData[0].status?.retweeted_status?.id
    const theRetweetedPostUserInfo = renderData[0].status?.retweeted_status?.user
    const theRetweetedPostMetaData = renderData[0].status?.retweeted_status
    return {
        thePostText,
        theRetweetedText,
        thePostId,
        theRetweetedPostId,
        thePostUserInfo,
        theRetweetedPostUserInfo,
        thePostMetaData,
        theRetweetedPostMetaData
    }
}

export const fetchBlogFullContentEffect = (blogId: string) => fetchBlogRenderDataEffect(blogId).pipe(
    Effect.map(ele => ele === null ? null : getBlogTrueContent(ele)),
    Effect.tapError(error => Effect.fail(null))
)

/**
 * 根据博文 ID 获取博文的全文内容，如果博文存在转发别人的博文，那么被转发的博文内容会存在在 theRetweetedText 字段中，否则该字段的值为 undefined
 * 如果返回结果是 null，那么表示获取失败
 * @param blogId 
 * @returns 
 */
export const fetchBlogFullContent = (blogId: string) => Effect.runPromise(fetchBlogRenderDataEffect(blogId).pipe(
    Effect.map(ele => ele === null ? null : getBlogTrueContent(ele)),
    Effect.tapError(error => Effect.fail(null))
))