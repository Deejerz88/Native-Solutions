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

  let descText = data.speciesCharacteristics.generalDescription;
  descText = !!descText
    ? descText
    : data.speciesCharacteristics.habitatComments;
  let descArray = descText.split(";");
  console.log({ descArray });
  let descList = $("<ul>").addClass("descList");
  descArray.forEach((des) => {
    descList.append($("<li>").text(des).css({ "list-style-type": "disc" }));
  });
  console.log({ descList });
  descText = $("<ul>").append(descList.clone()).html();
  console.log({ descText });

  content.html(`<b>Scientific Name:</b> ${sciName} <p>${descText}`);
  content.css({ color: "black" });

  link
    .attr({
      href: `https://explorer.natureserve.org/Taxon/${id}/${sciName}`,
    })
    .text("Add to Favorites");
  action.append(link);

  fab.on("click", (e) => {
    console.log(e);
    console.log(data);
    populateSidenav(data);
  });

  imgContainer.append(img, title, fab);
  card.append(imgContainer, content, action);
  cardContainer.append(card);
  searchResults.append(card);
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

const populateSidenav = (data) => {
  sideNav.empty();
  const collapsible = $("<ul>");
  const title = $("<h2>");
  const desc = $("<p>");
  // const background = $('<div>')
  // const bgImg = $('<img>')

  const general = data.speciesGlobal;
  title.text(data.primaryCommonName);
  let descText = data.speciesCharacteristics.generalDescription;
  descText = !!descText
    ? descText
    : data.speciesCharacteristics.habitatComments;
  let descArray = descText.split(";");
  console.log({ descArray });
  let descList = $("<ul>").addClass("descList");
  descArray.forEach((des) => {
    descList.append($("<li>").text(des).css({ "list-style-type": "disc" }));
  });
  console.log({ descList });
  descText = $("<ul>").append(descList.clone()).html();
  console.log({ descText });
  desc.html(descText);

  sideNav.append(
    title,
    desc,
    $("<li>").addClass("no padding").append(collapsible)
  );
  const categories = [
    "General Info",
    "Species Characteristics",
    "Animal Characteristics",
    "Plant Characteristics",
    "Endangerment",
  ];
  collapsible.addClass("collapsible popout");

  categories.forEach((category) => {
    //
    //animalCharacteristics{animalFoodHabits[array], animalPhenologies, animalPhenologyComments, foodHabitsComments,majorHabitat{object}, nonMigrant, localMigrant, longDistanceMigrant, mobilityMigrationComments,colonialBreeder,length,width,weight, subTypes}
    //
    //plantCharacteristics {genusEconomicValue, economicComments, plantProductionMethods, plantDurations ,plantEconomicUses, plantCommercialImportances }
    //
    //endangerment: grank, grankReasons, rankInfo{shortTermTrend, shortTermTrendComments, longTermTrend,longTermTrendComments, popSize, popSizeComments, rangeExtent, rangeExtentComments, threatImpactAssigned, threatImpactComments, inventoryNeeds, protectionNeeds }
    //
    //elementManagement { stewardshipOverview, biologicalResearchNeeds}
    //
    //General Info: nameCategory, primaryCommonName, formattedScientificName, speciesGlobal {family, genus, kingdom, phylum, taxclass, taxorder, informalTaxonomy} references, elementNationals, elementSubnationals
    const content = $("<li>");
    const header = $("<a>");
    const body = $("<div>");
    const info = $("<ul>");
    const bodyText = $("<span>");

    header.attr({ href: "#!" }).addClass("collapsible-header");
    body.addClass("collapsible-body");

    header.html(`<b>${category}</b>`);
    // let bodyHtml = $('<span>');
    if (category === "General Info") {
      taxLevels = [
        "Kingdom",
        "Phylum",
        "Class",
        "Order",
        "Family",
        "Genus",
        "Species",
      ];
      taxLevels.forEach((level) => {
        let taxLevel = general[level.toLowerCase()];
        taxLevel = !!taxLevel ? taxLevel : general["tax" + level.toLowerCase()];
        taxLevel = level === "Species" ? data.scientificName : taxLevel;
        bodyText.append(`<p><b>${level}:</b> ${taxLevel}`);
      });
      bodyText.append(
        `<p><b>Name Category:</b> ${data.nameCategory.nameCategoryDescEn}</p>`
      );
    } else if (category === "Species Characteristics") {
      //speciesCharacteristics {habitatComments, reproduction comments, sepciesGlobal{ endangerment(cosewic, cosewicRComments, saraStatus), ebarKbaGroup(general species ?)

      let char = ["habitatComments", "reproductionComments"];
    }

    // bodyText.html(bodyHtml);
    content.append(
      header,
      body.append(info.append($("<li>").append(bodyText)))
    );
    collapsible.append(content);
  });
  $(".collapsible").collapsible();
};

//sideNav
const sideNav = $("<ul>");
$("body").append(sideNav.addClass("sidenav").attr({ id: "slide-out" }));

$(document).ready(function () {
  $(".sidenav").sidenav();
});
