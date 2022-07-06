const searchInput = $("#searchinput");
const searchBtn = $("#searchbutton");
const searchResults = $("#search-results");
const taxonomyEl = $("#taxonomy");
const advanced = $("advanced");
const endangermentEl = $("#endangerment");
const locationEl = $("location");

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

const subtmitHandler = (e) => {
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
        const state = data.results[0].address_components[2].short_name;
        const country = data.results[0].address_components[3].short_name
        const location = { state: state, country: country };
        console.log(location)
        //getData(location)
        return location
      });
  });
};

const getData = (location) => {
  //Search for plants/animals
  let url = "https://explorer.natureserve.org/api/data/speciesSearch";
  //quick search, status (endangerment), location (Country, state), species taxonomy (scientific & informal searches),
  let searchCriteria = {};
  const taxSearch = taxonomyEl.val();

  if (!!searchInput.val())
    searchCriteria.textCriteria = [
      { paramType: "quickSearch", searchToken: searchInput.val() },
    ];

  if (!!taxSearch && !!advanced.val())
    searchCriteria.speciesTaxonomyCriteria = [
      {
        paramType: "scientificTaxonomy",
        level: taxSearch.level,
        scientificTaxonomy: taxSearch.taxonomy,
        kingdom: taxSearch.kingdom,
      },
    ];

  if (!!taxSearch && !!advanced.val())
    searchCriteria.speciesTaxonomyCriteria = [
      { paramType: "informalTaxonomy", informalTaxonomy: taxonomyEl.val() },
    ];
  if (!!locationEl.val())
    searchCriteria.locationCriteria = [
      {
        paramType: "subnation",
        subnation: locationEl.val().state,
        nation: location.val().country,
      },
    ];

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
      });
  });
};

searchBtn.on("click", subtmitHandler);

const getPlantInfo = () => {
  //Get Plant Info

  let url = "http://plants.usda.gov/api/plants/search";
};
