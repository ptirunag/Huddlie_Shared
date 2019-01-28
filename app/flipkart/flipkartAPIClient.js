var request = require('request');

var genQueryParams = function (query, method, credentials) {
  var params = '';
  if (method === 'getCategoryFeed') {
    for(var pr in query){
      if(pr != 'trackingId'){
        params = params + pr + '=' + query[pr] + '&';
      }
    }
  } else {
    for(var pr in query){
        params = params + pr + '=' + query[pr] + '&';
    }
  }
  params = params.substring(0, params.length - 1);
  return params;
}

var genFlipkartUrl = function(query, credentials, method) {
  var url = '';
  if (method === 'keywordSearch') {
    preUrl = credentials.responseType === 'xml' ? 'https://affiliate-api.flipkart.net/affiliate/1.0/search.json?' : 'https://affiliate-api.flipkart.net/affiliate/1.0/search.json?';
    url = preUrl + genQueryParams(query, method, credentials);
    console.log('url = '+url);
  }
  // else if (method === 'idSearch') {
  //   preUrl = credentials.responseType === 'xml' ? 'https://affiliate-api.flipkart.net/affiliate/product/xml?' : 'https://affiliate-api.flipkart.net/affiliate/product/json?';
  //   url = preUrl + genQueryParams(query, method, credentials);
  // }
  // else if (method === 'getAllOffers') {
  //   preUrl = credentials.responseType === 'xml' ? 'https://affiliate-api.flipkart.net/affiliate/offers/v1/all/xml' : 'https://affiliate-api.flipkart.net/affiliate/offers/v1/all/json';
  //   url = preUrl;
  // }
  // else if (method === 'getDealsOfDay') {
  //   preUrl = credentials.responseType === 'xml' ? 'https://affiliate-api.flipkart.net/affiliate/offers/v1/dotd/xml' : 'https://affiliate-api.flipkart.net/affiliate/offers/v1/dotd/json';
  //   url = preUrl;
  // }
  // else if (method === 'getOrdersReport') {
  //   preUrl = credentials.responseType === 'xml' ? 'https://affiliate-api.flipkart.net/affiliate/report/orders/detail/xml?' : 'https://affiliate-api.flipkart.net/affiliate/report/orders/detail/json?';
  //   url = preUrl + genQueryParams(query, method, credentials);
  // }
  // else if (method === 'getAppInstReport') {
  //   preUrl = credentials.responseType === 'xml' ? 'https://affiliate-api.flipkart.net/affiliate/v1/appInstall/xml?' : 'https://affiliate-api.flipkart.net/affiliate/v1/appInstall/json?';
  //   url = preUrl + genQueryParams(query, method, credentials);
  // }
  // else if (method === 'getCategoryFeed') {
  //   preUrl = credentials.responseType === 'xml' ? '.xml' : '.json';
  //   url = 'https://affiliate-api.flipkart.net/affiliate/api/' + query['trackingId'] + preUrl + genQueryParams(query, method, credentials);
  // }
  // else if (method === 'getProductsFeed') {
  //   url = query['url'];
  // }
  return url;
}

var runFKQuery = function (credentials, method) {
  return function (query, cb) {
    var url = genFlipkartUrl(query, credentials, method);
    if (typeof cb === 'function') {
      request.get({
        'url' : url,
        'headers' : {
          'Fk-Affiliate-Id' : credentials.FkAffId,
          'Fk-Affiliate-Token' : credentials.FkAffToken
        }
      }, function(err, response, body){
        if (err) {
          cb(err);
        }
        else if (!response) {
          cb("No response recieved (check internet connection)");
        }
        else if (response.statusCode == 400) {
          cb("Error: Bad request. Invalid input parameters");
        }
        else if (response.statusCode == 401) {
          cb("Error: Unauthorized. API Token or Affiliate Tracking ID invalid");
        }
        else if (response.statusCode == 403) {
          cb("Error: Forbidden. Tampered URL");
        }
        else if (response.statusCode == 404) {
          cb("Error: Not found");
        }
        else if (response.statusCode == 410) {
          cb("Error: URL expired");
        }
        else if (response.statusCode == 500) {
          cb("Error: Internal server error");
        }
        else if (response.statusCode == 503) {
          cb("Error: Service unavailable");
        }
        else if (response.statusCode == 599) {
          cb("Error: Connection timed out");
        }
        else if (response.statusCode == 200){
          cb(null, body);
        }else{
          cb(response);
        }
      });
    }
  }
}


var createClient = function (credentials) {
  return {
    keywordSearch: runFKQuery(credentials, 'keywordSearch')
    // ,
    // idSearch: runFKQuery(credentials,'idSearch'),
    // getAllOffers: runFKQuery(credentials,'getAllOffers'),
    // getDealsOfDay: runFKQuery(credentials,'getDealsOfDay'),
    // getOrdersReport: runFKQuery(credentials,'getOrdersReport'),
    // getAppInstReport: runFKQuery(credentials,'getAppInstReport'),
    // getCategoryFeed: runFKQuery(credentials,'getCategoryFeed'),
    // getProductsFeed: runFKQuery(credentials,'getProductsFeed')
  };
};

exports.createClient = createClient;