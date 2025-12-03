var setDatabase;
var cardDatabase;
var customCardDatabase = {};
var altDatabases = [];
var packLocation = {
      "common": 0,
      "uncommon": 1,
      "rare": 2,
      "mythic": 3,
      "foil": 5,
      "land": 4,
      "nonFoilLand": 4,
      "foilLand": 4,
      "basic": 4,
      "contraption": 6,
      "attraction": 7,
      "sticker": 8
};
var cardDict = {};
var stateArray = [`Commander Boxing`, `Sealed`, `Single Pack`];
var currentState = 0;

window.onload = async () => {
      setDatabase = await getData("https://mtgjson.com/api/v5/SetList.json");
      let datalist = document.createElement("datalist");
      datalist.id = "boosterSets";
      let sideBar = document.getElementById("options");
      sideBar.appendChild(datalist);
      var unlinePack = document.createElement("option");
      unlinePack.value = `UNL`;
      unlinePack.label = `Unline Unset`;
      datalist.appendChild(unlinePack);
      Object.values(setDatabase.data).forEach(function (item) {
            if (!item.sealedProduct || !item.sealedProduct.filter((sealedInfo) => { return sealedInfo.category == "booster_box" && (sealedInfo.subtype == "play" || sealedInfo.subtype == "draft") })[0]) {
                  return;
            }
            var option = document.createElement("option");
            option.value = item.code;
            option.label = item.name;
            datalist.appendChild(option);
      });
}

function setToState(event) {
      let buttonValues = [`boxing`, `sealed`, `singles`];
      currentState = buttonValues.indexOf(event.target.id.replace("Button",""));
      Array.from(document.getElementsByClassName(`bottom-element`)).forEach((element) => {
            element.classList.remove(`hidden-element`);
            if(element.id == event.target.id.replace("Button","")) {
                  element.classList.add(`hidden-element`);
            }
      });
      let title = document.getElementById(`titleText`);
      title.innerHTML = stateArray[currentState];
      let packCount = document.getElementById("packCount");
      let setTitle = document.getElementById("setTitle");
      let inputDiv = document.getElementById("inputDiv");
      let openButton = document.getElementById("startOpening");
      let nextButton = document.getElementById("continueOpening");
      packCount.style.display = `none`;
      setTitle.style.display = `none`;
      inputDiv.style.display = `block`;
      nextButton.style.display = `none`;
      openButton.style.display = `inline-block`;
      cardDict = {};
      let flexDiv = document.getElementById("allCards");
      flexDiv.innerHTML = "";
}

async function customPack(customSetID) {
      var cardOptions = await getData(`./customPacks/UnlineCards.json`);
      const allSets = cardOptions.allCards.map(item => item["set"]);
      const uniqueSets = new Set(allSets);
      for(setID of uniqueSets) {
            customCardDatabase[setID] = await getData(`https://mtgjson.com/api/v5/${setID}.json`);
            altDatabases.push(customCardDatabase[setID]);
      }

      boosterSlots = {
            "land": {
                  "basicAlt": 1,
                  "basic": 1,
                  "basicFoil": 1
            },
            "common": {
                  "common": 1
            },
            "uncommon": {
                  "uncommon": 1,
                  "uncommonWithShowcase": 1
            },
            "rareMythic": {
                  "rareMythicWithShowcase": 1,
                  "rare": 1,
                  "rareMythic": 1,
                  "mythic": 1
            },
            "attraction": {
                  "attraction": 1,
            },
            "sticker": {
                  "sunfSticker": 1,
            },
            "contraption": {
                  "contraption": 38,
                  "contraptionFoil": 2,
            },
            "altCommon": {
                  "foilWithShowcase": 1,
                  "foil": 1,
                  "unhingedFoil": 1,
            },
            "altLand": {
                  "shock": 1
            }
      }
      cardDatabase = {
            "data": {
                  "booster": {
                        "draft": {
                              "boostersTotalWeight": 0,
                              "boosters": [
                                    {
                                          //DEFAULT PACK
                                          "weight": 46,
                                          "contents": {
                                                "attraction": 1,
                                                "sticker": 1,
                                                "contraption": 1,
                                                "land": 1,
                                                "common": 8,
                                                "uncommon": 4,
                                                "rareMythic": 1,
                                          }
                                    },
                                    {
                                          //ALT COMMON
                                          "weight": 23,
                                          "contents": {
                                                "attraction": 1,
                                                "sticker": 1,
                                                "contraption": 1,
                                                "land": 1,
                                                "common": 7,
                                                "altCommon": 1,
                                                "uncommon": 4,
                                                "rareMythic": 1,
                                          }
                                    },
                                    {
                                          //ALT LAND
                                          "weight": 2,
                                          "contents": {
                                                "attraction": 1,
                                                "sticker": 1,
                                                "contraption": 1,
                                                "altLand": 1,
                                                "common": 8,
                                                "uncommon": 4,
                                                "rareMythic": 1,
                                          }
                                    },
                                    {
                                          //ALT LAND AND COMMON
                                          "weight": 1,
                                          "contents": {
                                                "attraction": 1,
                                                "sticker": 1,
                                                "contraption": 1,
                                                "altLand": 1,
                                                "common": 7,
                                                "altCommon": 1,
                                                "uncommon": 4,
                                                "rareMythic": 1,
                                          }
                                    }
                              ]
                        }
                  }
            }
      }

      var sheetData = {};
      for(key of Object.keys(boosterSlots)) {
            sheetData[key] = {
                  "cards": {},
                  "totalWeight": 0
            }
      }

      var allUUIDs = {};
      for(key of Object.keys(customCardDatabase)) {
            allUUIDs[key] = [];
      }
      for(cardInfo of cardOptions.allCards) {
            let allResults = customCardDatabase[cardInfo.set].data.cards.filter((card) => {
                  if(/^\d+$/.test(cardInfo.number)) {
                        return card.number.replace(/[a-z]/gi, '') == cardInfo.number;
                  } else {
                        return card.number == cardInfo.number;
                  }
                  
            });
            if(!customCardDatabase[cardInfo.set].data.booster) {
                  for(result of allResults) {
                        let sheetID;
                        if(cardInfo.set == "SUNF") {
                              sheetID = "sticker";
                        } else {
                              sheetID = Object.keys(boosterSlots).find(sheetName => 
                                    Object.keys(boosterSlots[sheetName]).includes(result.rarity)
                              );
                        }
                        sheetData[sheetID].cards[result.uuid] = 1;
                        sheetData[sheetID].totalWeight += 1;
                  }
            } else {
                  for(result of allResults) {
                        allUUIDs[cardInfo.set].push(result.uuid);
                  }
            }
      }

      for([cardSet, UUIDData] of Object.entries(allUUIDs)) {
            if(!UUIDData.length) {
                  continue;
            }
            for(uuid of UUIDData) {
                  let allPossibleSheets = [];
                  for(sheetName in customCardDatabase[cardSet].data.booster.draft.sheets) {
                        if(Object.keys(customCardDatabase[cardSet].data.booster.draft.sheets[sheetName].cards).includes(uuid)) {
                              allPossibleSheets.push(sheetName);
                        }
                  }
                  if(!allPossibleSheets.length) {
                        continue;
                  }
                  for(originalSheet of allPossibleSheets) {
                        const sheetID = Object.keys(boosterSlots).find(sheetName => 
                              Object.keys(boosterSlots[sheetName]).includes(originalSheet)
                        );
                        if(!sheetData[sheetID].cards[uuid]) {
                              sheetData[sheetID].cards[uuid] = 1;
                        } else {
                              sheetData[sheetID].cards[uuid] += 1;
                        }
                        
                        sheetData[sheetID].totalWeight += 1;
                  }
            }
      }

      cardDatabase.data.booster.draft.sheets = sheetData;

      let packCount = document.getElementById("packCount");
      let setTitle = document.getElementById("setTitle");
      let inputDiv = document.getElementById("inputDiv");
      let openButton = document.getElementById("startOpening");
      let nextButton = document.getElementById("continueOpening");
      packCount.style.display = `block`;
      setTitle.style.display = `block`;
      inputDiv.style.display = `none`;
      nextButton.style.display = `inline-block`;
      openButton.style.display = `none`;
      let remainingPacks = 36;
      packCount.innerHTML = `Packs to Open:<br><span class ="packNum" id="remainingPacks">${remainingPacks - 1}</span>`;
      setTitle.innerHTML = "Unline Unset";

      let packData = generatePack();
      loadPackImages(packData);
}

async function openPack() {
      let inputField = document.getElementById("setInput");
      let setID = inputField.value;
            if(setID == "UNL") {
            customPack("UNL");
            return;
      }
      if(!setDatabase.data.filter((item) => { return item.code == setID })[0]) {
            return;
      }
      cardDatabase = await getData(`https://mtgjson.com/api/v5/${setID}.json`);
      if(!cardDatabase.data.booster) {
            return;
      }
      let boosterInfo;
      if("play" in cardDatabase.data.booster) {
            boosterInfo = cardDatabase.data.booster.play;
      } else {
            boosterInfo = cardDatabase.data.booster.draft;
      }
      for(setCode of boosterInfo.sourceSetCodes) {
            let dataInfo = await getData(`https://mtgjson.com/api/v5/${setCode}.json`);
            altDatabases.push(dataInfo);
      }
      let packCount = document.getElementById("packCount");
      let setTitle = document.getElementById("setTitle");
      let inputDiv = document.getElementById("inputDiv");
      let openButton = document.getElementById("startOpening");
      let nextButton = document.getElementById("continueOpening");
      packCount.style.display = `block`;
      setTitle.style.display = `block`;
      inputDiv.style.display = `none`;
      nextButton.style.display = `inline-block`;
      openButton.style.display = `none`;
      let remainingPacks = 0;
      if(currentState == 0) {
            addStaples();
            remainingPacks = cardDatabase.data.sealedProduct.filter((sealedInfo) => {
                  if("play" in cardDatabase.data.booster) {
                        return sealedInfo.subtype == "play" && sealedInfo.category == "booster_box";
                  } else {
                        return sealedInfo.subtype == "draft" && sealedInfo.category == "booster_box";
                  }
            })[0].contents.sealed[0].count;
      } else if (currentState = 1) {
            remainingPacks = 6;
      } else {
            packCount.classList.add(`hidden-element`);
      }
      packCount.innerHTML = `Packs to Open:<br><span class ="packNum" id="remainingPacks">${remainingPacks - 1}</span>`;
      setTitle.innerHTML = cardDatabase.data.name;

      let packData = generatePack(setID);
      loadPackImages(packData);
}

function nextPack() {
      let packCount = document.getElementById("remainingPacks");
      if(currentState != 2) {
            if(packCount.innerText.replace(/\D/g, '') == 0) {
                  let buttonHolder = document.getElementById("packButtons");
                  buttonHolder.style.display = `none`;
                  return;
            }
      }
      let flipCards = Array.from(document.getElementsByClassName("flip-card")).filter((flipCard) => {
            return flipCard.clicked == false;
      });
      flipCards.forEach((card) => {
            if (`${card.cardSetCode} ${card.cardNumber}` in cardDict) {
                  cardDict[`${card.cardSetCode} ${card.cardNumber}`].count += 1;
            } else {
                  cardDict[`${card.cardSetCode} ${card.cardNumber}`] = {
                        "count": 1,
                        "name": card.cardName,
                        "setCode": card.cardSetCode,
                        "setNumber": card.cardNumber
                  };
            }
      });
      packCount.innerHTML = `${packCount.innerText.replace(/\D/g, '') - 1}`;
      let inputField = document.getElementById("setInput");
      let setID = inputField.value;
      let packData = generatePack(setID);
      loadPackImages(packData);
}

function addStaples() {

      //Myriad Landscape
      cardDict[`C14 61`] = {
            "count": 1,
            "name": "Myriad Landscape",
            "setCode": "C14",
            "setNumber": "61"
      };

      //Command Tower
      cardDict[`C15 281`] = {
            "count": 1,
            "name": "Command Tower",
            "setCode": "C15",
            "setNumber": "281"
      };

      //Arcane Signet
      cardDict[`ELD 331`] = {
            "count": 1,
            "name": "Arcane Signet",
            "setCode": "ELD",
            "setNumber": "331"
      };

      //Path of Ancestry
      cardDict[`C17 56`] = {
            "count": 1,
            "name": "Path of Ancestry",
            "setCode": "C17",
            "setNumber": "56"
      };

      //Terramorphic Expanse
      cardDict[`DDN 74`] = {
            "count": 1,
            "name": "Terramorphic Expanse",
            "setCode": "DDN",
            "setNumber": "74"
      };

      //Commander's Sphere
      cardDict[`C14 54`] = {
            "count": 1,
            "name": "Commander's Sphere",
            "setCode": "C14",
            "setNumber": "54"
      };

      //Mind Stone
      cardDict[`C14 250`] = {
            "count": 1,
            "name": "Mind Stone",
            "setCode": "C14",
            "setNumber": "250"
      };

}

async function copyListToClipboard() {
      let cardString = "";
      let buttonDiv = document.getElementById("copyText");
      for (pulledData of Object.values(cardDict)) {
            cardString += `${pulledData.count}x ${pulledData.name} (${pulledData.setCode}) ${pulledData.setNumber} \n`;
      }
      try {
            await navigator.clipboard.writeText(cardString);
            buttonDiv.innerHTML = "Copied!";
            setTimeout(() => {
                  buttonDiv.innerHTML = "Card List";
            }, 1000);
      } catch (err) {
            console.error('Failed to copy text: ', err);
            buttonDiv.innerHTML = "Failed!";
            setTimeout(() => {
                  buttonDiv.innerHTML = "Card List";
            }, 1000);
      }
}

function loadPackImages(packData) {
      let cardSize = 300;
      let flexDiv = document.getElementById("allCards");
      flexDiv.innerHTML = "";
      packData.forEach(async (card) => {
            const fileFace = 'front';
            const fileType = 'large';
            const fileFormat = 'jpg';
            const fileName = card.data.identifiers.scryfallId;
            const dir1 = fileName.charAt(0);
            const dir2 = fileName.charAt(1);
            const imageURL = `https://cards.scryfall.io/${fileType}/${fileFace}/${dir1}/${dir2}/${fileName}.${fileFormat}`;
            const backURL = `cardBack`;

            let newFlip = document.createElement("div");
            newFlip.classList.add("flip-card");
            flexDiv.appendChild(newFlip);

            if (card.boosterSlot in packLocation) {
                  newFlip.style.order = packLocation[card.boosterSlot];
            } else {
                  newFlip.style.order = packLocation[card.data.rarity];
            }

            newFlip.style.width = cardSize + `px`;
            newFlip.style.height = cardSize * 7 / 5 + "px";

            newFlip.cardName = card.data.name;
            newFlip.cardNumber = card.data.number;
            newFlip.cardSetCode = card.data.setCode;

            newFlip.clicked = false;

            let flipInner = document.createElement("div");
            flipInner.classList.add("flip-card-inner");
            newFlip.appendChild(flipInner);
            let flipFront = document.createElement("div");
            flipFront.classList.add("flip-card-front");
            flipInner.appendChild(flipFront);
            addImg(backURL, flipFront, (div) => {
                  div.style.width = cardSize + `px`;
            });
            let flipBack = document.createElement("div");
            flipBack.classList.add("flip-card-back");
            flipInner.appendChild(flipBack);
            addImg(imageURL, flipBack, (div) => {
                  div.style.width = cardSize + `px`;
            });

            newFlip.onclick = (event) => {
                  if (newFlip.clicked) {
                        return;
                  }
                  newFlip.clicked = true;
                  flipInner.style.transform = `rotateY(180deg)`;
                  if (`${newFlip.cardSetCode} ${newFlip.cardNumber}` in cardDict) {
                        cardDict[`${newFlip.cardSetCode} ${newFlip.cardNumber}`].count += 1;
                  } else {
                        cardDict[`${newFlip.cardSetCode} ${newFlip.cardNumber}`] = {
                              "count": 1,
                              "name": newFlip.cardName,
                              "setCode": newFlip.cardSetCode,
                              "setNumber": newFlip.cardNumber
                        };
                  }
                  // let cardList = document.getElementById("cardList");
                  // let cardString = "";
                  // for(pulledData of Object.values(cardDict)) {
                  //       cardString += `${pulledData.count}x ${pulledData.name} (${pulledData.setCode}) ${pulledData.setNumber} <br>`;
                  // }
                  // cardList.innerHTML = cardString;
            };
      });
}

function generatePack() {
      let boosterCards = [];
      let boosterData;
      if ("play" in cardDatabase.data.booster) {
            boosterData = cardDatabase.data.booster.play;
      } else {
            boosterData = cardDatabase.data.booster.draft;
      }
      let randomWeight = getRandomIntInclusive(1, boosterData.boostersTotalWeight);
      let accumulatedWeight = 0;
      let boosterContents;
      for (let boosterInfo of boosterData.boosters) {
            if (randomWeight <= accumulatedWeight + boosterInfo.weight) {
                  boosterContents = boosterInfo.contents;
                  break;
            }
            accumulatedWeight += boosterInfo.weight;
      };
      for ([cardType, count] of Object.entries(boosterContents)) {
            for (i = 0; i < count; i++) {
                  let randomCardWeight = getRandomIntInclusive(1, boosterData.sheets[cardType].totalWeight);
                  let accumulatedCardWeight = 0;
                  for (let [uuid, weight] of Object.entries(boosterData.sheets[cardType].cards)) {
                        if (randomCardWeight <= accumulatedCardWeight + weight) {
                              let cardData;
                              for(setData of altDatabases) {
                                    let potentialData = setData.data.cards.filter((card) => {
                                          return card.uuid == uuid;
                                    })[0];
                                    if(potentialData) {
                                          cardData = potentialData;
                                    }
                              }
                              boosterCards.push(
                                    {
                                          "data": cardData,
                                          "boosterSlot": cardType
                                    }
                              );
                              break;
                        }
                        accumulatedCardWeight += weight;
                  };
            }
      }
      return boosterCards;
}

async function getData(url = false) {
      if (!url) {
            return false;
      }
      try {
            const response = await fetch(url);
            if (!response.ok) {
                  throw new Error(`Response status: ${response.status}`);
            }
            const result = await response.json();
            return result;
      } catch (error) {
            console.error(error.message);
      }
}

function addImg(src, parentElement, imgCallback) {
      let newImg = new Image();
      if (src.includes(`https`)) {
            newImg.src = src;
      } else {
            newImg.src = `./images/${src}.webp`;
      }
      newImg.onerror = () => {
            imgCallback(false);
      };
      newImg.onload = addToPage;
      newImg.setAttribute('draggable', false);
      function addToPage(event) {
            let newDiv = document.createElement(`div`);
            if (parentElement) {
                  parentElement.appendChild(newDiv);
            }
            newDiv.classList.add(`imgcontainer`);
            newDiv.appendChild(this);
            if (imgCallback) {
                  imgCallback(newDiv);
            }
      }
}

function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
}