import type { Handbook } from '../types'

/**
 * Käyttöopas suomeksi. Painikkeiden, kenttien ja sivujen nimet on kirjoitettu
 * **lihavoituina** täsmälleen niin kuin suomenkielinen käyttöliittymä ne näyttää.
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
            text: 'JalaSpace on demo kiinteistöjen, vuokrattavien tilojen, vuokralaisten, vuokrasopimusten, vuokrahakemusten ja huoltojen hallintaan. Kirjaudu sisään kirjautumissivulla näkyvällä demotilillä.',
          },
          {
            type: 'steps',
            items: [
              'Valitse **Täytä demotunnukset** tai kirjoita **Demotili**-kohdassa näkyvät sähköposti ja salasana.',
              'Valitse **Kirjaudu sisään**. **Yleiskatsaus** avautuu, tai sivu, jolle olit menossa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Kirjaudu ulos yläpalkin oikeassa reunassa olevalla uloskirjautumispainikkeella.',
          },
          {
            type: 'note',
            text: 'Tämä on demo, jonka tiedot ovat keksittyjä ja kirjautuminen vain simuloitu. Älä koskaan kirjoita oikeita henkilötietoja.',
          },
        ],
      },
      navigation: {
        title: 'Liikkuminen sovelluksessa',
        blocks: [
          {
            type: 'paragraph',
            text: 'Vasemman reunan sivupalkissa ovat sovelluksen kaikki osat aiheittain ryhmiteltyinä: **Yleistä**, **Kiinteistösalkku**, **Ylläpito** ja **Vuokraus**. **Asetukset** ja tämä **Käyttöopas** ovat alimpana.',
          },
          {
            type: 'list',
            items: [
              'Puhelimessa tai kapeassa ikkunassa sivupalkki on piilossa. Avaa se yläpalkin vasemman reunan valikkopainikkeella ja sulje sulkemispainikkeella tai Esc-näppäimellä.',
              '**Hakemukset**-kohdan vieressä oleva luku kertoo, montako uutta hakemusta odottaa.',
              'Yläpalkin **?**-painike avaa käyttöoppaan luvun, joka kertoo avoinna olevasta sivusta.',
              'Yläpalkissa näkyvä nimesi avaa profiilisi **Asetuksissa**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Luetteloiden yläpuolella on hakukenttä ja suodattimia. Suodattimet tallentuvat sivun osoitteeseen, joten voit ladata sivun uudelleen, lisätä sen kirjanmerkkeihin tai jakaa linkin ja nähdä samat tulokset.',
          },
        ],
      },
      language: {
        title: 'Kieli',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpacea voi käyttää suomeksi ja englanniksi. Valitse kieli yläpalkin, kirjautumissivun tai **Asetusten** **Kieli**-valinnasta. Sivu vaihtuu heti ja pysyy samana.',
          },
          {
            type: 'paragraph',
            text: 'Valintasi muistetaan tässä selaimessa. Käyttäjien kirjoittamat nimet, osoitteet ja muut tekstit näytetään sellaisinaan, joten demotiedot ovat englanniksi.',
          },
        ],
      },
      'demo-data': {
        title: 'Demotiedot',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpacessa on valmiina keksitty kiinteistösalkku: kiinteistöjä useilla suomalaisilla paikkakunnilla tiloineen, vuokralaisineen, vuokrasopimuksineen, hakemuksineen ja huoltotehtävineen. Voit muuttaa mitä tahansa, lisätä omia tietoja ja poistaa niitä.',
          },
          {
            type: 'paragraph',
            text: 'Sivupalkin alareunan huomautus kertoo, minne muutoksesi tallentuvat: vain tähän selaimeen vai palvelimelle, jolla tiedot ovat yhteisiä kaikille demon käyttäjille.',
          },
          {
            type: 'paragraph',
            text: 'Aloita alusta palauttamalla demotiedot **Asetuksissa**. Katso luku Asetukset.',
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
            text: '**Yleiskatsaus** avautuu sisäänkirjautumisen jälkeen. Ylimpänä olevat tunnusluvut lasketaan tiedoistasi:',
          },
          {
            type: 'list',
            items: [
              '**Kiinteistöt**: kiinteistöjesi määrä ja se, monellako paikkakunnalla ne ovat.',
              '**Tilat**: kaikki tilat jaoteltuina vuokrattuihin, vapaisiin, varattuihin (tuleva vuokrasopimus on tehty) ja huollossa oleviin.',
              '**Käyttöaste**: vuokrattujen tilojen osuus kaikista tiloista.',
              '**Avoimet huollot**: keskeneräiset huoltotehtävät kiireellisyyden mukaan.',
              '**Avoimet hakemukset**: uudet ja käsittelyssä olevat hakemukset.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Valitse tunnusluku, niin vastaava luettelo avautuu.',
          },
        ],
      },
      lists: {
        title: 'Mikä vaatii huomiota',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tunnuslukujen alla on lyhyitä luetteloita. Jokainen rivi vie omalle sivulleen, ja **Näytä kaikki** avaa koko luettelon.',
          },
          {
            type: 'list',
            items: [
              '**Viimeisimmät huoltotehtävät**: uusimmat tehtävät kiireellisyyksineen ja määräpäivineen.',
              '**Vapaat tilat**: heti vuokrattavissa olevat tilat ja kunkin tilan hakemusten määrä. Tila, jolla on tuleva vuokrasopimus, on merkitty varatuksi.',
              '**Uusimmat hakemukset**: viisi uusinta hakemusta ja niiden tila.',
              '**Viimeaikaiset tapahtumat**: valmistuneet huollot, alkaneet ja päättyneet vuokrasopimukset sekä vastaanotetut ja hyväksytyt hakemukset.',
            ],
          },
        ],
      },
      ask: {
        title: 'Kysy JalaSpacelta',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kun tekoälytoiminnot ovat käytössä, yleiskatsauksessa on **Kysy JalaSpacelta** -kortti. Kysy suomeksi tai englanniksi, niin se näyttää, minne sovelluksessa kannattaa mennä tai mitkä tiedot vastaavat kysymystä.',
          },
          {
            type: 'list',
            items: [
              '”Missä vaihdan kielen?” vie oikealle sivulle.',
              '”Vapaa kolmio, jossa on sauna” näyttää sopivat tilat.',
              '”Myöhässä olevat korkean prioriteetin huoltotehtävät” näyttää sopivat tehtävät.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Ennen ensimmäistä kysymystä kortti tarjoaa muutaman esimerkin kohdassa **Kokeile esimerkiksi**; valitse esimerkki, niin se kysytään. Vastaus näyttää kohdassa **Tulkittu näin**, miten kysymys ymmärrettiin, ehtoina. Poista ehto laajentaaksesi hakua, ja valitse **Avaa sivulla**, niin näet tulokset omalla luettelosivullaan.',
          },
          {
            type: 'note',
            text: 'Kysymyksesi lähetetään Google Geminille, joten älä kirjoita siihen henkilötietoja. Tekoäly vain tulkitsee kysymyksen: tulokset haetaan JalaSpacen omista tiedoista.',
          },
        ],
      },
    },
  },

  properties: {
    title: 'Kiinteistöt',
    summary: 'Rakennukset ja kohteet tiloineen, huoltoineen ja sijainteineen.',
    sections: {
      list: {
        title: 'Kiinteistöluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Kiinteistöt**-sivulla ovat rakennuksesi ja kohteesi osoitteineen, tyyppeineen, tilamäärineen, käyttöasteineen ja avoimine huoltotehtävineen.',
          },
          {
            type: 'paragraph',
            text: '**Hae kiinteistöjä** -kentällä löydät kiinteistön nimen, osoitteen, postinumeron tai paikkakunnan perusteella. Valitse kiinteistön nimi, niin sen tiedot avautuvat.',
          },
          { type: 'link', to: '/properties', label: 'Siirry kiinteistöihin' },
        ],
      },
      details: {
        title: 'Kiinteistön tiedot',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kiinteistön sivulle on koottu kaikki siitä:',
          },
          {
            type: 'list',
            items: [
              '**Tunnusluvut**: tilat, käyttöaste ja avoimet huollot.',
              '**Tilat**: jokainen tila tyyppeineen, kerroksineen, pinta-aloineen, huoneineen, käyttötilanteineen ja nykyisine vuokralaisineen. **Lisää tila** luo tähän kiinteistöön uuden tilan.',
              '**Avoimet huollot**: keskeneräiset tehtävät. **Lisää tehtävä** luo tehtävän tälle kiinteistölle.',
              '**Sijainti**: kiinteistö kartalla, jos sijainti on asetettu.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Vapaan tilan kohdalla, jota voi hakea, on **Hakulomake**-linkki. Se avaa tilan julkisen hakulomakkeen uuteen välilehteen.',
          },
        ],
      },
      'add-edit': {
        title: 'Kiinteistön lisääminen ja muokkaaminen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Kiinteistöt**-sivulla **Lisää kiinteistö**. Muuttaaksesi olemassa olevaa kiinteistöä avaa se ja valitse **Muokkaa**.',
              'Täytä **Nimi**, **Tyyppi**, **Katuosoite**, **Postinumero** ja **Postitoimipaikka**. Tähdellä * merkityt kentät ovat pakollisia.',
              'Lisää halutessasi **Kuvaus** ja aseta **Sijainti**.',
              'Valitse **Tallenna kiinteistö**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Postinumerossa on viisi numeroa, esimerkiksi 80100. Jos jotain puuttuu tai on virheellistä, lomake näyttää korjattavat kentät.',
          },
        ],
      },
      location: {
        title: 'Sijainnin asettaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Sijainti on vapaaehtoinen. Se asetetaan kiinteistön lomakkeella, ja tietosivu näyttää sen kartalla.',
          },
          {
            type: 'steps',
            items: [
              'Tarkista osoite **Hae osoitteella** -kentässä. Se täytetään osoitekentistä.',
              'Valitse **Hae** tai paina Enter ja valitse oikea paikka kohdasta **Osumat**. Nasta siirtyy siihen.',
              'Tarkenna vetämällä nastaa tai napsauttamalla karttaa. Voit myös kirjoittaa **Leveysasteen** ja **Pituusasteen**.',
              'Lähennä tai loitonna kartta haluamallesi tasolle: taso tallennetaan sijainnin mukana.',
            ],
          },
          {
            type: 'paragraph',
            text: '**Poista sijainti** poistaa sijainnin. Tietosivun **Avaa OpenStreetMapissa** näyttää paikan OpenStreetMapin sivustolla.',
          },
          {
            type: 'note',
            text: 'Osoitehaku kattaa vain Suomen, ja hakemasi osoite lähetetään OpenStreetMapille.',
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
            text: 'Kiinteistöä, jolla on vielä tiloja tai huoltotehtäviä, ei voi poistaa. JalaSpace kertoo, mitä siihen liittyy, jotta voit poistaa tai siirtää ne ensin.',
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
            text: '**Tilat**-sivulla ovat kaikkien kiinteistöjen vuokrattavat tilat kiinteistöineen, tyyppeineen, kerroksineen, pinta-aloineen, huoneineen, käyttötilanteineen ja nykyisine vuokralaisineen.',
          },
          {
            type: 'list',
            items: [
              '**Hae tiloja** löytää tilan sen nimen tai vuokralaisen nimen perusteella.',
              'Suodata **Kiinteistön**, **Käyttötilanteen** ja **Huoneiden** mukaan (1–4 tai vähintään 5).',
              'Valitse **Ominaisuuksista** ne, jotka tilassa on oltava, esimerkiksi sauna ja parveke. Tilassa on oltava kaikki valitut ominaisuudet.',
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
              'Valitse **Lisää tila** **Tilat**-sivulla tai kiinteistön sivulla, jolloin kiinteistö on jo valittuna. Muuttaaksesi tilaa valitse sen nimi luettelosta.',
              'Valitse **Kiinteistö** ja täytä **Nimi**, **Tyyppi**, **Kerros** ja **Pinta-ala (m²)**.',
              'Lisää halutessasi **Huoneet** ja **Ominaisuudet**.',
              'Valitse **Tallenna tila**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Nimen on oltava yksilöllinen kiinteistön sisällä, esimerkiksi A 101.',
              'Kerros on kokonaisluku; kellarikerros on −1.',
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
            text: 'Tila on **Vapaa**, **Vuokrattu** tai **Huollossa**.',
          },
          {
            type: 'list',
            items: [
              'Tila on vuokrattu, kun sillä on voimassa oleva vuokrasopimus. JalaSpace asettaa tämän automaattisesti sopimuksen alkaessa ja päättyessä, eikä käyttötilannetta voi sillä välin muuttaa käsin.',
              'Muulloin valitset vapaan ja huollossa olevan välillä, esimerkiksi remontin ajaksi.',
              'Vuokratun tilan lomakkeella näkyy sen vuokralainen sekä linkit vuokralaiseen ja sopimukseen.',
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
    summary: 'Kirjaa korjaukset ja tarkastukset ja seuraa niitä valmistumiseen asti.',
    sections: {
      list: {
        title: 'Tehtäväluettelo',
        blocks: [
          {
            type: 'paragraph',
            text: '**Huolto**-sivulla ovat kaikki tehtävät uusimmasta alkaen kiinteistöineen, tiloineen, luokkineen, kiireellisyyksineen, tilanteineen ja määräpäivineen. Myöhässä olevat tehtävät on merkitty tekstillä **Myöhässä**.',
          },
          {
            type: 'list',
            items: [
              '**Hae tehtäviä** hakee otsikoista ja kuvauksista.',
              'Suodata **Kiinteistön**, **Tilan**, **Kiireellisyyden** ja **Tilanteen** mukaan.',
              '**Erääntyy viimeistään** näyttää tehtävät, joiden määräpäivä on annettuna päivänä tai sitä ennen, ja **Vain myöhässä olevat** keskeneräiset tehtävät, joiden määräpäivä on mennyt.',
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
              'Valitse **Lisää tehtävä** **Huolto**-sivulla tai kiinteistön sivulla, jolloin kiinteistö on jo valittuna.',
              'Valitse **Kiinteistö**. Valitse myös **Tila** tai jätä valinnaksi **Koko kiinteistö tai yhteiset tilat**.',
              'Kirjoita **Otsikko** ja halutessasi **Kuvaus**.',
              'Valitse **Luokka**, **Kiireellisyys** ja **Tilanne** sekä halutessasi **Määräpäivä**.',
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
            text: 'Kun tekoälytoiminnot ovat käytössä, tehtävälomakkeen kuvauksen alla on **Ehdota tekoälyllä** -painike. Se ehdottaa selkeää otsikkoa, kuvausta tarkistettavine asioineen, luokkaa ja kiireellisyyttä. Lyhyt otsikko, kuten ”keittiön allas vuotaa”, riittää.',
          },
          {
            type: 'steps',
            items: [
              'Kirjoita omin sanoin otsikko, kuvaus tai molemmat.',
              'Valitse **Ehdota tekoälyllä** ja odota **Tekoälyn ehdotusta**.',
              'Lue se. **Käytä ehdotusta** täyttää kentät, ja **Hylkää** säilyttää sen, mitä kirjoitit.',
              'Tarkista ja muokkaa kenttiä ja valitse sitten **Tallenna tehtävä**. Mitään ei tallenneta automaattisesti.',
            ],
          },
          {
            type: 'note',
            text: 'Otsikko ja kuvaus lähetetään Google Geminille, joten älä kirjoita niihin henkilötietoja. Ensimmäinen ehdotus voi kestää minuutin, kun palvelin käynnistyy.',
          },
        ],
      },
      status: {
        title: 'Tehtävän seuraaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Valitse tehtävän otsikko, niin tehtävä avautuu. Sen sivulla ovat tiedot ja nykyiseen tilanteeseen sopivat toiminnot:',
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
            text: 'Muuttaaksesi muita tietoja valitse **Muokkaa**.',
          },
        ],
      },
      delete: {
        title: 'Tehtävän poistaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Avaa tehtävä, valitse **Poista** ja vahvista valitsemalla **Poista tehtävä**. Poistoa ei voi perua; jos haluat säilyttää historian, merkitse tehtävä mieluummin valmiiksi.',
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
            text: '**Hakemukset**-sivulla ovat vuokrahakemukset uusimmasta alkaen: hakija, tila, toivottu alkamispäivä, vastaanottopäivä ja käsittelyn tila. Sivupalkin **Hakemukset**-kohdan vieressä oleva luku kertoo, montako hakemusta on uusia.',
          },
          {
            type: 'list',
            items: [
              'Suodata **Tilan** mukaan. **Avoimet (lähetetyt ja käsittelyssä)** näyttää hakemukset, jotka odottavat vielä päätöstä.',
              'Suodata **Kiinteistön** mukaan ja hae nimellä, yhteyshenkilöllä tai sähköpostilla.',
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
            text: 'Valitse hakijan nimi, niin hakemus avautuu: hakijan yhteystiedot, haettu tila ja viesti. Toiminnot riippuvat hakemuksen tilasta:',
          },
          {
            type: 'list',
            items: [
              '**Aloita käsittely** merkitsee uuden hakemuksen tilaan **Käsittelyssä**.',
              '**Hyväksy** hyväksyy hakijan. Katso seuraava kohta.',
              '**Hylkää** hylkää hakemuksen.',
              '**Merkitse perutuksi** kirjaa, että hakija on perunut hakemuksensa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Hylkääminen ja perutuksi merkitseminen pyytävät vahvistuksen, eikä niitä voi perua. Jos tila on sillä välin vuokrattu, varattu tai otettu huoltoon, hakemuksessa kerrotaan siitä.',
          },
        ],
      },
      approve: {
        title: 'Hyväksyminen ja vuokrasopimuksen luominen',
        blocks: [
          {
            type: 'steps',
            items: [
              'Valitse **Hyväksy**. Vahvistus kertoo, luodaanko hakijasta uusi vuokralainen vai liitetäänkö hakemus olemassa olevaan vuokralaiseen, jolla on sama sähköposti.',
              'Vahvista valitsemalla **Hyväksy**. Vuokrasopimuslomake avautuu, ja vuokralainen, tila ja toivottu alkamispäivä ovat valmiina.',
              'Lisää tarvittaessa päättymispäivä ja kuukausivuokra ja valitse **Tallenna sopimus**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Sopimus luodaan vasta, kun tallennat sen. Jos poistut lomakkeelta, voit luoda sopimuksen myöhemmin hyväksytyn hakemuksen **Luo vuokrasopimus** -painikkeella.',
          },
          {
            type: 'paragraph',
            text: 'Hyväksymisen jälkeen hakemuksessa näkyvät kohdassa **Muut hakemukset tähän tilaan** saman tilan avoimet hakemukset. **Hylkää kaikki** hylkää ne kerralla vahvistuksen jälkeen.',
          },
        ],
      },
      'public-form': {
        title: 'Julkinen hakulomake',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tilaa etsivät hakevat kirjautumatta. Kirjautumissivulla on linkki **Katso vapaat tilat ja hae**, joka näyttää haettavissa olevat tilat. Jokaisella tilalla on oma sivunsa, jossa ovat tilan tiedot, kartta ja lomake.',
          },
          {
            type: 'paragraph',
            text: 'Avataksesi lomakkeen itse valitse **Hakulomake** **Hakemukset**-sivulla tai vapaan tilan kohdalla **Tilat**-luettelossa tai kiinteistön sivulla. Lomake avautuu uuteen välilehteen.',
          },
          {
            type: 'paragraph',
            text: 'Lähetetty hakemus näkyy **Hakemukset**-sivulla tilassa **Lähetetty**.',
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
            text: '**Vuokralaiset**-sivulla ovat yritykset ja henkilöt yhteystietoineen ja nykyisine tiloineen. Hae nimellä, yhteyshenkilöllä tai sähköpostilla ja suodata **Tyypin** mukaan.',
          },
          {
            type: 'paragraph',
            text: 'Valitse vuokralaisen nimi, niin hänen sivunsa avautuu: tiedot, nykyiset ja tulevat tilat, päättyneet vuokrasopimukset ja hyväksytyt hakemukset.',
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
              'Täytä nimi ja **Sähköposti**. Yritykselle voi lisätä myös **Yhteyshenkilön**.',
              'Lisää halutessasi **Puhelin** ja **Muistiinpanot** ja valitse **Tallenna vuokralainen**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Jokaisella vuokralaisella on oltava eri sähköpostiosoite. Myös hakemuksen hyväksyminen luo vuokralaisen.',
          },
        ],
      },
      spaces: {
        title: 'Sisään- ja poismuutto',
        blocks: [
          {
            type: 'list',
            items: [
              'Vuokralaisen sivun **Liitä tilaan** avaa uuden vuokrasopimuksen, jossa vuokralainen on jo valittuna. Katso luku Vuokrasopimukset.',
              '**Poista tilasta** muuttaa vuokralaisen pois tänään: sopimus päättyy ja tila vapautuu. Sopimus, joka ei ole vielä alkanut, perutaan.',
              'Ajoittaaksesi poismuuton myöhemmäksi valitse **Muokkaa sopimusta** ja aseta päättymispäivä.',
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
            text: 'Vuokralaista, jolla on vuokrasopimuksia, myös päättyneitä, tai hyväksyttyjä hakemuksia, ei voi poistaa, jotta historia säilyy.',
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
            text: '**Vuokrasopimukset**-sivulla ovat kaikki sopimukset vuokralaisineen, tiloineen, sopimuskausineen, kuukausivuokrineen ja tilanteineen. Suodata **Tilanteen** ja **Kiinteistön** mukaan tai hae vuokralaisella tai tilalla.',
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
              'Valitse **Uusi vuokrasopimus** **Vuokrasopimukset**-sivulla tai **Liitä tilaan** vuokralaisen sivulla.',
              'Valitse **Vuokralainen**, **Kiinteistö** ja **Tila**.',
              'Anna **Alkamispäivä**. Jätä **Päättymispäivä** tyhjäksi, jos sopimus on toistaiseksi voimassa.',
              'Anna halutessasi **Kuukausivuokra (€)** ja valitse **Tallenna sopimus**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Ennen tallentamista lomake kertoo, onko sopimus voimassa jo tänään vai alkaako se myöhemmin. Saman tilan sopimukset eivät voi olla päällekkäin, eikä tänään voimassa oleva sopimus voi alkaa tilassa, joka on huollossa.',
          },
        ],
      },
      status: {
        title: 'Sopimuksen tilanne',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tilanne määräytyy päivämääristä, ja sekä alkamis- että päättymispäivä kuuluvat sopimukseen:',
          },
          {
            type: 'list',
            items: [
              '**Tuleva**: sopimus alkaa myöhemmin. Siihen asti tila säilyttää käyttötilanteensa, ja yleiskatsaus merkitsee vapaan tilan varatuksi.',
              '**Voimassa**: sopimus on voimassa tänään. Tila on vuokrattu.',
              '**Päättynyt**: päättymispäivä on mennyt, eikä sopimus enää varaa tilaa.',
            ],
          },
          {
            type: 'paragraph',
            text: 'JalaSpace päivittää tilat sopimusten alkaessa ja päättyessä, joten yleiskatsauksen käyttöaste pysyy ajan tasalla.',
          },
        ],
      },
      edit: {
        title: 'Sopimuksen muokkaaminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Valitse sopimuksen kohdalla **Muokkaa** muuttaaksesi päivämääriä tai vuokraa. Tuleva päättymispäivä ajoittaa poismuuton.',
          },
          {
            type: 'paragraph',
            text: 'Sopimuksen vuokralaista ja tilaa ei voi vaihtaa. Siirtääksesi vuokralaisen toiseen tilaan päätä nykyinen sopimus ja luo uusi.',
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
            text: 'Avaa **Asetukset** sivupalkista tai valitse nimesi yläpalkista. Muuta **Profiili**-kohdassa **Etunimi**, **Sukunimi** ja **Syntymäaika** ja valitse **Tallenna profiili**. Yläpalkki näyttää uuden nimen heti.',
          },
          {
            type: 'paragraph',
            text: 'Syntymäaika on vapaaehtoinen: valitse päivä, kuukausi ja vuosi tai jätä kaikki kolme tyhjiksi. Sähköpostia käytetään kirjautumiseen, eikä sitä voi muuttaa.',
          },
          { type: 'link', to: '/settings', label: 'Siirry asetuksiin' },
        ],
      },
      language: {
        title: 'Kieli',
        blocks: [
          {
            type: 'paragraph',
            text: '**Kieli**-kohdassa on sama valinta kuin yläpalkissa. Muutos tulee voimaan heti.',
          },
        ],
      },
      reset: {
        title: 'Demotietojen palauttaminen',
        blocks: [
          {
            type: 'paragraph',
            text: '**Demotiedot**-kohdan **Palauta demotiedot** palauttaa alkuperäiset kiinteistöt, tilat, vuokralaiset, vuokrasopimukset, hakemukset, huoltotehtävät ja profiilin. Pysyt kirjautuneena, ja kieli säilyy.',
          },
          {
            type: 'steps',
            items: ['Valitse **Palauta demotiedot**.', 'Lue vahvistus ja valitse uudelleen **Palauta demotiedot**.'],
          },
          {
            type: 'note',
            text: 'Kaikki tekemäsi muutokset menetetään. Kun tiedot ovat yhteisiä kaikille demon käyttäjille, palautus koskee kaikkia.',
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
            text: 'Joku on hakenut vapaata tilaa, ja haluat vuokrata sen hänelle.',
          },
          {
            type: 'steps',
            items: [
              'Avaa **Hakemukset**. Uusien hakemusten tila on **Lähetetty**.',
              'Valitse hakijan nimi, lue hakemus ja valitse **Aloita käsittely**.',
              'Kun olet tehnyt päätöksen, valitse **Hyväksy** ja vahvista. Hakijasta tulee vuokralainen.',
              'Tarkista avautuvalla sopimuslomakkeella alkamispäivä, lisää kuukausivuokra ja valitse **Tallenna sopimus**.',
              'Palaa hakemukseen ja hylkää halutessasi saman tilan muut avoimet hakemukset valitsemalla **Hylkää kaikki**.',
              'Sopimuksen alkamispäivänä tila muuttuu vuokratuksi, ja se näkyy yleiskatsauksen käyttöasteessa.',
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
              'Jos toiminto on käytössä, valitse **Ehdota tekoälyllä**, tarkista ehdotus ja valitse **Käytä ehdotusta**.',
              'Tarkista kiireellisyys, aseta määräpäivä ja valitse **Tallenna tehtävä**.',
              'Kun työ alkaa, avaa tehtävä ja valitse **Aloita työ**.',
              'Kun korjaus on tehty, valitse **Merkitse valmiiksi**. Tehtävä poistuu avoimista huolloista ja näkyy yleiskatsauksen **Viimeaikaisissa tapahtumissa**.',
            ],
          },
        ],
      },
      'new-property': {
        title: 'Kiinteistön ja sen tilojen lisääminen',
        blocks: [
          {
            type: 'paragraph',
            text: 'Olet hankkinut uuden rakennuksen ja haluat alkaa vuokrata sen tiloja.',
          },
          {
            type: 'steps',
            items: [
              'Avaa **Kiinteistöt**, valitse **Lisää kiinteistö** ja täytä nimi ja osoite.',
              'Hae osoite **Sijainti**-kohdassa ja valitse osuma. Valitse sitten **Tallenna kiinteistö**.',
              'Avaa uusi kiinteistö ja valitse **Lisää tila** jokaiselle asunnolle tai tilalle.',
              'Uusien tilojen käyttötilanne on **Vapaa**. Ne näkyvät julkisella hakulomakkeella, ja niitä voi hakea.',
              'Kun vuokralainen löytyy, luo sopimus: hyväksy hänen hakemuksensa tai valitse **Vuokrasopimukset**-sivulla **Uusi vuokrasopimus**.',
            ],
          },
        ],
      },
    },
  },
}
