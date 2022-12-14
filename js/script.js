// Authors: Jonathan Wist and Alden Geipel

// Definitions of all different elements on the HTML page.
const form = document.querySelector("form");

const input = document.querySelector("#keyword");

// Number of results per-page.
const num_res = document.querySelector("#num-results");

// Different filters that could be applied to the search.
const filter = document.querySelector("#filter");

// Buttons to the next and previous pages of results, as well as
// variables to hold the locations of those pages.
const prevButton = document.querySelector("#prev");
const nextButton = document.querySelector("#next");

const key = 'AIzaSyA6JFCh_bFbNbQM_A7-_YiXqG0fo7BbNHM';

// Results element and listeners for different user actions.
const results = document.querySelector("#results");

// Variable to save num of results per page.
let num;

// Variables to save the previous and next page tokens.
let nextPage;
let prevPage;

// Variable to store the list of responses from YouTube's API
let respList;

// Event Listeners all being added to their respective functions.
form.addEventListener('submit', submitFunc);
nextButton.addEventListener('click', nextFunc);
prevButton.addEventListener('click', prevFunc);
window.addEventListener('resize', updateImages);

// Function to be executed when the form is submitted whether by keypress or
// by hitting the 'submit' button.
async function submitFunc(ev) {
    ev.preventDefault();
    num = num_res.value;
    // If greater than 20 results per page
    if (num > 20) {
        num = 20;
    }

    // Check if there will actually be anything to display.
    if (input.value != "" && num > 0) {
        // Fetch the number of results from the YouTube API using the input as a query.
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&order=${filter.value}&maxResults=${num}&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);

        respList = respJson.items;
        // Store the token to get to the next page of results.
        nextPage = respJson.nextPageToken;
        console.log(respList);
        clearResultsElem();

        // Get the ratings of each result using the ReturnYouTubeDislikes API.
        const ratings = await getRatings(respList);
        console.log(ratings);

        // Create the HTML elements to be added to the page.
        const resultElems = await createElements(respList, ratings);
        results.append(...resultElems);
    }
}

// Runs through every response from YouTube in the list and gets their data from the 
// ReturnYouTubeDislikes API and stores the json version of the their ratings data 
// in a list to be used later.
// @param respList: list of results from YouTube's API
async function getRatings(respList) {
    const ratings = await Promise.all(
        respList.map((item) => {
            if (item.id.kind == "youtube#video") {
                const videoID = item.id.videoId;
                return fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoID}`).then((res) =>
                res.json().then( (jsonRes) => { return jsonRes } ));
            }
        })
    );
    return ratings;
} 

// Loops through each YouTube result and its corresponding rating data and creates
// HTML elements for each of them.
// @param response: list of search results from YouTube's API
// @param ratings: list of ratings data from the ReturnYouTubeDislikes API
async function createElements(response, ratings) {
    const elements = await Promise.all(
        response.map((item, index) =>{
            return createVideoElem(item, ratings[index]);
        })
    );
    return elements;
}

// Creates the individual HTML elements and returns them to the createElements
// function.
// @param item: individual search result from YouTube's API
// @param ratings: rating data for that item
function createVideoElem(item, ratings) {

    let title = item.snippet.title;
    let src = item.snippet.thumbnails.high.url;
    let uploader, viewCount, likes, dislikes;

    // Only assign these values if the current item is a video.
    if (ratings != null) {
        uploader = item.snippet.channelTitle;
        viewCount = ratings.viewCount
        likes = ratings.likes
        dislikes = ratings.dislikes
    }

    // Creates the main card for the item and the body of that card.
    const videoCard = document.createElement("div");
    videoCard.classList.add("card", "text-white", "bg-dark", "mb-3");
    if (item.id.kind == "youtube#video") {
        videoCard.classList.add("video");
        videoCard.id = item.id.videoId;
    } else {
        videoCard.classList.add("channel");
        videoCard.id = item.id.channelId;
    }
    videoCard.style.maxWidth = "800px";
    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    // Creates the title element, adds it to the card body.
    const cardTitle = document.createElement("h5");
    cardTitle.classList.add("card-title");
    cardTitle.innerHTML = title;
    cardBody.append(cardTitle);

    // Creates the image element, determines the resolution of the image based
    // on the resolution of the screen, then adds it to the card body.
    const cardImg = document.createElement("img");
    cardImg.classList.add("card-img");
    if (window.matchMedia("(max-width: 319px)").matches) {
        src = item.snippet.thumbnails.default.url;
    }
    else if (window.matchMedia("(max-width: 500px)").matches || 
        (item.id.kind == "youtube#channel" && window.matchMedia("(max-width: 800px)").matches)) {
        src = item.snippet.thumbnails.medium.url;
    }
    cardImg.src = src;
    cardBody.append(cardImg);

    // Creates the elements to be used if the current item is a video.
    const cardUpload = document.createElement("p");
    const cardViews = document.createElement("p");
    const cardLikes = document.createElement("p");
    const cardDislikes = document.createElement("p");

    // Only assigns and appends the previous elements if the current item is a video.
    if (item.id.kind == "youtube#video") {
        // Video uploader part of the card
        cardUpload.classList.add("card-text");
        cardUpload.innerHTML = `Uploader: ${uploader}`;
        cardBody.append(cardUpload);

        // Video views
        cardViews.classList.add("card-text");
        cardViews.innerHTML = `View Count: ${viewCount}`;
        cardBody.append(cardViews);

        // Video likes
        cardLikes.classList.add("card-text");
        cardLikes.innerHTML = `Likes: ${likes}`;
        cardBody.append(cardLikes);

        // Video dislikes
        cardDislikes.classList.add("card-text");
        cardDislikes.innerHTML = `Dislikes: ${dislikes}`;
        cardBody.append(cardDislikes);
    }
    videoCard.append(cardBody);
    return videoCard;
}

// Clears the page of past results.
function clearResultsElem() {
    Array.from(results.childNodes).forEach((child) => {
      child.remove();
    });
}

// Function to alter image sizes for results as the window changes sizes to 
// dynamically alter them and use the other images of different resolutions.
function updateImages() {
    // Only executes if there are images to modify.
    if (respList != null && results.childNodes != null) {
        Array.from(results.childNodes).forEach((item, index) => {
            const img = item.childNodes[0].childNodes[1];

            // Lowest resolution
            if (window.matchMedia("(max-width: 319px)").matches) {
                img.src = respList[index].snippet.thumbnails.default.url;
            }
            // Medium-quality resolution
            else if (window.matchMedia("(max-width: 500px)").matches ||
                (respList[index].id.kind == "youtube#channel" && window.matchMedia("(max-width: 800px)").matches)) {
                img.src = respList[index].snippet.thumbnails.medium.url;
            } 
            // High-quality resolution
            else {
                img.src = respList[index].snippet.thumbnails.high.url;
            }
        });
    }
}

// Function to execute when the 'next page' button is pressed. Fetches
// the next page of results using the earlier saved next page token.
async function nextFunc() {
    if (nextPage != null) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?pageToken=${nextPage}&part=snippet&order=${filter.value}&maxResults=${num}&&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);

        // Check that there is a next page in the new results.
        if (respJson.nextPageToken != null) {
            nextPage = respJson.nextPageToken;
        } else {
            nextPage = null;
        }

        prevPage = respJson.prevPageToken;
        respList = respJson.items;
        clearResultsElem();

        // Get ratings and create the result HTML elements.
        const ratings = await getRatings(respList);
        console.log(ratings);
        const resultElems = await createElements(respList, ratings);
        results.append(...resultElems);
    }
}

// Function to be executed when hitting the 'previous page' button. Only 
// executes if there is a previous page. Fetches the page of results using
// the stored previous page token.
async function prevFunc() {
    if (prevPage != null) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?pageToken=${prevPage}&part=snippet&order=${filter.value}&maxResults=${num}&&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);

        // Check that there is a previous page in the new results.
        if (respJson.prevPageToken != null) {
            prevPage = respJson.prevPageToken;
        } else {
            prevPage = null;
        }

        nextPage = respJson.nextPageToken;
        respList = respJson.items;
        clearResultsElem();

        // Get the ratings for each result and create their HTML elements.
        const ratings = await getRatings(respList);
        console.log(ratings);
        const resultElems = await createElements(respList, ratings);
        results.append(...resultElems);
    }
}