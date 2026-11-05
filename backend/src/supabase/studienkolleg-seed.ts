import { UpsertStudienkollegPayload } from '../studienkolleg/studienkolleg.interfaces.js';

/**
 * Danh sách 21 trường Studienkolleg tại 12 bang của Đức
 * Được tổng hợp từ file backend/src/supabase/studienkollege_links.txt
 */
export const STUDIENKOLLEG_SEED_DATA: UpsertStudienkollegPayload[] = [
    // 1. Baden-Württemberg
    {
        slug: 'stk-heidelberg',
        name: 'Studienkolleg an der Universität Heidelberg',
        city: 'Heidelberg',
        state: 'Baden-Württemberg',
        type: 'UNIVERSITAET',
        website_url: 'https://www.isz.uni-heidelberg.de/de/studienkolleg',
        crawler_url: 'https://www.isz.uni-heidelberg.de/de/aufnahme-stk-ksk',
    },
    {
        slug: 'stk-karlsruhe',
        name: 'Studienkolleg des KIT (Karlsruhe)',
        city: 'Karlsruhe',
        state: 'Baden-Württemberg',
        type: 'UNIVERSITAET',
        website_url: 'https://www.stk.kit.edu/',
        crawler_url: 'https://www.stk.kit.edu/studieren.php',
    },
    {
        slug: 'stk-konstanz',
        name: 'Studienkolleg HTWG Konstanz',
        city: 'Konstanz',
        state: 'Baden-Württemberg',
        type: 'FACHHOCHSCHULE',
        website_url:
            'https://www.htwg-konstanz.de/studium/studienkolleg-der-htwg-konstanz/startseite-studienkolleg',
        crawler_url:
            'https://www.htwg-konstanz.de/studium/studienkolleg-der-htwg-konstanz/zeugnisanerkennung/anerkennung',
    },

    // 2. Bayern
    {
        slug: 'stk-muenchen',
        name: 'Studienkolleg bei den Universitäten des Freistaates Bayern (München)',
        city: 'München',
        state: 'Bayern',
        type: 'UNIVERSITAET',
        website_url: 'https://xn--studienkolleg-mnchen-3ec.de/',
        crawler_url:
            'https://xn--studienkolleg-mnchen-3ec.de/bewerben/aufnahme-in-das-studienkolleg',
    },
    {
        slug: 'stk-coburg',
        name: 'Studienkolleg bei den Fachhochschulen des Freistaates Bayern (Coburg)',
        city: 'Coburg',
        state: 'Bayern',
        type: 'FACHHOCHSCHULE',
        website_url: 'https://studienkolleg-coburg.de/',
        crawler_url: 'https://studienkolleg-coburg.de/aufnahmepruefung/',
    },

    // 3. Berlin
    {
        slug: 'stk-tu-berlin',
        name: 'Studienkolleg an der TU Berlin',
        city: 'Berlin',
        state: 'Berlin',
        type: 'UNIVERSITAET',
        website_url:
            'https://www.tu.berlin/international/studierende/studienkolleg',
        crawler_url:
            'https://www.tu.berlin/international/studierende/studienkolleg/kurse-und-pruefungen',
    },
    {
        slug: 'stk-fu-berlin',
        name: 'Studienkolleg der FU Berlin',
        city: 'Berlin',
        state: 'Berlin',
        type: 'UNIVERSITAET',
        website_url: 'https://www.fu-berlin.de/sites/studienkolleg',
        crawler_url: 'https://www.fu-berlin.de/sites/studienkolleg/bewerbung/',
    },

    // 4. Hamburg
    {
        slug: 'stk-hamburg',
        name: 'Studienkolleg Hamburg',
        city: 'Hamburg',
        state: 'Hamburg',
        type: 'BOTH',
        website_url: 'https://studienkolleg-hamburg.de/',
        crawler_url: 'https://studienkolleg-hamburg.de/bewerbung/',
    },

    // 5. Hessen
    {
        slug: 'stk-frankfurt',
        name: 'Studienkolleg der Goethe-Universität Frankfurt am Main',
        city: 'Frankfurt am Main',
        state: 'Hessen',
        type: 'BOTH',
        website_url:
            'https://www.uni-frankfurt.de/43662305/Internationales_Studienzentrum__ISZ',
        crawler_url: 'https://www.uni-frankfurt.de/43662351/Studienkolleg',
    },
    {
        slug: 'stk-darmstadt',
        name: 'Studienkolleg TU Darmstadt',
        city: 'Darmstadt',
        state: 'Hessen',
        type: 'UNIVERSITAET',
        website_url:
            'https://www.stk.tu-darmstadt.de/studienkollegstart/startseite_stk.de.jsp',
        crawler_url:
            'https://www.stk.tu-darmstadt.de/schwerpunktkurse_stk/tkurs_stk/bewerbung_tkurs_stk/index.de.jsp',
    },
    {
        slug: 'stk-kassel',
        name: 'Studienkolleg Universität Kassel',
        city: 'Kassel',
        state: 'Hessen',
        type: 'BOTH',
        website_url:
            'https://www.uni-kassel.de/einrichtung/studienkolleg/willkommen.html',
        crawler_url:
            'https://www.uni-kassel.de/einrichtung/studienkolleg/bewerbung-und-aufnahme.html',
    },
    {
        slug: 'stk-marburg',
        name: 'Studienkolleg Mittelhessen (Universität Marburg)',
        city: 'Marburg',
        state: 'Hessen',
        type: 'BOTH',
        website_url: 'https://www.uni-marburg.de/de/studienkolleg',
        crawler_url:
            'https://www.uni-marburg.de/de/studienkolleg/fachkurse/tests',
    },

    // 6. Mecklenburg-Vorpommern
    {
        slug: 'stk-wismar',
        name: 'Studienkolleg an der Hochschule Wismar',
        city: 'Wismar',
        state: 'Mecklenburg-Vorpommern',
        type: 'BOTH',
        website_url:
            'https://www.hs-wismar.de/international/aus-dem-ausland/studienkolleg/',
        crawler_url:
            'https://www.hs-wismar.de/international/aus-dem-ausland/studienkolleg/bewerbung/',
    },

    // 7. Niedersachsen
    {
        slug: 'stk-hannover',
        name: 'Niedersächsisches Studienkolleg (Universität Hannover)',
        city: 'Hannover',
        state: 'Niedersachsen',
        type: 'UNIVERSITAET',
        website_url: 'https://www.stk.uni-hannover.de/',
        crawler_url: 'https://www.stk.uni-hannover.de/kursteilnahme/aufnahmetest',
    },

    // 8. Rheinland-Pfalz
    {
        slug: 'stk-mainz',
        name: 'Studienkolleg an der Johannes Gutenberg-Universität Mainz',
        city: 'Mainz',
        state: 'Rheinland-Pfalz',
        type: 'BOTH',
        website_url: 'https://www.issk.uni-mainz.de/studienkolleg/',
        crawler_url:
            'https://www.studium.uni-mainz.de/meine-bewerbung/bewerbung-international/studienkolleg/',
    },
    {
        slug: 'stk-kaiserslautern',
        name: 'Internationales Studienkolleg der Hochschule Kaiserslautern',
        city: 'Kaiserslautern',
        state: 'Rheinland-Pfalz',
        type: 'FACHHOCHSCHULE',
        website_url:
            'https://www.hs-kl.de/international/internationales-studienkolleg/',
        crawler_url:
            'https://www.hs-kl.de/international/internationales-studienkolleg/bewerbung',
    },

    // 9. Sachsen
    {
        slug: 'stk-leipzig',
        name: 'Universität Leipzig – Studienkolleg Sachsen',
        city: 'Leipzig',
        state: 'Sachsen',
        type: 'UNIVERSITAET',
        website_url: 'https://www.stksachs.uni-leipzig.de/',
        crawler_url:
            'https://www.uni-leipzig.de/studium/vorbereitung/studienkolleg-und-deutschkurse',
    },
    {
        slug: 'stk-zittau',
        name: 'Studienkolleg an der Hochschule Zittau/Görlitz',
        city: 'Zittau',
        state: 'Sachsen',
        type: 'FACHHOCHSCHULE',
        website_url: 'https://studienkolleg.hszg.de/',
        crawler_url: 'https://studienkolleg.hszg.de/bewerbung-aufnahme',
    },

    // 10. Sachsen-Anhalt
    {
        slug: 'stk-halle',
        name: 'Studienkolleg an der Martin-Luther-Universität Halle-Wittenberg',
        city: 'Halle (Saale)',
        state: 'Sachsen-Anhalt',
        type: 'UNIVERSITAET',
        website_url: 'https://www.studienkolleg.uni-halle.de/',
        crawler_url: 'https://www.studienkolleg.uni-halle.de/aufnahmetest/',
    },
    {
        slug: 'stk-koethen',
        name: 'Landesstudienkolleg an der Hochschule Anhalt (Köthen)',
        city: 'Köthen',
        state: 'Sachsen-Anhalt',
        type: 'BOTH',
        website_url:
            'https://www.hs-anhalt.de/international/bewerbung-auslaendische-studierende/studienkolleg/startseite.html',
        crawler_url:
            'https://www.hs-anhalt.de/international/bewerbung-auslaendische-studierende/studienkolleg/bewerbung.html',
    },

    // 11. Schleswig-Holstein
    {
        slug: 'stk-kiel',
        name: 'Studienkolleg an der Fachhochschule Kiel (HAW Kiel)',
        city: 'Kiel',
        state: 'Schleswig-Holstein',
        type: 'FACHHOCHSCHULE',
        website_url:
            'https://www.haw-kiel.de/studium/studieninteressierte/studienkolleg-schleswig-holstein/',
        crawler_url:
            'https://www.haw-kiel.de/studium/studieninteressierte/studienkolleg-schleswig-holstein/bewerbung/',
    },

    // 12. Thüringen
    {
        slug: 'stk-nordhausen',
        name: 'Staatliches Studienkolleg Nordhausen (Hochschule Nordhausen)',
        city: 'Nordhausen',
        state: 'Thüringen',
        type: 'BOTH',
        website_url:
            'https://www.hs-nordhausen.de/international/staatliches-studienkolleg/',
        crawler_url:
            'https://www.hs-nordhausen.de/international/staatliches-studienkolleg/bewerbung-am-studienkolleg/',
    },
];

