var Koa = require('koa');
var app = new Koa();
const serve = require("koa-static");
const mount = require("koa-mount");
// const config = require('./db')

const static_pages = new Koa();
static_pages.use(serve(__dirname + "/build")); //serve the build directory
app.use(mount("/", static_pages));
  
const server = require('http').createServer(app.callback())
var io = require('socket.io')(server)

const PORT = process.env.PORT || 3000;

let users = new Map()
io.on("connection", (socket) => {
    socket.on('getID', name => {
        users.set(name, socket.id)
    })

    // 这里定义socket io 实例 收到 自定义的消息时做出什么行为
    socket.on('skchange', data => {
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
        io.emit('editendcoming', data)

    })
    // 断开后根据id值删除键和值
    socket.on('disconnect', () => {
        for ([username, id] of users.entries()) {
            if (id === socket.id) {
                users.delete(username)

            }
        }
    })

})


server.listen(PORT, function () {
    console.log("Running on port %s. Visit http://localhost:%s/", PORT, PORT);
});
