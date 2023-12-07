const CharacterAI = require('./cai/index.js');
const characterAI = new CharacterAI();
const express = require("express")
const app = express()
const cors = require("cors")
let doneSetup = false;
let chat;
let lock;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function compress(string) {
  string = unescape(encodeURIComponent(string));
  var newString = '',
    char, nextChar, combinedCharCode;
  for (var i = 0; i < string.length; i += 2) {
    char = string.charCodeAt(i);

    if ((i + 1) < string.length) {


      nextChar = string.charCodeAt(i + 1) - 31;


      combinedCharCode = char + "" + nextChar.toLocaleString('en', {
        minimumIntegerDigits: 2
      });

      newString += String.fromCharCode(parseInt(combinedCharCode, 10));

    } else {


      newString += string.charAt(i);
    }
  }
  return btoa(unescape(encodeURIComponent(newString)));
}

async function init() {
  await characterAI.authenticateAsGuest()
  const characterId = "bQBlcCVVjfTAzv8OWK30dw7Tj-TNtKC_Rh0Z46Dx6fY" // Discord moderator
  chat = await characterAI.createOrContinueChat(characterId);
  console.log("Worked")
  doneSetup = true
}

async function bruh(prompt) {
  const response = await chat.generateImage(prompt, true)
  //console.log(response)
  return response
}

app.use(cors({
  origin: "*"
}))

app.get("/", async (req, res) => {
  while (!doneSetup) await sleep(1000)
  res.send("Ok")
})

app.get("/prompt/:pr", async (req, res) => {
  while (!doneSetup || lock) await sleep(1000)
  lock = true
  try {
    const url = await bruh(req.params.pr)
    res.send(url)
  }
  finally {
    lock = false
  }
})

app.listen(3000, () => {
  console.log("Worked in 3000")
  init()
  lock = false;
})