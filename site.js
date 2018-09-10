var firebaseConfig = {
    apiKey: "AIzaSyBIUiiO1KlGhO-jnj0MhvUshg4ugLfhCE4",
    authDomain: "oumc-database.firebaseapp.com",
    databaseURL: "https://oumc-database.firebaseio.com",
    projectId: "oumc-database",
    storageBucket: "oumc-database.appspot.com",
    messagingSenderId: "509465878745"
};

var membersTableRoot = '/Members/';
var rolloverCode = "code";
var superuserEmail = "oumc.superuser@gmail.com";
var rootLocation = "/~climbing/MEMBERSHIP_DATABASE/";
var postfix = ".html";

var addMemberFormLocation = rootLocation + "Index" + postfix;
var editMemberFormLocation = rootLocation + "Edit" + postfix;
var viewMembersLocation = rootLocation + "Database" + postfix;
var rolloverLocation = rootLocation + "Rollover" + postfix;
var errorLocation = rootLocation + "Error" + postfix;
var successLocation = rootLocation + "Success" + postfix;
var upgradeTermMembersLocation = rootLocation + "UpgradeTermMembers" + postfix;
var upgradeTermMemberLocation = rootLocation + "UpgradeTermMember" + postfix;

var canReadUsers = [
	"oumc.superuser@gmail.com",
	"oumc.president@gmail.com",
	"secretary.oumc@gmail.com"
];

var canWriteUsers = [
	"oumc.superuser@gmail.com",
	"oumc.president@gmail.com",
	"secretary.oumc@gmail.com",
    "oumc.finances@gmail.com",
	"oumc.meets@gmail.com",
	"oumc.gear@gmail.com",
	"oumc.socials@gmail.com",
	"oumc.librarian@gmail.com",
	"oumc.coursesandcomps@gmail.com",
	"webmaster.oumc@gmail.com",
	"oumc.expeditions@gmail.com"
];

var termMembershipTypes = [
    "Michaelmas",
    "Hilary",
    "Trinity",
    "Summer"
];

function registerAuthChecking(callbackIfSuperuser, callbackIfCanWriteOnly, callbackIfCanReadAndWrite, callbackOtherwise) {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            if (user.email === superuserEmail) {
                callbackIfSuperuser();
            }
            else if (canReadUsers.includes(user.email)) {
                callbackIfCanReadAndWrite();
            }
            else if (canWriteUsers.includes(user.email)) {
                callbackIfCanWriteOnly();
            }
            else {
                callbackOtherwise();
            }
        } else {
            callbackOtherwise();
        }
    });
}

function showForm() {
    $('#memberForm').show();
}

function getRawData() {
    getMembershipData(function (data) {
        return JSON.stringify(data);
    });
}

function firebaseInit() {
    firebase.initializeApp(firebaseConfig);

    var database = firebase.database();

    return database;
}

function authenticationProviderInit() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    return provider;
}

function getMembershipData(callback, memberId) {
    var searchTerm;
    if (memberId === undefined || memberId === null) {
        searchTerm = membersTableRoot;
    }
    else {
        searchTerm = membersTableRoot + memberId;
    }
    firebase.database().ref(searchTerm).once('value')
        .then(function (snapshot) {
            callback(snapshot.val());
        })
        .catch(function (error) {
            if (error.code === "PERMISSION_DENIED") {
                signInWithRedirect(function () {
                    getMembershipData(callback);
                });
            }
            else {
                window.location.href = errorLocation;
            }
        });
}

function signInWithRedirect(callback) {
    firebase.auth().signInWithRedirect(provider).then(callback);
}

function formatTimestamp(timestamp) {
    var date = new Date(timestamp);

    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    return day + "-" + month + "-" + year;
}

function goToEditPage(id) {
    window.location.href = editMemberFormLocation + "?id=" + id;
}

function deleteRecord(id) {
    if (confirm("Are you sure you want to delete this membership entry? This action cannot be undone.")) {
        firebase.database().ref(membersTableRoot).child(id).remove();
        location.reload();
    }
}

//https://davidwalsh.name/query-string-javascript
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function formatTimestampReverse(timestamp) {
    var date = new Date(timestamp);
    var day = singleDigitToTwoDigits(date.getDate());
    var month = singleDigitToTwoDigits(date.getMonth() + 1);
    var year = date.getFullYear();

    return year + "-" + month + "-" + day;
}

function singleDigitToTwoDigits(input) {
    return ("0" + input).slice(-2);
}

function emptyFunction() {
    return undefined;
}

//https://stackoverflow.com/a/30800715
function downloadObjectAsJson(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function processDateInput(date, elementId) {
    var isCorrectFormat = date.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
    if (isCorrectFormat) {
        var day = parseInt(date.substr(0, 2));
        var month = parseInt(date.substr(3, 2));
        var year = parseInt(date.substr(6, 4));

        if (day > 0 && day <= 31
        && month > 0 && month <= 12
        && year > 1970 && year < 3000) {
            var timestamp = Date.parse(year + '-' + month + '-' + day);
            if (isNaN(timestamp)) {
                inputError(elementId, 'Invalid Date Entered: Please enter a valid date.');
            } else {
                return timestamp;
            }
        } else {
            inputError(elementId, 'Invalid Date Entered: Please enter a valid date.');
        }
    } else {
        inputError(elementId, 'Wrong Date Format: Please enter date with format DD/MM/YYYY.');
    }
    return null;
}

function processTextInput(text, elementId) {
    if (!/^s*$/.test(text)) {
        return text;
    } else {
        inputError(elementId, 'Please enter valid text.');
        return null;
    }
}

function inputError(elementId, msg) {
    console.log(msg);
    var $element = $('#'+elementId);
    if ($element && !$element.hasClass('error')) {
        $element.addClass('error');

        var errorMessageObj = document.createElement('p');
        errorMessageObj.classList.add('error-msg');
        var textObj = document.createTextNode(msg);
        errorMessageObj.appendChild(textObj);
        $('#submit').addClass('error');

        insertAfter(errorMessageObj, $element[0]);
    }
}

function clearErrors() {
    var $errorEls = $('.error, .error-msg');
    $errorEls.each(function (i, el) {
        $this = $(this);
        $this.removeClass('error');
        if ($this.hasClass('error-msg')) {
            $this.remove();
        }
    });
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}