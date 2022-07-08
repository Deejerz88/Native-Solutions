const searchInput = $("#searchinput");
const searchBtn = $("#searchbutton");
const searchResults = $("#search-results");
const taxonomyEl = $("#taxonomy");
const advanced = $("#advanced");
const endangermentEl = $("#endangerment");
const locationEl = $("#location");
const cardContainer = $("#card-container");

//Get API Keys from AWS Lambda
const apiURL =
  "https://zx3eyuody3fc25me63au7ukbki0jqehi.lambda-url.us-east-2.on.aws/";
let config = {};
fetch(apiURL).then((res) => {
  if (res.ok)
    res.json().then((data) => {
      config = data;
    });
});

const submitHandler = (e) => {
  e.preventDefault();
  const location = getState(searchInput.val());
};

const getState = (location) => {
  const apiKey = config.GOOGLE_API;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${apiKey}`;
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log(data);
        const address = data.results[0].address_components;
        let state;
        let country;
        address.forEach((component, i) => {
          console.log(component);
          if (component.types[0] === "administrative_area_level_1")
            state = component.short_name;
          else if (component.types[0] === "country")
            country = component.short_name;
        });

        // const state = data.results[0].address_components[2].short_name;
        // const country = data.results[0].address_components[3].short_name
        const location = { state: state, country: country };
        console.log(location);
        getData(location);
        return location;
      });
  });
};

const getData = (location) => {
  //Search for plants/animals
  let url = "https://explorer.natureserve.org/api/data/speciesSearch";
  //Future Filters: quick search, status (endangerment), location (Country, state), species taxonomy (scientific & informal searches),
  let searchCriteria = {};
  // const taxSearch = taxonomyEl.val()
  searchCriteria.criteriaType = "species";
  searchCriteria.locationCriteria = [
    {
      paramType: "subnation",
      subnation: location.state,
      nation: location.country,
    },
  ];

  // if (!!searchInput.val())
  //   searchCriteria.textCriteria = [
  //     { paramType: "quickSearch", searchToken: searchInput.val() },
  //   ];

  // if (!!taxSearch && !!advanced.val())
  //   searchCriteria.speciesTaxonomyCriteria = [
  //     {
  //       paramType: "scientificTaxonomy",
  //       level: taxSearch.level,
  //       scientificTaxonomy: taxSearch.taxonomy,
  //       kingdom: taxSearch.kingdom,
  //     },
  //   ];

  // if (!!taxSearch && !!advanced.val())
  //   searchCriteria.speciesTaxonomyCriteria = [
  //     { paramType: "informalTaxonomy", informalTaxonomy: taxonomyEl.val() },
  //   ];
  // if (!!locationEl.val())
  //   searchCriteria.locationCriteria = [
  //     {
  //       paramType: "subnation",
  //       subnation: locationEl.val().state,
  //       nation: location.val().country,
  //     },
  //   ];

  console.log({ searchCriteria });
  fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(searchCriteria),
  }).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log(data);
        data.results.forEach((organism) => {
          getOrganismInfo(organism.uniqueId);
        });
      });
  });
};

searchBtn.on("click", submitHandler);

const getOrganismInfo = (id) => {
  //Get Plant Info
  let url = `https://explorer.natureserve.org/api/data/taxon/${id}`;
  // let url = "http://plants.usda.gov/api/plants/search";
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log(data);
        createCard(data);
      });
  });
};

const createCard = (data) => {
  //speciesCharacteristics {habitatComments, reproduction comments, sepciesGlobal{ endangerment(cosewic, cosewicRComments, saraStatus), ebarKbaGroup(general species ?)
  //
  //animalCharacteristics{animalFoodHabits[array], animalPhenologies, animalPhenologyComments, foodHabitsComments,majorHabitat{object}, nonMigrant, localMigrant, longDistanceMigrant, mobilityMigrationComments,colonialBreeder,length,width,weight, subTypes}
  //
  //plantCharacteristics {genusEconomicValue, economicComments, plantProductionMethods, plantDurations ,plantEconomicUses, plantCommercialImportances }
  //
  //endangerment(grank, grankReasons, rankInfo{shortTermTrend, shortTermTrendComments, longTermTrend,longTermTrendComments, popSize, popSizeComments, rangeExtent, rangeExtentComments, threatImpactAssigned, threatImpactComments, inventoryNeeds, protectionNeeds })
  //
  //elementManagement { stewardshipOverview, biologicalResearchNeeds}
  //
  //nameCategory, primaryCommonName, formattedScientificName, family, genus, kingdom, phylum, taxclass, taxorder, informalTaxonomy, references, elementNationals, elementSubnationals
  //

  const sciName = data.scientificName;
  const commonName = data.primaryCommonName;
  const id = data.uniqueId;

  const card = $("<article>");
  const imgContainer = $("<div>");
  const img = $("<img>");
  const title = $("<span>");
  const fabDiv = $("<div>");
  const content = $("<section>");
  const action = $("<footer>");
  const link = $("<a>");
  const icons = $("i");

  card.addClass("card");
  imgContainer.addClass("card-image");
  title.addClass("card-title");
  fabDiv.addClass("fixed-action-btn");
  iconLink1.addClass("btn-floating halfway-fab waves-effect waves-light red");
  fabDiv.append(iconLink1);

  for (let i = 0; i < 4; i++){
    const listEl = $("<li>");
    const anchor = $("<a>");
    const icon = $('<i>')
    const iconText = [
      "mode_edit",
      "insert_chart",
      "format_quote",
      "publish",
      "attach_file",
    ];
    const anchorClass = 
  
    icon.addClass("material-icons");
    icon.text(iconText[i]);
    
  }


  content.addClass("card-content");
  action.addClass("card-action");

  // getImage()
  let rnd1 = (Math.random() * 100) << 0;
  let rnd2 = (Math.random() * 100) << 0;
  img.attr({ src: `http://placekitten.com/${rnd1}/${rnd2}` });
  img.css({ width: 100, height: 100 });

  title.text(commonName);
  title.css({ color: "black" });


  content.text(sciName);
  content.css({ color: "black" });

  link
    .attr({
      href: `https://explorer.natureserve.org/Taxon/${id}/${sciName}`,
    })
    .text("More Info");

  action.append(link);
  imgContainer.append(img, title, fab);
  card.append(imgContainer, content, action);
  cardContainer.append(card);

  // https://materializecss.com/cards.html
  //
  //     <div class="card horizontal">
  //       <div class="card-image">
  //         <img src="images/sample-1.jpg">
  //         <span class="card-title">Card Title</span>
  //         <a class="btn-floating halfway-fab waves-effect waves-light red"><i class="material-icons">add</i></a>
  //       </div>
  //       <div class="card-content">
  //         <p>I am a very simple card. I am good at containing small bits of information. I am convenient because I require little markup to use effectively.</p>
  //       </div>
  //     </div>
  //   </div>
  // </div>
};

const getImage = (species, kingdom) => {
  let imgUrl = "https://apps.des.qld.gov.au/species-search/?f=json";
  let taxIdURL = `https://apps.des.qld.gov.au/species/?op=speciessearch?species=${species}&kingdom=${kingdom}`;
  console.log(taxIdURL);
  fetch(taxIdURL).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log(data);
      });
  });
};

$(document).ready(() => {
  $(".fixed-action-btn").floatingActionButton();
});
