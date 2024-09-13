import { pipe,flow } from "fp-ts/lib/function.js";
import { map } from "fp-ts/lib/Array.js";
import { weiboUserContainerIdFetch,weiboUserLatestWeiboFetch } from "./weibo.js";
import { parseTabInfoFromInitResponseBody,extractUserWeiboContainerId } from "./parser.js";

export const fetchUserLatestWeiboByUID = (uid:string) => pipe(
    weiboUserContainerIdFetch(uid),
)