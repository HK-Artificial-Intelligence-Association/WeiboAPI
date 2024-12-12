import type { Mblog } from "../container/getIndex.ts";

/**
 * 访问博文详情页时，对应的网页上的 $render_data 的类型
 */
export type RenderData = [{
    status: Mblog
}]