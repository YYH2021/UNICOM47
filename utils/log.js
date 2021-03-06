const util = require('util')
const axios = require('axios');
const fs = require('fs-extra');
var transParams = (data) => {
    let params = new URLSearchParams();
    for (let item in data) {
        params.append(item, data['' + item + '']);
    }
    return params;
};
var notify_logs = {}
var wrapper_color = (type, msg) => {
    if (process.stdout.isTTY) {
        if (type === 'error') {
            msg = `\x1B[33m${msg}\x1B[0m`
        } else if (type === 'reward') {
            msg = `\x1B[36m${msg}\x1B[0m`
        }
    }
    if (type === 'error') {
        msg = '[âđ€Łđ] ' + msg
    } else if (type === 'reward') {
        msg = '[âđ€©đ] ' + msg
    }
    return msg
}
var stdout_task_msg = (msg) => {
    if ('current_task' in process.env && process.env.current_task) {
        msg = `${process.env.current_task}: ` + msg
    }
    process.stdout.write(msg + '\n')
}
console.notify = function () {
    if ('current_task' in process.env) {
        if (!(process.env.current_task in notify_logs)) {
            notify_logs[process.env.current_task] = []
        }
        notify_logs[process.env.current_task].push(util.format.apply(null, arguments) + '\n')
    }
    stdout_task_msg(util.format.apply(null, arguments))
}

console.log = function () {
    if (process.env.asm_verbose === 'true') {
        stdout_task_msg(util.format.apply(null, arguments))
    }
}

console.info = function () {
    stdout_task_msg(util.format.apply(null, arguments))
}

console.error = function () {
    stdout_task_msg(wrapper_color('error', util.format.apply(null, arguments)))
}

console.reward = function () {
    let type, num
    if (arguments.length === 2) {
        type = arguments[0]
        num = arguments[1]
    } else if (arguments.length === 1) {
        type = arguments[0]
        num = 1

        if (arguments[0].indexOf('ć„ć±ç§Żć') !== -1) {
            type = 'integral'
            num = parseInt(arguments[0])
        }
        if (arguments[0].indexOf('éäżĄç§Żć') !== -1) {
            type = 'txintegral'
            num = parseInt(arguments[0])
        }
        if (arguments[0].indexOf('ćźćç§Żć') !== -1) {
            type = 'dxintegral'
            num = parseInt(arguments[0])
        }
    }

    stdout_task_msg(wrapper_color('reward', util.format.apply(null, [type, num])))

    let taskJson = fs.readFileSync(process.env.taskfile).toString('utf-8')
    taskJson = JSON.parse(taskJson)
    if (!('rewards' in taskJson)) {
        taskJson['rewards'] = {}
    }
    let rewards = taskJson.rewards
    if (!(type in rewards)) {
        rewards[type] = parseInt(num || 0)
    } else {
        rewards[type] += parseInt(num || 0)
    }
    taskJson['rewards'] = rewards

    fs.writeFileSync(process.env.taskfile, JSON.stringify(taskJson))
}

var notify = {
    dingtalk_send: async (desp) => {
        if (desp.length) {
            console.log('äœżçšdingtalkæșćšäșșæšéæ¶æŻ')
            await axios({
                url: `https://oapi.dingtalk.com/robot/send?access_token=${process.env.notify_dingtalk_token}`,
                method: 'post',
                data: {
                    "msgtype": "text",
                    "text": {
                        content: desp
                    },
                }
            }).catch(err => console.log('ćéć€±èŽ„'))
        }
    },
    tele_send: async (desp) => {
        if (desp.length) {
            console.log('äœżçšteleæșćšäșșæšéæ¶æŻ')
            await axios({
                url: `https://api.telegram.org/bot${process.env.notify_tele_bottoken}`,
                method: 'post',
                data: {
                    "method": "sendMessage",
                    "chat_id": process.env.notify_tele_chatid,
                    "text": desp,
                }
            }).catch(err => console.log('ćéć€±èŽ„'))
        }
    },
    sct_send: async (desp) => {
        if (desp.length) {
            console.log('äœżçšServeré±æšéæ¶æŻ')
            await axios({
                url: `https://sctapi.ftqq.com/${process.env.notify_sctkey}.send`,
                method: 'post',
                params: transParams({
                    text: 'ASMä»»ćĄæ¶æŻ',
                    desp
                })
            }).catch(err => console.log('ćéć€±èŽ„'))
        }
    },
    sc_send: async (desp) => {
        if (desp.length) {
            console.log('äœżçšServeré±æšéæ¶æŻ')
            await axios({
                url: `https://sc.ftqq.com/${process.env.notify_sckey}.send`,
                method: 'post',
                params: transParams({
                    text: 'ASMä»»ćĄæ¶æŻ',
                    desp
                })
            }).catch(err => console.log('ćéć€±èŽ„'))
        }
    },
    pushplus_send: async (desp) => {
        if (desp.length) {
            console.log('äœżçšpushplusé±æšéæ¶æŻ')
            await axios({
                url: `http://pushplus.hxtrip.com/send`,
                method: 'post',
                data: {
                    token: process.env.notify_pushplus_token,
                    title: 'ASMä»»ćĄæ¶æŻ',
                    content: desp
                }
            }).catch(err => console.log('ćéć€±èŽ„'))
        }
    },
    buildMsg: () => {
        let msg = ''
        for (let taskName in notify_logs) {
            msg += `**ä»„äžäžș${taskName}ä»»ćĄæ¶æŻ**\n\n`
            msg += notify_logs[taskName].join('\n')
        }
        return msg
    },
    sendLog: async () => {
        if (process.env.notify_sctkey) {
            notify.sct_send(notify.buildMsg())
        }
        if (process.env.notify_sckey) {
            notify.sc_send(notify.buildMsg())
        }
        if (process.env.notify_tele_bottoken && process.env.notify_tele_chatid) {
            notify.tele_send(notify.buildMsg())
        }
        if (process.env.notify_dingtalk_token) {
            notify.dingtalk_send(notify.buildMsg())
        }
        if (process.env.notify_pushplus_token) {
            notify.pushplus_send(notify.buildMsg())
        }
        notify_logs = {}
    }
}

console.sendLog = notify.sendLog

module.exports = notify