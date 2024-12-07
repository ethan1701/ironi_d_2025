const spreadsheetId = '1rA-ytUWAHycqiX_pRjxJfdZ-JVbBMgP_tQj3Ur7MRXc'
const sheetName='formatted';
const kidPicBaseUrl = 'images/kids/';
let kids = {};
let spData = null;


// function doData(json) {
// 	spData = json.feed.entry;
// }

// function getTitleFromCol(titles, col) {
// 	return titles[col];
// }

function toHumanDate(date) {
	var options = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	};
	var locale = 'he-IL';
	if(date instanceof Date && !isNaN(date.valueOf())){
		return date.toLocaleDateString(locale, options);		
	}else{
		return null;
	}
}

function createVcard(kid, includePic) {
	// create a downloadable vcard
	
	function getPicBase64(kidPicAddress, cb){
		loadXHR(kidPicAddress).then(function(blob) {
		var reader = new window.FileReader();
		reader.readAsDataURL(blob);
		reader.onloadend = function() {
//			console.log(reader.result);
			cb ('PHOTO;ENCODING=b;TYPE=JPEG:' + reader.result);
			}
		})
		
	}
	
	vcard = {
		version: "3.0",
		n: kid["Last_Name"] + ";" + kid["First_Name"] + ";",
		fn: kid["Full Name"],
		org: "עירוני ד' ז'5",
		adr: [],
		tel: [],
		email: []
	}

	if(toHumanDate(kid["DOB"])){
		vcard.bday = kid["DOB"];
	}
	// a kid may have more than one address. Put them all in the vcard
	var addresses = kid["Address"].split("\n");
	for (var address in addresses) {
		vcard.adr.push({
			value: ";;" + addresses[address] + ";תל אביב;;ישראל",
			type: "home"
		});
	}

	// add each phone and email that exists
	if ("child phone" in kid) {
		vcard.tel.push({
			value: kid["child phone"],
			type: "CELL"
		});
	}
	if ("child email" in kid) {
		vcard.email.push({
			value: kid["child email"],
			type: "HOME"
		});
	}

	// generate base64 for image, if needed
	if (includePic) {
		var kidPicAddress = kid["pic"];
		getPicBase64(kidPicAddress, function(photo){
			vcard.photo = 'photo';
//			console.log(photo);
		})
	}
	
	var vcardBack = {};
	vcardBack.string = vCard.dump(vcard);
	vcardBack.file = vCard.export(vcard, kid["Full Name"], false);
	
//	console.log(vcardBack);
//	return vCard.export(vcard, kid["Full Name"], false) // use parameter true to force download
	return vcardBack;
}
// top details box
function showDetails(kid) {
	console.log(kid);
	history.pushState(null, null, '#details');

	details = $("<div class = 'kid' />");
//	var imgURL = ("ImageID" in kid) ? "https://drive.google.com/uc?export=view&id=" + kid["ImageID"] : "";
	var imgURL = kidPicBaseUrl + kid["photoName"]+ '.jpg'
	var imgURL = kid["pic"]
	var img = $("<img onerror='$(this).attr(\"src\",\"images/transparent.png\");' src='" + imgURL + "' class='kidpic'/>");
	details.append(img);

	var info = $("<span class='info'/>");
	var name = $("<div class = 'fullName'/>");
	var address = $("<div class='address' title='כתובת'/>");
	var dob = $("<div class='dob' title='תאריך לידה'/>");
	details.append(info);
	info.append(name);
	
	if(kid["child phone"] != null && kid["child phone"] != ""){
		info.append(getContactInfo(kid["child phone"], "phone"));
	}

	if(kid["child email"] != null && kid["child email"] != ""){
		info.append(getContactInfo(kid["child email"], "email"));
	}

	var dateString = toHumanDate(new Date(kid["DOB"]));
	if(dateString){
		dob.append(dateString);
		info.append(dob);
	}
	
	if(kid["Address"] != ""){
		address.append(kid["Address"].replace("\n", "<br />"));
		info.append(address);
	}
	
	name.append(kid["Full Name"]);
	
	var contact = $("<div class='contact'/>");
	var parent1 = $("<div class='parent  parent1'/>");
	var parent2 = $("<div class='parent  parent2'/>");

	details.append(contact);

	if(kid["Parent1 Full Name"].trim() !=""){
		parent1.append(kid["Parent1 Full Name"]);
	}
	if(kid["Parent 1 phone"] != ""){
		parent1.append(getContactInfo(kid["Parent 1 phone"], "phone"));
	}
	if(kid["Parent 1 Email"] != ""){
		parent1.append(getContactInfo(kid["Parent 1 Email"], "email"));
	}
	var thereAreTwoParents = false;
	if(kid["Parent2 Full Name"].trim() !=""){
		parent2.append(kid["Parent2 Full Name"]);
		thereAreTwoParents = true;
	}
	if(kid["Parent 2 phone"] && kid["Parent 2 phone"].length > 0){
		parent2.append(getContactInfo(kid["Parent 2 phone"], "phone"));
		thereAreTwoParents = true;
	}
	if(kid["Parent 2 Email"] && kid["Parent 2 Email"].length > 0){
		parent2.append(getContactInfo(kid["Parent 2 Email"], "email"));
		thereAreTwoParents = true;
	}
	contact.append(parent1);
	if (thereAreTwoParents) {
		contact.append(parent2);
	}

	$("#details").empty().append(details);

	if (kid["Address"] != "") {
		var googleMap = $("<div id = 'GoogleMap' class = 'GoogleMap'>");
		$("#details").append(googleMap);
		drawMap(kid["Address For Map"]);
	}
	$(".dynamic").addClass("showDetails");
	$("#details").scrollTop(0);

	var vcardLink = createVcard(kid, true)
	info.append(vcardLink.file);
	
	//higlight relevant details
	var filterStr = $("#filter")[0].value.toUpperCase();
	if ( filterStr ) {
		$('#detailsContainer').highlight( filterStr );
		
	return details;
	}

}

function hideDetails() {
	$(".dynamic").removeClass("showDetails");
}

function getContactInfo(info, type) {
	if (null == info) return null;
	if (type == "phone") {
		var stripped = info.replace(/-/g,"");
		return ("<div class= '" + type + "'><a href='tel:" + stripped + "' title='חייג' target='_blank'>" + info + "</a><a href='https://api.whatsapp.com/send?phone=972" + stripped + "' title='שלח הודעת WhatsApp' target='_blank' class='whatsapp'></a></div>");
	} else if (type == "email") {
		return ("<a href='mailto:" + info + "' class='" + type + "' target='_blank' title='שלח מייל'>" + info + "</a>");
	} else return null;
}

function drawDetails(form, kid) {
	//   console.log(kid);
	var container = $("<div class = 'kidContainer' />");
	var div = $("<div class = 'kid' title='" + kid["Full Name"] + "'/>").click(function() {
		showDetails(kid)
	});
	// http://www.husky-owners.com/forum/uploads/monthly_2015_06/558fcc225abae_photo.thumb_jpgsz256.65bbc89b7dc3a7d0047f701989439647
//	var imgURL = ("ImageID" in kid) ? "https://drive.google.com/uc?export=view&id=" + kid["ImageID"] : "";
	var imgURL = kid["pic"]
	var img = $("<img onerror='$(this).attr(\"src\",\"images/transparent.png\");' src='" + imgURL + "' class='kidpic' />");
	var name = $("<div class = 'fullName'/>");
	var info = $("<div class='info'/>");
	var address = $("<div class='address' title='כתובת'/>");
	var dob = $("<div class='dob' title='תאריך לידה'/>");
	var contact = $("<div class='contact'/>");
	var parent1 = $("<div class='parent  parent1'/>");
	var parent2 = $("<div class='parent  parent2'/>");
	form.append(container);
	container.append(div);
	div.append(img);
	div.append(name);
	div.append(info);
	div.append(contact);
	name.append(kid["Full Name"]);
	
	var dateString = toHumanDate(new Date(kid["DOB"]));
	if(dateString){
		dob.append(dateString);
		info.append(dob);
	}
	
	if(kid["Address"] != ""){
		address.append(kid["Address"].replace("\n", "<br />"));
		info.append(address);
	}
	parent1.append(kid["Parent1 Full Name"]);
	parent1.append(getContactInfo(kid["Parent 1 phone"], "phone"));
	parent1.append(getContactInfo(kid["Parent 1 Email"], "email"));
	parent2.append(kid["Parent2 Full Name"]);
	parent2.append(getContactInfo(kid["Parent 2 phone"], "phone"));
	parent2.append(getContactInfo(kid["Parent 2 Email"], "email"));
	contact.append(parent1);
	if ("Parent2 Full Name" in kid || "Parent 2 phone" in kid || "Parent 2 Email" in kid) {
		contact.append(parent2);
	}
	var vcardLink = createVcard(kid, true)
	console.log(vcardLink.string);
	// var qrStr = 'https://quickchart.io/qr?text='+encodeURI(vcardLink.string).replace(/'/g,"%27");
	// div.append("<img src='" + qrStr + "' class='QR''/>");

}

function readData() {
	// create array of column titles and corresponding column numbers
	let titles = {};
	Object.keys(spData.cols).forEach(function(key) {
	    titles[key] = spData.cols[key].label;
	});

	// iterate over the kids. create an opject with keys = column names, and each kid's value
	Object.keys(spData.rows).forEach(function(key) {
		kids["kid"+key] = {};
		Object.keys(spData.rows[key].c).forEach(function(col) {
			// if cell is not null, it will have a (v)alue key. Some also have a (f)ormatted key.
			// prioritize $.f over $.v
			let value;
			if (null == spData.rows[key].c[col]){
				console.warn(spData.rows[key].c[0].v + " does not have " + titles[col]);
				value = '';
			}
			else {
				if (!(undefined === spData.rows[key].c[col].f)){
					value = spData.rows[key].c[col].f;
				}
				else{
					value = spData.rows[key].c[col].v;
				}
			}
			kids["kid"+key][titles[col]] = value;
		});
	});
	console.log(kids);
}

function filterKids(){
	var filterStr = $("#filter")[0].value.toUpperCase();
	var kids = document.getElementsByClassName('kidContainer');
	[].forEach.call(kids, (function (kid){
		// start by hiding all
		if(filterStr != ''){
			kid.classList.add('hidden');
		}
		
		// if search is empty, show all
		if(filterStr == ''){
			kid.classList.remove('hidden');
		}
		
		if (kid.innerText.toUpperCase().indexOf(filterStr) > -1){
				kid.classList.remove('hidden');
			}
	}));
	
	// remove any old highlighted terms
	$('#body, #detailsContainer').removeHighlight();
	// disable highlighting if empty
	if ( filterStr ) {
		// highlight the new term
		$('#body, #detailsContainer').highlight( filterStr );
	}
}

$(document).ready(function() {
	fetch('https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/gviz/tq?tqx=out:json&sheet=' + sheetName)
		.then(res => res.text())
		.then(text => {
			spData = JSON.parse(text.substr(47).slice(0, -2)).table;
			console.log(spData)
		})
		.then(data => {
			readData();
			for (i in kids) {
				drawDetails($("#data"), kids[i]);
			}
		})

	if (window.history && window.history.pushState) {
		window.history.pushState('forward', null, './#forward');
		$(window).on('popstate', function() {
			hideDetails();
		});

	}
});

$.preloadImages = function() {
	for (var i = 0; i < arguments.length; i++) {
		$("<img />").attr("src", arguments[i]);
	}
}

$.preloadImages("images/print-user.png", "images/email-Icon.png", "images/phone-icon.png");

/*
todo:
O 	use map API instead of embed
O 	format field address for map, use that
O	remove link to map from displayed address
O	improve print layout
O	small layout tweaks
O	get all kids from vaad
O	link to contact download
add image to vcard. possibly store base64 in spreadsheet
enable bookmark on mobile
O	search
links on bottom. Do we need them?
all on one map
*/
