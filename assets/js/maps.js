var map, places, infoWindow;
var searchSettings;
var markers = [];
var autocomplete;
var TYPE_COLOR = {
	restaurant: 'ff6600',
	lodging: '33ff00',
	point_of_interest: '9999ff'
};
var ALL_TYPES = ['restaurant', 'lodging', 'point_of_interest'];
var cityRestrict = {
	'country': 'iq'
};
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');

// List of Iraqi cities location on the map and zoom for each city
var countries = {
	'iq': {
		center: {
			lat: 33.312805,
			lng: 44.361488
		},
		zoom: 6
	},
	'bg': {
		center: {
			lat: 33.312805,
			lng: 44.361488
		},
		zoom: 11
	},
	'mo': {
		center: {
			lat: 36.340000,
			lng: 43.130001
		},
		zoom: 12
	},
	'su': {
		center: {
			lat: 35.566864,
			lng: 45.416107
		},
		zoom: 13
	},
	'bs': {
		center: {
			lat: 30.508102,
			lng: 47.783489
		},
		zoom: 11
	},
	'er': {
		center: {
			lat: 36.191113,
			lng: 44.009167
		},
		zoom: 13
	},
	'al': {
		center: {
			lat: 33.355026,
			lng: 43.783337
		},
		zoom: 12
	},
	'ka': {
		center: {
			lat: 34.645638,
			lng: 45.322723
		},
		zoom: 12
	},
	'zu': {
		center: {
			lat: 30.389462,
			lng: 47.705727
		},
		zoom: 12
	},
	'sa': {
		center: {
			lat: 33.384441,
			lng: 44.465103
		},
		zoom: 13
	},
	'hi': {
		center: {
			lat: 32.483334,
			lng: 44.433334
		},
		zoom: 13
	}
};

function initMap() {
	// Restrict screen size
	if ($(window).width() < 1024) {
		alert('Less than 1024');
		return;
}
 
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: countries['iq'].zoom,
		center: countries['iq'].center,
		mapTypeControl: true,
		panControl: true,
		zoomControl: true,
		streetViewControl: false,
	});
	infoWindow = new google.maps.InfoWindow({
		content: document.getElementById('info-content')

	});
	// Create the autocomplete object and associate it with the UI input control.
	// The search limits Iraq cities only.
	autocomplete = new google.maps.places.Autocomplete(
		/** @type {!HTMLInputElement} */
		(
			document.getElementById('autocomplete')), {
			types: ['(cities)'],
			componentRestrictions: {
				country: "iq"
			}
		});
	places = new google.maps.places.PlacesService(map);


	changeType(['lodging']);
	autocomplete.addListener('place_changed', onPlaceChanged);
	document.getElementById('restaurant').addEventListener('change', () => searchByTypes(['restaurant']));
	document.getElementById('hotel').addEventListener('change', () => searchByTypes(['lodging']));
	document.getElementById('tourist').addEventListener('change', () => searchByTypes(['point_of_interest']));


	// Add a DOM event listener to react when the user selects a city.
	document.getElementById('city').addEventListener('change', setCity);
	document.getElementById('Reset-Button').addEventListener("click", setCity);
}

// Settings button reset filters
function Reset() {
	clearResults();
	clearMarkers();
	$('#city')[0].selectedIndex = 0;
	$("#autocomplete").val("");
	$('input[name="buton"]').prop('checked', false);
	$('input[value="hotel"]').prop('checked', true);
	map.setZoom(6);
	map.setCenter(countries["iq"].center);
	map.componentRestrictions = {
		'city': []
	};
	place = "";
}

// When the user selects a city, get the place details for the city and
// zoom the map in on the city.
function onPlaceChanged() {
	var place = autocomplete.getPlace();
	if (place.geometry) {
		map.panTo(place.geometry.location);
		map.setZoom(15);
		search();
	} else {
		document.getElementById('autocomplete').placeholder = 'Enter a city';
	}
}

function searchByTypes(types) {
	changeType(types);
	search();
}

function changeType(types) {
	searchSettings = {
		types
	};
}

// Search for hotels, restaurants and tourist areas, within the viewport of the map.
function search() {
	places.nearbySearch({
		bounds: map.getBounds(),
		...searchSettings
	}, function (results, status) {
		if (status === google.maps.places.PlacesServiceStatus.OK) {
			clearResults();
			clearMarkers();
			// Create a sign for each hotel, restaurant or tourist place found, and
			// assign a letter of the alphabetic to each marker icon.
			for (var i = 0; i < results.length; i++) {
				var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
				var markerIcon = getMarkerUrl(getMainResultType(results[i].types), markerLetter);
				// Use marker animation to drop the icons incrementally on the map.
				markers[i] = new google.maps.Marker({
					position: results[i].geometry.location,
					animation: google.maps.Animation.DROP,
					icon: markerIcon
				});
				// If the user clicks on a hotel sign, show the details of that hotel, restaurant or tourist area
				// in an info window.
				markers[i].placeResult = results[i];
				google.maps.event.addListener(markers[i], 'click', showInfoWindow);
				setTimeout(dropMarker(i), i * 100);
				addResult(results[i], i);
			}
		}
	});
}

function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		if (markers[i]) {
			markers[i].setMap(null);
		}
	}
	markers = [];
}

// Set the city restriction based on user input.
// Also center and zoom the map on the given city.
function setCity() {
	var city = document.getElementById('city').value;
	if (city == 'all') {
		autocomplete.setComponentRestrictions({
			'city': []
		});
		map.setCenter({
			lat: 33.312805,
			lng: 44.361488
		});
		map.setZoom(6);
	} else {
		autocomplete.setComponentRestrictions({
			'city': city
		});
		map.setCenter(countries[city].center);
		map.setZoom(countries[city].zoom);
		search();
	}
	clearResults();
	clearMarkers();
}

function dropMarker(i) {
	return function () {
		markers[i].setMap(map);
	};
}

function getMainResultType(types) {
	return types.find((type) => {
		return ['lodging', 'point_of_interest', 'restaurant'].includes(type);
	});
}

function getMarkerUrl(type, letter) {
	var markerColor = TYPE_COLOR[type];
	return `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${letter}|${markerColor}`;
}

function addResult(result, i) {
	var results = document.getElementById('results');
	var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));

	var tr = document.createElement('tr');
	tr.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
	tr.onclick = function () {
		google.maps.event.trigger(markers[i], 'click');
	};

	var iconTd = document.createElement('td');
	var nameTd = document.createElement('td');
	var icon = document.createElement('img');
	var resultType = getMainResultType(result.types);
	icon.src = getMarkerUrl(resultType, markerLetter);
	icon.setAttribute('class', 'placeIcon');
	icon.setAttribute('className', 'placeIcon');
	var name = document.createTextNode(result.name);
	iconTd.appendChild(icon);
	nameTd.appendChild(name);
	tr.appendChild(iconTd);
	tr.appendChild(nameTd);
	results.appendChild(tr);
}

function clearResults() {
	var results = document.getElementById('results');
	while (results.childNodes[0]) {
		results.removeChild(results.childNodes[0]);
	}
}

// Get the place details for a hotel, restaurant or tourist area.
//Display information in the information window, installed on the hotel, 
//restaurant or tourist marker specified by the user.
function showInfoWindow() {
	var marker = this;
	places.getDetails({
			placeId: marker.placeResult.place_id
		},
		function (place, status) {
			if (status !== google.maps.places.PlacesServiceStatus.OK) {
				return;
			}
			infoWindow.open(map, marker);
			buildIWContent(place);
		});
}

// Load the place information into the HTML elements used by the info window.
function buildIWContent(place) {
	document.getElementById('iw-icon').innerHTML = '<img class="hotelIcon" ' +
		'src="' + place.icon + '"/>';
	document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
		'">' + place.name + '</a></b>';
	document.getElementById('iw-address').textContent = place.vicinity;

	if (place.formatted_phone_number) {
		document.getElementById('iw-phone-row').style.display = '';
		document.getElementById('iw-phone').textContent =
			place.formatted_phone_number;
	} else {
		document.getElementById('iw-phone-row').style.display = 'none';
	}


	if (place.rating) {
		var ratingHtml = '';
		for (var i = 0; i < 5; i++) {
			if (place.rating < (i + 0.5)) {
				ratingHtml += '✩';
			} else {
				ratingHtml += '✭';
			}
			document.getElementById('iw-rating-row').style.display = '';
			document.getElementById('iw-rating').innerHTML = ratingHtml;
		}
	} else {
		document.getElementById('iw-rating-row').style.display = 'none';
	}

	// The regexp isolates the first part of the URL (domain plus subdomain)
	// to give a short URL for displaying in the info window.
	if (place.website) {
		var fullUrl = place.website;
		var website = hostnameRegexp.exec(place.website);
		if (website === null) {
			website = 'http://' + place.website + '/';
			fullUrl = website;
		}
		document.getElementById('iw-website-row').style.display = '';
		document.getElementById('iw-website').textContent = website;
	} else {
		document.getElementById('iw-website-row').style.display = 'none';
	}
}