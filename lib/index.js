import JsSIP from 'jssip';
import webApi from './getLoginInfo'
import Logger from '../lib/Logger';

const EventEmitter = require('events').EventEmitter;
const logger = new Logger('JsSipWrap');

module.exports = class JsSipWrap extends EventEmitter {

    constructor() {
        super();
        this._ua = null;
    }

    // 登录
    //un, pwd, switchNumber, callintype,socketUri
    async login(param) {
        var settings = this.settings;
        // 首先取http的登录流程 TODO:
        //un, pwd, switchNumber, callintype
        try {
            var result = await webApi.fetchAsync(param.un, param.pwd, param.switchNumber, param.callintype)
            logger.debug(result);
            var s = Number(result.serverInfo.eid); // todo
            s = s.toString(16); 
            var eid = "00000000" + s;
            eid = eid.substr(s.length, eid.length); // 截取最后8位字符
            let socket = new JsSIP.WebSocketInterface(param.socketUri);
            socket.via_transport = 'auto'
            this._ua = new JsSIP.UA({
                uri: `sip:${param.un}_${eid}@${result.serverInfo.domain}:${result.serverInfo.sipPort}`,
                password: param.pwd,
                display_name: result.memberInfo.returnData.displayname,
                sockets: [socket],
                registrar_server: `${result.serverInfo.domain}:${result.serverInfo.sipPort}`,
                contact_uri: `sip:${param.un}_${eid}@${result.serverInfo.domain}:${result.serverInfo.sipPort}`,
                authorization_user: `${param.un}_${eid}`,
                user_agent: 'callcenter_w_pc_Sipek_win32/r35194'
            });

        } catch (error) {
            logger.error(error);
            return;
        }

        // http 等成功注册sip服务器
        this._ua.start();

        /************ 有关注册相关事件 **********************/
        // 注册成功后服务器推送的事件,这个是基于sip标准,jssip再封装
        this._ua.on('connecting', (data) => {
            this.emit('connecting', data);
        });

        this._ua.on('connected', (data) => {
            this.emit('connected', data);
        });

        this._ua.on('disconnected', (data) => {
            this.emit('disconnected', data);
        });

        this._ua.on('registered', (data) => {
            this.emit('registered', data);
        });

        this._ua.on('unregistered', () => {
            this.emit('unregistered', data);
        });

        this._ua.on('registrationFailed', (data) => {
            this.emit('registrationFailed', data);
        });


        /******************* 通话相关事件 ******************/
        // 收到INVITE 消息后调用.
        this._ua.on('newRTCSession', (data) => {
            logger.debug('UA "newRTCSession" event');
            this.emit('incomingCall', data);
        });

        this._ua.on('newMessage', (data) => {
            // 收到新的Message
            // 对PBX 消息进行处理,先统计一下
            /*
            a:
              1 状态由api端设置为空闲
              2 暂离
              6 话后处理状态
              22 查询通话状态 - 由客户端发给PBX

            */
            this.emit('newMessage', data);
        })
    }

    // 拨打电话
    call(target, type) {
        // type = 1 外线拨号  type = 2 回拨  type = 3 内线互拨
        logger.debug('handleOutgoingCall() [uri:"%s"]', target);

        if (type == 1) {
            return this._ua.call(target, {
                mediaConstraints: {
                    audio: true,
                },
                rtcOfferConstraints: {
                    offerToReceiveAudio: 1,
                }
            });
        } else if (type == 2) {
            // p 是总机号,应该要从登陆的参数获得 ,i 是时间戳,随机生成
            var xml = `<?xml version="1.0" encoding="utf-8"?><cc a="200" p="02566699734" i="1520488772626763" t=${target} />`
            this.sendMessage('PBX', xml);
        } else if (type == 3) {
            var xml = `<?xml version="1.0" encoding="utf-8"?><cc a="300" p="02566699734" i="1520488772626763" t=${target} />`
            this.sendMessage('PBX', xml);
        }
    }

    stop() {
        this._ua.stop();
    }

    // 发送xml消息
    sendMessage(target, text,eventHandler) {
        logger.debug(`send message!!!,content:${text} target:${target}`);
        let eventHandlers = {
            'succeeded': eventHandler['succeeded'],
            'failed': eventHandler['failed']
        };

        // extraHeaders :Array of Strings with extra SIP headers for the MESSAGE request.
        // contentType : Optional String representing the content-type of the body. Default text/plain.
        // eventHandlers : Optional Object of event handlers to be registered to each message event. Define an event handler for each event you want to be notified about.
        let options = {
            'eventHandlers': eventHandlers,
            // 'extraHeaders':[ `Contact: ${this.props.settings.contact_uri}` ],
            // 'contentType': 'application/pidf+xml'
        };
        return this._ua.sendMessage(target, text, options);
    }

    isConnected() {
        return this._ua.isConnected;
    }

    // 修改坐席状态 0 离线  1 空闲  2暂离
    changeStaus(status) {
        var xml = `<?xml version="1.0" encoding="utf-8"?><cc a=${status}>`
        return this._ua.sendMessage('PBX')
    }

    //挂断

}