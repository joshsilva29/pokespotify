var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express');
var app = express();

var spotifyApi = new SpotifyWebApi({
    clientId: '04893084a5104966975a4ee50f3a5933',
    clientSecret: '14e8d19288e1429bb5fa6dab9b9b8fcd',
    redirectUri: 'https://pokemon-spotify.herokuapp.com/callback'
  });

// 'http://localhost:8888/callback'
// https://pokemon-spotify.herokuapp.com/callback

app.use(express.static(__dirname + '/'));

/*
* from app.js provided by spotify -- this is for the state
*/
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var scopes = ['user-read-private', 'user-read-email', 'user-top-read'];
var state = generateRandomString(16);
var url = spotifyApi.createAuthorizeURL(scopes, state);

console.log(url);

//login path
app.get('/login', function routeHandler(req, res) {
    res.redirect(url);
  });

//callback path (from spotify callback uri)
app.get('/callback', function routeHandler(req, res) {
    var code = req.query.code || null;
    spotifyApi.authorizationCodeGrant(code).then(
        function(data) {
          console.log('The token expires in ' + data.body['expires_in']);
          console.log('The access token is ' + data.body['access_token']);
          console.log('The refresh token is ' + data.body['refresh_token']);

          var access_token = data.body['access_token'];
          var refresh_token = data.body['refresh_token'];

          // Set the access token on the API object to use it in later calls
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);
          //pass the access token and refresh token via url

          var url_params = new URLSearchParams({logged: 'true'});
          var url_redirect = '/#' + url_params;
          res.redirect(url_redirect);
        },
        function(err) {
          console.log('Something went wrong!', err);
        }
      );
  });

app.get('/json_fetch', function routeHandler(req,res) {

  console.log("where am i");

  async function get_json() {
    const short_response = await spotifyApi.getMyTopTracks({time_range : "short_term"});
    const medium_response = await spotifyApi.getMyTopTracks({time_range : "medium_term"});
    const long_response = await spotifyApi.getMyTopTracks({time_range : "long_term"});

    var short_arr = [];
    var medium_arr = [];
    var long_arr = [];
    
    var short_tracks = short_response.body.items;
    var medium_tracks = medium_response.body.items;
    var long_tracks = long_response.body.items;

    for(const song of short_tracks) {
      short_arr.push(song["id"]);
    }

    for(const song of medium_tracks) {
      medium_arr.push(song["id"]);
    }

    for(const song of long_tracks) {
      long_arr.push(song["id"]);
    }

    const short_features_response = await spotifyApi.getAudioFeaturesForTracks(short_arr);
    const medium_features_response = await spotifyApi.getAudioFeaturesForTracks(medium_arr);
    const long_features_response = await spotifyApi.getAudioFeaturesForTracks(long_arr);

    var short_mood = 0;
    var medium_mood = 0;
    var long_mood = 0;

    var short_energy= 0;
    var medium_energy = 0;
    var long_energy = 0;

    var short_acoustic= 0;
    var medium_acoustic = 0;
    var long_acoustic = 0;

    var short_tempo = 0;

    for (const song of short_features_response.body.audio_features) {
      short_mood += song["valence"] + song["mode"];
      short_energy += song["energy"] + song["danceability"];
      short_acoustic += song["acousticness"];
      short_tempo += song["tempo"];
      if (song["tempo"] < 108) {
        short_energy += song["tempo"] / 108;
      } else if (song["tempo"] >= 108) {
        short_energy += 1;
      }
    }

    short_tempo /= short_features_response.body.audio_features.length;
    var str_tempo = "tempoooooooo: " + short_tempo;

    console.log(str_tempo);

    short_mood /= short_features_response.body.audio_features.length;
    short_energy /= short_features_response.body.audio_features.length;
    short_acoustic /= short_features_response.body.audio_features.length;

    console.log("short_acoustic:")
    console.log("yesssss" + short_acoustic);

    for (const song of medium_features_response.body.audio_features) {
      medium_mood += song["valence"] + song["mode"];
      medium_energy += song["energy"] + song["danceability"];
      medium_acoustic += song["acousticness"];
      if (song["tempo"] < 108) {
        medium_energy += song["tempo"] / 108;
      } else if (song["tempo"] >= 108) {
        medium_energy += 1;
      }
    }

    medium_mood /= medium_features_response.body.audio_features.length;
    medium_energy /= medium_features_response.body.audio_features.length;
    medium_acoustic /= medium_features_response.body.audio_features.length;

    for (const song of long_features_response.body.audio_features) {
      long_mood += song["valence"] + song["mode"];
      long_energy += song["energy"] + song["danceability"];
      long_acoustic += song["acousticness"];
      if (song["tempo"] < 108) {
        long_energy += song["tempo"] / 108;
      } else if (song["tempo"] > 108) {
        long_energy += 1;
      }
    }

    long_mood /= long_features_response.body.audio_features.length;
    long_energy /= long_features_response.body.audio_features.length;
    long_acoustic /= long_features_response.body.audio_features.length;
  
    var all_vals = {
      "mood" : [short_mood, medium_mood, long_mood],
      "energy" : [short_energy, medium_energy, long_energy],
      "acoustic" : [short_acoustic, medium_acoustic, long_acoustic]
    }

    return all_vals
  }

  get_json().then(function(result) {
      console.log(result);
      res.json(result);
    },
    function(error) {
      res.send({});
    });

});

app.get('/refresh', function routeHandler(req, res) {});

console.log('Listening on 8888');
app.listen(process.env.PORT || 8888);










