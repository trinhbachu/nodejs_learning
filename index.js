var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var _data = require('./lib/data');

// _data.create('test', 'newFile', {'foo': 'bar'}, err => {
//     console.log('Error:' + err);
// })
// _data.read('test', 'newFile', (err, data) => {
//     console.log('Err:' + err);
//     console.log('Data:' + data);

// })

_data.update('test', 'newFile', {'foo': 'change'}, (err) => {
    console.log('Error:' + err);
})

var httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});
httpServer.listen(config.httpPort, () => console.log('Server is running in port ' + config.httpPort));

var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem'),
};
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});
httpsServer.listen(config.httpsPort, () => console.log('Server is running in port ' + config.httpsPort));

var unifiedServer = (req, res) => {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/\/+|\/+$/g, '');

    var queryStringObject = parsedUrl.query;

    var headers = req.headers;
    var method = req.method.toLocaleLowerCase();

    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer+= decoder.end();

        const choosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer,
        };

        choosenHandler(data, (statusCode, payload) => {
            buffer += decoder.end();
            statusCode = typeof(statusCode) === 'number' ? statusCode: 200;

            payload = typeof(payload) === 'object' ? payload : new Object();

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log('Response: ', payloadString, statusCode);
        })

        console.log('Request received on path: ' + trimmedPath + ' with method ' + method);
        console.log(queryStringObject);
        console.log(headers);
        console.log(buffer);
    });
}

var handlers = {};
handlers.ping = (data, callback) => {
    callback(200);
}
handlers.notFound = (data, callback) => {
    callback(404);
}
var router = {
    'ping': handlers.ping
}