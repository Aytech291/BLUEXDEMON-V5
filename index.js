const moment = require("moment-timezone")
let cluster = require('cluster')
let path = require('path')
let fs = require('fs')
const {
    createServer
} = require("http");
const {
    Server
} = require("socket.io");
const Readline = require('readline')
const yargs = require('yargs/yargs')
const rl = Readline.createInterface(process.stdin, process.stdout)

var isRunning = false
function start(file) {
    if (isRunning) return
    isRunning = true
    let args = [path.join(__dirname, file), ...process.argv.slice(2)]
    cluster.setupMaster({
        exec: path.join(__dirname, file),
        args: args.slice(1),
    })
    let p = cluster.fork()
    p.on('message', data => {
        console.log('[RECEIVED]', data)

        switch (data) {


            case 'reset':
                p.process.kill()
                isRunning = false
                start.apply(this, arguments)
                break


            case 'null':
                p.process.kill()
                isRunning = false
                start.apply(this, arguments)
                break


        }
    })
    p.on('exit', (_, code) => {
        if (code == null) process.exit()
        isRunning = false
        console.error('Exited with code:', code)

        if (code === 0) return
        fs.watchFile(args[0], () => {
            fs.unwatchFile(args[0])
            start(file)
        })
    })
    let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
    if (!opts['test'])
        if (!rl.listenerCount()) rl.on('line', line => {
            p.emit('message', line.trim())
        })
}

start('./database/main.js')