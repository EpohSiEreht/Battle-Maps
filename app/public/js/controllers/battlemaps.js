var ctrl = angular.module('addCtrl', ['geolocation', 'gservice']);

ctrl.controller('mainController', ['$scope', '$http', 'geolocation', 'gservice', function($scope, $http, geolocation, gservice) {

    // Initializes Variables
    // ----------------------------------------------------------------------------
    $scope.formData = {};
    var coords = {};
    var lat = 0;
    var long = 0;

    $("#wrapper").toggleClass("active");

    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("active");
    });

    


    // Set initial coordinates to the center of the US

    var userData = {};
    $scope.id = {};

    // Get User's actual coordinates based on HTML5 at window load
    geolocation.getLocation().then(function(data){

        // Set the latitude and longitude equal to the HTML5 coordinates
        coords = {lat:data.coords.latitude, long:data.coords.longitude};

        $scope.formData.latitude = data.coords.latitude;
        $scope.formData.longitude = data.coords.longitude;

        userData = {
            latitude: data.coords.latitude, 
            longitude: data.coords.longitude
        };

        console.log(userData);

        $http.get('/currentUser').then(function(response) {
            console.log(response.data.local);
            var userID = response.data._id;
            console.log(data.coords.latitude);

            $http.patch('/users/' + userID, {local: {latitude: data.coords.latitude, longitude: data.coords.longitude, exp: response.data.local.exp, lives: response.data.local.lives, lvl: response.data.local.lvl}})
                    .success(function (data) {
                        // // Once complete, clear the form (except location)
                        // $scope.formData.latitude = "";
                        // $scope.formData.longitude = "";
                        console.log(data);
                        
                    })
                    .error(function (data) {
                        console.log('Error: ' + data);
                    });
        });

        // Display coordinates in location textboxes rounded to three decimal points
        $scope.formData.longitude = parseFloat(coords.long).toFixed(3);
        $scope.formData.latitude = parseFloat(coords.lat).toFixed(3);

        gservice.refresh(data.coords.latitude, data.coords.longitude);

    });
    // Refresh the map with new data
    gservice.refresh($scope.formData.latitude, $scope.formData.longitude);
    

}]);