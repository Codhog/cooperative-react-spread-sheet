var Koa = require('koa');
var app = new Koa();
const config = require('./db')


const server = require('http').createServer(app.callback())
var io = require('socket.io')(server)

let users = new Map()
io.on("connection", (socket) => {
    console.log('ws连接了');

    socket.on('getID', name => {
        users.set(name, socket.id)
        console.log(users, 'Hello');
    })

    // 这里定义socket io 实例 收到 自定义的消息时做出什么行为
    socket.on('skchange', data => {
        console.log('ws表格变动', data);
        io.emit('sknew', data)
        // for ([username, id] of users.entries()) {
        //     console.log('oair', username, id);
        //     if (username !== data.sender) {
        //         io.to(id).emit('sknew', data)
        //     }
        // }
    })

    socket.on('skediting', data => {
        io.emit('skeditcoming', data)

    })

    socket.on('editend', data => {
        console.log('editend', data);
        io.emit('editendcoming', data)

    })
    // 断开后根据id值删除键和值
    socket.on('disconnect', () => {
        console.log('socket断开了', socket.id);
        for ([username, id] of users.entries()) {
            if (id === socket.id) {
                users.delete(username)

            }
        }
        console.log('断开后map', users);
    })

})


server.listen(8080, () => console.log('http:localhost:8080'))
