// Authors: Jonathan Wist and Alden Geipel

// Definitions of all different elements on the HTML page.
const form = document.querySelector("form");

const input = document.querySelector("#keyword");

// Number of results per-page.
const num_res = document.querySelector("#num-results");
let num;

// Different filters that could be applied to the search.
const filter = document.querySelector("#filter");

// Buttons to the next and previous pages of results, as well as
// variables to hold the locations of those pages.
const prevButton = document.querySelector("#prev");
const nextButton = document.querySelector("#next");
let nextPage;
let prevPage;

const key = 'AIzaSyA6JFCh_bFbNbQM_A7-_YiXqG0fo7BbNHM';

const results = document.querySelector("#results");
form.addEventListener('submit', submitFunc);
nextButton.addEventListener('click', nextFunc);
prevButton.addEventListener('click', prevFunc);

async function submitFunc(ev) {
    ev.preventDefault();
    num = num_res.value;
    if (num > 20) {
        num = 20;
    }

    if (input.value != "" || num < 0) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&order=${filter.value}&maxResults=${num}&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);

        let respList = respJson.items;
        nextPage = respJson.nextPageToken;
        console.log(respList);
        clearResultsElem();
        const ratings = await getRatings(respList);
        console.log(ratings);
        const resultElems = await createElements(respList, ratings);
        results.append(...resultElems);
    }
}

async function getRatings(respList) {
    const ratings = await Promise.all(
        respList.map((item) => {
            if (item.id.kind == "youtube#video") {
                const videoID = item.id.videoId;
                return fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoID}`).then((res) =>
                res.json().then( (jsonRes) => {return jsonRes}));
            }
        })
    );
    return ratings;
} 

async function createElements(response, ratings) {
    const elements = await Promise.all(
        response.map((item, index) =>{
            return createVideoElem(item, ratings[index]);
        })
    );
    return elements;
}

function createVideoElem(item, ratings) {
    const vidElem = document.createElement("div");
    if (item.id.kind == "youtube#channel") {
        vidElem.id = item.id.channelId;
        vidElem.classList.add("channel");
    } else if (item.id.kind == "youtube#video") {
        vidElem.id = item.id.videoId;
        vidElem.classList.add("video");
    }
    const title = document.createElement("h2");
    // const tempElem = document.createElement("div");
    // tempElem.innerHTML = video.snippet.title;
    // title.textContent = tempElem.textContent;
    title.innerHTML = item.snippet.title;
    vidElem.append(title);
    const currImg = document.createElement("img");
    currImg.src = item.snippet.thumbnails.high.url;
    vidElem.append(currImg);
    if (ratings != null) {
        const viewElem = document.createElement("h3");
        viewElem.textContent = `Views: ${ratings.viewCount}`;
        vidElem.append(viewElem);
        const likeElem = document.createElement("h4");
        const dislikeElem = document.createElement("h4");
        likeElem.textContent = `Likes: ${ratings.likes}`;
        dislikeElem.textContent = `Dislikes: ${ratings.dislikes}`;
        vidElem.append(likeElem);
        vidElem.append(dislikeElem);
    }
    return vidElem;
}

function clearResultsElem() {
    Array.from(results.childNodes).forEach((child) => {
      child.remove();
    });
}

async function nextFunc() {
    if (nextPage != null) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?pageToken=${nextPage}&part=snippet&order=${filter.value}&maxResults=${num}&&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);
        if (respJson.nextPageToken != null) {
            nextPage = respJson.nextPageToken;
        } else {
            nextPage = null;
        }
        prevPage = respJson.prevPageToken;
        const respList = respJson.items;
        clearResultsElem();
        const resultElem = document.createElement("div");
        const ratings = await getRatings(respList);
        console.log(ratings);
        const resultElems = await createElements(respList, ratings);
        results.append(...resultElems);
    }
}

async function prevFunc() {
    if (prevPage != null) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?pageToken=${prevPage}&part=snippet&order=${filter.value}&maxResults=${num}&&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);
        if (respJson.prevPageToken != null) {
            prevPage = respJson.prevPageToken;
        } else {
            prevPage = null;
        }
        nextPage = respJson.nextPageToken;
        const respList = respJson.items;
        clearResultsElem();
        const resultElem = document.createElement("div");
        const ratings = await getRatings(respList);
        console.log(ratings);
        const resultElems = await createElements(respList, ratings);
        results.append(...resultElems);
    }
}