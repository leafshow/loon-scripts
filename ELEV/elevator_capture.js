// elevator_capture.js
// 用途：捕获电梯开门码相关参数并持久化存储（doorkey）
// 触发：App/H5 中点击「开门码」，拦截 ac_estate_passpopedom 接口响应，
//       从 URL 提取 token/bizSource/h5Source，从响应提取 userId，拼接 doorkey JSON 存储
// 类型：http-response（requires-body=true）

var url = $request.url;
var responseBody = $response.body;
// 获取之前可能已经缓存下来的数据
var cacheToken = $persistentStore.read('cache_token') || '';
var cacheBizSource = $persistentStore.read('cache_bizSource') || '';
var cacheH5Source = $persistentStore.read('cache_h5Source') || '';

// 1. 定义一个从 URL 提取参数的辅助函数
function getParamFromUrl(name, urlStr) {
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)", "i");
    var match = regex.exec(urlStr);
    return match ? decodeURIComponent(match[1]) : '';
}

// 2. 尝试从当前请求的 URL 中提取 token 等信息
var tempToken = getParamFromUrl('token', url) || getParamFromUrl('weixinToken', url);
var tempBizSource = getParamFromUrl('bizSource', url);
var tempH5Source = getParamFromUrl('h5Source', url);

// 3. 如果当前 URL 带有这些参数，就更新缓存（覆盖掉旧的）
if (tempToken) {
    $persistentStore.write(tempToken, 'cache_token');
    cacheToken = tempToken;
}
if (tempBizSource) {
    $persistentStore.write(tempBizSource, 'cache_bizSource');
    cacheBizSource = tempBizSource;
}
if (tempH5Source) {
    $persistentStore.write(tempH5Source, 'cache_h5Source');
    cacheH5Source = tempH5Source;
}

// 4. 如果当前请求是获取开门码的接口
if (url.includes('ac_estate_passpopedom') && responseBody) {
    try {
        var jsonData = JSON.parse(responseBody);
        var targetData = jsonData.obj || jsonData.data;
        
        if (targetData) {
            var userId = targetData.userId || '';
            
            // 拼接最终需要的 JSON 格式
            var finalJson = JSON.stringify({
                token: cacheToken,
                bizType: "JSLIFE",
                bizSource: cacheBizSource,
                userId: userId,
                areaId: "47c5d8c310c84371a9c6006bc3e7100d",
                seqId: 22,
                h5Source: cacheH5Source
            });

            // 存入持久化存储
            $persistentStore.write(finalJson, 'doorkey');

            $notification.post('完整参数提取成功', '已存入持久化数据 doorkey', finalJson);
        }
    } catch (e) {
        console.log('解析开门码接口失败');
    }
}

$done($response);
