// Elementtien haku
const asema = document.getElementById("station-select");
const nappi = document.getElementById("search-btn");
const päivitetty = document.getElementById("updated-time");
const taulukko = document.getElementById("timetable-body");

// Napin klikkaustoiminto, hakee valitun aseman junat
nappi.addEventListener("click", function () {
  const valittuAsema = asema.value;

  // Hakee Digitraffic API:sta valitun aseman junat
  const osoite =
    "https://rata.digitraffic.fi/api/v1/live-trains/station/" +
    valittuAsema +
    "?arrived_trains=0&arriving_trains=0&departed_trains=0" +
    "&departing_trains=10&include_nonstopping=false" +
    "&train_categories=Commuter,Long-distance";

  päivitetty.textContent = "Haetaan lähtöjä...";
  taulukko.innerHTML = "";

  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", osoite, true);

  xmlhttp.onload = function () {
    if (xmlhttp.status === 200) {
      // Saadun JSON-datan käsittely
      const junat = JSON.parse(xmlhttp.responseText);

      console.log("Haetut junat:", junat);

      // Kellonajan päivitys
      const nyt = new Date();

      const kellonaika = nyt.toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Helsinki"
      });

      päivitetty.textContent = "Päivitetty " + kellonaika;
    } else {
      // Virheviesti jos haku epäonnistuu
      päivitetty.textContent = "Haku epäonnistui: " + xmlhttp.status;
    }
  };

  // Virheviesti jos ei yhteyttä
  xmlhttp.onerror = function () {
    päivitetty.textContent = "Haku epäonnistui: " + xmlhttp.status;
  };

  xmlhttp.send();
});
