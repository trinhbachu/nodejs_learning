var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

var server = http.createServer((req, res) => {
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


});
server.listen(3000, () => console.log('Server is running in port 3000!'));

var handlers = {};
handlers.sample = (data, callback) => {
    callback(406, {'name': 'sample handler'});
}
handlers.notFound = (data, callback) => {
    callback(404);
}
var router = {
    'sample': handlers.sample
}