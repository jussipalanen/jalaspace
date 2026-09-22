import type { Messages } from './en'

/** Finnish messages. Typed against the English dictionary, so every key is required. */
export const fi: Messages = {
  app: {
    name: 'JalaSpace',
    documentTitle: '{page} · JalaSpace',
    demoBadge: 'Demo',
    skipToContent: 'Siirry sisältöön',
  },
  language: {
    label: 'Kieli',
  },
  nav: {
    sidebar: 'Sivupalkki',
    main: 'Päävalikko',
    open: 'Avaa valikko',
    close: 'Sulje valikko',
    demoNote: 'Demoympäristö. Tiedot tallennetaan vain tähän selaimeen.',
    sections: {
      overview: 'Yleistä',
      portfolio: 'Kiinteistösalkku',
      operations: 'Ylläpito',
      leasing: 'Vuokraus',
    },
    items: {
      dashboard: 'Yleiskatsaus',
      properties: 'Kiinteistöt',
      spaces: 'Tilat',
      maintenance: 'Huolto',
      tenants: 'Vuokralaiset',
      leases: 'Vuokrasopimukset',
      settings: 'Asetukset',
    },
  },
  header: {
    signOut: 'Kirjaudu ulos',
  },
  pages: {
    dashboard: {
      title: 'Yleiskatsaus',
      description: 'Kiinteistösalkkusi tilanne yhdellä silmäyksellä.',
    },
    properties: {
      title: 'Kiinteistöt',
      description: 'Salkkusi rakennukset ja kohteet.',
      comingSoonTitle: 'Kiinteistöjen hallinta on tulossa pian',
      comingSoonDescription: 'Voit pian lisätä, hakea ja hallita kiinteistöjä täällä.',
    },
    spaces: {
      title: 'Tilat',
      description: 'Kaikkien kiinteistöjen huoneistot ja vuokrattavat tilat.',
      comingSoonTitle: 'Tilojen hallinta on tulossa pian',
      comingSoonDescription:
        'Voit pian suodattaa tiloja kiinteistön ja käyttötilanteen mukaan sekä seurata vapaita tiloja täällä.',
    },
    maintenance: {
      title: 'Huolto',
      description: 'Seuraa ja hoida kiinteistöjesi huoltotehtäviä.',
      comingSoonTitle: 'Huoltotehtävät ovat tulossa pian',
      comingSoonDescription:
        'Voit pian luoda, priorisoida ja kuitata huoltotehtäviä valmiiksi täällä.',
    },
    tenants: {
      title: 'Vuokralaiset',
      description: 'Tilojasi vuokraavat yritykset ja henkilöt.',
      comingSoonTitle: 'Vuokralaisten hallinta on tulossa pian',
      comingSoonDescription: 'Voit pian hallita vuokralaisia ja liittää heitä tiloihin täällä.',
    },
    leases: {
      title: 'Vuokrasopimukset',
      description: 'Vuokralaisten ja tilojen väliset vuokrasopimukset.',
      comingSoonTitle: 'Vuokrasopimusten hallinta on tulossa pian',
      comingSoonDescription: 'Voit pian hallita sopimuskausia, vuokria ja sopimusten tiloja täällä.',
    },
    settings: {
      title: 'Asetukset',
      description: 'Sovelluksen ja demoympäristön asetukset.',
      comingSoonTitle: 'Asetukset ovat tulossa pian',
      comingSoonDescription: 'Demotietojen palautus ja muut asetukset tulevat tänne.',
    },
    propertyDetails: {
      title: 'Kiinteistön tiedot',
      comingSoonTitle: 'Kiinteistön tiedot ovat tulossa pian',
      back: 'Takaisin kiinteistöihin',
    },
    maintenanceDetails: {
      title: 'Huoltotehtävän tiedot',
      comingSoonTitle: 'Huoltotehtävän tiedot ovat tulossa pian',
      back: 'Takaisin huoltoon',
    },
    tenantDetails: {
      title: 'Vuokralaisen tiedot',
      comingSoonTitle: 'Vuokralaisen tiedot ovat tulossa pian',
      back: 'Takaisin vuokralaisiin',
    },
    details: {
      reference: 'Tunniste: {id}',
      comingSoonDescription: 'Tarkemmat tiedot näytetään täällä, kun tietolähde on yhdistetty.',
    },
    notFound: {
      title: 'Sivua ei löytynyt',
      description: 'Etsimääsi sivua ei ole olemassa, tai se on siirretty.',
      action: 'Siirry yleiskatsaukseen',
    },
    error: {
      title: 'Jokin meni vikaan',
      description: 'Sivua ei voitu näyttää. Yritä uudelleen.',
      action: 'Lataa sivu uudelleen',
    },
  },
  auth: {
    signIn: 'Kirjaudu sisään',
    subtitle: 'Kiinteistöjen ja tilojen hallinnan demo',
    email: 'Sähköposti',
    password: 'Salasana',
    submitting: 'Kirjaudutaan…',
    demoAccount: 'Demotili',
    fillDemo: 'Täytä demotunnukset',
    notice:
      'Tämä on demo. Kirjautuminen tapahtuu vain selaimessasi, eikä se ole turvallinen. Tiedot tallennetaan vain tähän selaimeen.',
    invalidCredentials: 'Virheellinen sähköposti tai salasana.',
    unavailable: 'Kirjautuminen ei onnistunut. Yritä uudelleen.',
    validation: {
      email: {
        required: 'Sähköposti on pakollinen.',
        invalid: 'Anna kelvollinen sähköpostiosoite.',
      },
      password: {
        required: 'Salasana on pakollinen.',
      },
    },
  },
  states: {
    loading: 'Ladataan…',
    retryHint: 'Yritä hetken kuluttua uudelleen.',
    retry: 'Yritä uudelleen',
  },
  dashboard: {
    loading: 'Ladataan yleiskatsausta…',
    loadError: 'Yleiskatsauksen lataaminen epäonnistui.',
    keyFigures: 'Tunnusluvut',
    stats: {
      properties: 'Kiinteistöt',
      inCities: { one: '{count} paikkakunnalla', other: '{count} paikkakunnalla' },
      spaces: 'Tilat',
      available: '{count} vapaana',
      occupancy: 'Käyttöaste',
      spacesOccupied: {
        one: '{occupied} / {count} tilasta vuokrattu',
        other: '{occupied} / {count} tilasta vuokrattu',
      },
      openMaintenance: 'Avoimet huollot',
      highPriority: { one: '{count} kiireellinen', other: '{count} kiireellistä' },
    },
    recentMaintenance: {
      title: 'Viimeisimmät huoltotehtävät',
      empty: 'Ei vielä huoltotehtäviä.',
      due: 'Määräpäivä {date}',
    },
    availableSpaces: {
      title: 'Vapaat tilat',
      empty: 'Kaikki tilat ovat vuokrattuina tai huollossa.',
      reservedFrom: 'Varattu {date} alkaen',
      floor: '{floor}. krs',
    },
    activity: {
      title: 'Viimeaikaiset tapahtumat',
      empty: 'Ei vielä tapahtumia.',
      types: {
        maintenance_completed: 'Huoltotehtävä valmistui',
        lease_started: 'Vuokrasopimus alkoi',
        lease_ended: 'Vuokrasopimus päättyi',
      },
    },
    viewAll: 'Näytä kaikki',
    viewAllCount: 'Näytä kaikki {count}',
  },
  maintenance: {
    status: {
      open: 'Avoin',
      in_progress: 'Työn alla',
      completed: 'Valmis',
    },
    priority: {
      low: 'Matala',
      medium: 'Keskitaso',
      high: 'Korkea',
    },
    priorityAccessible: 'Kiireellisyys: {priority}',
  },
  space: {
    status: {
      available: 'Vapaa',
      occupied: 'Vuokrattu',
      maintenance: 'Huollossa',
    },
    type: {
      office: 'Toimisto',
      retail: 'Liiketila',
      industrial: 'Teollisuustila',
      storage: 'Varasto',
      apartment: 'Asunto',
    },
  },
}
