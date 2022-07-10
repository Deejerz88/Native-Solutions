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
        // console.log(data);
        const address = data.results[0].address_components;
        let state;
        let country;
        address.forEach((component, i) => {
          if (component.types[0] === "administrative_area_level_1")
            state = component.short_name;
          else if (component.types[0] === "country")
            country = component.short_name;
        });

        // const state = data.results[0].address_components[2].short_name;
        // const country = data.results[0].address_components[3].short_name
        const location = { state: state, country: country };
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

  // console.log({ searchCriteria });
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
        console.log(data.primaryCommonName, data);
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
  col.addClass("col s6 m6 l6");
  card.addClass("card");
  imgContainer.addClass("card-image");
  title.addClass("card-title");
  // fabDiv.addClass("row");
  cardContainer.append(col.append(card));

  content.addClass("card-content");
  action.addClass("card-action");

  // getImage()
  img.attr({ src: `https://via.placeholder.com/100` }).css({ width: 100 });

  title.text(commonName);
  title.css({ color: "black" });

  fab
    .attr({ href: "#", "data-target": "slide-out" })
    .addClass(
      "btn-floating halfway-fab waves-effect waves-light red sidenav-trigger"
    );
  icon.addClass("material-icons").text("info");
  fab.append(icon);

  const descText = createBody(data);

  content.html(`<b>Scientific Name:</b> ${sciName} <p>${descText}`);
  content.css({ color: "black" });

  link
    .attr({
      href: `https://explorer.natureserve.org/Taxon/${id}/${sciName}`,
    })
    .text("Add to Favorites");
  action.append(link);

  fab.on("click", (e) => {
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
  const img = $("<img>");
  const desc = $("<p>");
  // const background = $('<div>')
  // const bgImg = $('<img>')

  const species = data.speciesGlobal;
  const sc = data.speciesCharacteristics;
  const ac = data.animalCharacteristics;
  const pc = data.plantCharacteristics;
  const rank = data.rankInfo;

  title.text(data.primaryCommonName);
  img
    .attr({ src: `https://via.placeholder.com/200` })
    .css({ width: 200, margin: 20 });
  sideNav.append(
    title,
    img,
    $("<li>").addClass("no padding").append(collapsible)
  );
  const categories = [
    "General Info",
    "Classification",
    "Habitat",
    "Food Habits",
    "Reproduction",
    "Phenology",
    "Migration",
    "Population & Endangerment",
    "Plant Characteristics",
  ];
  collapsible.addClass("collapsible popout");

  categories.forEach((category) => {
    //animalCharacteristics{animalFoodHabits[array], animalPhenologies, animalPhenologyComments, foodHabitsComments,majorHabitat{object}, nonMigrant, localMigrant, longDistanceMigrant, mobilityMigrationComments,colonialBreeder,length,width,weight, subTypes}
    //
    //plantCharacteristics {genusEconomicValue, economicComments, plantProductionMethods, plantDurations ,plantEconomicUses, plantCommercialImportances }
    //
    //endangerment: grank, grankReasons, rankInfo{shortTermTrend, shortTermTrendComments, longTermTrend,longTermTrendComments, popSize, popSizeComments, rangeExtent, rangeExtentComments, threatImpactAssigned, threatImpactComments, inventoryNeeds, protectionNeeds }, elementManagement { stewardshipOverview, biologicalResearchNeeds}
    //
    //
    //
    //General Info: nameCategory, primaryCommonName, formattedScientificName, speciesGlobal {family, genus, kingdom, phylum, taxclass, taxorder, informalTaxonomy} references,
    const content = $("<li>");
    const header = $("<a>");
    const body = $("<div>");
    const info = $("<ul>");
    const bodyText = $("<span>");

    header.attr({ href: "#!" }).addClass("collapsible-header");
    body.addClass("collapsible-body");

    header.html(`<b>${category}</b>`);
    // let bodyHtml = $('<span>');

    //General Info
    if (category === "General Info") {
      const descText = createBody(data);
      desc.html(descText);
      bodyText.append(desc);
    }

    //Classification
    else if (category === "Classification") {
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
        let taxLevel = species[level.toLowerCase()];
        taxLevel = !!taxLevel ? taxLevel : species["tax" + level.toLowerCase()];
        taxLevel = level === "Species" ? data.scientificName : taxLevel;

        bodyText.append(`<p><b>${level}:</b> ${taxLevel}<br>
        <p><b>Informal Taxonomy:</b> ${data.nameCategory.nameCategoryDescEn}</p>`);
      });
    } else if (category === "Habitat") {
      //elementNationals, elementSubnationals
      // let nationals = {};
      bodyText.append($('<table>').attr({ 'data-sortable': undefined }).addClass('sortable-theme-slick'))
      
      const countries = data.elementNationals;
      countries.forEach((country) => {
        const countryName = country.nation.nameEn;
        console.log({ country });
        

        // nationals[countryName] = {};
        // console.log({ nationals });
        const subNationals = country.elementSubnationals;
        subNationals.forEach((subNat) => {
          const subnation = subNat.subnation.nameEn;
          const exotic = subNat.speciesSubnational.exotic;
          const hybrid = subNat.speciesSubnational.hybrid;
          const native = subNat.speciesSubnational.native;
          tableData.push({ countryName, subnation, exotic, hybrid, native });
        });
        console.log({ tableData });
        // subNationals.forEach((subNat) => {
        //   console.log({subNat})
        //   const info = {
        //     subnation: subNat.subnation.nameEn,
        //     exotic: subNat.speciesSubnational.exotic,
        //     hybrid: subNat.speciesSubnational.hybrid,
        //     native: subNat.speciesSubnational.native,
        //   };
        //   nationals[countryName][info.subnation] = {
        //     exotic: info.exotic,
        //     hybrid: info.hybrid,
        //     native: info.native,
        //   };
        // });
      });
      // console.log({ nationals });
      

      let habitat = "";
      try {
        const majorHabitat = ac.majorHabitat.majorHabitatDescEn;
        habitat = !!majorHabitat
          ? `<b>Major Habitat:</b> ${majorHabitat}<br><br>`
          : habitat;
      } catch (err) {}
    }

    //Food Habits
    else if (category === "Food Habits") {
      const foodArr = ac.animalFoodHabits;
      let foodDesc = ac.foodHabitsComments;
      const ul = $("<ul>");

      foodArr.forEach((habit) => {
        const adult = habit.foodHabits.adult;
        const immature = habit.foodHabits.immature;
        const habitList = $("<li>").text(habit.foodHabits.foodHabitsDescEn);
        if (!!adult)
          habitList.append($("<ul><li>").html(`<b>Adult:</b> ${adult}`));
        if (!!immature)
          habitList.append($("<li>").html(`<b>Immature:</b> ${immature}`));
        ul.append(habitList);
      });
      bodyText.append(ul, foodDesc);
    }

    //Reproduction
    else if (category === "Reproduction") {
      bodyText.html(
        `<b>Colonial Breeder:</b> ${ac.colonialBreeder}<br>${sc.reproductionComments}`
      );
    }

    //Phenology
    else if (category === "Phenology") {
      //animalPhenologies, animalPhenologyComments,
      let phenoDesc = ac.animalPhenologyComments;
      const phenoArr = ac.animalPhenologies;
      const ul = $("<ul>");
      phenoArr.forEach((pheno) => {
        const adult = pheno.adult;
        const immature = pheno.immature;
        const phenoList = $("<li>").text(
          pheno.animalPhenology.animalPhenologyDescEn
        );
        if (!!adult)
          phenoList.append($("<ul><li>").html(`<b>Adult:</b> ${adult}`));
        if (!!immature)
          phenoList.append($("<li>").html(`<b>Immature:</b> ${immature}`));
        ul.append(phenoList);
      });
      bodyText.append(ul, phenoDesc);
    }

    //Migration
    else if (category === "Migration") {
      const migArr = [
        "nonMigrant",
        "localMigrant",
        "longDistanceMigrant",
        "mobilityMigrationComments",
      ];
      migArr.forEach((mig) => {
        bodyText.append(
          ac[mig] !== null ? `<b>${mig}:</b> ${ac[mig]}<br>` : ""
        );
      });
    }

    //Endangerment
    else if (category === "Population & Endangerment") {
      const popSize = rank.popSize.popSizeDescEn;
      const popDesc = rank.popSizeComments;
      const range = rank.rangeExtent.rangeExtentDescEn;
      const rangeDesc = rank.rangeExtentComments;

      const grank = data.grank;
      const grankDesc = data.grankReasons;
      const shortTrend = rank.shortTermTrend.shortTermTrendDescEn;
      const shortDesc = rank.shortTermTrendComments;
      const longTrend = rank.longTermTrend.longTermTrendDescEn;
      const longDesc = rank.longTermTrendComments;

      const threat = rank.threatImpactAssigned.threatImpactAssignedDescEn;
      const threatDesc = rank.threatImpactComments;

      const popNeeds = rank.inventoryNeeds;
      const protectionNeeds = rank.protectionNeeds;

      const stewardship = data.elementManagement.stewardshipOverview;
      const research = data.elementManagement.bioligicalResearchNeeds;

      const pop = $("<p>");
      if (!!popSize) {
        pop.append(
          `<b>Population:</b> ${popSize}<br>${popDesc}<br><br><b>Range:</b> ${range}<br>${rangeDesc}`
        );
      }
      pop.append(`<b>Global Status:</b> ${grank}<br>${grankDesc}`);
      if (!!shortTrend)
        pop.append(
          `<br> <br><b>Short-Term Trend:</b> ${shortTrend}<br>${shortDesc}`
        );
      if (!!longTrend)
        pop.append(
          `<br><br><b>Long-Term Trend:</b> ${longTrend}<br>${longDesc}<br><br>`
        );
      if (!!threat) pop.append(`<b>Threat:</b> ${threat}<br>${threatDesc}`);
      if (!!popNeeds) pop.append(`<b>Population Needs:</b> ${popNeeds}`);
      if (!!protectionNeeds)
        pop.append(`<b>Protection Needs:</b> ${protectionNeeds}`);
      bodyText.append(pop);
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
const createBody = (data) => {
  const ac = data.animalCharacteristics;
  const sc = data.speciesCharacteristics;
  let lww = "";
  if (!!ac.length) lww += `<b>Length:</b> ${ac.length}mm`;
  if (!!ac.width) lww += !lww ? "" : " | " + `<b>Width:</b> ${ac.width}mm`;
  if (!!ac.weight) lww += !lww ? "" : " | " + `<b>Weigth:</b> ${ac.weight}<br>`;
  let habitat = "";
  try {
    const majorHabitat = ac.majorHabitat.majorHabitatDescEn;
    habitat = !!majorHabitat
      ? `<b>Major Habitat:</b> ${majorHabitat}<br><br>`
      : habitat;
  } catch (err) {}
  let descText = sc.generalDescription;
  descText = !!descText ? descText : sc.habitatComments;
  let descArray;
  try {
    descArray = descText.split(";");
    let descList = $("<ul>").addClass("descList");
    descArray.forEach((des) => {
      descList.append($("<li>").text(des).css({ "list-style-type": "disc" }));
    });
    descText = $("<ul>").append(descList.clone()).html();
    descText = lww + habitat + descText;
  } catch (err) {}
  return descText;
};
//sideNav
const sideNav = $("<ul>");
$("body").append(sideNav.addClass("sidenav").attr({ id: "slide-out" }));

$(document).ready(function () {
  $(".sidenav").sidenav();
});
