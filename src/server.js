const http = require('http');
const url = require('url');
const handler = require('./responses.js');
const query = require('querystring');

const port = process.env.PORT || process.env.NODE_PORT || 3000;


const onRequest = (request, response) => {
  console.log(request.url);

  const parsedUrl = url.parse(request.url);

  // check the request method (get, head, post, etc)
  switch (request.method) {
    case 'GET':
      if (parsedUrl.pathname === '/') {
        // if homepage, send index
        handler.getIndex(request, response);
      } else if (parsedUrl.pathname === '/style.css') {
        // if stylesheet, send stylesheet
        handler.getCss(request, response);
      } else if (parsedUrl.pathname === '/getUsers') {
        // if get users, send user object back
        handler.getUsers(request, response);
      } else if (parsedUrl.pathname === '/updateUser') {
        // if update user, change our user object
        handler.updateUser(request, response);
      } else {
        // if not found, send 404 message
        handler.notFound(request, response);
      }
      break;
    case 'HEAD':
      if (parsedUrl.pathname === '/getUsers') {
        // if get users, send meta data back with etag
        handler.getUsersMeta(request, response);
      } else {
        // if not found send 404 without body
        handler.notFoundMeta(request, response);
      }
      break;
    case 'POST':
      if (parsedUrl.pathname === '/addUser') {
        const res = response;

        const body = [];

        request.on('error', () => {
          res.statusCode = 400;
          res.end();
        });
          
        request.on('data', (chunk) => {
            body.push(chunk);
        });

        request.on('end', () => {
          const bodyString = Buffer.concat(body).toString();

          const bodyParams = query.parse(bodyString);

          handler.addUser(request, res, bodyParams);
        });
      }
      break;
    default:
      // send 404 in any other case
      handler.notFound(request, response);
  }
};

http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

