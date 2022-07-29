var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express');
var app = express();

var spotifyApi = new SpotifyWebApi({
    clientId: '04893084a5104966975a4ee50f3a5933',
    clientSecret: '14e8d19288e1429bb5fa6dab9b9b8fcd',
    // redirectUri: 'https://pokemon-spotify.herokuapp.com/callback'
    redirectUri: 'http://localhost:8888/callback'
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
    var code_str = "code: " + code;
    console.log(code_str);
    spotifyApi.authorizationCodeGrant(code).then(
        function(data) {
          var access_token = data.body['access_token'];
          var refresh_token = data.body['refresh_token'];

          console.log("access token: " + data.body['access_token']);
          console.log("refresh token: " + data.body['refresh_token']);

          // Set the access token on the API object to use it in later calls
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);

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

  async function get_json() {
    console.log("inside the function");
    console.log("access token in function: " + spotifyApi.getAccessToken());

    var short_response;
    var medium_response;
    var long_response;

    try {
      short_response = await spotifyApi.getMyTopTracks({time_range : "short_term"});
      medium_response = await spotifyApi.getMyTopTracks({time_range : "medium_term"});
      long_response = await spotifyApi.getMyTopTracks({time_range : "long_term"});
    } catch (e) {
      console.error(e);
    }

    console.log("successful fetch for response");
    console.log(short_response);

    var short_arr = [];
    var medium_arr = [];
    var long_arr = [];
    
    var short_tracks = short_response.body.items;
    var medium_tracks = medium_response.body.items;
    var long_tracks = long_response.body.items;

    console.log("are we hereeeeeeeeee???");

    for(const song of short_tracks) {
      short_arr.push(song["id"]);
    }

    for(const song of medium_tracks) {
      medium_arr.push(song["id"]);
    }

    for(const song of long_tracks) {
      long_arr.push(song["id"]);
    }

    console.log("how r we not here at least");

    const short_features_response = await spotifyApi.getAudioFeaturesForTracks(short_arr);
    const medium_features_response = await spotifyApi.getAudioFeaturesForTracks(medium_arr);
    const long_features_response = await spotifyApi.getAudioFeaturesForTracks(long_arr);

    console.log("after responses for features");

    var short_mood = 0;
    var medium_mood = 0;
    var long_mood = 0;

    var short_energy= 0;
    var medium_energy = 0;
    var long_energy = 0;

    var short_acoustic= 0;
    var medium_acoustic = 0;
    var long_acoustic = 0;

    for (const song of short_features_response.body.audio_features) {
      short_mood += song["valence"] + song["mode"];
      short_energy += song["energy"] + song["danceability"];
      short_acoustic += song["acousticness"];
      if (song["tempo"] < 108) {
        short_energy += song["tempo"] / 108;
      } else if (song["tempo"] >= 108) {
        short_energy += 1;
      }
    }

    console.log("did we make it past the first short calculations");

    short_mood /= short_features_response.body.audio_features.length;
    short_energy /= short_features_response.body.audio_features.length;
    short_acoustic /= short_features_response.body.audio_features.length;

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

    console.log("smth wrong here at avg");
  
    var avg_mood = (short_mood + medium_mood + long_mood) / 3;
    var avg_energy = (short_energy + medium_energy + long_energy) / 3;
    var avg_acoustic = (short_acoustic + medium_acoustic + long_acoustic) / 3;

    console.log("here at least");

    function get_type() {
      if (avg_mood < 1) {
        if (avg_energy < 1.9) { //ghost and ice
          if(avg_acoustic < 0.35) { //ghost
            return "ghost";
          } else { //ice
            return "ice";
          }
        } else if (avg_energy >= 1.9 && avg_energy < 2.3) { //poison and dragon
          if(avg_acoustic < 0.35) { //poison
            return "poison";
          } else { //dragon
            return "dragon";
          }
        } else { //dark and psychic
          if(avg_acoustic < 0.35) { //dark
            return "dark";
          } else { //psychic
            return "psychic";
          }
        }
      } else if (avg_mood >= 1 && avg_mood < 1.3) {
        if (avg_energy < 1.9) { //grass and steel
          if(avg_acoustic < 0.35) { //steel
            return "steel";
          } else { //grass
            return "grass";
          }
        } else if (avg_energy >= 1.9 && avg_energy < 2.3) { //normal and water
          if(avg_acoustic < 0.35) { //water
            return "water";
          } else { //normal
            return "normal";
          }
        } else { //fire and fighting
          if(avg_acoustic < 0.35) { //fire
            console.log("here... at typing");
            return "fire";
          } else { //fighting
            return "fighting";
          }
        }
      } else {
        if (avg_energy < 1.9) { //ground and rock
          if(avg_acoustic < 0.35) { //rock
            return "rock";
          } else { //ground
            return "ground";
          }
        } else if (avg_energy >= 1.9 && avg_energy < 2.3) { //bug and fairy
          if(avg_acoustic < 0.35) { //bug
            return "bug";
          } else { //fairy
            return "fairy";
          }
        } else { //electric and flying
          if(avg_acoustic < 0.35) { //electric
            return "electric";
          } else { //flying
            return "flying";
          }
        }
      }
    }

    function get_pokemon(type) {
      switch (type) {
        case "dark":
          if (avg_energy > 2.5) {
            if (avg_mood > 0.8) { //E+, M+
              return "honchkrow";
            } else { //E+, M-
              return "umbreon";
            }
          } else {
            if (avg_mood > 0.8) { //E-, M+
              return "absol";
            } else { //E-, M-
              return "zorua";
            }
          }
        case "psychic":
          if (avg_energy > 2.5) {
            if (avg_mood > 0.8) { //E+, M+
              return "mewtwo";
            } else { //E+, M-
              return "espeon";
            }
          } else {
            if (avg_mood > 0.8) { //E-, M+
              return "mew";
            } else { //E-, M-
              return "abra";
            }
          }
        case "poison":
          if (avg_energy > 2.1) {
            if (avg_mood > 0.8) { //E+, M+
              return "crobat";
            } else { //E+, M-
              return "toxicroak";
            }
          } else {
            if (avg_mood > 0.8) { //E-, M+
              return "ekans";
            } else { //E-, M-
              return "stunky";
            }
          }
        case "dragon":
          if (avg_energy > 2.1) {
            if (avg_mood > 0.8) { //E+, M+
              return "salamence";
            } else { //E+, M-
              return "garchomp";
            }
          } else {
            if (avg_mood > 0.8) { //E-, M+
              return "dragonite";
            } else { //E-, M-
              return "kingdra";
            }
          }
        case "ghost":
          if (avg_energy > 1.6) {
            if (avg_mood > 0.8) { //E+, M+
              return "gengar";
            } else { //E+, M-
              return "chandelure";
            }
          } else {
            if (avg_mood > 0.8) { //E-, M+
              return "gastly";
            } else { //E-, M-
              return "rotom";
            }
          }
        case "ice":
          if (avg_energy > 1.6) {
            if (avg_mood > 0.8) { //E+, M+
              return "vulpix-alola"; //troubleshoot vulpix
            } else { //E+, M-
              return "glaceon";
            }
          } else {
            if (avg_mood > 0.8) { //E-, M+
              return "froslass";
            } else { //E-, M-
              return "sneasel";
            }
          }
        case "fire":
          if (avg_energy > 2.5) {
            if (avg_mood > 1.15) { //E+, M+
              return "charmander";
            } else { //E+, M-
              return "cyndaquil";
            }
          } else {
            if (avg_mood > 1.15) { //E-, M+
              return "chimchar";
            } else { //E-, M-
              console.log("made it to torchic");
              return "torchic";
            }
          }
        case "fighting":
          if (avg_energy > 2.5) {
            if (avg_mood > 1.15) { //E+, M+
              return "mienshao";
            } else { //E+, M-
              return "lucario";
            }
          } else {
            if (avg_mood > 1.15) { //E-, M+
              return "riolu";
            } else { //E-, M-
              return "machop";
            }
          }
        case "normal":
          if (avg_energy > 2.1) {
            if (avg_mood > 1.15) { //E+, M+
              return "eevee";
            } else { //E+, M-
              return "meowth";
            }
          } else {
            if (avg_mood > 1.15) { //E-, M+
              return "bidoof";
            } else { //E-, M-
              return "snorlax";
            }
          }
        case "water":
          if (avg_energy > 2.1) {
            if (avg_mood > 1.15) { //E+, M+
              return "squirtle";
            } else { //E+, M-
              return "piplup";
            }
          } else {
            if (avg_mood > 1.15) { //E-, M+
              return "lapras";
            } else { //E-, M-
              return "vaporeon";
            }
          }
        case "grass":
          if (avg_energy > 1.6) {
            if (avg_mood > 1.15) { //E+, M+
              return "shaymin-sky"; //troubleshoot shaymin
            } else { //E+, M-
              return "bulbasaur";
            }
          } else {
            if (avg_mood > 1.15) { //E-, M+
              return "turtwig";
            } else { //E-, M-
              return "celebi";
            }
          }
        case "steel":
          if (avg_energy > 1.6) {
            if (avg_mood > 1.15) { //E+, M+
              return "mawile"; 
            } else { //E+, M-
              return "magnemite";
            }
          } else {
            if (avg_mood > 1.15) { //E-, M+
              return "skarmory";
            } else { //E-, M-
              return "jirachi";
            }
          }
        case "electric":
          if (avg_energy > 2.5) {
            if (avg_mood > 1.45) { //E+, M+
              return "shinx";
            } else { //E+, M-
              return "pikachu";
            }
          } else {
            if (avg_mood > 1.45) { //E-, M+
              return "raichu";
            } else { //E-, M-
              return "pichu";
            }
          }
        case "flying":
          if (avg_energy > 2.5) {
            if (avg_mood > 1.45) { //E+, M+
              return "staraptor";
            } else { //E+, M-
              return "fletchinder";
            }
          } else {
            if (avg_mood > 1.45) { //E-, M+
              return "togekiss";
            } else { //E-, M-
              return "pidgeot";
            }
          }
        case "bug":
          if (avg_energy > 2.1) {
            if (avg_mood > 1.45) { //E+, M+
              return "butterfree";
            } else { //E+, M-
              return "yanma";
            }
          } else {
            if (avg_mood > 1.45) { //E-, M+
              return "beautifly";
            } else { //E-, M-
              return "scyther";
            }
          }
        case "fairy":
          if (avg_energy > 2.1) {
            if (avg_mood > 1.45) { //E+, M+
              return "sylveon";
            } else { //E+, M-
              return "jigglypuff";
            }
          } else {
            if (avg_mood > 1.45) { //E-, M+
              return "gardevoir";
            } else { //E-, M-
              return "clefairy";
            }
          }
        case "ground":
          if (avg_energy > 1.6) {
            if (avg_mood > 1.45) { //E+, M+
              return "phanpy";
            } else { //E+, M-
              return "flygon";
            }
          } else {
            if (avg_mood > 1.45) { //E-, M+
              return "diglett";
            } else { //E-, M-
              return "sandshrew";
            }
          }
        case "rock":
          if (avg_energy > 1.6) {
            if (avg_mood > 1.45) { //E+, M+
              return "geodude";
            } else { //E+, M-
              return "rockruff";
            }
          } else {
            if (avg_mood > 1.45) { //E-, M+
              return "rhyhorn";
            } else { //E-, M-
              return "onix";
            }
          }
        default: 
          return "arceus";
      }
    }

    console.log("i make it here pls like whatttt");

    var type = get_type();
    var name = get_pokemon(type);

    var species_name = name;
    var official_name = name.charAt(0).toUpperCase() + name.slice(1);
    //species link gets json with flavor text (use omega ruby flavor texts)
    //poke link gets artwork
    //species link does not work with shaymin-sky or vulpix-alola

    if (name === "shaymin-sky") {
      species_name = "shaymin";
    } else if (name === "vulpix-alola") {
      species_name = "vulpix";
      official_name = "Alolan Vulpix";
    }

    var species_link = "https://pokeapi.co/api/v2/pokemon-species/" + species_name;
    var poke_link = "https://pokeapi.co/api/v2/pokemon/" + name;

    console.log(species_link);
    console.log(poke_link);

    var all_vals = {
      "mood" : avg_mood,
      "energy" : avg_energy,
      "acoustic" : avg_acoustic,
      "name": official_name,
      "species": species_link,
      "poke": poke_link
    }

    return all_vals;
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










