let cityLat = 0;
let cityLon = 0;
let cityName = ''; 
let countryCode = '';
let tempInK = 0;
let humidity = 0;
let windSpeed = 0;
let uvIndex = 0;
let iconName = '';
let iconURL= 'https://openweathermap.org/img/wn/';
let weatherIcon = '';
let weatherInfoRequestPrefix = 'https://api.openweathermap.org/data/2.5/';
let fiveDayRequestPrefix = 'https://api.openweathermap.org/data/2.5/forecast?q='; 
let uviQuery = 'uvi?'
// let apiKey = '&appid=5798a1edb7672033e58c4d096e47b7d7'
const apiKey = "&appid=" + config.OW_API_KEY;
let searchHistory = {};

$(document).ready(() => {
    // localStorage.clear();
    renderSearchHistory();
})

const renderSearchHistory = () => {
    let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
    if(searchHx) {
        arrayLength = searchHx.length;
        for(let i = 0; i < arrayLength; ++i) {
        $(`#row${i}`).html(`<td><button class="recent btn btn-link p-0 text-muted">${searchHx[i].searchString}</button></td>`);
        }
    }
}

$( "table" ).on( "click", "button.recent", function() {
    event.preventDefault();
    getWeatherInformation($(this).text());
});

let initializeLocalStorage = (() => {
    localStorage.setItem('searchHistory', '[]');
});

$('#city-search').click(() => {
    event.preventDefault();
    let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
    getWeatherInformation(citySearchString);
})

$('input').keypress(event => {
    if (event.which == 13) {
        event.preventDefault();
        let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
        getWeatherInformation(citySearchString);
    }
})

let getWeatherInformation = (citySearchString => {
    let cityQuery = 'weather?q=' + citySearchString;
    $.ajax({
        url: weatherInfoRequestPrefix + cityQuery + apiKey,
        method: "GET",
        error: (err => {
        alert("City Not Found. Please check the spelling, or enter a city name with a country code, separated by a comma")
        return;
        })
    })
    .then((response) => {
        cityLat = response.coord.lat;
        cityLon = response.coord.lon;
        cityName = response.name;
        countryCode = response.sys.country;
        tempInK = response.main.temp;
        humidity = response.main.humidity;
        windSpeed = response.wind.speed;
        iconName = response.weather[0].icon;
    })
    .then(() => {
        return $.ajax({
        url: weatherInfoRequestPrefix + uviQuery + apiKey + '&lat=' + cityLat + '&lon=' + cityLon,
        method: "GET"
        })
        .then(response => {
        uvIndex = response.value;
        })
        .then(() => {
        showValuesOnPage();
        })
    })

    $.ajax({
        url: fiveDayRequestPrefix + citySearchString + apiKey,
        method: "GET"
    })
    .then(response => {
        return setFiveDayData(response);
    })
})

let validatedSearchString = (city => {
    let search = city.split(',');
    if(search.length > 1){
        let first = search[0].length;
        let second = search[1].length;
        if(first === 0 || second === 0) {
        return first > second ? search[0] : search[1];
        }
        return search[0] + ',' + search[1];
    } else {
        return city;
    }
})

let dateString = (unixTime => {
    return moment(unixTime).format('MM/DD/YYYY');
})

let showValuesOnPage = (() => {
    let searchString = cityName; // If you wanted Country to show, add <  + ', ' + countryCode >
    $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
    addToSearchHistory(searchString, Date.now());
    renderSearchHistory();
    $('#weather-icon').attr('src', iconURL + iconName + '.png')
    $('#temp-data').text('Temperature: ' + 
        (tempInK - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
        ((tempInK - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
    $('#hum-data').text('Humidity: ' + humidity + '%');
    $('#wind-data').text('Wind Speed: ' + windSpeed + ' MPH');
    $('#uvi-data').text('UV Index: ' + uvIndex);
});

let setFiveDayData = (response => {
    let dataArray = response.list;
    let size = dataArray.length;
    let dayNumber = 1;
    for(let i = 0; i < size; i+=8) {
        $(`#five-day-${dayNumber}`).find('h6').text(dateString(dataArray[i].dt * 1000));
        $(`#five-day-${dayNumber}`).find('.weather-icon').attr('src', iconURL + dataArray[i].weather[0].icon + '.png');
        $(`#five-day-${dayNumber}`).find('.temp-5').text('Temperature: ' + 
        (dataArray[i].main.temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
        ((dataArray[i].main.temp - 273.15) * 9/5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
        $(`#five-day-${dayNumber}`).find('.hum-5').text('Humidity: ' + dataArray[i].main.humidity + '%');
        ++ dayNumber;
    }
})


let saveToLocalStorage = (searchHx => {
    return localStorage.setItem('searchHistory', JSON.stringify(searchHx));
});

const addToSearchHistory = (searchString, timeStamp) => {
    let obj = {
        "searchString": searchString,
        "timeStamp": timeStamp
    }
    let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
    if(!searchHx) {
        searchHx = [];
    }

    let len = searchHx.length;
    let inArray = false;
    for(let i = 0; i < len; ++i) {
        if(searchHx[i].searchString === obj.searchString) {
        searchHx[i].timeStamp = obj.timeStamp;
        inArray = true;
        }
    }

    if(inArray === false) {
        searchHx.push(obj);
    }

    searchHx.sort((b, a) => {
        return a.timeStamp - b.timeStamp;
    });

    while(searchHx.length > 10) {
        let popResult = searchHx.pop();
    }

    saveToLocalStorage(searchHx);
}
