'use strict';

import Logger from './Logger';
import SparkMD5 from 'spark-md5'

const logger = new Logger('getLoginInfo');

module.exports = {
    fetchAsync: fetchAsync,
    webApiHandler, webApiHandler,
};
/**
 * 1 通过xml文件获取 运维地址
 * 2 getInfo 获取运维信息
 * 3 getEpProfile 获取企业信息
 * 4 getMemberInfo 获取登录所选组
 * 5 updateInfo 更新模式
 */
async function fetchAsync(un, pwd, switchNumber, callintype) {
    // 获取 运维服务器地址 
    var PWD = SparkMD5.hash(pwd);
    var server = await loadXMLForServer(switchNumber)
    var infoData = await getInfo(un, PWD, switchNumber, server);
    logger.debug(infoData)
    localStorage.setItem("server", infoData.data.real_domain);

    if (infoData.code != 200) return ({ code: 50001, info: '获取失败', step: "getInfo" });
    var webParam = {
        un: un,
        pwd: PWD,
        eid: infoData.data.eid
    }
    localStorage.setItem("eid", infoData.data.eid);
    var EsInfo = await webApiHandler('getEpProfile', webParam);
    if (EsInfo.code != 200) return EsInfo;
    var memberInfo = await webApiHandler('getMemberInfo', webParam);
    if (memberInfo.code != 200) return memberInfo;
    webParam.jsonStr = JSON.stringify({ "data": { "callintype": 4 } });
    var updateInfo = await webApiHandler('updateInfo', webParam);
    if (updateInfo.code != 200) return updateInfo;

    return ({ code: 200, serverInfo: infoData.data, epInfo: EsInfo, groupInfo: null, memberInfo: memberInfo })

}
// 读取xml文件 获取请求服务器
// todo  目前只支持谷歌
function loadXMLForServer(number) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", "https://localhost:3002/resources/province.xml", false);   //创建一个新的http请求，并指定此请求的方法、URL以及验证信息
    xmlhttp.send(null);
    var xmlDoc = xmlhttp.responseXML;

    var data = xmlToJson(xmlDoc)
    console.log(data)
    logger.debug(`xmlToJson ${data}`);
    var server = getServer(data, number);
    return server;

}
// 先解析测试地址 ，，@todo 
function getServer(data, number) {
    var server = ''
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
    logger.debug(`运维地址 ${server}`);
    return server
}
function xmlToJson(xmlDoc) {
    var root = xmlDoc.firstChild,
        obj = {};
    if (root && root.children && root.children.length > 0) {

        for (var i = 0; i < root.children.length; i++) {
            var arr1 = []
            var rootChild = root.children[i];
            if (rootChild.nodeName == 'version') continue; //不处理
            if (rootChild.tagName == 'TestDistricts' || rootChild.tagName == 'CurDistricts') {
                var arr2 = []
                for (var j = 0; j < rootChild.children.length; j++) {
                    var subChildren = rootChild.children[j];
                    var arr3 = []
                    for (var k = 0; k < subChildren.children.length; k++) {
                        var dataChildren = subChildren.children[k];
                        var data = {
                            tagName: dataChildren.tagName,
                            textContent: dataChildren.textContent
                        }
                        arr3.push(data)
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



// 获取企业服务器信息
async function getInfo(un, pwd, switchNumber, server) {
    var url = new URL('https://' + server + ':1047/Api/Client/getinfo');
    var params = {
        un: un,
        pwd: pwd,
        switchNumber: switchNumber,
        cFlag: 1
    };
    url.search = new URLSearchParams(params);
    logger.debug(`await fetch ${url}`);
    let response = await fetch(url);
    // only proceed once promise is resolved
    let data = await response.json();
    var returnData = {
        domain: data.data.domain,
        sipPort: data.data.port,
        real_domain: data.data.real_domain,
        http_port: data.data.http_port,
        https_port: data.data.http_ports,
        epName: data.data.epName,
        eid: data.data.eid,
    }
    logger.debug(('getinfo:' + JSON.stringify(returnData)));
    return ({ code: 200, info: '获取运维信息成功', data: returnData })
}

/**
 * 
 * @param {请求方法名} functionName 
 * @param {请求参数} webParam 
 */
async function webApiHandler(functionName, webParam) {
    var server = localStorage.getItem('server')
    var baseUrl = 'https://' + server + '/Talk/Api/'
    var param = webParam;
    var url = ''
    var url = new URL(baseUrl + functionName);
    url.search = new URLSearchParams(param);
    logger.debug(`${functionName} await fetch ${url}`);
    logger.debug(`${functionName} param ${JSON.stringify(webParam)}`);
    let response = await fetch(url);
    let resultData = await response.json();
    if (resultData.status !== 0) return { code: 50002, info: resultData.info, step: functionName };
    var returnData = {};
    // 返回数据处理
    switch (functionName) {
        case 'getEpProfile': {
            var data = resultData.data.epProfile;
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
            }
            break;
        }
        case 'getGroups': {
            var groupData = resultData.data;
            var groups = groupData.map(function (m) {
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
            break;
        }
        case 'getMemberInfo': {
            var data = resultData.data;
            var groups = data.inGroups.map(function (m) {
                return {
                    id: m.id,
                    eid: m.eid,
                    name: m.name,
                };
            });
            // 存储登录时选组信息
            localStorage.setItem("groupInfo", JSON.stringify(groups));
            localStorage.setItem("userInfo", JSON.stringify({ id: data.id, eid: data.eid, uid: data.uid, displayname: data.displayname, }));
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
            }
            break;
        }
        case 'updateInfo': {
            returnData = resultData;
            break;
        }
        default: return { code: 50003, info: '未知请求' };
    }
    logger.debug((functionName + JSON.stringify(returnData)));
    return { code: 200, returnData: returnData };
}
