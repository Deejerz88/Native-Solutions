const searchInput = $("#searchinput");
const searchBtn = $("#searchbutton");
const searchResults = $("#search-results");
const taxonomyEl = $("#taxonomy");
const advanced = $("#advanced");
const endangermentEl = $("#endangerment");
const locationEl = $("#location");

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
  // const fabDiv = $("<div>");
  const cardContainer = $("<div>");
  const col = $("<div>");
  const fab = $("<a>");
  const icon = $("<i>");
  const content = $("<section>");
  const action = $("<footer>");
  const link = $("<a>");

  cardContainer.addClass("row");
  col.addClass("col s12 m6");
  card.addClass("card");
  imgContainer.addClass("card-image");
  title.addClass("card-title");
  // fabDiv.addClass("row");
  cardContainer.append(col.append(card));

  content.addClass("card-content");
  action.addClass("card-action");

  // getImage()
  let rnd1 = (Math.random() * 100) << 0;
  let rnd2 = (Math.random() * 100) << 0;
  img.attr({ src: `http://placekitten.com/${rnd1}/${rnd2}` });
  img.css({ width: 100, height: 100 });

  title.text(commonName);
  title.css({ color: "black" });

  fab
    .attr({ href: "#", "data-target": "slide-out" })
    .addClass(
      "btn-floating halfway-fab waves-effect waves-light red sidenav-trigger"
    );
  icon.addClass("material-icons").text("info");
  fab.append(icon);

  // animalCharacteristics.mobilityMigrationComments;
  content.html(
    `<b>Scientific Name:</b> ${sciName} <p>${data.animalCharacteristics.mobilityMigrationComments}`
  );
  content.css({ color: "black" });

  link
    .attr({
      href: `https://explorer.natureserve.org/Taxon/${id}/${sciName}`,
    })
    .text("Add to Favorites");
  action.append(link);

  imgContainer.append(img, title, fab);
  card.append(imgContainer, content, action);
  cardContainer.append(card);
  searchResults.append(card);

  // card.on('click', () => { openSidenav(data) })

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

// const openSidenav = (data) => {
//   // const sideNav = $('<nav>')

//   // $("body").append(sideNav);

// }

//sideNav
const sideNav = $("<ul>");
const collapsible = $("<ul>");
const title = $("<h2>");
// const background = $('<div>')
// const bgImg = $('<img>')

// sideNav.text(data.primaryCommonName)
sideNav.addClass("sidenav").attr({ id: "slide-out" });
sideNav.append($("<li>").addClass('no padding').append(collapsible));
const categories = [
  "General Info",
  "Species Characteristics",
  "Animal Characteristics",
  "Plant Characteristics",
  "Endangerment",
];
collapsible.addClass("collapsible collapsible-accordian");

categories.forEach((category) => {
  const content = $("<li>");
  const header = $("<a>");
  const body = $("<div>");
  const info = $("<ul>");
  const bodyText = $("<span>");
  
  // const icon = $("<i>");

  
  header.attr({ href: '#!'}).addClass("collapsible-header");
  // icon.addClass("material-icons");
  body.addClass("collapsible-body");

  // icon.text("info");
  header.text(category);
  bodyText.text(
    "Quis eu velit nostrud labore labore do quis aliquip nisi minim nisi officia anim pariatur. Cillum eiusmod est adipisicing laborum quis proident ullamco ut mollit culpa. Laborum occaecat ipsum laboris culpa culpa nisi. Aute magna deserunt sint consequat sunt culpa ex incididunt occaecat. Aliqua exercitation occaecat ad tempor id voluptate exercitation exercitation ea laborum cillum deserunt."
  );
  
  content.append(header, info.append($("<li>").append(bodyText)));
    // , body.append(ul).append($("<li>").append(bodyText)));
  collapsible.append(content);
  // console.log(sideNav.children('a'))
});

$("body").append(sideNav);

$(document).ready(function () {
  $(".sidenav").sidenav();
});
