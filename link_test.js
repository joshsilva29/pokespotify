var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: '04893084a5104966975a4ee50f3a5933',
    clientSecret: '14e8d19288e1429bb5fa6dab9b9b8fcd',
    redirectUri: 'http://localhost:8888/callback'
  });

var generateRandomString = function(length) {
var text = '';
var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
}
return text;
};

var code = 'MQCbtKe23z7YzzS44KzZzZgjQa621hgSzHN';

var scopes = ['user-read-private', 'user-read-email'];
var state = generateRandomString(16);
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

console.log(authorizeURL);