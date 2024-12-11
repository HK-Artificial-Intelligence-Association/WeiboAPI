export interface GetIndexResponseBody<T extends IndexResponseType> {
    data: GetIndexResponseData<T>
    ok: number
}

/**
 * 访问 https://m.weibo.cn/u/5576168164 页面的数据接口定义
 * 该网页统一使用 https://m.weibo.cn/api/container/getIndex?type=uid&value=5576168164&containerid=1005055576168164 这个接口获取数据，通过 containerid 的不同来区分获取不同的数据
 */
export type IndexResponseType = { kind: 'init' } | { kind: 'profile' } | { kind: 'weibo' } | { kind: 'original_video' } | { kind: 'album' }

type GetIndexResponseData<T extends IndexResponseType> = T extends { kind: 'weibo' } ? {
    cardlistInfo: {
        containerid: string
        v_p: number
        show_style: number
        total: number
        autoLoadMoreIndex: number
        since_id: number
    }
    cards: Card[]
    schema:string
    showAppTips:number
} : T extends { kind: 'init' } ? WeiboInitResponse
    : {
        fans_scheme: string
        follow_scheme: string
    }


/**
 * 使用本包调用接口时，相应的博文数据都封装在 Card 的 myblog 中。
 */
export interface Card {
    card_type: number
    commend_info?: CommendInfo[]
    mblog: Mblog
}

interface CommendInfo {
    icon: string
    text: string
    access_right: number
    scheme: string
    action_log: {
        act_code: number
        oid: string
        ext: string
        fid: string
    }
}

export interface Mblog {
    visible: {
        type: number
        list_id: number
    }
    created_at: string
    id: string
    mid: string
    can_edit: boolean
    region_name?:string
    /**
     * 包含 html 标签的博文内容
     * 请注意，在博文详情页接口中，它才会是完整的原文
     */
    text: string
    /**
     * 如果是转发的别人的原微博，那么在 retweeted_status 中不会包括该项
     */
    raw_text?: string
    source: string
    favorited: boolean
    pic_ids: string[]
    is_paid: boolean
    mblog_vip_type: number
    user: User
    reposts_count: number
    comments_count: number
    attitudes_count: number
    pending_approval_count: number
    isLongText: boolean
    show_mlevel: number
    bid: string
    retweeted_status?: Mblog
}

interface User {
    avatar:string
    id: number
    name:string
    screen_name: string
    profile_image_url: string
    profile_url: string
    statuses_count: number
    verified: boolean
    verified_type: number
    close_blue_v: boolean
    description: string
    gender: string
    mbtype: number
    urank: number
    mbrank: number
    follow_me: boolean
    following: boolean
    followers_count: number
    follow_count: number
    cover_image_phone: string
    avatar_hd: string
    like: boolean
    like_me: boolean
    badge: {
        [key: string]: number
    }
}

/**
 * https://m.weibo.cn/api/container/getIndex?type=uid&value=557616816
 * init 时获取的数据
 */
export interface WeiboInitResponse {
    isVideoCoverStyle: number
    isStarStyle: number
    userInfo: UserProfileInfo
    /**
     * 从此处获取要获取不同 tab 数据所需的 containerid
     */
    tabsInfo: TabsInfo
    fans_scheme: string
    follow_scheme: string
    profile_ext: string
    scheme: string
    showAppTips: number
}

interface UserProfileInfo extends User {
    close_blue_v: boolean
    follow_count: number
    followers_count_str: string
    verified_type_ext: number
    verified_reason: string
    friendships_relation: number
    special_follow: boolean
    toolbar_menus: ToolbarMenu[]
    svip: number
}

interface ToolbarMenu {
    type: string
    name: string
    params: {
        [key: string]: any
    }
    actionlog: {
        act_code: string
        fid: string
        oid: string
        cardid: string
        ext: string
    }
    scheme?: string
    sub_type?: number
    userInfo?: User
}

interface TabsInfo {
    selectedTab: number
    tabs: Tab[]
}

interface Tab {
    id: number
    tabKey: IndexResponseType['kind']
    must_show: number
    hidden: number
    title: string
    tab_type: string
    containerid: string
    apipath?: string
    headSubTitleText?: string
    new_select_menu?: number
    gender?: string
    params?: {
        [key: string]: any
    }
    tab_icon?: string
    tab_icon_dark?: string
    url?: string
    filter_group?: FilterGroup[]
    filter_group_info?: FilterGroupInfo
}

interface FilterGroup {
    name: string
    containerid: string
    title: string
    scheme: string
}

interface FilterGroupInfo {
    title: string
    icon: string
    icon_name: string
    icon_scheme: string
}
