// Authors: Jonathan Wist and Alden Geipel

const form = document.querySelector("form");

const input = document.querySelector("#keyword");

const num_res = document.querySelector("#num-results");
let num;

const filter = document.querySelector("#filter");

const prevButton = document.querySelector("#prev");
const nextButton = document.querySelector("#next");
let nextPage;
let prevPage;

const key = 'AIzaSyA6JFCh_bFbNbQM_A7-_YiXqG0fo7BbNHM';

console.log(form);
console.log(input.value);
console.log(num_res);
const results = document.querySelector("#results");
form.addEventListener('submit', submitFunc);
nextButton.addEventListener('click', nextFunc);
prevButton.addEventListener('click', prevFunc);

async function submitFunc(ev) {
    ev.preventDefault();
    num = num_res.value;
    if (num > 20) {
        num = 20;
    } else if (num < 0) {
        num = 0;
    }

    if (input.value != "") {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&order=${filter.value}&maxResults=${num}&q=${input.value}&key=${key}`);
        const respJson = await response.json();
        console.log(respJson);

        let videoList = respJson.items;
        nextPage = respJson.nextPageToken;
        console.log(videoList);
        clearResultsElem();
        const resultElem = document.createElement("div");
        // window.location.href = `${window.location.href}/${videoList[0]}`
        // videoList.forEach(async (video, index) => {
        //     if (video.id.kind == "youtube#video") {
        //         const videoID = video.id.videoId;
        //         const ratingResp = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoID}`);
        //         const ratingJSON = await ratingResp.json();
        //         console.log(ratingJSON);
        //         console.log(`${index} likes:${ratingJSON.likes} dislikes:${ratingJSON.dislikes}`);
        //         resultElem.append(createVideoElem(video, ratingJSON));
        //     }
        // });
        const ratings = await getRatings(videoList);
        console.log(ratings);
        results.append(resultElem);
    }
}

async function getRatings(respList) {
    return respList.forEach(async (item, index) => {
        if (item.id.kind == "youtube#video") {
            const videoID = item.id.videoId;
            const ratingResp = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoID}`);
            const ratingJSON = await ratingResp.json();
            console.log(ratingJSON);
            console.log(`${index} likes:${ratingJSON.likes} dislikes:${ratingJSON.dislikes}`);
            return ratingJSON;
        }
    });
} 

function createVideoElem(video, ratings) {
    const vidElem = document.createElement("div");
    vidElem.classList.add("video");
    const title = document.createElement("h2");
    title.textContent = video.snippet.title;
    vidElem.append(title);
    const currImg = document.createElement("img");
    currImg.src = video.snippet.thumbnails.high.url;
    vidElem.append(currImg);
    const viewElem = document.createElement("h3");
    viewElem.textContent = `Views: ${ratings.viewCount}`;
    vidElem.append(viewElem);
    const likeElem = document.createElement("h4");
    const dislikeElem = document.createElement("h4");
    likeElem.textContent = `Likes: ${ratings.likes}`;
    dislikeElem.textContent = `Dislikes: ${ratings.dislikes}`;
    vidElem.append(likeElem);
    vidElem.append(dislikeElem);
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
        // respList.forEach(async (video, index) => {
        //     if (video.id.kind == "youtube#video") {
        //         const videoID = video.id.videoId;
        //         const ratingResp = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoID}`);
        //         const ratingJSON = await ratingResp.json();
        //         console.log(ratingJSON);
        //         console.log(`${index} likes:${ratingJSON.likes} dislikes:${ratingJSON.dislikes}`);
        //         resultElem.append(createVideoElem(video, ratingJSON));
        //     }
        // });
        const ratings = await getRatings(respList);
        console.log(ratings);
        results.append(resultElem);
    }
}

async function prevFunc() {
    if (prevPage != null) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?pageToken=${prevPage}&part=snippet&order=${filter.value}&maxResults=${num}&&q=${input.value}&key=${key}`);
        const respJson = await response.json();
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
        results.append(resultElem);
    }
}
// for (let i = 1; i < 5; i++) {
//     const currResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?pageToken=${nextPage}&part=snippet&maxresults=25&q=${input.value}&key=AIzaSyDm1C1asDzsd5U72iWhydu4ked3LLyyO0A`);
//     const currJson = await currResponse.json();
//     videoList = currJson.items;
//     nextPage = currJson.nextPageToken;
//     console.log(videoList);
//     videoList.forEach(async (video, index) => {
    //         if (video.id.kind == "youtube#video") {
//             const videoID = video.id.videoId;
//             const ratingResp = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoID}`);
//             const ratingJSON = await ratingResp.json();
//             console.log(ratingJSON);
//             console.log(`${index} likes:${ratingJSON.likes} dislikes:${ratingJSON.dislikes}`);
//         }
//     });
// }