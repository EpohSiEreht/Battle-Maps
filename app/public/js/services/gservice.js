angular.module('gservice', [])
    .factory('gservice', ['$rootScope', '$http', '$compile', function($rootScope, $http, $compile) {

        // Initialize Variables

        // Handles clicks and location selection
        // Service our factory will return
        var googleMapService = {};

        // Array of locations obtained from API calls
        var locations = [];
        var currentUser = [];
        $rootScope.locations = locations;

        // Selected Location (initialize to center of America)
        var selectedLat = 39.50;
        var selectedLong = -98.35;

        var info = {};


        // Functions
        // --------------------------------------------------------------
        // Refresh the Map with new data. Function will take new latitude and longitude coordinates.
        googleMapService.refresh = function(latitude, longitude){

            // Clears the holding array of locations
            locations = [];

            // Set the selected lat and long equal to the ones provided on the refresh() call
            selectedLat = latitude;
            selectedLong = longitude;

            // Perform an AJAX call to get current user's record
            $http.get('/currentUser').success(function(response){
                currentUser = convertToGoogle(response);
                // Set up sidebar with user information
                $('#your-username').html(currentUser[0].username);
                $('#your-pic').attr('src', currentUser[0].trainer);
                $('#your-pokemon-pic').attr('src', currentUser[0].icon);
                var heart = '<i class="fa fa-heart"></i>';
                String.prototype.repeat = function(n){
                    n = n || 1;
                    return Array(n+1).join(this);
                }

                for(var i = 0; i < currentUser[0].lvl + 1; i++ ){
                    if(currentUser[0].lvl === i){
                        var hearts = heart.repeat(i);
                    }
                }
                $('#your-lives').html('<br>'+hearts);
            });

            // Perform an AJAX call to get all of the records in the db.
            $http.get('/users').success(function(response){
                // Convert the results into Google Map Format
                locations = convertToMapPoints(response);

                // Then initialize the map.
                initialize(latitude, longitude);
            }).error(function(){});
        };

        // Private Inner Functions
        // --------------------------------------------------------------

        // Convert a JSON of currentUser into map points
        var convertToGoogle = function(response){
            var currentUser =[];
            console.log(response);
            currentUser.push({icon: response.local.character, username: response.local.username, trainer: response.local.trainer, lvl: response.local.lvl, lives: response.local.lives, exp: response.local.exp, id: response._id, lat: response.local.latitude, lon: response.local.longitude});

            return currentUser;
        }
        // Convert a JSON of users into map points
        var convertToMapPoints = function(response){

            // Clear the locations holder
            locations = [];
            

            // Loop through all of the JSON entries provided in the response
            for(var i= 0; i < response.length; i++) {
                var user = response[i];

                // Create popup windows for each record
                 var contentString =    '<div class="information>'+
                                          '<div class="row top">'+
                                              '<div class="row infoCol">'+
                                                '<span class="span9">'+
                                                  '<p><b>TRAINER</b> <br>' + user.local.username + '</p>'+
                                                '</span>'+
                                              '</div>'+
                                          '<div class="row bottom">'+
                                            '<span class="span9">'+
                                              '<a class="battle btn btn-default btn-sm" id="startBattle">Battle!</a>'+
                                            '</span>'+
                                          '</div>'+
                                        '</div>';

                                 
                var compiled = $compile(contentString)($rootScope);
                console.log('COmPIlEd', compiled[0]);
                var infoWindow = new google.maps.InfoWindow({
                                    content: compiled[0].innerHTML
                                });  
                // Converts each of the JSON records into Google Maps Location format (Note [Lat, Lng] format).
                locations.push({
                    latlon: new google.maps.LatLng(user.local.latitude, user.local.longitude),
                    message: infoWindow,
                    username: user.local.username,
                    trainer: user.local.trainer,
                    character: user.local.character,
                    lives: user.local.lives,
                    lvl: user.local.lvl,
                    exp: user.local.exp
                });
            }
            // location is now an array populated with records in Google Maps format
            return locations;
        };
       

        // Initializes the map
        var initialize = function(latitude, longitude){

            // Uses the selected lat, long as starting point
            var myLatLng = {lat: parseInt(selectedLat), lng: parseInt(selectedLong)};
            // If map has not been created already...
            if (!map){

                // Create a new map and place in the index.html page
                var map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 14,
                    center: myLatLng
                });
            }
            // Loop through each location in the array and place a marker
            locations.forEach(function(n, i){
                if(n.username !== currentUser[0].username){
                    var marker = new google.maps.Marker({
                        position: n.latlon,
                        map: map,
                        animation: google.maps.Animation.DROP,
                        title: "Big Map",
                        icon: n.trainer
                    });
                    // Hides markers if zoom is less than 10
                    google.maps.event.addListener(map, 'zoom_changed', function() {
                        var zoom = map.getZoom();

                        if (zoom <= 11) {
                            marker.setMap(null);
                        } else {
                            marker.setMap(map);
                        }
                    });
                    // For each marker created, add a listener that checks for clicks
                    google.maps.event.addListener(marker, 'click', function(e) {
                        // When clicked, open the selected marker's message
                        currentSelectedMarker = n;
                        n.message.open(map, marker);
                        // When clicking outside of infoBox, close infoBox
                        google.maps.event.addListener(map, 'click', function(e){
                            n.message.close(map, marker);
                        });

                        // Set up health for enemy and user
                        var userHealth;
                        var maxUserHealth;
                        var enemyHealth;
                        var maxEnemyHealth;
                        // Create moves array for enemy and user
                        var eMoves = new Array();
                        var moves = new Array();

                        // move function
                        function move(move, basedmg){
                            this.move = move;
                            this.basedmg = basedmg;
                        }

                        // Assign sprite links to variable names
                        var frontBulbasaur = "http://sprites.pokecheck.org/i/001.gif";
                        var backBulbasaur = "http://sprites.pokecheck.org/b/001.gif";
                        var frontCharmander = "http://sprites.pokecheck.org/i/004.gif";
                        var backCharmander = "http://sprites.pokecheck.org/b/004.gif";
                        var frontSquirtle = "http://sprites.pokecheck.org/i/007.gif";
                        var backSquirtle = "http://sprites.pokecheck.org/b/007.gif";

                        var frontIvysaur = "http://sprites.pokecheck.org/i/002.gif";
                        var backIvysaur = "http://sprites.pokecheck.org/b/002.gif";
                        var frontCharmeleon = "http://sprites.pokecheck.org/i/005.gif";
                        var backCharmeleon = "http://sprites.pokecheck.org/b/005.gif";
                        var frontWartortle = "http://sprites.pokecheck.org/i/008.gif";
                        var backWartortle = "http://sprites.pokecheck.org/b/008.gif";

                        var frontVenusaur = "http://sprites.pokecheck.org/i/003.gif";
                        var backVenusaur = "http://sprites.pokecheck.org/b/003.gif";
                        var frontCharizard = "http://sprites.pokecheck.org/i/006.gif";
                        var backCharizard = "http://sprites.pokecheck.org/b/006.gif";
                        var frontBlastoise = "http://sprites.pokecheck.org/i/009.gif";
                        var backBlastoise = "http://sprites.pokecheck.org/b/009.gif";

                        var frontMaleTrainer = "http://sprites.pokecheck.org/t/144.gif";
                        var backMaleTrainer = "http://sprites.pokecheck.org/t/b013.gif";
                        var frontFemaleTrainer = "http://sprites.pokecheck.org/t/145.gif";
                        var backFemaleTrainer = "http://sprites.pokecheck.org/t/b015.gif";

                        console.log(currentUser[0]);

                        function setUpEnemy(){
                            // Conditions for setting up enemy pokemon
                            if(n.character === frontBulbasaur){
                                $('#enemy-character').attr('src', frontBulbasaur);
                                $('#enemy-name').html('BULBASAUR');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 50);
                                eMoves[1] = new move("GROWL", 0);
                                if(n.character.lvl >= 9){
                                    eMoves[2] = new move("VINE WHIP", 45);
                                }
                                if(n.character.lvl >= 13){
                                    eMoves[3] = new move("CUT", 40);
                                }
                            } else if(n.character === frontCharmander) {
                                $('#enemy-character').attr('src', frontCharmander);
                                $('#enemy-name').html('CHARMANDER');
                                // Declare moves
                                eMoves[0] = new move("GROWL", 0);
                                eMoves[1] = new move("SCRATCH", 50);
                                if(n.character.lvl >= 9){
                                    eMoves[2] = new move("EMBER", 40);
                                }
                                if(n.character.lvl >= 13){
                                    eMoves[3] = new move("SLASH", 70);
                                }
                            } else if(n.character === frontSquirtle) {
                                $('#enemy-character').attr('src', frontSquirtle);
                                $('#enemy-name').html('SQUIRTLE');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 50);
                                eMoves[1] = new move("TAIL WHIP", 0);
                                if(n.character.lvl >= 9){
                                    eMoves[2] = new move("WATER GUN", 40);
                                }
                                if(n.character.lvl >= 13){
                                    eMoves[3] = new move("BITE", 60);
                                }
                            } else if(n.character === frontIvysaur){
                                $('#enemy-character').attr('src', backIvysaur);
                                $('#enemy-name').html('IVYSAUR');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 50);
                                eMoves[1] = new move("GROWL", 0);
                                eMoves[2] = new move("VINE WHIP", 45);
                                eMoves[3] = new move("CUT", 40);
                            } else if(n.character === frontCharmeleon){
                                $('#enemy-character').attr('src', backCharmeleon);
                                $('#enemy-name').html('CHARMELEON');
                                // Declare moves
                                eMoves[0] = new move("GROWL", 0);
                                eMoves[1] = new move("SCRATCH", 50);
                                eMoves[2] = new move("EMBER", 40);
                                eMoves[3] = new move("SLASH", 70);
                            } else if(n.character === frontWartortle){
                                $('#enemy-character').attr('src', backWartortle);
                                $('#enemy-name').html('WARTORTLE');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 50);
                                eMoves[1] = new move("TAIL WHIP", 0);
                                eMoves[2] = new move("WATER GUN", 40);
                                eMoves[3] = new move("BITE", 60);
                            } else if(n.character === frontVenusaur){
                                $('#enemy-character').attr('src', backVenusaur);
                                $('#enemy-name').html('VENUSAUR');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 50);
                                eMoves[1] = new move("GROWL", 0);
                                eMoves[2] = new move("VINE WHIP", 45);
                                eMoves[3] = new move("CUT", 40);
                            } else if(n.character === frontCharizard){
                                $('#enemy-character').attr('src', backCharizard);
                                $('#enemy-name').html('CHARIZARD');
                                // Declare moves
                                eMoves[0] = new move("GROWL", 0);
                                eMoves[1] = new move("SCRATCH", 50);
                                eMoves[2] = new move("EMBER", 40);
                                eMoves[3] = new move("SLASH", 70);
                            } else if(n.character === frontBlastoise){
                                $('#enemy-character').attr('src', backBlastoise);
                                $('#enemy-name').html('BLASTOISE');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 50);
                                eMoves[1] = new move("TAIL WHIP", 0);
                                eMoves[2] = new move("WATER GUN", 40);
                                eMoves[3] = new move("BITE", 60);
                            }
                            if(n.character === frontBulbasaur || n.character === frontIvysaur || n.character === frontVenusaur){
                                maxEnemyHealth = 45;
                                for(var i = 6; i < 101; i++){
                                    if(n.lvl === i){
                                        maxEnemyHealth = maxEnemyHealth + n.lvl;
                                    }
                                }
                            } else if(n.character === frontCharmander || n.character === frontCharmeleon || n.character === frontCharizard){
                                maxEnemyHealth = 39;
                                for(var i = 6; i < 101; i++){
                                    if(n.lvl === i){
                                        maxEnemyHealth = maxEnemyHealth + n.lvl;
                                    }
                                }
                            } else if(n.character === frontSquirtle || n.character === frontWartortle || n.character === frontBlastoise){
                                maxEnemyHealth = 44;
                                for(var i = 6; i < 101; i++){
                                    if(n.lvl === i){
                                        maxEnemyHealth = maxEnemyHealth + n.lvl;
                                    }
                                }
                            }
                            enemyHealth = maxEnemyHealth;
                            if(n.trainer === frontMaleTrainer){
                                $('#enemy-trainer').attr('src', frontMaleTrainer);
                            } else if(n.trainer === frontFemaleTrainer) {
                                $('#enemy-trainer').attr('src', frontFemaleTrainer);
                            }
                            $('#enemy-level').html(n.lvl);
                            return enemyHealth, maxEnemyHealth, eMoves;
                        }

                        function setUpUser(){
                            // Conditions for setting up your pokemon
                            if(currentUser[0].icon === frontBulbasaur){
                                $('#your-character').attr('src', backBulbasaur);
                                $('#your-name').html('BULBASAUR');
                                // Declare moves
                                moves[0] = new move("TACKLE", 50);
                                moves[1] = new move("GROWL", 0);
                                if(currentUser[0].lvl >= 9){
                                    moves[2] = new move("VINE WHIP", 45);
                                }
                                if(currentUser[0].lvl >= 13){
                                    moves[3] = new move("CUT", 40);
                                }
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]){
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]){
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontCharmander) {
                                $('#your-character').attr('src', backCharmander);
                                $('#your-name').html('CHARMANDER');
                                // Declare moves
                                moves[0] = new move("GROWL", 0);
                                moves[1] = new move("SCRATCH", 50);
                                if(currentUser[0].lvl >= 9){
                                    moves[2] = new move("EMBER", 40);
                                }
                                if(currentUser[0].lvl >= 13){
                                    moves[3] = new move("SLASH", 70);
                                }
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]){
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontSquirtle) {
                                $('#your-character').attr('src', backSquirtle);
                                $('#your-name').html('SQUIRTLE');
                                // Declare moves
                                moves[0] = new move("TACKLE", 50);
                                moves[1] = new move("TAIL WHIP", 0);
                                if(currentUser[0].lvl >= 9){
                                    moves[2] = new move("WATER GUN", 40);
                                }
                                if(currentUser[0].lvl >= 13){
                                    moves[3] = new move("BITE", 60);
                                }
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]) {
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontIvysaur){
                                $('#your-character').attr('src', backIvysaur);
                                $('#your-name').html('IVYSAUR');
                                // Declare moves
                                moves[0] = new move("TACKLE", 50);
                                moves[1] = new move("GROWL", 0);
                                moves[2] = new move("VINE WHIP", 45);
                                moves[3] = new move("CUT", 40);
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]) {
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontCharmeleon){
                                $('#your-character').attr('src', backCharmeleon);
                                $('#your-name').html('CHARMELEON');
                                // Declare moves
                                moves[0] = new move("GROWL", 0);
                                moves[1] = new move("SCRATCH", 50);
                                moves[2] = new move("EMBER", 40);
                                moves[3] = new move("SLASH", 70);
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]){
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontWartortle){
                                $('#your-character').attr('src', backWartortle);
                                $('#your-name').html('WARTORTLE');
                                // Declare moves
                                moves[0] = new move("TACKLE", 50);
                                moves[1] = new move("TAIL WHIP", 0);
                                moves[2] = new move("WATER GUN", 40);
                                moves[3] = new move("BITE", 60);
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]) {
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontVenusaur){
                                $('#your-character').attr('src', backVenusaur);
                                $('#your-name').html('VENUSAUR');
                                // Declare moves
                                moves[0] = new move("TACKLE", 50);
                                moves[1] = new move("GROWL", 0);
                                moves[2] = new move("VINE WHIP", 45);
                                moves[3] = new move("CUT", 40);
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]) {
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontCharizard){
                                $('#your-character').attr('src', backCharizard);
                                $('#your-name').html('CHARIZARD');
                                // Declare moves
                                moves[0] = new move("GROWL", 0);
                                moves[1] = new move("SCRATCH", 50);
                                moves[2] = new move("EMBER", 40);
                                moves[3] = new move("SLASH", 70);
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]){
                                    $('#attack-four').html(moves[3].move);
                                }
                            } else if(currentUser[0].icon === frontBlastoise){
                                $('#your-character').attr('src', backBlastoise);
                                $('#your-name').html('BLASTOISE');
                                // Declare moves
                                moves[0] = new move("TACKLE", 50);
                                moves[1] = new move("TAIL WHIP", 0);
                                moves[2] = new move("WATER GUN", 40);
                                moves[3] = new move("BITE", 60);
                                $('#attack-one').html(moves[0].move);
                                $('#attack-two').html(moves[1].move);
                                if(!moves[2]){
                                    $('#attack-three').html('-');
                                } else if(moves[2]) {
                                    $('#attack-three').html(moves[2].move);
                                }
                                if(!moves[3]){
                                    $('#attack-four').html('-');
                                } else if(moves[3]) {
                                    $('#attack-four').html(moves[3].move);
                                }
                            }

                            if(currentUser[0].icon === frontBulbasaur || currentUser[0].icon === frontIvysaur || currentUser[0].icon === frontVenusaur){
                                maxUserHealth = 45;
                                for(var i = 6; i < 101; i++){
                                    if(currentUser[0].lvl === i){
                                        maxUserHealth = maxUserHealth + currentUser[0].lvl;
                                    }
                                }
                            } else if(currentUser[0].icon === frontCharmander || currentUser[0].icon === frontCharmeleon || currentUser[0].icon === frontCharizard){
                                maxUserHealth = 39;
                                for(var i = 6; i < 101; i++){
                                    if(currentUser[0].lvl === i){
                                        maxUserHealth = maxUserHealth + currentUser[0].lvl;
                                    }
                                }
                            } else if(currentUser[0].icon === frontSquirtle || currentUser[0].icon === frontWartortle || currentUser[0].icon === frontBlastoise){
                                maxUserHealth = 44;
                                for(var i = 6; i < 101; i++){
                                    if(currentUser[0].lvl === i){
                                        maxUserHealth = maxUserHealth + currentUser[0].lvl;
                                    }
                                }
                            }
                            userHealth = maxUserHealth;
                            if(currentUser[0].trainer === frontMaleTrainer) {
                                $('#your-trainer').attr('src', backMaleTrainer);
                            } else if(currentUser[0].trainer === frontFemaleTrainer) {
                                $('#your-trainer').attr('src', backFemaleTrainer);
                            }
                            $('#your-level').html(currentUser[0].lvl);
                            $('#your-hp').html(userHealth);
                            $('#your-max-hp').html(maxUserHealth);
                            var expRatio = Math.cbrt(currentUser[0].exp) - Math.floor(Math.cbrt(currentUser[0].exp));
                            var widthEXP = ((Math.round(expRatio*100)/100) * 162) + "px";
                            $('#your-exp').css('width', widthEXP);
                            return userHealth, maxUserHealth, moves;
                        }

                    
                        // Listen for Battle! button to be clicked and set up the battle zone
                        $('body').on('click', '#startBattle', function(e) {
                            // Start battle music
                            $('#battlemusic').attr('src', '../../sounds/battlemusic.mp3');
                            // Set up battle div 
                            $('#battle-area').show();
                            if(currentUser[0].icon === frontBulbasaur){
                                var yourPokemonName = "BULBASAUR";
                            } else if(currentUser[0].icon === frontCharmander){
                                var yourPokemonName = "CHARMANDER";
                            } else if(currentUser[0].icon === frontSquirtle){
                                var yourPokemonName = "SQUIRTLE";
                            } else if(currentUser[0].icon === frontIvysaur){
                                var yourPokemonName = "IVYSAUR";
                            } else if(currentUser[0].icon === frontCharmeleon){
                                var yourPokemonName = "CHARMELEON";
                            } else if(currentUser[0].icon === frontWartortle){
                                var yourPokemonName = "WARTORTLE";
                            } else if(currentUser[0].icon === frontVenusaur){
                                var yourPokemonName = "VENUSAUR";
                            } else if(currentUser[0].icon === frontCharizard){
                                var yourPokemonName = "CHARIZARD";
                            } else if(currentUser[0].icon === frontBlastoise){
                                var yourPokemonName = "BLASTOISE";
                            }
                            if(n.character === frontBulbasaur){
                                var enemyPokemonName = "BULBASAUR";
                            } else if(n.character === frontCharmander){
                                var enemyPokemonName = "CHARMANDER";
                            } else if(n.character === frontSquirtle){
                                var enemyPokemonName = "SQUIRTLE";
                            } else if(n.character === frontIvysaur){
                                var enemyPokemonName = "IVYSAUR";
                            } else if(n.character === frontCharmeleon){
                                var enemyPokemonName = "CHARMELEON";
                            } else if(n.character === frontWartortle){
                                var enemyPokemonName = "WARTORTLE";
                            } else if(n.character === frontVenusaur){
                                var enemyPokemonName = "VENUSAUR";
                            } else if(n.character === frontCharizard){
                                var enemyPokemonName = "CHARIZARD";
                            } else if(n.character === frontBlastoise){
                                var enemyPokemonName = "BLASTOISE";
                            }
                            
                            function startAnimation(){
                                $('#your-trainer').css('left', '500px');
                                $('#enemy-trainer').css('left', '-80px');
                                $('#intro-text').html('You challenged TRAINER ' + n.username);
                                $('#your-trainer').animate({
                                    left: '60px'
                                }, 2000).delay(4200).animate({
                                    left: '-100'
                                }, 1000, function(){
                                    $('#intro-text').html("GO! " + yourPokemonName + "!");
                                    $('#your-stat-area').show();
                                    $('#your-character').css('width', '0px');
                                    if(yourPokemonName === "IVYSAUR"){
                                        $('#your-character').show().animate({
                                            width: '170px',
                                            left: '40px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    } else if(yourPokemonName === "CHARMELEON"){
                                        $('#your-character').show().animate({
                                            width: '180px',
                                            left: '25px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    } else if(yourPokemonName === "WARTORTLE"){
                                        $('#your-character').show().animate({
                                            width: '140px',
                                            left: '50px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    } else if(yourPokemonName === "VENUSAUR"){
                                        $('#your-character').show().animate({
                                            width: '200px',
                                            left: '20px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    } else if(yourPokemonName === "CHARIZARD"){
                                        $('#your-character').show().animate({
                                            width: '235px',
                                            left: '0px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    } else if(yourPokemonName === "BLASTOISE"){
                                        $('#your-character').show().animate({
                                            width: '170px',
                                            left: '50px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    } else {
                                        $('#your-character').show().animate({
                                            width: '120px'
                                        }, 400, function(){
                                            setTimeout(function(){
                                                $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                                $('#menu-area').show();
                                            }, 1400);
                                           
                                            }
                                        );
                                    }
                                    
                                });
                                $('#enemy-trainer').animate({
                                    left: '340px'
                                }, 2000, function(){
                                    $('#intro-text').html('TRAINER '+ n.username + " sent out " + enemyPokemonName + "!");
                                }).delay(1000).animate({
                                        left: '510px'
                                    }, 1000, function(){
                                         $('#enemy-stat-area').show();
                                         $('#enemy-character').css('width', '0px');
                                         $('#enemy-character').show().animate({
                                            width: '100px'
                                         }, 400);
                                     });

                            }
                            console.log('CURRENT USER', currentUser);

                            startAnimation();

                            setUpEnemy();
                            setUpUser();

                            
                            // Select attack for user
                            $('body').on('click', '.attack-arrow-box', function(e){

                                
                                var selectedAttack = $(this).prev('.attack-button')[0].innerHTML;

                                console.log(selectedAttack);


                                $('#attackbox, #statbox, .attack-button, .attack-arrow-box').hide();
                                $('#menu-area').show();
                                // Declare a variable that will grab the user's attack index
                                var userAttack;
                                // Store enemy attack id
                                var enemyAttackId;
                                // Call enemy pokemon attack
                                callEnemyAttack = function(){
                                    enemyAttackId = Math.floor(Math.random() * eMoves.length);
                                    return enemyAttackId;
                                }
                                // Get selected attack damage from enemy
                                enemyAttackDamage = function(){
                                    $('#menu-area').hide();
                                    if(eMoves[callEnemyAttack()].basedmg === 0){
                                        $('#intro-text').html(enemyPokemonName + " used " + eMoves[enemyAttackId].move + "!");
                                        damage = 0;
                                    } else {
                                        $('#intro-text').html(enemyPokemonName + " used " + eMoves[enemyAttackId].move + "!");
                                        damage = Math.floor( ((2 * n.lvl + 10)/250) * eMoves[callEnemyAttack()].basedmg + 5 );
                                    }
                                    if(eMoves[callEnemyAttack()].move === "GROWL"){
                                        $('#your-attack').attr('src', "../../images/growl.png").css('transform', 'scaleX(-1)').delay(100).hide('fast').delay(100).show('fast').delay(100).hide('fast');
                                        setTimeout(function(){
                                            $('#your-character').fadeOut('fast').delay(50).fadeIn('fast').delay(50).fadeOut('fast').delay(50).fadeIn('fast');
                                        }, 300);
                                        setTimeout(function(){
                                            $('#intro-text').html(yourPokemonName + "'s defense fell!");
                                        }, 600);
                                    } 
                                    else if(eMoves[callEnemyAttack()].move === "TAIL WHIP"){
                                            $('#enemy-character').animate({
                                                left: "+=20px"
                                            }, 100, function(){
                                                $('#enemy-character').animate({
                                                    left: "-=40px"
                                                }, 100).animate({
                                                    left: "+=20px"
                                                }, 100);
                                                $('#your-character').fadeOut('fast').delay(50).fadeIn('fast').delay(50).fadeOut('fast').delay(50).fadeIn('fast');
                                                $('#intro-text').html(yourPokemonName + "'s defense fell!");
                                            });
                                        }  
                                    else {
                                        $('#enemy-character').animate({
                                            left: "+=20px"
                                        }, 100, function(){
                                            $('#enemy-character').animate({
                                                left: "-=40px"
                                            }, 100).animate({
                                                left: "+=20px"
                                            }, 100);
                                            $('#your-character').fadeOut('fast').delay(50).fadeIn('fast').delay(50).fadeOut('fast').delay(50).fadeIn('fast');

                                        });  
                                    }
                                    $('#attack').attr('src', '../../sounds/attack.mp3');
                                    return damage;
                                }
                                // Create a function to determine user's attack damage
                                userAttackDamage = function() {
                                    $('#menu-area').hide();
                                    if(moves[userAttack].basedmg === 0){
                                        $('#intro-text').html(yourPokemonName + " used " + moves[userAttack].move + "!");
                                        damage = 0;
                                    } else {
                                        $('#intro-text').html(yourPokemonName + " used " + moves[userAttack].move + "!");
                                        damage = Math.floor( ((2 * currentUser[0].lvl + 10)/250) * moves[userAttack].basedmg + 5 );
                                    }
                                    if(moves[userAttack].move === "GROWL"){
                                        $('#enemy-attack').attr('src', "../../images/growl.png").delay(100).hide('fast').delay(100).show('fast').delay(100).hide('fast');
                                        setTimeout(function(){
                                            $('#enemy-character').fadeOut('fast').delay(50).fadeIn('fast').delay(50).fadeOut('fast').delay(50).fadeIn('fast');
                                        }, 300);
                                        $('#intro-text').html(enemyPokemonName + "'s defense fell!");
                                    } 
                                    else if(moves[userAttack].move === "TAIL WHIP"){
                                        $('#your-character').animate({
                                            left: "-=20px"
                                        }, 100, function(){
                                            $('#your-character').animate({
                                                left: "+=40px"
                                            }, 100).animate({
                                                left: "-=20px"
                                            }, 100);
                                            $('#enemy-character').fadeOut('fast').delay(50).fadeIn('fast').delay(50).fadeOut('fast').delay(50).fadeIn('fast');
                                            $('#intro-text').html(enemyPokemonName + "'s defense fell!");
                                        });
                                    }
                                    else {
                                        $('#your-character').animate({
                                            left: "-=20px"
                                        }, 100, function(){
                                            $('#your-character').animate({
                                                left: "+=40px"
                                            }, 100).animate({
                                                left: "-=20px"
                                            }, 100);
                                            $('#enemy-character').fadeOut('fast').delay(50).fadeIn('fast').delay(50).fadeOut('fast').delay(50).fadeIn('fast');

                                        });
                                    }

                                    

                                    $('#attack').attr('src', '../../sounds/attack.mp3');
                                    return damage;
                                }

                                function enemyPokemonAttack(){
                                    if(userHealth > 0){
                                        userHealth = userHealth - damage;
                                        // Animate health bar according to damage
                                        var userHealthBarPixel = 120;
                                        var newUserHealthBarPixel = (userHealth * userHealthBarPixel)/maxUserHealth;
                                        $('#your-health').animate({
                                            width: newUserHealthBarPixel
                                        }, 800, function(){
                                            if(userHealth < 0){
                                                userHealth = 0;
                                            }
                                            if( (userHealth/maxUserHealth) <= 0.3 && (userHealth/maxUserHealth) > 0 ){
                                                $('#your-health').css('background-color', '#F24040');
                                            } else if( (userHealth/maxUserHealth) <= 0.6 && (userHealth/maxUserHealth) > 0.3 ){
                                                $('#your-health').css('background-color', '#F2CC3C');
                                            }
                                            $('#your-hp').html(userHealth);
                                            setTimeout(function(){
                                                yourPokemonFaint();
                                                $('#intro-text').html("What will " + yourPokemonName + " do next?");
                                                $('#menu-area').show();
                                            }, 2000);
                                        });
                                        // Insert enemy attack and damage into textbox
                                        console.log('Users Health', userHealth);
                                    } else {
                                        // Insert notice saying Pokemon fainted
                                    }
                                    return userHealth;
                                }

                                function userPokemonAttack(){
                                    if(enemyHealth > 0){
                                        enemyHealth = enemyHealth - damage;
                                        // Animate health bar according to damage
                                        var enemyHealthBarPixel = 130;
                                        var newEnemyHealthBarPixel = (enemyHealth * enemyHealthBarPixel)/maxEnemyHealth;
                                        $('#enemy-health').animate({
                                            width: newEnemyHealthBarPixel
                                        }, 800, function(){
                                            if( (enemyHealth/maxEnemyHealth) > 0.3 && (enemyHealth/maxEnemyHealth) < 0.6 ){
                                                $('#enemy-health').css('background-color', '#F2CC3C');
                                            } else if((userHealth/maxUserHealth) > 0 && (enemyHealth/maxEnemyHealth) <= 0.35){
                                                $('#enemy-health').css('background-color', '#F24040');
                                            } 
                                            userTurn = false;
                                            enemyPokemonFaint();
                                            setTimeout(function(){
                                                attackLoop();
                                            }, 2000);
                                        });
                                        // Insert your attack and damage into textbox
                                        console.log('Enemys Health', enemyHealth);

                                    } else {
                                        // Insert notice saying enemy Pokemon has fainted
                                    }
                                    return enemyHealth;
                                }

                                function startFight(){
                                    // Insert intro text with some animation
                                    console.log('let the fight begin');
                                    userTurn = true;
                                }

                                function attackLoop(){
                                    if(userTurn === true){
                                        userTurn = false;
                                        enemyAttackDamage();
                                        enemyPokemonAttack();
                                    } else {
                                        userTurn = true;
                                    }
                                }

                                function yourPokemonFaint(){
                                    if(userHealth < 1){
                                        // Insert notice saying enemy Pokemon has fainted
                                        console.log('Your pokemon has fainted');
                                        $('#intro-text').html(yourPokemonName + " has fainted!");
                                        $('#your-character').animate({
                                            bottom: '-100px'
                                        }, 800, function(){
                                            $('#battlemusic').attr('src', '#');
                                            var losingLife = currentUser[0].lives - 1;
                                            $http.patch('/users/' + currentUser[0].id, {local: {latitude: currentUser[0].lat, longitude: currentUser[0].lon, exp: currentUser[0].exp, lives: losingLife, lvl: currentUser[0].lvl, character: currentUser[0].icon}})
                                                .success(function(data) {
                                                    console.log(data);
                                                })
                                                .error(function(data) {
                                                    console.log('Error: ' + data);
                                                });
                                            $('#intro-text').html('Better luck next time loser!');
                                            $('#end-battle').show();
                                            $('body').on('click', '#end-button', function(e){
                                                // $('battle-area').hide();
                                                e.preventDefault();
                                                location.reload();
                                            });
                                        });
                                    } else {
                                        attackLoop();
                                    }
                                }

                                function enemyPokemonFaint(){
                                    if(enemyHealth < 1){
                                        // Insert notice saying enemy Pokemon has fainted
                                        console.log('enemy has fainted');
                                        $('#intro-text').html("Foe " + enemyPokemonName + " has fainted!");
                                        $('#enemy-character').animate({
                                            bottom: '-100px'
                                        }, 800, function(){
                                            $('#battlemusic').attr('src', '#');
                                            $('#ending').attr('src', '../../sounds/endingSong.mp3');

                                            if(enemyPokemonName === "BULBASAUR"){
                                                var baseExperienceYield = 64;
                                            } else if(enemyPokemonName === "CHARMANDER"){
                                                var baseExperienceYield = 65;
                                            } else if(enemyPokemonName === "SQUIRTLE"){
                                                var baseExperienceYield = 66;
                                            } else if(enemyPokemonName === "IVYSAUR"){
                                                var baseExperienceYield = 142;
                                            } else if(enemyPokemonName === "CHARMELEON"){
                                                var baseExperienceYield = 142;
                                            } else if(enemyPokemonName === "WARTORTLE"){
                                                var baseExperienceYield = 142;
                                            } else if(enemyPokemonName === "VENUSAUR"){
                                                var baseExperienceYield = 236;
                                            } else if(enemyPokemonName === "CHARIZARD"){
                                                var baseExperienceYield = 240;
                                            } else if(enemyPokemonName === "BLASTOISE"){
                                                var baseExperienceYield = 239;
                                            }
                                            var currentEXP = currentUser[0].exp;
                                            var earnedEXP = Math.round(((1.5*baseExperienceYield * n.lvl)/7));
                                            var updatedEXP = currentEXP + earnedEXP;
                                            var afterLevel = Math.floor(Math.cbrt(updatedEXP));
                                            $('#intro-text').html(yourPokemonName + " gained " + earnedEXP + " EXP. Points!");
                                            var expRatio = Math.cbrt(updatedEXP) - Math.floor(Math.cbrt(updatedEXP));
                                            var widthEXP = ((Math.round(expRatio*100)/100) * 162) + "px";

                                            console.log('FRONT BULB', frontBulbasaur);
                                            // EVOLVE SECTION
                                            if( currentUser[0].icon === frontBulbasaur && afterLevel === 16 ){
                                                var pokemon = frontIvysaur;
                                            } 
                                            else if( currentUser[0].icon === frontCharmander && afterLevel === 16 ){
                                                var pokemon = frontCharmeleon;
                                            } 
                                            else if( currentUser[0].icon === frontSquirtle && afterLevel === 16 ){
                                                var pokemon = frontWartortle;
                                            }
                                            else if( currentUser[0].icon === frontIvysaur && afterLevel === 32 ){
                                                var pokemon = frontIvysaur;
                                            } 
                                            else if( currentUser[0].icon === frontCharmeleon && afterLevel === 36 ){
                                                var pokemon = frontCharizard;
                                            } 
                                            else if( currentUser[0].icon === frontWartortle && afterLevel === 36 ){
                                                var pokemon = frontBlastoise;
                                            } else {
                                                var pokemon = currentUser[0].icon;
                                            }


                                            if( Math.cbrt(updatedEXP) < Math.ceil(Math.cbrt(currentEXP)) ){
                                                $('#your-exp').animate({
                                                    width: widthEXP
                                                }, 1000, function(){
                                                    $('#end-battle').show();
                                                    $('body').on('click', '#end-button', function(e){
                                                        // $('battle-area').hide();
                                                        e.preventDefault();
                                                        location.reload();
                                                    });
                                                });
                                            } else if( Math.cbrt(updatedEXP) >= Math.ceil(Math.cbrt(currentEXP)) ){
                                                $('#your-exp').animate({
                                                    width: "162px"
                                                }, 1000, function(){
                                                    setTimeout(function(){
                                                        $('#your-level').html(afterLevel);
                                                        $('#your-exp').css('width', '0px');
                                                        $('#your-exp').animate({
                                                            width: widthEXP
                                                        }, 500, function(){
                                                            $('#intro-text').html(yourPokemonName + " grew to LV. " + afterLevel + "!");
                                                            $('#end-battle').show();
                                                            $('body').on('click', '#end-button', function(e){
                                                                // $('#battle-area').hide();
                                                                e.preventDefault();
                                                                location.reload();
                                                            });
                                                        });
                                                    }, 1200);
                                                });
                                            }
                                            $http.patch('/users/' + currentUser[0].id, {local: {latitude: currentUser[0].lat, longitude: currentUser[0].lon, exp: updatedEXP, lives: currentUser[0].lives, lvl: afterLevel, character: pokemon}})
                                            .success(function(data) {
                                                console.log(data);
                                            })
                                            .error(function(data) {
                                                console.log('Error: ' + data);
                                            });
                                        });
                                    } else {
                                        attackLoop();
                                    }
                                }

                                // Declare damage
                                var damage;
                                for(var i = 0; i < moves.length; i++){
                                    if(selectedAttack === moves[i].move){
                                        userAttack = i;
                                    }
                                }
                                startFight();

                                userAttackDamage();
                                userPokemonAttack();
                                return damage;
                            });
                            e.stopPropagation();

                        });

                        // When user clicks "FIGHT", display pokemon's attack list
                        $('body').on('click', '#fight-arrow', function(){
                            $('#attackbox, #statbox, .attack-button, .attack-arrow-box').show();
                            console.log($('#attack-four').html());
                            if($('#attack-four').html() === "-"){
                                $('#arrow-four').hide();
                            } else if($('#attack-three').html() === "-"){
                                $('#arrow-three').hide();
                                $('#arrow-four').hide();
                            }
                            $('#menu-area').hide();
                        });
                    });

                } else {
                    console.log('This user has been excluded from the map');
                }
            });



            console.log('THIS LOCATION', currentUser);
            // Set initial location as a bouncing red marker
            var initialLocation = new google.maps.LatLng(latitude, longitude);
            console.log('CUrrentUser Icon', currentUser[0].icon);
            var marker = new google.maps.Marker({
                position: initialLocation,
                animation: google.maps.Animation.BOUNCE,
                map: map,
                icon: currentUser[0].trainer
            });
            // Hides markers if zoom is less than 10
            google.maps.event.addListener(map, 'zoom_changed', function() {
                var zoom = map.getZoom();

                if (zoom <= 10) {
                    marker.setMap(null);
                } else {
                    marker.setMap(map);
                }
            });

            lastMarker = marker;


            // Function for moving to a selected location
            map.panTo(new google.maps.LatLng(latitude, longitude));


        };

        // Refresh the page upon window load. Use the initial latitude and longitude
        google.maps.event.addDomListener(window, 'load', googleMapService.refresh(selectedLat, selectedLong));
        return googleMapService;
    }]);