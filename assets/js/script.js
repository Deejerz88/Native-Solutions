const searchInput = $("#searchinput");
const searchBtn = $("#searchbutton");
const searchResults = $("#search-results");
const taxonomyEl = $("#taxonomy");
const advanced = $("#advanced");
const endangermentEl = $("#endangerment");
const locationEl = $("#location");
const favContainer = $('#favorites')
const quickSearch = $('#quick-search')
let favorites
searchInput.val("Michigan");
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
        console.log({address})
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
  const plantAnimal = $("input[name=group1]:checked").next().text()
  console.log(plantAnimal)
  let url = "https://explorer.natureserve.org/api/data/speciesSearch";
  const qs = quickSearch.val()
  //Future Filters: quick search, status (endangerment), location (Country, state), species taxonomy (scientific & informal searches),
  let searchCriteria = {};
  // const taxSearch = taxonomyEl.val()
  searchCriteria.criteriaType = "species";
  let locType = !!location.state ? "subnation":"nation"
  searchCriteria.locationCriteria = [
    {
      paramType: locType,
      subnation: location.state,
      nation: location.country,
    },
  ];

  if (!!qs)
    searchCriteria.textCriteria = [
      { paramType: "quickSearch", searchToken: qs },
    ];

  // if (!!taxSearch && !!advanced.val())
  // searchCriteria.speciesTaxonomyCriteria = [
  //   {
  //     paramType: "scientificTaxonomy",
  //     level: 'KINGDOM',
  //     scientificTaxonomy: 'plants',
  //     kingdom: 'plants',
  //   },
  // ];

  // console.log(searchCriteria)
  if (!!plantAnimal)
  searchCriteria.speciesTaxonomyCriteria = [
    { paramType: "informalTaxonomy", informalTaxonomy: plantAnimal },
  ];
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
        console.log(data, data.results);
        if (!!data.results) searchResults.empty()
        data.results.forEach((organism) => {
          getOrganismInfo(organism.uniqueId);
        });
      });
  });
};

searchBtn.on("click", submitHandler);

const getOrganismInfo = (id,origin) => {
  //Get Plant Info
  let url = `https://explorer.natureserve.org/api/data/taxon/${id}`;
  // let url = "http://plants.usda.gov/api/plants/search";
  fetch(url).then((res) => {
    if (res.ok)
      res.json().then((data) => {
        console.log(data.primaryCommonName, data);
        if (origin !== 'favorites') {
          createCard(data);
        } else{populateSidenav(data)}
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
  // imgContainer.addClass("card-image");
  title.addClass("card-title");
  // fabDiv.addClass("row");
  cardContainer.append(col.append(card));

  content.addClass("card-content");
  action.addClass("card-action");
  //
  // const imgUrl = getImage(sciName)
  // img.attr({ src: `https://via.placeholder.com/100` }).css({ width: 100 });

  title.text(commonName);
  // title.css({ color: "black" });

  fab
    .attr({ href: "#", "data-target": "slide-out" })
    .addClass("btn-floating halfway-fab red sidenav-trigger pulse");
  icon.addClass("material-icons").text("info");
  fab.append(icon);

  const descText = createBody(data);

  content.html(`<b>Scientific Name:</b> ${sciName} <p>${descText}`);
  content.css({ color: "black" });
  // https://explorer.natureserve.org/Taxon/${id}/${sciName}
  link
    .attr({
      href: `#!`,
    })
    .text("Add to Favorites")
    .on("click", addToFavorites)
    .data({ "id": data.uniqueId,"name":commonName });
  action.append(link);

  fab.on("click", (e) => {
    populateSidenav(data);
  });

  imgContainer.append(img, title, fab);
  card.append(imgContainer, content, action);
  cardContainer.append(card);
  searchResults.append(card);
};

const getImage = (sciName) => {
  let key = "AIzaSyClLuw93oZYShzT7DCia1VDsGLZQyiARm0";
  let id = 'f70c22e56966f4573'
  sciName = sciName.toString().replace(/ /g, "%20");
  let url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${id}&q=${sciName}&searchType=image&imgSize=large&imgType=photo&num=1`;
  let imgUrl = "";
  // console.log(url);
  fetch(url).then((res) => {
    if (res.ok) {
      res.json().then((imgData) => {
        imgUrl = imgData.items[0].link;
      });
    } else console.log(res.error.message);
  });

  console.log({imgUrl});
  return imgUrl
};

const populateSidenav = (data) => {
  sideNav.empty();
  const collapsible = $("<ul>");
  const title = $("<h2>");
  // const img = $("<img>");
  const desc = $("<p>");
  // const background = $('<div>')
  // const bgImg = $('<img>')

  let countries;

  const species = data.speciesGlobal;
  const sc = data.speciesCharacteristics;
  const ac = data.animalCharacteristics;
  const pc = data.plantCharacteristics;
  const rank = data.rankInfo;
  const type = !!ac ? ac : pc;
  title.text(data.primaryCommonName);
  // img
  //   .attr({ src: `https://via.placeholder.com/200` })
  //   .css({ width: 200, margin: 20 });
  sideNav.append(
    title,
    // img,
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
  ];
  collapsible.addClass("collapsible popout");

  categories.forEach((category) => {
    //animalCharacteristics{animalFoodHabits[array], animalPhenologies, animalPhenologyComments, foodHabitsComments,majorHabitat{object}, nonMigrant, localMigrant, longDistanceMigrant, mobilityMigrationComments,colonialBreeder,length,width,weight, subTypes}
    //
    //Plants
    //plantCharacteristics {genusEconomicValue, economicComments, plantProductionMethods, plantDurations ,plantEconomicUses, plantCommercialImportances }
    //
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
      let bodyData = createBody(data);
      console.log({bodyData})
      if (!bodyData) return
      desc.html(bodyData);
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
      const ul = $("<ul>");
      taxLevels.forEach((level) => {
        let taxLevel = species[level.toLowerCase()];
        taxLevel = !!taxLevel ? taxLevel : species["tax" + level.toLowerCase()];
        taxLevel = level === "Species" ? data.scientificName : taxLevel;
        ul.append($("<li>").html(`<b>${level}:</b> ${taxLevel}`));
      });
      ul.append(
        $("<li>").html(
          `<b>Informal Taxonomy:</b> ${data.nameCategory.nameCategoryDescEn}`
        )
      );
      bodyText.append(ul);
    }

    //Habitat
    else if (category === "Habitat") {
      //elementNationals, elementSubnationals
      // let nationals = {};

      let natSearch = $("<input>").attr({
        type: "text",
        id: "natSearch",
        onkeyup: "searchNats()",
        placeholder: "Search...",
      });

      countries = data.elementNationals;

      const numSubnats = countries.reduce(
        (a, b) => a.elementSubnationals.length + b.elementSubnationals.length
      );
      let perPage = 5;
      let numPages = Math.ceil(numSubnats / perPage);

      let table = createTable(1, perPage, countries);

      // console.log("adding pagination");
      let pagination = $("<div>").addClass("pagination");
      pagination.append(
        $("<a>")
          .attr({ href: "#!", id: "back", onclick: "shiftPage(back)" })
          .html("&laquo;")
      );
      for (let n = 0; n < numPages; n++) {
        let page = n + 1;
        let a = $("<a>");
        if (n == 0) a.addClass("active");
        a.attr({
          href: "#!",
          id: `page${page}`,
          onclick: `changePage(${page})`,
        })
          .addClass("")
          .text(n + 1);
        pagination.append(a);
      }
      pagination.append(
        $("<a>")
          .attr({ href: "#!", id: "forward", onclick: `shiftPage(forward)` })
          .html("&raquo;")
      );
      // console.log(pagination.html());

      let habitat = "<br>";
      try {
        const majorHabitat = type.majorHabitat.majorHabitatDescEn;
        habitat += !!majorHabitat
          ? `<b>Major Habitat:</b> ${majorHabitat}<br><br>`
          : habitat;
      } catch (err) {}
      bodyText.append(natSearch, table, pagination, habitat);
    }

    //Food Habits
    else if (category === "Food Habits") {
      if (!!pc) return
      const foodArr = type.animalFoodHabits;
      let foodDesc = type.foodHabitsComments;
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
        `<b>Colonial Breeder:</b> ${type.colonialBreeder}<br>${sc.reproductionComments}`
      );
    }

    //Phenology
    else if (category === "Phenology") {
      if (!!pc) return
      //animalPhenologies, animalPhenologyComments,
      let phenoDesc = type.animalPhenologyComments;
      const phenoArr = type.animalPhenologies;
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
      if (!!pc) return
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

    //Population & Endangerment
    else if (category === "Population & Endangerment") {
      let popSize,
        popDesc,
        range,
        rangeDesc,
        grank,
        grankDesc,
        shortTrend,
        shortDesc,
        longTrend,
        longDesc,
        threat,
        threatDesc,
        popNeeds,
        protectionNeeds;
      try {
        longTrend, longDesc, threat, threatDesc, popNeeds, protectionNeeds;
        popSize = rank.popSize.popSizeDescEn;
        popDesc = rank.popSizeComments;
        range = rank.rangeExtent.rangeExtentDescEn;
        rangeDesc = rank.rangeExtentComments;

        grank = data.grank;
        grankDesc = data.grankReasons;
        shortTrend = rank.shortTermTrend.shortTermTrendDescEn;
        shortDesc = rank.shortTermTrendComments;
        longTrend = rank.longTermTrend.longTermTrendDescEn;
        longDesc = rank.longTermTrendComments;

        threat = rank.threatImpactAssigned.threatImpactAssignedDescEn;
        threatDesc = rank.threatImpactComments;

        popNeeds = rank.inventoryNeeds;
        protectionNeeds = rank.protectionNeeds;
      } catch (err) {}

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
  console.log(!!ac)
  const pc = data.plantCharacteristics;
  const sc = data.speciesCharacteristics;
  const type = !!ac ? ac : pc;

  if (!!ac) {
    let lww = "";
    if (!!type.length) lww += `<b>Length:</b> ${type.length}mm`;
    if (!!type.width)
      lww += !lww ? "" : " | " + `<b>Width:</b> ${type.width}mm`;
    if (!!type.weight)
      lww += !lww ? "" : " | " + `<b>Weigth:</b> ${type.weight}<br>`;
    let habitat = "";
    try {
      const majorHabitat = type.majorHabitat.majorHabitatDescEn;
      habitat = !!majorHabitat
        ? `<b>Major Habitat:</b> ${majorHabitat}<br><br>`
        : habitat;
    } catch (err) {}
  }
  
  
  let descText = sc.generalDescription;

  descText = !!descText ? descText : ''

  if (!!descText) {
    let descArray;
    try {
      descArray = descText.split(";");
      let descList = $("<ul>").addClass("descList");
      descArray.forEach((des) => {
        descList.append($("<li>").text(des).css({ "list-style-type": "disc" }));
      });
      descText = $("<ul>").append(descList.clone()).html();
      descText = lww + habitat + descText;
    } catch (err) { }
  }
  let char = sc.diagnosticCharacteristics;

  if (!!char) descText = descText + '<br>' + char
  console.log({descText})
  return descText;
};

const searchNats = () => {
  // Declare variables
  let input, filter, tr, td, txtValue;
  input = $("#natSearch");
  filter = input.val().toUpperCase();
  tr = $(".natRow");
  for (let i = 0; i < tr.length; i++) {
    const row = $(tr[i]);
    td = $(row.children(".tableFilter"));
    for (let j = 0; j < td.length; j++) {
      let found = 0;
      if (td[j]) {
        txtValue = $(td[j]).val() || $(td[j]).text();
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          found++;
        }
        if (!found) row.hide();
        else row.show();
      }
    }
  }
};

const addToFavorites = (e) => {
  e.stopPropagation();
  favorites = JSON.parse(localStorage.getItem("natureFavorites"));
  favorites = !!favorites ? favorites : {};
  const tgt = $(e.target);
  const id = tgt.data("id");
  const name = tgt.data("name");
  console.log(id, name);
  favorites[name] = id;
  localStorage.setItem("natureFavorites", JSON.stringify(favorites));
  showFavorites(favorites);
};

const showFavorites = (favorites) => {
  favContainer.empty();

  favContainer.append($('<h5>').text('Favorites:').css({'font-weight':'bold','margin-left':'5px'}))
  console.log({ favorites })
  favorites = !!favorites
    ? favorites
    : JSON.parse(localStorage.getItem("natureFavorites"));
   favorites = !!favorites ? favorites : {};
  const row = $('<div>').addClass('row').attr({id:'favRow'})
  favArr = Object.entries(favorites);
  let numCol = Math.floor(12 / favArr.length);
  numCol = numCol > 0 ? numCol:1
  favArr.forEach(favorite => {
    const name = favorite[0]
    const id = favorite[1]
    row.append(
     
      $("<div>")
        .addClass(`valign-wrapper col s${numCol} favorite`)
        .html(
          `<a href='#' class='sidenav-trigger' data-target='slide-out'><i style='color:red' class="material-icons">favorite</i><b>${name}</b></a>`
        )
        .on("click", () => {
          getOrganismInfo(id,'favorites')
        }))
  })

favContainer.append(row)
}


const createTable = (page, perPage, countries) => {
  let table = $("<table>")
    .attr({ id: "national-table" })
    .addClass("striped")
    .data({ countries: countries, perPage, perPage });
  const thead = $("<thead>").append($("<tr>"));
  const headers = ["Country", "State", "Native", "Exotic", "Hybrid"];
  headers.forEach((header, i) => {
    let th = $('<th>')
    if (i>1) th.addClass('center-align')
    thead.append(th.append(header))
  })
  const tbody = $("<tbody>");

  let numRows = 0;
  let end = page * perPage;
  let start = end - perPage + 1;

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const countryName = country.nation.nameEn;
    const subNationals = country.elementSubnationals;
    for (let j = 0; j < subNationals.length; j++) {
      numRows++;
      // console.log({ numRows });

      const subNat = subNationals[j];
      const tr = $("<tr>").addClass("natRow");
      const subnation = subNat.subnation.nameEn;
      const exotic = subNat.speciesSubnational.exotic;
      const hybrid = subNat.speciesSubnational.hybrid;
      const native = subNat.speciesSubnational.native;

      if (numRows < start || numRows > end) tr.css({ display: "none" });
      else tr.css({ display: "" });

      const dataSet = [countryName, subnation, native, exotic, hybrid];
      dataSet.forEach((data) => {
        const td = $("<td>")
        if (data !== true && data !== false) td.addClass("tableFilter")
        else td.addClass('center-align')
        switch (data) {
          case true:
            data =
              '<i style="color:green" class="material-icons">check_circle</i>';
            break;
          case false:
            data = '<i style="color:red" class="material-icons">cancel</i>';
            break;
        }

        tr.append(td.html(data));
      });
      tbody.append(tr);
    }
  }

  // return
  // let pagination = `<ul class="pagination">
  //   <li class="disabled"><a href="#!"><i class="material-icons">chevron_left</i></a></li>
  //   <li class="active"><a href="#!">${page}</a></li>
  //   <li class="waves-effect"><a href="#!">${page+1}</a></li>
  //   <li class="waves-effect"><a href="#!">${page+2}</a></li>
  //   <li class="waves-effect"><a href="#!">${page+3}</a></li>
  //   <li class="waves-effect"><a href="#!">${page+4}</a></li>
  //   <li class="waves-effect"><a href="#!"><i class="material-icons">chevron_right</i></a></li>
  // </ul>`;

  table.append(thead, tbody);
  return table;
};

const changePage = (page) => {
  console.log(page);
  const natTable = $("#national-table");
  const countries = natTable.data("countries");
  const perPage = natTable.data("perPage");
  const table = createTable(page, perPage, countries);
  natTable.replaceWith(table);
  console.log($(`#page${page}`).addClass("active"));
  $(".pagination .active").removeClass("active");
  $(`#page${page}`).addClass("active");
};

const shiftPage = (dir) => {
  console.log(dir.id);
  let currPage = Number($(".pagination .active").text());
  const page = dir.id === "back" ? currPage - 1 : currPage + 1;
  changePage(page);
};

//sideNav
const sideNav = $("<ul>");
$("body").append(sideNav.addClass("sidenav").attr({ id: "slide-out" }));

$(document).ready(function () {
  $(".sidenav").sidenav();
  
});

// getFavorites();
showFavorites();
