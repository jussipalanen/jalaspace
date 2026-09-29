import type { Handbook } from '../types'

/**
 * Käyttöopas suomeksi. Painikkeiden, kenttien ja sivujen nimet on kirjoitettu
 * **lihavoituina** perusmuodossa, täsmälleen niin kuin käyttöliittymä ne näyttää.
 * Sijapääte liitetään apusanaan: **Asetukset**-sivulla, ei **Asetuksissa**.
 */
export const fi: Handbook = {
  'getting-started': {
    title: 'Aloittaminen',
    summary: 'Kirjaudu sisään, löydä tiesi sovelluksessa ja valitse kieli.',
    sections: {
      'sign-in': {
        title: 'Sisäänkirjautuminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpace on demo, jolla hallitaan kiinteistöjä, vuokrattavia tiloja, vuokralaisia, vuokrasopimuksia, vuokrahakemuksia ja huoltoja. Kirjaudu sisään demotilillä, jonka tunnukset näkyvät kirjautumissivulla.',
          },
          {
            type: 'steps',
            items: [
              'Valitse **Täytä demotunnukset** tai kirjoita sähköposti ja salasana, jotka näkyvät kohdassa **Demotili**.',
              'Valitse **Kirjaudu sisään**. **Yleiskatsaus** avautuu, tai sivu, jolle olit menossa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Kirjaudu ulos yläpalkin oikean reunan painikkeesta.',
          },
          {
            type: 'note',
            text: 'Tämä on demo. Tiedot ovat kuvitteellisia ja kuka tahansa voi kirjautua, joten älä koskaan kirjoita oikeita henkilötietoja.',
          },
        ],
      },
      navigation: {
        title: 'Liikkuminen sovelluksessa',
        blocks: [
          {
            type: 'paragraph',
            text: 'Vasemman reunan sivupalkissa ovat sovelluksen kaikki osat aiheittain: **Yleistä**, **Kiinteistösalkku**, **Ylläpito** ja **Vuokraus**. **Asetukset** ja tämä **Käyttöopas** ovat alimpana.',
          },
          {
            type: 'list',
            items: [
              'Puhelimessa sivupalkki on piilossa. Avaa se yläpalkin vasemman reunan valikkopainikkeesta. Sulje se sulkemispainikkeesta tai Esc-näppäimellä.',
              'Kohdan **Hakemukset** vieressä oleva luku kertoo, montako uutta hakemusta odottaa.',
              'Yläpalkin **?**-painike avaa käyttöoppaan luvun, joka kertoo avoinna olevasta sivusta.',
              'Kun valitset nimesi yläpalkista, profiilisi avautuu **Asetukset**-sivulle.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Luetteloiden yläpuolella on hakukenttä ja suodattimia. Suodattimet säilyvät, kun lataat sivun uudelleen. Jos kopioit linkin ja lähetät sen jollekulle, hän näkee saman suodatetun luettelon.',
          },
        ],
      },
      language: {
        title: 'Kieli',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpacea voi käyttää suomeksi ja englanniksi. Valitse kieli **Kieli**-valikosta. Valikko on yläpalkissa, kirjautumissivulla ja **Asetukset**-sivulla. Kieli vaihtuu heti, ja pysyt samalla sivulla.',
          },
          {
            type: 'paragraph',
            text: 'Valintasi muistetaan tässä selaimessa. Käyttäjien kirjoittamia nimiä, osoitteita ja muita tekstejä ei käännetä, joten demotiedot ovat englanniksi.',
          },
        ],
      },
      'demo-data': {
        title: 'Demotiedot',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpacessa on valmiina kuvitteellinen kiinteistösalkku: kiinteistöjä useilla suomalaisilla paikkakunnilla sekä niiden tilat, vuokralaiset, vuokrasopimukset, hakemukset ja huoltotehtävät. Voit muuttaa mitä tahansa, lisätä omia tietoja ja poistaa niitä.',
          },
          {
            type: 'paragraph',
            text: 'Sivupalkin alareunan huomautus kertoo, kuka muutoksesi näkee: vain sinä tässä selaimessa vai kaikki demon käyttäjät.',
          },
          {
            type: 'paragraph',
            text: 'Jos haluat aloittaa alusta, [palauta demotiedot](/help/settings#reset) **Asetukset**-sivulla.',
          },
        ],
      },
    },
  },

  dashboard: {
    title: 'Yleiskatsaus',
    summary: 'Kiinteistösalkun tunnusluvut ja se, mikä vaatii huomiota.',
    sections: {
      'key-figures': {
        title: 'Tunnusluvut',
        blocks: [
          {
            type: 'paragraph',
            text: '**Yleiskatsaus** avautuu, kun kirjaudut sisään. Ylimpänä olevat tunnusluvut lasketaan tiedoistasi:',
          },
          {
            type: 'list',
            items: [
              '**Kiinteistöt**: montako kiinteistöä sinulla on ja monellako paikkakunnalla.',
              '**Tilat**: kaikki tilat jaoteltuna: vuokratut, vapaat, varatut (vuokrasopimus alkaa myöhemmin) ja huollossa olevat.',
              '**Käyttöaste**: kuinka suuri osa tiloista on vuokrattu.',
              '**Avoimet huollot**: keskeneräiset huoltotehtävät kiireellisyyden mukaan.',
              '**Avoimet hakemukset**: uudet ja käsittelyssä olevat hakemukset.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Kun valitset tunnusluvun, vastaava luettelo avautuu.',
          },
        ],
      },
      lists: {
        title: 'Mikä vaatii huomiota',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tunnuslukujen alla on lyhyitä luetteloita. Valitse rivi, niin se avautuu, tai valitse **Näytä kaikki**, niin koko luettelo avautuu.',
          },
          {
            type: 'list',
            items: [
              '**Viimeisimmät huoltotehtävät**: uusimmat tehtävät, niiden kiireellisyys ja määräpäivä.',
              '**Vapaat tilat**: tilat, jotka voi vuokrata heti, ja montako hakemusta kuhunkin on tullut. Jos tilan vuokrasopimus alkaa myöhemmin, tila on merkitty varatuksi.',
              '**Uusimmat hakemukset**: viisi uusinta hakemusta ja niiden käsittelyn tila.',
              '**Viimeaikaiset tapahtumat**: valmistuneet huollot, alkaneet ja päättyneet vuokrasopimukset sekä saapuneet ja hyväksytyt hakemukset.',
            ],
          },
        ],
      },
      ask: {
        title: 'Kysy JalaSpacelta',
        blocks: [
          {
            type: 'paragraph',
            text: '**Kysy JalaSpacelta** -kortilla voit kysyä suomeksi tai englanniksi. Kortti näyttää, minne sovelluksessa kannattaa mennä tai mitkä tiedot vastaavat kysymystä. Esimerkiksi:',
          },
          {
            type: 'list',
            items: [
              '”Missä vaihdan kielen?” vie oikealle sivulle.',
              '”Vapaa kolmio, jossa on sauna” näyttää sopivat tilat.',
              '”Myöhässä olevat kiireelliset huoltotehtävät” näyttää sopivat tehtävät.',
            ],
          },
          {
            type: 'steps',
            items: [
              'Kirjoita kysymys ja valitse **Kysy**, tai valitse jokin esimerkki kohdasta **Kokeile esimerkiksi**.',
              'Tarkista kohdasta **Tulkittu näin**, miten kysymys ymmärrettiin. Jos haluat laajentaa hakua, poista jokin ehto.',
              'Valitse tulos, niin se avautuu. **Avaa sivulla** näyttää kaikki tulokset omalla luettelosivullaan.',
            ],
          },
          {
            type: 'note',
            text: 'Kysymyksesi lähetetään Google Geminille, joten älä kirjoita siihen henkilötietoja. Tekoäly vain tulkitsee kysymyksen: tulokset tulevat aina omista JalaSpace-tiedoistasi.',
          },
          {
            type: 'paragraph',
            text: 'Jos korttia ei näy, tekoälytoiminnot eivät ole käytössä tässä demossa.',
          },
        ],
      },
    },
  },

  properties: {
    title: 'Kiinteistöt',
    summary: 'Rakennukset ja kohteet sekä niiden tilat, huollot ja sijainti.',
    sections: {
      list: {
        title: 'Kiinteistöluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Kiinteistöt**-sivulla ovat rakennuksesi ja kohteesi. Luettelosta näet, montako tilaa kussakin on, kuinka moni niistä on vuokrattu ja montako huoltoa on kesken.',
          },
          {
            type: 'paragraph',
            text: 'Voit hakea kiinteistöä nimellä, osoitteella, postinumerolla tai paikkakunnalla **Hae kiinteistöjä** -kentästä. Valitse kiinteistön nimi, niin kiinteistö avautuu.',
          },
          { type: 'link', to: '/properties', label: 'Siirry kiinteistöihin' },
        ],
      },
      details: {
        title: 'Kiinteistön tiedot',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kiinteistön sivulle on koottu kaikki kiinteistön tiedot:',
          },
          {
            type: 'list',
            items: [
              '**Tunnusluvut**: tilat, käyttöaste ja avoimet huollot.',
              '**Tilat**: kiinteistön kaikki tilat, niiden käyttötilanne ja nykyinen vuokralainen. **Lisää tila** luo tähän kiinteistöön uuden tilan.',
              '**Avoimet huollot**: keskeneräiset tehtävät. **Lisää tehtävä** luo tehtävän tälle kiinteistölle.',
              '**Sijainti**: kiinteistö kartalla, jos sijainti on asetettu.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Jos vapaata tilaa voi hakea, sen kohdalla on **Hakulomake**-linkki. Linkki avaa tilan julkisen hakulomakkeen uuteen välilehteen.',
          },
        ],
      },
      'add-edit': {
        title: 'Kiinteistön lisääminen ja muokkaaminen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Kiinteistöt**-sivulla **Lisää kiinteistö**. Jos haluat muuttaa kiinteistön tietoja, avaa kiinteistö ja valitse **Muokkaa**.',
              'Täytä kentät **Nimi**, **Tyyppi**, **Katuosoite**, **Postinumero** ja **Postitoimipaikka**. Tähdellä * merkityt kentät ovat pakollisia.',
              'Voit myös kirjoittaa kuvauksen **Kuvaus**-kenttään ja [asettaa sijainnin](/help/properties#location).',
              'Valitse **Tallenna kiinteistö**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Postinumerossa on viisi numeroa, esimerkiksi 80100. Jos jotain puuttuu tai on väärin, lomake näyttää, mitkä kentät pitää korjata.',
          },
        ],
      },
      location: {
        title: 'Sijainnin asettaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Sijainti on vapaaehtoinen. Se asetetaan kiinteistön lomakkeella, ja kiinteistön sivu näyttää sen kartalla.',
          },
          {
            type: 'steps',
            items: [
              'Tarkista osoite **Hae osoitteella** -kentästä. Osoite on täytetty valmiiksi osoitekentistä.',
              'Valitse **Hae** tai paina Enter. Valitse sitten oikea paikka kohdasta **Osumat**, niin nasta siirtyy siihen.',
              'Voit tarkentaa sijaintia vetämällä nastaa tai napsauttamalla karttaa. Koordinaatit voi myös kirjoittaa kenttiin **Leveysaste** ja **Pituusaste**.',
              'Lähennä tai loitonna kartta haluamallesi tasolle. Taso tallennetaan sijainnin mukana.',
            ],
          },
          {
            type: 'paragraph',
            text: '**Poista sijainti** poistaa sijainnin. Kiinteistön sivulla **Avaa OpenStreetMapissa** näyttää paikan OpenStreetMapin sivustolla.',
          },
          {
            type: 'note',
            text: 'Osoitehaku löytää vain suomalaisia osoitteita, ja hakemasi osoite lähetetään OpenStreetMapille.',
          },
        ],
      },
      delete: {
        title: 'Kiinteistön poistaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Avaa kiinteistö, valitse **Poista** ja vahvista valitsemalla **Poista kiinteistö**. Poistoa ei voi perua.',
          },
          {
            type: 'paragraph',
            text: 'Kiinteistöä ei voi poistaa, jos sillä on vielä tiloja tai huoltotehtäviä. JalaSpace kertoo, mitä ne ovat, jotta voit ensin poistaa tai siirtää ne.',
          },
        ],
      },
    },
  },

  spaces: {
    title: 'Tilat',
    summary: 'Asunnot, toimistot ja muut vuokrattavat tilat kiinteistöissäsi.',
    sections: {
      list: {
        title: 'Tilojen etsiminen',
        blocks: [
          {
            type: 'paragraph',
            text: '**Tilat**-sivulla ovat kaikkien kiinteistöjesi vuokrattavat tilat. Luettelosta näet kunkin tilan käyttötilanteen ja nykyisen vuokralaisen.',
          },
          {
            type: 'list',
            items: [
              '**Hae tiloja** löytää tilan sen nimellä tai vuokralaisen nimellä.',
              'Voit rajata luetteloa suodattimilla **Kiinteistö**, **Käyttötilanne** ja **Huoneet** (1–4 tai vähintään 5).',
              'Valitse kohdasta **Ominaisuudet**, mitä tilassa pitää olla, esimerkiksi sauna ja parveke. Luettelossa näkyvät vain tilat, joissa on kaikki valitut ominaisuudet.',
              '**Tyhjennä suodattimet** näyttää taas kaikki tilat.',
            ],
          },
          { type: 'link', to: '/units', label: 'Siirry tiloihin' },
        ],
      },
      'add-edit': {
        title: 'Tilan lisääminen ja muokkaaminen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Tilat**-sivulla **Lisää tila**. Voit lisätä tilan myös kiinteistön sivulla, jolloin kiinteistö on valmiiksi valittuna. Jos haluat muuttaa tilan tietoja, valitse tilan nimi luettelosta.',
              'Valitse kiinteistö **Kiinteistö**-kentästä ja täytä kentät **Nimi**, **Tyyppi**, **Kerros** ja **Pinta-ala (m²)**.',
              'Voit myös valita huoneiden määrän **Huoneet**-kentästä ja tilan varustelun kohdasta **Ominaisuudet**.',
              'Valitse **Tallenna tila**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Jokaisella kiinteistön tilalla on oltava oma nimi, esimerkiksi A 101.',
              'Kerros on kokonaisluku. Kellarikerros on −1.',
              'Pinta-alassa voi olla desimaaleja, esimerkiksi 62,5.',
            ],
          },
        ],
      },
      status: {
        title: 'Käyttötilanne',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tilan käyttötilanne on **Vapaa**, **Vuokrattu** tai **Huollossa**.',
          },
          {
            type: 'list',
            items: [
              'Tila on vuokrattu, kun sillä on voimassa oleva vuokrasopimus. JalaSpace muuttaa käyttötilanteen itse, kun sopimus alkaa ja päättyy.',
              'Vuokratun tilan käyttötilannetta ei voi muuttaa käsin.',
              'Muulloin voit valita, onko tila vapaa vai huollossa, esimerkiksi remontin ajaksi.',
              'Vuokratun tilan lomakkeella näkyy vuokralainen sekä linkit vuokralaiseen ja sopimukseen.',
            ],
          },
        ],
      },
      delete: {
        title: 'Tilan poistaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Avaa tila, valitse lomakkeen alareunasta **Poista tila** ja vahvista. Poistoa ei voi perua.',
          },
          {
            type: 'paragraph',
            text: 'Tilaa ei voi poistaa, jos siihen liittyy vuokrasopimuksia, huoltotehtäviä tai hakemuksia. JalaSpace luettelee ne, jotta voit hoitaa ne ensin.',
          },
        ],
      },
    },
  },

  maintenance: {
    title: 'Huolto',
    summary: 'Kirjaa korjaukset ja tarkastukset ja seuraa niitä, kunnes ne ovat valmiita.',
    sections: {
      list: {
        title: 'Tehtäväluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Huolto**-sivulla ovat kaikki huoltotehtävät uusimmasta alkaen. Jos tehtävän määräpäivä on mennyt, tehtävän kohdalla lukee **Myöhässä**.',
          },
          {
            type: 'list',
            items: [
              '**Hae tehtäviä** hakee tehtävien otsikoista ja kuvauksista.',
              'Voit rajata luetteloa suodattimilla **Kiinteistö**, **Tila**, **Kiireellisyys** ja **Tilanne**.',
              '**Erääntyy viimeistään** näyttää tehtävät, joiden määräpäivä on valittuna päivänä tai aiemmin.',
              '**Vain myöhässä olevat** näyttää keskeneräiset tehtävät, joiden määräpäivä on mennyt.',
            ],
          },
          { type: 'link', to: '/maintenance', label: 'Siirry huoltoon' },
        ],
      },
      add: {
        title: 'Tehtävän lisääminen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Huolto**-sivulla **Lisää tehtävä**. Voit lisätä tehtävän myös kiinteistön sivulla, jolloin kiinteistö on valmiiksi valittuna.',
              'Valitse kiinteistö **Kiinteistö**-kentästä. Valitse myös tila **Tila**-kentästä, tai jätä valinnaksi **Koko kiinteistö tai yhteiset tilat**.',
              'Kirjoita otsikko **Otsikko**-kenttään. Voit myös kirjoittaa kuvauksen **Kuvaus**-kenttään.',
              'Valitse **Luokka**, **Kiireellisyys** ja **Tilanne**. Voit myös antaa määräpäivän **Määräpäivä**-kenttään.',
              'Valitse **Tallenna tehtävä**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Kirjoita määräpäivä muodossa p.k.vvvv, esimerkiksi 30.9.2026, tai valitse se kentän vieressä olevasta kalenterista.',
          },
        ],
      },
      ai: {
        title: 'Ehdota tekoälyllä',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kuvauksen alla oleva **Ehdota tekoälyllä** -painike auttaa kirjoittamaan tehtävän. Tekoäly ehdottaa selkeää otsikkoa, luokkaa ja kiireellisyyttä sekä kuvausta, jossa on lista tarkistettavista asioista. Lyhyt otsikko, kuten ”keittiön allas vuotaa”, riittää.',
          },
          {
            type: 'steps',
            items: [
              'Kirjoita omin sanoin otsikko, kuvaus tai molemmat.',
              'Valitse **Ehdota tekoälyllä** ja odota, että **Tekoälyn ehdotus** tulee näkyviin.',
              'Lue ehdotus. **Käytä ehdotusta** täyttää kentät, ja **Hylkää** säilyttää sen, mitä kirjoitit.',
              'Tarkista kentät, muuta niitä tarvittaessa ja valitse **Tallenna tehtävä**. Mitään ei tallenneta ennen sitä.',
            ],
          },
          {
            type: 'note',
            text: 'Otsikko ja kuvaus lähetetään Google Geminille, joten älä kirjoita niihin henkilötietoja. Ensimmäinen ehdotus voi kestää minuutin.',
          },
          {
            type: 'paragraph',
            text: 'Jos painiketta ei näy, tekoälytoiminnot eivät ole käytössä tässä demossa.',
          },
        ],
      },
      status: {
        title: 'Tehtävän seuraaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Valitse tehtävän otsikko, niin tehtävä avautuu. Tehtävän sivun painikkeet riippuvat tehtävän tilanteesta:',
          },
          {
            type: 'list',
            items: [
              '**Aloita työ** siirtää avoimen tehtävän tilanteeseen **Työn alla**.',
              '**Merkitse valmiiksi** merkitsee tehtävän valmiiksi ja tallentaa valmistumisajan.',
              '**Avaa uudelleen** palauttaa valmiin tehtävän tilanteeseen **Avoin**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Jos haluat muuttaa muita tietoja, valitse **Muokkaa**.',
          },
        ],
      },
      delete: {
        title: 'Tehtävän poistaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Avaa tehtävä, valitse **Poista** ja vahvista valitsemalla **Poista tehtävä**. Poistoa ei voi perua. Jos haluat, että tehty työ jää näkyviin, merkitse tehtävä mieluummin valmiiksi.',
          },
        ],
      },
    },
  },

  applications: {
    title: 'Hakemukset',
    summary: 'Käsittele vuokrahakemukset ja tee hyväksytyistä hakijoista vuokralaisia.',
    sections: {
      list: {
        title: 'Hakemusluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Hakemukset**-sivulla ovat vuokrahakemukset uusimmasta alkaen. Sivupalkissa kohdan **Hakemukset** vieressä oleva luku kertoo, montako hakemusta on uusia.',
          },
          {
            type: 'list',
            items: [
              'Voit rajata hakemuksia käsittelyn tilan mukaan **Tila**-suodattimella. **Avoimet (lähetetyt ja käsittelyssä)** näyttää hakemukset, jotka odottavat vielä päätöstä.',
              'Voit rajata hakemuksia myös **Kiinteistö**-suodattimella tai hakea nimellä, yhteyshenkilöllä tai sähköpostilla.',
            ],
          },
          { type: 'link', to: '/applications', label: 'Siirry hakemuksiin' },
        ],
      },
      review: {
        title: 'Hakemuksen käsitteleminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Jokaisella hakemuksella on käsittelyn tila:',
          },
          {
            type: 'list',
            items: [
              '**Lähetetty**: uusi hakemus, jota kukaan ei ole vielä käsitellyt.',
              '**Käsittelyssä**: käsittelet hakemusta.',
              '**Hyväksytty**: hakijasta tuli vuokralainen.',
              '**Hylätty**: hylkäsit hakemuksen.',
              '**Peruttu**: hakija perui hakemuksensa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Valitse hakijan nimi, niin hakemus avautuu. Näet hakijan yhteystiedot, haetun tilan ja hakijan viestin. Valitse sitten, mitä teet:',
          },
          {
            type: 'list',
            items: [
              '**Aloita käsittely** merkitsee uuden hakemuksen käsittelyssä olevaksi.',
              '**Hyväksy** hyväksyy hakijan. Katso [Hyväksyminen ja vuokrasopimuksen luominen](/help/applications#approve).',
              '**Hylkää** hylkää hakemuksen.',
              '**Merkitse perutuksi** kirjaa, että hakija on perunut hakemuksensa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Ennen hylkäämistä ja perutuksi merkitsemistä sinua pyydetään vahvistamaan valinta, eikä niitä voi perua. Jos tila ei ole enää vapaana, hakemuksessa kerrotaan siitä.',
          },
        ],
      },
      approve: {
        title: 'Hyväksyminen ja vuokrasopimuksen luominen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Hyväksy**. JalaSpace kertoo, luodaanko hakijasta uusi vuokralainen vai liitetäänkö hakemus vuokralaiseen, jolla on sama sähköposti.',
              'Vahvista valitsemalla **Hyväksy**. Vuokrasopimuksen lomake avautuu, ja vuokralainen, tila ja alkamispäivä on täytetty valmiiksi.',
              'Lisää tarvittaessa päättymispäivä ja kuukausivuokra ja valitse **Tallenna sopimus**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Sopimus syntyy vasta, kun tallennat sen. Jos poistut lomakkeelta, voit luoda sopimuksen myöhemmin hakemuksen **Luo vuokrasopimus** -painikkeella.',
          },
          {
            type: 'paragraph',
            text: 'Kun olet hyväksynyt hakemuksen, näet kohdassa **Muut hakemukset tähän tilaan** saman tilan muut avoimet hakemukset. **Hylkää kaikki** hylkää ne kerralla, kun olet vahvistanut valinnan.',
          },
        ],
      },
      'public-form': {
        title: 'Julkinen hakulomake',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tilaa etsivät hakevat tilaa kirjautumatta. He valitsevat kirjautumissivulla **Katso vapaat tilat ja hae**, valitsevat tilan ja täyttävät sen hakulomakkeen.',
          },
          {
            type: 'paragraph',
            text: 'Voit avata lomakkeen myös itse: valitse **Hakemukset**-sivulla tai vapaan tilan kohdalla **Hakulomake**. Lomake avautuu uuteen välilehteen.',
          },
          {
            type: 'paragraph',
            text: 'Lähetetty hakemus näkyy **Hakemukset**-sivulla, ja sen käsittelyn tila on **Lähetetty**.',
          },
          {
            type: 'note',
            text: 'Lomake on osa demoa: älä kirjoita siihen oikeita henkilötietoja.',
          },
        ],
      },
    },
  },

  tenants: {
    title: 'Vuokralaiset',
    summary: 'Yritykset ja henkilöt, jotka vuokraavat tilojasi.',
    sections: {
      list: {
        title: 'Vuokralaisluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Vuokralaiset**-sivulla ovat yritykset ja henkilöt, jotka vuokraavat sinulta tiloja. Luettelosta näet heidän yhteystietonsa ja nykyiset tilansa. Voit hakea nimellä, yhteyshenkilöllä tai sähköpostilla ja rajata luetteloa **Tyyppi**-suodattimella.',
          },
          {
            type: 'paragraph',
            text: 'Valitse vuokralaisen nimi, niin vuokralaisen sivu avautuu. Sivulla ovat vuokralaisen tiedot, nykyiset ja tulevat tilat, päättyneet vuokrasopimukset ja hyväksytyt hakemukset.',
          },
          { type: 'link', to: '/tenants', label: 'Siirry vuokralaisiin' },
        ],
      },
      add: {
        title: 'Vuokralaisen lisääminen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Vuokralaiset**-sivulla **Lisää vuokralainen**.',
              'Valitse **Vuokralaisen tyyppi**: yritys tai henkilö.',
              'Täytä nimi ja sähköposti. Yritykselle voit lisätä myös yhteyshenkilön **Yhteyshenkilö**-kenttään.',
              'Voit myös lisätä puhelinnumeron **Puhelin**-kenttään ja muistiinpanoja **Muistiinpanot**-kenttään. Valitse **Tallenna vuokralainen**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Jokaisella vuokralaisella on oltava eri sähköpostiosoite. Vuokralainen syntyy myös, kun hyväksyt hakemuksen.',
          },
        ],
      },
      spaces: {
        title: 'Sisään- ja poismuutto',
        blocks: [
          {
            type: 'list',
            items: [
              'Vuokralaisen sivun **Liitä tilaan** avaa uuden vuokrasopimuksen, jossa vuokralainen on valmiiksi valittuna. Katso [Vuokrasopimuksen luominen](/help/leases#create).',
              '**Poista tilasta** muuttaa vuokralaisen pois tänään: sopimus päättyy ja tila vapautuu. Jos sopimus ei ole vielä alkanut, se perutaan.',
              'Jos vuokralainen muuttaa pois myöhemmin, valitse **Muokkaa sopimusta** ja aseta päättymispäivä.',
            ],
          },
        ],
      },
      delete: {
        title: 'Vuokralaisen poistaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Avaa vuokralainen, valitse **Poista** ja vahvista valitsemalla **Poista vuokralainen**.',
          },
          {
            type: 'paragraph',
            text: 'Vuokralaista ei voi poistaa, jos hänellä on vuokrasopimuksia, myös päättyneitä, tai hyväksyttyjä hakemuksia. Näin historia säilyy.',
          },
        ],
      },
    },
  },

  leases: {
    title: 'Vuokrasopimukset',
    summary: 'Liitä vuokralaiset tiloihin sopimuskaudeksi.',
    sections: {
      list: {
        title: 'Sopimusluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Vuokrasopimukset**-sivulla ovat kaikki vuokrasopimukset. Luettelosta näet kunkin sopimuksen vuokralaisen, tilan, sopimuskauden, vuokran ja tilanteen. Voit rajata luetteloa suodattimilla **Tilanne** ja **Kiinteistö** tai hakea vuokralaisella tai tilalla.',
          },
          { type: 'link', to: '/leases', label: 'Siirry vuokrasopimuksiin' },
        ],
      },
      create: {
        title: 'Vuokrasopimuksen luominen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Vuokrasopimukset**-sivulla **Uusi vuokrasopimus** tai vuokralaisen sivulla **Liitä tilaan**.',
              'Valitse **Vuokralainen**, **Kiinteistö** ja **Tila**.',
              'Anna alkamispäivä **Alkamispäivä**-kenttään. Jos sopimus on toistaiseksi voimassa, jätä **Päättymispäivä** tyhjäksi.',
              'Voit myös antaa vuokran **Kuukausivuokra (€)** -kenttään. Valitse **Tallenna sopimus**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Ennen tallentamista lomake kertoo, onko sopimus voimassa jo tänään vai alkaako se myöhemmin.',
          },
          {
            type: 'list',
            items: [
              'Saman tilan kaksi sopimusta eivät voi olla voimassa yhtä aikaa.',
              'Huollossa olevalle tilalle ei voi tehdä sopimusta, joka on voimassa jo tänään.',
            ],
          },
        ],
      },
      status: {
        title: 'Sopimuksen tilanne',
        blocks: [
          {
            type: 'paragraph',
            text: 'Sopimuksen tilanne määräytyy päivämääristä. Sopimus on voimassa myös ensimmäisenä ja viimeisenä päivänään.',
          },
          {
            type: 'list',
            items: [
              '**Tuleva**: sopimus alkaa myöhemmin. Siihen asti tilan käyttötilanne ei muutu, ja yleiskatsaus näyttää tilan varattuna.',
              '**Voimassa**: sopimus on voimassa tänään, ja tila on vuokrattu.',
              '**Päättynyt**: päättymispäivä on mennyt, eikä sopimus enää varaa tilaa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'JalaSpace päivittää tilat, kun sopimukset alkavat ja päättyvät, joten yleiskatsauksen käyttöaste on aina ajan tasalla.',
          },
        ],
      },
      edit: {
        title: 'Sopimuksen muokkaaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Valitse sopimuksen kohdalla **Muokkaa**, jos haluat muuttaa päivämääriä tai vuokraa. Kun asetat päättymispäiväksi tulevan päivän, poismuutto ajoittuu sille päivälle.',
          },
          {
            type: 'paragraph',
            text: 'Sopimuksen vuokralaista ja tilaa ei voi vaihtaa. Jos vuokralainen muuttaa toiseen tilaan, päätä nykyinen sopimus ja luo uusi.',
          },
        ],
      },
    },
  },

  settings: {
    title: 'Asetukset',
    summary: 'Profiilisi, kieli ja demotietojen palauttaminen.',
    sections: {
      profile: {
        title: 'Profiili',
        blocks: [
          {
            type: 'paragraph',
            text: 'Avaa **Asetukset** sivupalkista tai valitse nimesi yläpalkista.',
          },
          {
            type: 'steps',
            items: [
              'Muuta kohdassa **Profiili** kenttiä **Etunimi**, **Sukunimi** tai **Syntymäaika**.',
              'Valitse **Tallenna profiili**. Yläpalkissa näkyy heti uusi nimi.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Syntymäaika on vapaaehtoinen: valitse päivä, kuukausi ja vuosi tai jätä kaikki kolme tyhjiksi. Kirjaudut sisään sähköpostillasi, joten sitä ei voi muuttaa.',
          },
          { type: 'link', to: '/settings', label: 'Siirry asetuksiin' },
        ],
      },
      language: {
        title: 'Kieli',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kohdassa **Kieli** on sama valinta kuin yläpalkin valikossa. Kieli vaihtuu heti.',
          },
        ],
      },
      reset: {
        title: 'Demotietojen palauttaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kohdan **Demotiedot** painike **Palauta demotiedot** tuo takaisin alkuperäiset kiinteistöt, tilat, vuokralaiset, vuokrasopimukset, hakemukset, huoltotehtävät ja profiilin. Pysyt kirjautuneena, eikä kieli muutu.',
          },
          {
            type: 'steps',
            items: ['Valitse **Palauta demotiedot**.', 'Lue viesti ja valitse uudelleen **Palauta demotiedot**.'],
          },
          {
            type: 'note',
            text: 'Kaikki tekemäsi muutokset menetetään. Jos kaikki demon käyttäjät näkevät samat tiedot, palautus koskee kaikkia.',
          },
        ],
      },
    },
  },

  walkthroughs: {
    title: 'Esimerkkejä',
    summary: 'Tavallisia tehtäviä alusta loppuun usean sivun läpi.',
    sections: {
      'application-to-lease': {
        title: 'Hakemuksesta vuokrasopimukseen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Joku on hakenut vapaata tilaa, ja haluat vuokrata tilan hänelle.',
          },
          {
            type: 'steps',
            items: [
              'Avaa **Hakemukset**. Uusien hakemusten käsittelyn tila on **Lähetetty**.',
              'Valitse hakijan nimi, lue hakemus ja valitse **Aloita käsittely**.',
              'Kun olet tehnyt päätöksen, valitse **Hyväksy** ja vahvista. Hakijasta tulee vuokralainen.',
              'Tarkista avautuvalla sopimuslomakkeella alkamispäivä, lisää kuukausivuokra ja valitse **Tallenna sopimus**.',
              'Palaa hakemukseen. Jos haluat, hylkää saman tilan muut avoimet hakemukset valitsemalla **Hylkää kaikki**.',
              'Alkamispäivänä tila muuttuu vuokratuksi, ja se näkyy yleiskatsauksen käyttöasteessa.',
            ],
          },
        ],
      },
      'maintenance-task': {
        title: 'Huoltotehtävän kirjaaminen ja kuittaaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Vuokralainen ilmoittaa vuotavasta altaasta, ja haluat seurata korjausta, kunnes se on tehty.',
          },
          {
            type: 'steps',
            items: [
              'Avaa **Huolto** ja valitse **Lisää tehtävä**.',
              'Valitse kiinteistö ja tila ja kirjoita otsikoksi esimerkiksi ”keittiön allas vuotaa”.',
              'Voit valita **Ehdota tekoälyllä**, tarkistaa ehdotuksen ja valita **Käytä ehdotusta**. Katso [Ehdota tekoälyllä](/help/maintenance#ai).',
              'Tarkista kiireellisyys, aseta määräpäivä ja valitse **Tallenna tehtävä**.',
              'Kun työ alkaa, avaa tehtävä ja valitse **Aloita työ**.',
              'Kun korjaus on tehty, valitse **Merkitse valmiiksi**. Tehtävää ei enää lasketa avoimiin huoltoihin, ja se näkyy yleiskatsauksen kohdassa **Viimeaikaiset tapahtumat**.',
            ],
          },
        ],
      },
      'new-property': {
        title: 'Kiinteistön ja sen tilojen lisääminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Olet ostanut uuden rakennuksen ja haluat alkaa vuokrata sen tiloja.',
          },
          {
            type: 'steps',
            items: [
              'Avaa **Kiinteistöt**, valitse **Lisää kiinteistö** ja täytä nimi ja osoite.',
              'Hae osoite kohdassa **Sijainti** ja valitse osuma. Valitse **Tallenna kiinteistö**.',
              'Avaa uusi kiinteistö ja valitse **Lisää tila** jokaiselle asunnolle tai tilalle.',
              'Uusien tilojen käyttötilanne on **Vapaa**. Ne näkyvät julkisella hakulomakkeella, joten niitä voi hakea.',
              'Kun löydät vuokralaisen, luo sopimus: hyväksy hänen hakemuksensa tai valitse **Vuokrasopimukset**-sivulla **Uusi vuokrasopimus**.',
            ],
          },
        ],
      },
    },
  },
}
