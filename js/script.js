// Elementtien haku
const asema = document.getElementById("station-select");
const nappi = document.getElementById("search-btn");
const päivitetty = document.getElementById("updated-time");
const taulukko = document.getElementById("timetable-body");

// Napin klikkaustoiminto, valittu asema
nappi.addEventListener("click", function () {
  const valittuAsema = asema.value;

  // Hakee Digitraffic API:sta valitun aseman junat napin klikkauksen jälkeen
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

      // Annetaan funktiolle myös valittu asema
      näytäLähdöt(junat, valittuAsema);

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

// Haettujen junien tunnukset + lähtöajat taulukossa
function näytäLähdöt(junat, asemaKoodi) {
  taulukko.innerHTML = "";

  for (let i = 0; i < junat.length; i++) {
    const juna = junat[i];

    // Juna lähdön etsiminen valitulta asemalta
    const lähtö = etsiLähtö(juna, asemaKoodi);

    // Näytetään juna, jos sitä ei ole peruttu ja lähtö löytyi
    if (!juna.cancelled && lähtö !== null) {
      // Muutetaan aikataulun lähtöaika Suomen kellonajaksi
      const lähtöaika = new Date(lähtö.scheduledTime).toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Helsinki"
      });

      let tunnus = juna.trainType + " " + juna.trainNumber;

      if (juna.commuterLineID) {
        tunnus = juna.commuterLineID;
      }

      const rivi = taulukko.insertRow(-1);

      rivi.insertCell(0).textContent = lähtöaika;
      rivi.insertCell(1).textContent = tunnus;
      rivi.insertCell(2).textContent = "–";
      rivi.insertCell(3).textContent = "–";
    }
  }
}

// Seuraavan juna lähdön etsiminen valitulta asemalta
function etsiLähtö(juna, asemaKoodi) {
  for (let i = 0; i < juna.timeTableRows.length; i++) {
    const pysähdys = juna.timeTableRows[i];

    // Etsitään valitulta asemalta lähtö, joka on vielä tulossa ja jota ei ole peruttu.
    if (
      pysähdys.stationShortCode === asemaKoodi &&
      pysähdys.type === "DEPARTURE" &&
      pysähdys.commercialStop &&
      !pysähdys.actualTime &&
      !pysähdys.cancelled
    ) {
      return pysähdys;
    }
  }

  // Jos sopivaa lähtöä ei löytynyt, ei lisää riviä taulukkoon
  return null;
}