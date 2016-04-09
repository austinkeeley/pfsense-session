var request = require('request');
var pRequest = require("promisified-request");
var fScraper = require("form-scraper");

/**
 * @name login
 * @param hostname The pfSense hostname
 * @param username Username to log in with
 * @param password Password to log in with
 * @param cb Callback function
 */
var login = function(hostname, username, password, cb) {

  var pRequestInstance = pRequest.create(request);

  var formProvider = new fScraper.ScrapingFormProvider();
  var formSubmitter = new fScraper.FormSubmitter();

  formProvider.updateOptions({
    url: 'http://' + hostname + '/index.php',
    formId: '#iform',
    pRequest: pRequestInstance
  });

  formSubmitter.updateOptions({
    formProvider: formProvider,
    pRequest: pRequestInstance,
  })
  .submitForm({
    usernamefld: username,
    passwordfld: password,
    login: 'Login'
  })
  .then(function(response) {

    try {
      var sessionCookie = getSessionCookie(response);
    }
    catch (e) {
      cb(e, null);
    }

    // Success! Create a new session object that is really
    // just the hostname and PHPSESSID
    var session = {
      hostname: hostname,
      username: username,
      token: sessionCookie
    };

    cb(null, session);
  },
  function(err) {
    cb(err, null);
  });


};

/**
 * @description Gets the PHPSESSID cookie out of a login response
 */
var getSessionCookie = function(response) {
  if (response.statusCode === 302) {
    if (!response.headers['set-cookie']) {
      throw 'Cookie not set';
    }
    var phpSessionID;
    response.headers['set-cookie'].forEach(function(cookie) {
      var pair = cookie.split(';');
      var keyValue = pair[0].split('=');
      if (keyValue[0] === 'PHPSESSID') {
        phpSessionID = keyValue[1];
        return;
      }
    });
    if (phpSessionID) {
      return phpSessionID;
    }

    throw 'Cookie not set';
  }
  throw 'HTTP 302 not returned';
};

module.exports = {
  login: login
};
