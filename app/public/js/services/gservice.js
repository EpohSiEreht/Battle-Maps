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
                                            '<span class="col-md-3">'+
                                              '<img src="'+user.local.character+'" class="infopic">' +
                                            '</span>'+
                                          '<div class="row infoCol">'+
                                            '<span class="span5">'+
                                              '<p><b>Username</b>: ' + user.local.username + '</p>'+
                                              '<p><b>Lives</b>: ' + user.local.lives + '</p>'+
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

            // $('body').on('click', '.battle', function(){
            //     $("#wrapper").toggleClass("active");
            // });


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
                        var frontMaleTrainer = "http://sprites.pokecheck.org/t/144.gif";
                        var backMaleTrainer = "http://sprites.pokecheck.org/t/b013.gif";
                        var frontFemaleTrainer = "http://sprites.pokecheck.org/t/145.gif";
                        var backFemaleTrainer = "http://sprites.pokecheck.org/t/b015.gif";


                        function setUpEnemy(){
                            // Conditions for setting up enemy pokemon
                            if(n.character === frontBulbasaur){
                                $('#enemy-character').attr('src', frontBulbasaur);
                                $('#enemy-name').html('BULBASAUR');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 5);
                                eMoves[1] = new move("GROWL", 0);
                                // moves[2] = new move("Tackle", 3);
                                // moves[3] = new move("Cut", 4);

                                // Declare health
                                enemyHealth = 45;
                                maxEnemyHealth = 45;
                            } else if(n.character === frontCharmander) {
                                $('#enemy-character').attr('src', frontCharmander);
                                $('#enemy-name').html('CHARMANDER');
                                // Declare moves
                                eMoves[0] = new move("GROWL", 0);
                                eMoves[1] = new move("SCRATCH", 4);
                                // moves[2] = new move("Tackle", 3);
                                // moves[3] = new move("Cut", 4);

                                // Declare health
                                enemyHealth = 39;
                                maxEnemyHealth = 39;
                            } else if(n.character === frontSquirtle) {
                                $('#enemy-character').attr('src', frontSquirtle);
                                $('#enemy-name').html('SQUIRTLE');
                                // Declare moves
                                eMoves[0] = new move("TACKLE", 5);
                                eMoves[1] = new move("TAIL WHIP", 4);
                                // moves[2] = new move("Tackle", 3);
                                // moves[3] = new move("Cut", 4);

                                // Declare health
                                enemyHealth = 44;
                                maxEnemyHealth = 44;
                            }
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
                                moves[0] = new move("TACKLE", 20);
                                moves[1] = new move("GROWL", 0);
                                // moves[2] = new move("Tackle", 3);
                                // moves[3] = new move("Cut", 4);

                                // Declare health
                                userHealth = 45;
                                maxUserHealth = 45;

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
                                moves[1] = new move("SCRATCH", 4);
                                // moves[2] = new move("Tackle", 3);
                                // moves[3] = new move("Cut", 4);

                                // Declare health
                                userHealth = 39;
                                maxUserHealth = 39;

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
                                moves[0] = new move("TACKLE", 5);
                                moves[1] = new move("TAIL WHIP", 0);
                                // moves[2] = new move("Tackle", 3);
                                // moves[3] = new move("Cut", 4);

                                // Declare health
                                userHealth = 44;
                                maxUserHealth = 44;

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
                            // Set up battle div 
                            $('#battle-area').show();
                            if(currentUser[0].icon === frontBulbasaur){
                                var yourPokemonName = "BULBASAUR";
                            } else if(currentUser[0].icon === frontCharmander){
                                var yourPokemonName = "CHARMANDER";
                            } else if(currentUser[0].icon === frontSquirtle){
                                var yourPokemonName = "SQUIRTLE";
                            }
                            if(n.character === frontBulbasaur){
                                var enemyPokemonName = "BULBASAUR";
                            } else if(n.character === frontCharmander){
                                var enemyPokemonName = "CHARMANDER";
                            } else if(n.character === frontSquirtle){
                                var enemyPokemonName = "SQUIRTLE";
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
                                    $('#your-character').show().animate({
                                        width: '120px'
                                    }, 400, function(){
                                        setTimeout(function(){
                                            $('#intro-text').html("What will " + yourPokemonName + " do?"); 
                                            $('#menu-area').show();
                                        }, 1400);
                                       
                                        }
                                    );
                                    
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
                                        damage = Math.floor(Math.random() * eMoves[callEnemyAttack()].basedmg + 3);
                                    }
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
                                        damage = Math.floor(Math.random() * moves[userAttack].basedmg + 3);
                                    }
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
                                        $('#intro-text').html("Foe " + yourPokemonName + " has fainted!");
                                        $('#your-character').animate({
                                            bottom: '-100px'
                                        }, 800);
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
                                            if( Math.cbrt(updatedEXP) < Math.ceil(Math.cbrt(currentEXP)) ){
                                                $('#your-exp').animate({
                                                    width: widthEXP
                                                }, 500, function(){
                                                    $('#end-battle').show();
                                                    $('body').on('click', '#end-button', function(){
                                                        $('battle-area').hide();
                                                        location.reload();
                                                    });
                                                });
                                            } else if( Math.cbrt(updatedEXP) >= Math.ceil(Math.cbrt(currentEXP)) ){
                                                $('#your-exp').animate({
                                                    width: "162px"
                                                }, 500, function(){
                                                    setTimeout(function(){
                                                        $('#intro-text').html(yourPokemonName + " grew to LV. " + afterLevel + "!");
                                                        $('#your-level').html(afterLevel);
                                                        $('#your-exp').css('width', '0px');
                                                        $('#your-exp').animate({
                                                            width: widthEXP
                                                        }, 500, function(){
                                                            $('#end-battle').show();
                                                            $('body').on('click', '#end-button', function(){
                                                                $('#battle-area').hide();
                                                                location.reload();
                                                            });
                                                        });
                                                    }, 1200);
                                                });
                                            }
                                            $http.patch('/users/' + currentUser[0].id, {local: {latitude: currentUser[0].lat, longitude: currentUser[0].lon, exp: updatedEXP, lives: currentUser[0].lives, lvl: afterLevel}})
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