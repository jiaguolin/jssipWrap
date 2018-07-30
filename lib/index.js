import JsSIP from 'jssip';
const EventEmitter = require('events').EventEmitter;

import Logger from './Logger';
const logger = new Logger('JsSipWrap');

module.exports = class JsSipWrap extends EventEmitter {

    constructor(settings) {
        super();
        let socket = new JsSIP.WebSocketInterface(settings.socket.uri);
        socket.via_transport = 'auto'
        this._ua = new JsSIP.UA({
            uri: settings.uri,
            password: settings.password,
            display_name: settings.display_name,
            sockets: [socket],
            registrar_server: settings.registrar_server,
            contact_uri: settings.contact_uri,
            authorization_user: settings.authorization_user,
            instance_id: settings.instance_id,
            session_timers: settings.session_timers,
            use_preloaded_route: settings.use_preloaded_route,
            user_agent: 'callcenter_w_pc_Sipek_win32/r35194'
        });
    }

    // 登录
    login(param) {

        // 首先取http的登录流程 TODO:

        // http 等成功注册sip服务器
        this._ua.start();

        /************ 有关注册相关事件 **********************/
        // 注册成功后服务器推送的事件,这个是基于sip标准,jssip再封装
        this._ua.on('connecting', (data) => {
            this.emit('connecting', data);
            logger.debug('-------------');
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
        }else if (type == 3){
            var xml = `<?xml version="1.0" encoding="utf-8"?><cc a="300" p="02566699734" i="1520488772626763" t=${target} />`
            this.sendMessage('PBX', xml);
        }
    }

    stop(){
        this._ua.stop();
    }

    // 发送xml消息
    sendMessage(target, text) {
        logger.debug(`send message!!!,content:${content} target:${target}`);

        let eventHandlers = {
            'succeeded': function (e) {
                //logger.debug(`send message succeeded:${JSON.stringify(e)}`);
                logger.debug(`send message succeeded`);
            },
            'failed': function (e) {
                logger.debug(`send message failed:${JSON.stringify(e)}`);
            }
        };

        // extraHeaders :Array of Strings with extra SIP headers for the MESSAGE request.
        // contentType : Optional String representing the content-type of the body. Default text/plain.
        // eventHandlers : Optional Object of event handlers to be registered to each message event. Define an event handler for each event you want to be notified about.
        let options = {
            'eventHandlers': eventHandlers,
            // 'extraHeaders':[ `Contact: ${this.props.settings.contact_uri}` ],
            'contentType': 'application/pidf+xml'
        };
        return  this._ua.sendMessage(target, content, options);
    }

    isConnected(){
        return this._ua.isConnected;
    }

    // 修改坐席状态 0 离线  1 空闲  2暂离
    changeStaus(status){
        var xml = `<?xml version="1.0" encoding="utf-8"?><cc a=${status}>`
        return this._ua.sendMessage('PBX')
    }

    //挂断
    
}