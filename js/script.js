// Elementtien haku
const asema = document.getElementById("station-select");
const nappi = document.getElementById("search-btn");
const päivitetty = document.getElementById("updated-time");
const taulukko = document.getElementById("timetable-body");

// Asemien nimet asemakoodeittain, esimerkiksi LH = Lahti
let asemat = {};

// Viimeisimmän haun tunnus
let hakuNumero = 0;

// Viimeksi haetut lähdöt
let viimeksiHaetutJunat = null;
let viimeksiValittuAsema = null;

// Haetaan asemien nimet muistiin
haeAsemat();

// Napin klikkaustoiminto
nappi.addEventListener("click", haeLähdöt);

// Lähtöjen haku napista ja automaattisesti
function haeLähdöt() {
  const valittuAsema = asema.value;

  // Uuden haun tunnus
  hakuNumero++;
  const tämänHaunNumero = hakuNumero;

  // Hakee Digitraffic API:sta valitun aseman junat
  const osoite =
    "https://rata.digitraffic.fi/api/v1/live-trains/station/" +
    valittuAsema +
    "?arrived_trains=0&arriving_trains=0&departed_trains=0" +
    "&departing_trains=10&include_nonstopping=false" +
    "&train_categories=Commuter,Long-distance";

  päivitetty.textContent = "Haetaan lähtöjä...";
  taulukko.innerHTML = "";
  viimeksiHaetutJunat = null;
  viimeksiValittuAsema = null;

  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", osoite, true);

  xmlhttp.onload = function () {
    // Vanhan haun vastauksen ohittaminen
    if (tämänHaunNumero !== hakuNumero) {
      return;
    }

    if (xmlhttp.status === 200) {
      // Saadun JSON-datan käsittely
      const junat = JSON.parse(xmlhttp.responseText);

      console.log("Haetut junat:", junat);

      // Jos asemien nimet saapuvat myöhemmin, taulukko voidaan päivittää
      viimeksiHaetutJunat = junat;
      viimeksiValittuAsema = valittuAsema;

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
    // Vanhan haun vastauksen ohittaminen
    if (tämänHaunNumero !== hakuNumero) {
      return;
    }

    päivitetty.textContent = "Haku epäonnistui (verkkovirhe).";
  };

  xmlhttp.send();
}

// Haettujen junien tunnukset + lähtöajat taulukossa
function näytäLähdöt(junat, asemaKoodi) {
  taulukko.innerHTML = "";

  // Järjestetään lähtöajan mukaan
  järjestäLähdöt(junat, asemaKoodi);

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

      // Määränpään haku
      const vikaPysähdys = juna.timeTableRows[juna.timeTableRows.length - 1];
      const määränpääKoodi = vikaPysähdys.stationShortCode;
      const määränpääNimi = asemat[määränpääKoodi] || määränpääKoodi;

      // Luodaan taulukkorivi
      const rivi = taulukko.insertRow(-1);

      // Solu 0: Lähtöaika
      rivi.insertCell(0).textContent = lähtöaika;
      
      // Solu 1: Juna
      rivi.insertCell(1).textContent = tunnus;
      
      // Solu 2: Määränpää (koko nimi)
      const määränpääSolu = rivi.insertCell(2);
      määränpääSolu.textContent = määränpääNimi;
      määränpääSolu.classList.add("destination");

      // Solu 3: Raide
      const raide = lähtö.commercialTrack || "–";
      rivi.insertCell(3).textContent = raide;
    }
  }
}

// Seuraavan juna lähdön etsiminen valitulta asemalta
function etsiLähtö(juna, asemaKoodi) {
  for (let i = 0; i < juna.timeTableRows.length; i++) {
    const pysähdys = juna.timeTableRows[i];

    // Etsitään valitulta asemalta lähtö
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

// Aseman lähtöjen järjestys lähtöajan mukaan
function järjestäLähdöt(junat, asemaKoodi) {
  for (let i = 0; i < junat.length; i++) {
    for (let j = i + 1; j < junat.length; j++) {
      const lähtö1 = etsiLähtö(junat[i], asemaKoodi);
      const lähtö2 = etsiLähtö(junat[j], asemaKoodi);

      // Lähtöaikojen vertailu jos molemmille junille löytyi lähtö
      if (lähtö1 !== null && lähtö2 !== null) {
        // Lähtöaikojen muuttaminen vertailtavaan muotoon
        const aika1 = new Date(lähtö1.scheduledTime);
        const aika2 = new Date(lähtö2.scheduledTime);

        // Junien järjestys jos toinen lähtee aikaisemmin
        if (aika1 > aika2) {
          const apu = junat[i];
          junat[i] = junat[j];
          junat[j] = apu;
        }
      }
    }
  }
}

// Haetaan asemien metatiedot API:sta nimitietojen muuntamista varten
function haeAsemat() {
  const xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "https://rata.digitraffic.fi/api/v1/metadata/stations", true);

  xmlhttp.onload = function () {
    if (xmlhttp.status === 200) {
      const asemalista = JSON.parse(xmlhttp.responseText);

      // Tallennetaan asemien nimipari
      for (let i = 0; i < asemalista.length; i++) {
        const asemaObj = asemalista[i];
        // Poistetaan API:n nimestä " asema", esim. "Helsinki asema" -> "Helsinki"
        const nimi = asemaObj.stationName.replace(" asema", "");
        asemat[asemaObj.stationShortCode] = nimi;
      }

      // Päivitetään määränpäiden nimet
      if (viimeksiHaetutJunat !== null) {
        näytäLähdöt(viimeksiHaetutJunat, viimeksiValittuAsema);
      }
    }
  };

  xmlhttp.send();
}

// Haetaan lähdöt heti sivun avautuessa
haeLähdöt();

// Haetaan valitun aseman lähdöt uudelleen minuutin välein
// Ajastimen ohje: https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval
setInterval(haeLähdöt, 60000);