// elevator_read.js
// 用途：读取已捕获的电梯开门码 doorkey 数据并展示
// 查看方式：通知展开可看分字段内容；点击通知进入脚本日志页，Log 中为完整 JSON（可复制）

var data = $persistentStore.read('doorkey');
if (data) {
    // 完整 JSON 输出到日志：点击通知进入的脚本记录页 Log 区会显示，可选中复制
    console.log('[doorkey] ' + data);

    // 通知内分行展示各字段
    var display = data;
    try {
        var o = JSON.parse(data);
        display = 'token: ' + (o.token || '') + '\n'
            + 'bizType: ' + (o.bizType || '') + '\n'
            + 'bizSource: ' + (o.bizSource || '') + '\n'
            + 'userId: ' + (o.userId || '') + '\n'
            + 'areaId: ' + (o.areaId || '') + '\n'
            + 'seqId: ' + o.seqId + '\n'
            + 'h5Source: ' + (o.h5Source || '');
    } catch (e) {
        console.log('[doorkey] 非标准 JSON，按原文展示');
    }

    $notification.post('doorkey 数据', '点通知进日志页可复制完整JSON', display);
} else {
    $notification.post('提示', 'doorkey 暂无数据', '请先点一次开门码');
}
$done();

