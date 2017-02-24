const fs = require('fs');
const crypto = require('crypto');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);

const users = {};

let etag = crypto.createHash('sha1').update(JSON.stringify(users));
let digest = etag.digest('hex');

const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const getCss = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

// with a JSON body (GET)
const respond = (request, response, status, content) => {
  const header = {
    'Content-Type': 'application/json',
    etag: digest,
  };
  response.writeHead(status, header);
  response.write(JSON.stringify(content));
  response.end();
};

// no JSON body (HEAD)
const respondJSONMeta = (request, response, status) => {
  const header = {
    'Content-Type': 'application/json',
    etag: digest,
  };
  response.writeHead(status, header);
  response.end();
};

// GET
const getUsers = (request, response) => {
  const responseJSON = {
    users,
  };

    // check the client's if-none-match header to see the
    // number the client is returning from etag
    // If the version number (originally set by the server in
    // etag) is the same as our current one, then send a 304
    // 304 cannot have a body in it
  if (request.headers['if-none-match'] === digest) {
        // return 304 response without message
        // 304 is not modified and cannot have a body field
        // 304 will tell the browser to pull from cache instead
    return respondJSONMeta(request, response, 304);
  }

    // return 200 with message
  return respond(request, response, 200, responseJSON);
};


// HEAD
const getUsersMeta = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    return respondJSONMeta(request, response, 304);
  }

  return respondJSONMeta(request, response, 200);
};


const addUser = (request, response, body) => {
  const responseJSON = {
    message: 'Name and age are both required.',
  };

  if (!body.name || !body.age) {
    responseJSON.id = 'missingParams';
    return respond(request, response, 400, responseJSON);
  }

    // the default is 201
  let responseCode = 201;

    //
  if (users[body.name]) {
    responseCode = 204;
  } else {
    users[body.name] = {};
  }

    // throw the new users into the object
  users[body.name].name = body.name;
  users[body.name].age = body.age;

    // creating a new hash object
  etag = crypto.createHash('sha1').update(JSON.stringify(users));
    // recalculating the hash digest for etag
  digest = etag.digest('hex');

  if (responseCode === 201) {
    responseJSON.message = 'Created Successfully';
    return respond(request, response, responseCode, responseJSON);
  }

  return respondJSONMeta(request, response, responseCode);
};

// function for 404 not found requests with message
const notFound = (request, response) => {
  // create error message for response
  const responseJSON = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  // return a 404 with an error message
  respond(request, response, 404, responseJSON);
};

// function for 404 not found without message
const notFoundMeta = (request, response) => {
  // return a 404 without an error message
  respondJSONMeta(request, response, 404);
};

// exports to set functions to public
module.exports = {
  getIndex,
  getCss,
  getUsers,
  getUsersMeta,
  addUser,
  notFound,
  notFoundMeta,
};

