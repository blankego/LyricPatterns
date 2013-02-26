var app = require('express')();
app.get('/', function (req, res) {
   res.send("Hello world");
}).listen(7777);
console.log("App started...");