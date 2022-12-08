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
        // results.append(...resultElems);
        results.innerHTML = resultElems.join("");
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
    // const vidElem = document.createElement("div");
    // // Determine whether the element is a YouTube channel or video and store
    // // some identification data.
    // if (item.id.kind == "youtube#channel") {
    //     vidElem.id = item.id.channelId;
    //     vidElem.classList.add("channel");
    // } else if (item.id.kind == "youtube#video") {
    //     vidElem.id = item.id.videoId;
    //     vidElem.classList.add("video");
    // }

    // // Store data for the title of the result.
    // const title = document.createElement("h2");
    // // const tempElem = document.createElement("div");
    // // tempElem.innerHTML = video.snippet.title;
    // // title.textContent = tempElem.textContent;
    // title.innerHTML = item.snippet.title;
    // vidElem.append(title);

    // // Store data for the image of the result
    // const currImg = document.createElement("img");
    // // Dynamically changes which image is displayed based upon the resolution
    // // of the display device.
    // if (window.matchMedia("(max-width: 319px)").matches) {
    //     currImg.src = item.snippet.thumbnails.default.url;
    // }
    // else if (window.matchMedia("(max-width: 500px)").matches || 
    //     (item.id.kind == "youtube#channel" && window.matchMedia("(max-width: 800px)").matches)) {
    //     currImg.src = item.snippet.thumbnails.medium.url;
    // } else {
    //     currImg.src = item.snippet.thumbnails.high.url;
    // }
    // vidElem.append(currImg);

    // // Only applies ratings data if the element is a YouTube video.
    // if (ratings != null) {
    //     const viewElem = document.createElement("h3");
    //     viewElem.textContent = `Views: ${ratings.viewCount}`;
    //     vidElem.append(viewElem);

    //     const likeElem = document.createElement("h4");
    //     likeElem.textContent = `Likes: ${ratings.likes}`;
    //     vidElem.append(likeElem);
    //     const dislikeElem = document.createElement("h4");
    //     dislikeElem.textContent = `Dislikes: ${ratings.dislikes}`;
    //     vidElem.append(dislikeElem);
    // }
    // return vidElem;
    let title = item.snippet.title;
    let src = item.snippet.thumbnails.high.url;
    let uploader, viewCount, likes, dislikes;
    if (ratings != null) {
        uploader = item.snippet.channelTitle;
        viewCount = ratings.viewCount
        likes = ratings.likes
        dislikes = ratings.dislikes
    }

    if (window.matchMedia("(max-width: 319px)").matches) {
        src = item.snippet.thumbnails.default.url;
    }
    else if (window.matchMedia("(max-width: 500px)").matches || 
        (item.id.kind == "youtube#channel" && window.matchMedia("(max-width: 800px)").matches)) {
        src = item.snippet.thumbnails.medium.url;
    }

    let videoCard;
    if (item.id.kind == "youtube#video") {
        console.log(item);
        console.log(ratings);
        console.log(dislikes);
        videoCard = `  <div class="card text-white bg-dark mb-3" style="max-width: 50rem;">
                                <div class="card-body">
                                    <h5 class="card-title">${title}</h5>
                                    <img class="card-img" src="${src}">
                                    <p class="card-text">Uploader: ${uploader}</p>
                                    <p class="card-text">View count: ${viewCount}</p>
                                    <p class="card-text">Likes: ${likes}</p>
                                    <p class="card-text">Dislikes: ${dislikes}</p>
                                </div>
                            </div>`;
    } else {
        videoCard = `  <div class="card text-white bg-dark mb-3" style="max-width: 50rem;">
                                <div class="card-body">
                                    <h5 class="card-title">Channel: ${title}</h5>
                                    <img class="card-img" src="${src}">
                                </div>
                            </div>`;
    }
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
    if (respList != null && results.childNodes != null) {
        // Array.from(results.childNodes).forEach((child, index) => {
        //     const img = child.childNodes.item(1);
            // if (window.matchMedia("(max-width: 319px)").matches) {
            //     img.src = respList[index].snippet.thumbnails.default.url;
            // }
            // else if (window.matchMedia("(max-width: 500px)").matches ||
            //     (respList[index].id.kind == "youtube#channel" && window.matchMedia("(max-width: 800px)").matches)) {
            //     img.src = respList[index].snippet.thumbnails.medium.url;
            // } else {
            //     img.src = respList[index].snippet.thumbnails.high.url;
            // }
        // });
        console.log(results.childNodes);
        console.log(results.childNodes[1].childNodes[1].childNodes[3]);
        for (let i = 1; i < results.childNodes.length; i += 2) {
            const img = results.childNodes[i].childNodes[1].childNodes[3];
            if (window.matchMedia("(max-width: 319px)").matches) {
                img.src = respList[Math.floor(i/2)].snippet.thumbnails.default.url;
            }
            else if (window.matchMedia("(max-width: 500px)").matches ||
                (respList[Math.floor(i/2)].id.kind == "youtube#channel" && window.matchMedia("(max-width: 800px)").matches)) {
                img.src = respList[Math.floor(i/2)].snippet.thumbnails.medium.url;
            } else {
                img.src = respList[Math.floor(i/2)].snippet.thumbnails.high.url;
            }
        }
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
        // results.append(...resultElems);
        results.innerHTML = resultElems.join("");
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
        // results.append(...resultElems);
        results.innerHTML = resultElems.join("");
    }
}