async function drawMap(markers='{"addresses":[{"title":"nowhere","latlng":{"lat": 0, "lng": 0}}]}') {
	markers = JSON.parse(markers);
	console.log(markers);
	
	const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
	const position = markers.addresses[0].latlng;
	const title = markers.addresses[0].title;

	const map = new google.maps.Map(document.getElementById("GoogleMap"),  {
    zoom: 15,
    center: position,
    mapId: "DEMO_MAP_ID", // Map ID is required for advanced markers.
  });

	const marker = new google.maps.marker.AdvancedMarkerElement({
			map: map,
			position: position,
			title: title
	});
}
