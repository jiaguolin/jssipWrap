## 对jssip的包装
主要是想单独分开处理PBX的各种sip消息

### 使用
 > npm install jssipwrap


```javascript
var ua = new JsSIPWrap(config)
// 具体配置信息和字段和jssip 一样,除了socekts不需要配置
```

创建完成后,需要登录


### 登录
`ua.login();`

登录成功后就可以监听各类事件.目前定义有如下:

```
 // 注册登录相关
connecting
connected
disconnected
registered
unregistered
registrationFailed

//会话相关
newRTCSession

// 收到新的消息
newMessage
由于消息都是xml ,且PBX 的消息种类比较多,后面需要对每个不同的消息分别定义不同事件,外层使用不用关心PBX消息类型
```
### 拨打电话

```
 ua.call(target, type)

// target 的是呼叫号码 ,type 是呼叫的类型 1:外线直接呼叫 2:回拨  3:内线互拨
```

### 挂断
`ua.stop()`
### 发送xml消息

```
ua.sendMessage(target, text)

//target 消息接受人,需要加企业和分机号拼接 

// 如果发给PBX 的事件,需要单独函数处理,上层不需要关系各种PBX事件
```
### 注意
*  不管是发出invite 或者收到invite消息,session 相关的事件都通过原生RTCSession 来监听
### 后续
* 需要把ring 相关的封装写进来
* 发出的PBX 消息事件接口完善
* 收到的PBX 消息事件接口完善


