# A beginners' guide of implementing co-operative editing document using React and socket.io

#### 1. Tech-Stack:

- React (create-react-app)
- Koa 
- Socket.io
- nodemon for HMR on server side (optional)

(You need Node and npm/yarn installed, as well as some basic webpack knowledge)

#### 2. Abstraction

This App is a simple implementation of co-operative editing document meant for demonstrating how client-ui can work with server through a constant tcp-based connection - Websocket.

#### 3. Folders Structure

**Client Side **(react create-react-app) Client's name folder

​	src

​		Table

​			-> Table.js

​		Cell

​			-> Cell.js

​		Row

​			-> Row.js

​	App.js

​	index.js

**Server Side** (Koa2) Server(API) name folder

server.js

#### 4. The Client side => Capturing events and define behaviors in each event's callback

The code before Introducing Formula is an Excel table with editing function without Math(all the code above Introducing Formula), and we will try to make it **real-time** like Google Docs. When it's done, your code should be similar to https://flaviocopes.com/tutorial-react-spreadsheet/ Before **Introducing Formula**. 

In order to make real-time co-operative edit work, we need to add some events in componentDidMount .

We will add these events:

- sheet's Content changing  
- sheet editing (start and stop)

1. Content Changed Event

When the change of table's content is changed we will emit an event to notify the server, and the other client.

We define the function sendMessage anywhere below the "sonstructor" method and above the render() in Table.js

and call "sendMessage"  in "handleChangedCell" as this function handle the total table data and apply to each cell.

```javascript
  handleChangedCell = ({ x, y }, value) => {
    const modifiedData = Object.assign({}, this.state.data);
    if (!modifiedData[y]) modifiedData[y] = {};
    modifiedData[y][x] = value;
    this.setState({ data: modifiedData });
    this.sendMessage(modifiedData, this.props.displayName)
  };

  sendMessage = (sdata, sendername) => {
    socket.emit("skchange", { 
      data: sdata,
      sender: sendername
    });
  }; 
```

By doing this we send the table data along with sender's name to backend, and backend will respond and transmit a new singal('sknew').

```js
    socket.on('skchange', data => {
          for ([username, id] of users.entries()) {
            if (username !== data.sender) {
                io.to(id).emit('sknew', data)
            }
        }
    })
```

"  socket.broadcast.emit " can also brocasting the data to everyone except the sender.

The Table.js has a state "data" which is essentially the data of each column and row stored in one object.

When one client changed data, we want another client to have the same data.

So we just Transmit the whole data, through server and to another client.

 **Tips!**:we will do this in componentDidmount()

```
  componentDidMount() {
    socket.on("sknew", (sdata) => {
      console.log('sknew接收',sdata);
      this.setState({
        data: sdata.data,
        sender: sdata.sender
      })
      this.forceUpdate()
    });
```

with the server code (shown above)

we shall have the app working like this

![2](\images\2.gif?raw=true)

Now we have the real-time text, let's make others know who is editing.



![3](\images\3.gif?raw=true)



To do that, we need to send out socket signals of "Start Editing" and "End Editing" at "double-clicked" "onBlur" respectively.

```js
  doubleClicked = () => {
    // Prevent click and double click to conflict
    clearTimeout(this.timer);
    this.prevent = true;
    this.emitUnselectAllEvent();
    this.setState({ editing: true, selected: true });
    // Unselect all the otfher cells and set the current
    // Cell state to `selected` & `editing`
    // 双击格子后 发送信号
    socket.emit('skediting', {
      'dataName': this.props.displayName,
      'dataCoor': [this.props.x, this.props.y]
    })
  };
```

Above is how we send the  "Start Editing", and we need to code the receiving signal for this.

Since we want this to happen after the DOM is mounted, we code the behavior on receiving events in componentDidmount()

```
    socket.on('skeditcoming', (data) => {
      console.log('接受修改信号', data);
      // 取消其他选中框
      this.emitUnselectAllEvent();
      this.setState({
        typingName: data.dataName,
        currentXy: [...data.dataCoor],
        editing: true
      })
    })
```

we transfer the data including: the guy's name who is editing, which cell is editing, and the state for editing.

After we finished the "Start Editing" signal, let's get to the "End Editing"

```js
  onBlur = (e) => {
    socket.emit('editend', {
      'xycoor': [this.props.x, this.props.y],
      'newValue': e.target.value
    })
    this.hasNewValue(e.target.value);
  };
```

And the receiving part.

```js
    socket.on('editendcoming', (data) => {
      console.log(data, 'editendcoming+_+_+');
      this.props.onChangedValue(
        {
          x: data.xycoor[0],
          y: data.xycoor[1],
        },
        data.newValue
      );
      this.setState({
        typingName: '',
        currentXy: [],
        // value:data.newValue,
        editing: false
      })
    })
```

**SUM UP**:  Every event we register will have two different names come back and forth,

If we emit "newmessage" to server, after server received it, it need another name to send to client "newMessageComing"

![](\images\4.png?raw=true)

#### 5. Transmitting data through Socket.io

The server side is simplified to demonstrate how socket.io works with http server and client-UI with no touch on database.

First, we create the instance of websocket using Koa.  

Note that Koa requires app.callback() as parameter

```js
const server = require('http').createServer(app.callback())
var io = require('socket.io')(server)
```

 which is unlike express

```
var http = require('http').Server(app);
var io = require('socket.io')(http);
```



Next, in my implementation I used a map collection to record the current logged in users.

```js
let users = new Map()
io.on("connection", (socket)=>{
    console.log('ws on connect');
    
    socket.on('getID', name=>{
        users.set(name, socket.id) 
        console.log(users, 'Hello');
    })
})  
```

I personally chose a customized signal to record each user's information (username, socketId, etc..)

In client side, where login event will trigger this function.  Emitting the "getID" signal while server-side store and handle the users' information.

```js
  handleLogin = () => {
    socket.emit("getID", this.username.current.value);
    this.setState({
      displayTable: true,
    });
  };
```

**Some controversies here:**

The other way around is transmitting information in the callback function of on("connect"),

which means transmitting data over the first/short TCP "touching base" request, seems unstable?  But it's doable and is in the official docs.

But I found it unstable with the **sequence** of setting other state in client side or with other ajax action which required the use of Async decorator to achieve desired code firing order.

Let's also set a customized disconnect event for client, so the global users map object can now update according to users' login/logout action with unique socketID.

users map delete the socketID of disconnected users using map.prototype.delete(), easy right?

Put this block of code inside the scope of  io.on('connection'){} as this is a customized event.

```js
      socket.on('disconnect', ()=>{
        console.log('socket disconnected', socket.id);
        for ([username, id] of users.entries()){
            if(id === socket.id){
                users.delete(username)
                
            }
        }
        console.log('map after disconnected', users);
      })
```

**Tips:**

In fact, all of the customized events need to be put in the scope of 

```
io.on("connection", (socket)=>{
  // put all customized events here
})  
```

Adding the events of cooperative document will use,

-  sheet changing 
-  sheet editing 

The sheet can be now edited while another client knowing it.

Here is what "server/server.js" file will look like

```js
var Koa = require('koa');
var app = new Koa();
//const config = require('./db') omitting the database


const server = require('http').createServer(app.callback())
var io = require('socket.io')(server)

let users = new Map()
io.on("connection", (socket)=>{
    console.log('ws连接了');
    
    socket.on('getID', name=>{
        users.set(name, socket.id) 
        console.log(users, 'Hello');
    })

    // 这里定义socket io 实例 收到 自定义的消息时做出什么行为
    socket.on('skchange', data => {
        console.log('ws表格变动', data);
        for ([username, id] of users.entries()){
            if(username!==data.sender){
                io.to(id).emit('sknew', data)
            }
        }
        console.log('ws发出');
      })

    socket.on('skediting', user => {
        console.log(user, '开始编辑');
        for ([username, id] of users.entries()){
            if(username!==user){
                io.to(id).emit('skeditcoming', user)
            }
        }
    })
    // 断开后根据id值删除键和值
      socket.on('disconnect', ()=>{
        console.log('socket断开了', socket.id);
        for ([username, id] of users.entries()){
            if(id === socket.id){
                users.delete(username)
                
            }
        }
        console.log('断开后map', users);
      })

})


server.listen(8080, () => console.log('http:localhost:8080'))

```

#### 6. References

The react-sheet-ui with no websocket enhanced is based off Flavio Copes(https://flaviocopes.com/) React Excel tutorial.

You can find the full code here [Codhog/cooperative-react-spread-sheet (github.com)](https://github.com/Codhog/cooperative-react-spread-sheet)



