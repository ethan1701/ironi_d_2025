// jquery(function($) {
    // // asynchronously load the map api 
	// var apikey = "aizasydvls9ns9jb8rycf8hawzs5jylfdip2vdk";
    // var script = document.createelement('script');
    // script.src = "http://maps.googleapis.com/maps/api/js?callback=drawMap&key=" + apikey;
    // document.body.appendchild(script);
	// console.log('foo');

// });

function drawMap(markers) {
//	markers = JSON.parse(markers);
//	console.log(markers);
	
    var map;
    var bounds = new google.maps.LatLngBounds();
    var mapOptions = {
        mapTypeId: 'roadmap'
    };

    // Display a map on the page
    map = new google.maps.Map(document.getElementById("GoogleMap"), mapOptions);

    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow(), marker, i;
    
    // Loop through our array of markers & place each one on the map  
    for( i = 0; i < markers.addresses.length; i++ ) {
		var position = new google.maps.LatLng(markers.addresses[i].lat, markers.addresses[i].long);
		var image = {
			url: markers.addresses[i].marker,
			scaledSize: new google.maps.Size(40, 70),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(20, 70)
		};
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: map,
			icon: image,
            title: markers.addresses[i].title
        });

        // Allow each marker to have an info window    
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infoWindow.setContent(markers.addresses[i].infoWindow);
                infoWindow.open(map, marker);
            }
        })(marker, i));
        
        // Automatically center the map fitting all markers on the screen
        map.fitBounds(bounds);
    }

    // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
    var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
        this.setZoom(15);
        google.maps.event.removeListener(boundsListener);
    });
    
} 