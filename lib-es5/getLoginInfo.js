'use strict';

/**
 * 1 通过xml文件获取 运维地址
 * 2 getInfo 获取运维信息
 * 3 getEpProfile 获取企业信息
 * 4 getMemberInfo 获取登录所选组
 * 5 updateInfo 更新模式
 */
var fetchAsync = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(un, pwd, switchNumber, callintype) {
        var PWD, server, infoData, webParam, EsInfo, memberInfo, updateInfo;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // 获取 运维服务器地址 
                        PWD = _sparkMd2.default.hash(pwd);
                        _context.next = 3;
                        return loadXMLForServer(switchNumber);

                    case 3:
                        server = _context.sent;
                        _context.next = 6;
                        return getInfo(un, PWD, switchNumber, server);

                    case 6:
                        infoData = _context.sent;

                        logger.debug(infoData);
                        localStorage.setItem("server", infoData.data.real_domain);

                        if (!(infoData.code != 200)) {
                            _context.next = 11;
                            break;
                        }

                        return _context.abrupt('return', { code: 50001, info: '获取失败', step: "getInfo" });

                    case 11:
                        webParam = {
                            un: un,
                            pwd: PWD,
                            eid: infoData.data.eid
                        };

                        localStorage.setItem("eid", infoData.data.eid);
                        _context.next = 15;
                        return webApiHandler('getEpProfile', webParam);

                    case 15:
                        EsInfo = _context.sent;

                        if (!(EsInfo.code != 200)) {
                            _context.next = 18;
                            break;
                        }

                        return _context.abrupt('return', EsInfo);

                    case 18:
                        _context.next = 20;
                        return webApiHandler('getMemberInfo', webParam);

                    case 20:
                        memberInfo = _context.sent;

                        if (!(memberInfo.code != 200)) {
                            _context.next = 23;
                            break;
                        }

                        return _context.abrupt('return', memberInfo);

                    case 23:
                        webParam.jsonStr = JSON.stringify({ "data": { "callintype": 4 } });
                        _context.next = 26;
                        return webApiHandler('updateInfo', webParam);

                    case 26:
                        updateInfo = _context.sent;

                        if (!(updateInfo.code != 200)) {
                            _context.next = 29;
                            break;
                        }

                        return _context.abrupt('return', updateInfo);

                    case 29:
                        return _context.abrupt('return', { code: 200, serverInfo: infoData.data, epInfo: EsInfo, groupInfo: null, memberInfo: memberInfo });

                    case 30:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function fetchAsync(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
}();
// 读取xml文件 获取请求服务器
// todo  目前只支持谷歌


// 获取企业服务器信息
var getInfo = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(un, pwd, switchNumber, server) {
        var url, params, response, data, returnData;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        url = new URL('https://' + server + ':1047/Api/Client/getinfo');
                        params = {
                            un: un,
                            pwd: pwd,
                            switchNumber: switchNumber,
                            cFlag: 1
                        };

                        url.search = new URLSearchParams(params);
                        logger.debug('await fetch ' + url);
                        _context2.next = 6;
                        return fetch(url);

                    case 6:
                        response = _context2.sent;
                        _context2.next = 9;
                        return response.json();

                    case 9:
                        data = _context2.sent;
                        returnData = {
                            domain: data.data.domain,
                            sipPort: data.data.port,
                            real_domain: data.data.real_domain,
                            http_port: data.data.http_port,
                            https_port: data.data.http_ports,
                            epName: data.data.epName,
                            eid: data.data.eid
                        };

                        logger.debug('getinfo:' + JSON.stringify(returnData));
                        return _context2.abrupt('return', { code: 200, info: '获取运维信息成功', data: returnData });

                    case 13:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function getInfo(_x5, _x6, _x7, _x8) {
        return _ref2.apply(this, arguments);
    };
}();

/**
 * 
 * @param {请求方法名} functionName 
 * @param {请求参数} webParam 
 */


var webApiHandler = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(functionName, webParam) {
        var server, baseUrl, param, url, response, resultData, returnData, data, groupData, groups;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        server = localStorage.getItem('server');
                        baseUrl = 'https://' + server + '/Talk/Api/';
                        param = webParam;
                        url = '';
                        url = new URL(baseUrl + functionName);

                        url.search = new URLSearchParams(param);
                        logger.debug(functionName + ' await fetch ' + url);
                        logger.debug(functionName + ' param ' + JSON.stringify(webParam));
                        _context3.next = 10;
                        return fetch(url);

                    case 10:
                        response = _context3.sent;
                        _context3.next = 13;
                        return response.json();

                    case 13:
                        resultData = _context3.sent;

                        if (!(resultData.status !== 0)) {
                            _context3.next = 16;
                            break;
                        }

                        return _context3.abrupt('return', { code: 50002, info: resultData.info, step: functionName });

                    case 16:
                        returnData = {};
                        // 返回数据处理

                        _context3.t0 = functionName;
                        _context3.next = _context3.t0 === 'getEpProfile' ? 20 : _context3.t0 === 'getGroups' ? 23 : _context3.t0 === 'getMemberInfo' ? 27 : _context3.t0 === 'updateInfo' ? 33 : 35;
                        break;

                    case 20:
                        data = resultData.data.epProfile;

                        returnData = {
                            dialing_display_set: data.dialing_display_set,
                            incoming_call_remind: data.incoming_call_remind,
                            outcallenterprisenumber: data.outcallenterprisenumber,
                            switch_number_public_set_mode: data.switch_number_public_set_mode,
                            switch_number_default: data.switch_number_default,
                            allow_customer_manager: data.allow_customer_manager,
                            allow_callcenter: data.allow_callcenter,
                            allow_auto_answer: data.allow_auto_answer,
                            allow_hide_number: data.allow_hide_number,
                            allow_worksheet: data.allow_worksheet,
                            allow_monitor: data.allow_monitor,
                            allow_record_manager: data.allow_record_manager
                        };
                        return _context3.abrupt('break', 36);

                    case 23:
                        groupData = resultData.data;
                        groups = groupData.map(function (m) {
                            return {
                                id: m.id,
                                eid: m.eid,
                                name: m.name,
                                oid: m.oid,
                                pid: m.pid,
                                level: m.level
                            };
                        });

                        returnData = groups;
                        return _context3.abrupt('break', 36);

                    case 27:
                        data = resultData.data;
                        groups = data.inGroups.map(function (m) {
                            return {
                                id: m.id,
                                eid: m.eid,
                                name: m.name
                            };
                        });
                        // 存储登录时选组信息

                        localStorage.setItem("groupInfo", JSON.stringify(groups));
                        localStorage.setItem("userInfo", JSON.stringify({ id: data.id, eid: data.eid, uid: data.uid, displayname: data.displayname }));
                        returnData = {
                            id: data.id,
                            eid: data.eid,
                            uid: data.uid,
                            displayname: data.displayname,
                            client_brands: data.client_brands,
                            number: data.number,
                            work_number: data.work_number,
                            duty: data.duty,
                            mobile: data.mobile,
                            outside_callnumber: data.outside_callnumber,
                            address: data.address,
                            permission: data.permission,
                            call_limit: data.call_limit,
                            time_limit: data.time_limit,
                            cur_limit_time: data.cur_limit_time,
                            type: data.type,
                            inGroups: groups
                        };
                        return _context3.abrupt('break', 36);

                    case 33:
                        returnData = resultData;
                        return _context3.abrupt('break', 36);

                    case 35:
                        return _context3.abrupt('return', { code: 50003, info: '未知请求' });

                    case 36:
                        logger.debug(functionName + JSON.stringify(returnData));
                        return _context3.abrupt('return', { code: 200, returnData: returnData });

                    case 38:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function webApiHandler(_x9, _x10) {
        return _ref3.apply(this, arguments);
    };
}();

var _Logger = require('../lib/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _sparkMd = require('spark-md5');

var _sparkMd2 = _interopRequireDefault(_sparkMd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var logger = new _Logger2.default('getLoginInfo');

module.exports = _defineProperty({
    fetchAsync: fetchAsync,
    webApiHandler: webApiHandler }, 'webApiHandler', webApiHandler);function loadXMLForServer(number) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "https://localhost:3002/resources/province.xml", false); //创建一个新的http请求，并指定此请求的方法、URL以及验证信息
    xmlhttp.send(null);
    var xmlDoc = xmlhttp.responseXML;

    var data = xmlToJson(xmlDoc);
    console.log(data);
    logger.debug('xmlToJson ' + data);
    var server = getServer(data, number);
    return server;
}
// 先解析测试地址 ，，@todo 
function getServer(data, number) {
    var server = '';
    var serverData = data.TestDistricts[0];
    for (var i = 0; i < serverData.length; i++) {
        var datas = serverData[i];
        for (var j = 0; j < datas.length; j++) {
            var data = datas[j];
            if (data.tagName == 'switchNumbers' && data.textContent.split(',').indexOf(number) !== -1) {
                server = serverData[i][j - 1].textContent;
                break;
            }
        }
    }
    logger.debug('\u8FD0\u7EF4\u5730\u5740 ' + server);
    return server;
}
function xmlToJson(xmlDoc) {
    var root = xmlDoc.firstChild,
        obj = {};
    if (root && root.children && root.children.length > 0) {

        for (var i = 0; i < root.children.length; i++) {
            var arr1 = [];
            var rootChild = root.children[i];
            if (rootChild.nodeName == 'version') continue; //不处理
            if (rootChild.tagName == 'TestDistricts' || rootChild.tagName == 'CurDistricts') {
                var arr2 = [];
                for (var j = 0; j < rootChild.children.length; j++) {
                    var subChildren = rootChild.children[j];
                    var arr3 = [];
                    for (var k = 0; k < subChildren.children.length; k++) {
                        var dataChildren = subChildren.children[k];
                        var data = {
                            tagName: dataChildren.tagName,
                            textContent: dataChildren.textContent
                        };
                        arr3.push(data);
                    }
                    arr2.push(arr3);
                }
                arr1.push(arr2);
            }
            obj[rootChild.tagName] = arr1;
        }
    }
    return obj;
}