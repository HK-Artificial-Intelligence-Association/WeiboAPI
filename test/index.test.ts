/**
 * 对于测试单元文件，一律以 .test.ts 为后缀并且放在 test 目录下
 */

import { fetchUserLatestWeiboByUID } from "@/index.ts";
import { Effect } from "effect";

describe('fetchUserLatestWeiboByUID', () => {
    it('should return the latest 10 weibo infos', async () => {
        const weiboInfos = await Effect.runPromise(fetchUserLatestWeiboByUID('5576168164'));
        expect(weiboInfos.length).toBeGreaterThanOrEqual(10);
    });

    it('如果传入的 UID 错误，那么 promise 链应该正确捕捉到该错误', async () => {
        await expect(Effect.runPromise(fetchUserLatestWeiboByUID('12'))).rejects.toThrow('获取用户最新微博失败，因为新浪微博接口返回的 ok 状态码不为 1');
    });
});