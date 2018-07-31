'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jssip = require('jssip');

var _jssip2 = _interopRequireDefault(_jssip);

var _getLoginInfo = require('./getLoginInfo');

var _getLoginInfo2 = _interopRequireDefault(_getLoginInfo);

var _Logger = require('../lib/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events').EventEmitter;
var logger = new _Logger2.default('JsSipWrap');

module.exports = function (_EventEmitter) {
    _inherits(JsSipWrap, _EventEmitter);

    function JsSipWrap() {
        _classCallCheck(this, JsSipWrap);

        var _this = _possibleConstructorReturn(this, (JsSipWrap.__proto__ || Object.getPrototypeOf(JsSipWrap)).call(this));

        _this._ua = null;
        return _this;
    }

    // 登录
    //un, pwd, switchNumber, callintype,socketUri


    _createClass(JsSipWrap, [{
        key: 'login',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(param) {
                var _this2 = this;

                var settings, result, s, eid, socket;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                settings = this.settings;
                                // 首先取http的登录流程 TODO:
                                //un, pwd, switchNumber, callintype

                                _context.prev = 1;
                                _context.next = 4;
                                return _getLoginInfo2.default.fetchAsync(param.un, param.pwd, param.switchNumber, param.callintype);

                            case 4:
                                result = _context.sent;

                                logger.debug(result);
                                s = Number(result.serverInfo.eid); // todo

                                s = s.toString(16);
                                eid = "00000000" + s;

                                eid = eid.substr(s.length, eid.length); // 截取最后8位字符
                                socket = new _jssip2.default.WebSocketInterface(param.socketUri);

                                socket.via_transport = 'auto';
                                this._ua = new _jssip2.default.UA({
                                    uri: 'sip:' + param.un + '_' + eid + '@' + result.serverInfo.domain + ':' + result.serverInfo.sipPort,
                                    password: param.pwd,
                                    display_name: result.memberInfo.returnData.displayname,
                                    sockets: [socket],
                                    registrar_server: result.serverInfo.domain + ':' + result.serverInfo.sipPort,
                                    contact_uri: 'sip:' + param.un + '_' + eid + '@' + result.serverInfo.domain + ':' + result.serverInfo.sipPort,
                                    authorization_user: param.un + '_' + eid,
                                    user_agent: 'callcenter_w_pc_Sipek_win32/r35194'
                                });

                                _context.next = 19;
                                break;

                            case 15:
                                _context.prev = 15;
                                _context.t0 = _context['catch'](1);

                                logger.error(_context.t0);
                                return _context.abrupt('return');

                            case 19:

                                // http 等成功注册sip服务器
                                this._ua.start();

                                /************ 有关注册相关事件 **********************/
                                // 注册成功后服务器推送的事件,这个是基于sip标准,jssip再封装
                                this._ua.on('connecting', function (data) {
                                    _this2.emit('connecting', data);
                                });

                                this._ua.on('connected', function (data) {
                                    _this2.emit('connected', data);
                                });

                                this._ua.on('disconnected', function (data) {
                                    _this2.emit('disconnected', data);
                                });

                                this._ua.on('registered', function (data) {
                                    _this2.emit('registered', data);
                                });

                                this._ua.on('unregistered', function () {
                                    _this2.emit('unregistered', data);
                                });

                                this._ua.on('registrationFailed', function (data) {
                                    _this2.emit('registrationFailed', data);
                                });

                                /******************* 通话相关事件 ******************/
                                // 收到INVITE 消息后调用.
                                this._ua.on('newRTCSession', function (data) {
                                    logger.debug('UA "newRTCSession" event');
                                    _this2.emit('incomingCall', data);
                                });

                                this._ua.on('newMessage', function (data) {
                                    // 收到新的Message
                                    // 对PBX 消息进行处理,先统计一下
                                    /*
                                    a:
                                      1 状态由api端设置为空闲
                                      2 暂离
                                      6 话后处理状态
                                      22 查询通话状态 - 由客户端发给PBX
                                     */
                                    _this2.emit('newMessage', data);
                                });

                            case 28:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[1, 15]]);
            }));

            function login(_x) {
                return _ref.apply(this, arguments);
            }

            return login;
        }()

        // 拨打电话

    }, {
        key: 'call',
        value: function call(target, type) {
            // type = 1 外线拨号  type = 2 回拨  type = 3 内线互拨
            logger.debug('handleOutgoingCall() [uri:"%s"]', target);

            if (type == 1) {
                return this._ua.call(target, {
                    mediaConstraints: {
                        audio: true
                    },
                    rtcOfferConstraints: {
                        offerToReceiveAudio: 1
                    }
                });
            } else if (type == 2) {
                // p 是总机号,应该要从登陆的参数获得 ,i 是时间戳,随机生成
                var xml = '<?xml version="1.0" encoding="utf-8"?><cc a="200" p="02566699734" i="1520488772626763" t=' + target + ' />';
                this.sendMessage('PBX', xml);
            } else if (type == 3) {
                var xml = '<?xml version="1.0" encoding="utf-8"?><cc a="300" p="02566699734" i="1520488772626763" t=' + target + ' />';
                this.sendMessage('PBX', xml);
            }
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._ua.stop();
        }

        // 发送xml消息

    }, {
        key: 'sendMessage',
        value: function sendMessage(target, text, eventHandler) {
            logger.debug('send message!!!,content:' + text + ' target:' + target);
            var eventHandlers = {
                'succeeded': eventHandler['succeeded'],
                'failed': eventHandler['failed']
            };

            // extraHeaders :Array of Strings with extra SIP headers for the MESSAGE request.
            // contentType : Optional String representing the content-type of the body. Default text/plain.
            // eventHandlers : Optional Object of event handlers to be registered to each message event. Define an event handler for each event you want to be notified about.
            var options = {
                'eventHandlers': eventHandlers
                // 'extraHeaders':[ `Contact: ${this.props.settings.contact_uri}` ],
                // 'contentType': 'application/pidf+xml'
            };
            return this._ua.sendMessage(target, text, options);
        }
    }, {
        key: 'isConnected',
        value: function isConnected() {
            return this._ua.isConnected;
        }

        // 修改坐席状态 0 离线  1 空闲  2暂离

    }, {
        key: 'changeStaus',
        value: function changeStaus(status) {
            var xml = '<?xml version="1.0" encoding="utf-8"?><cc a=' + status + '>';
            return this._ua.sendMessage('PBX');
        }

        //挂断

    }]);

    return JsSipWrap;
}(EventEmitter);