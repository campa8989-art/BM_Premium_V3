/** report_config.js - Configurazione Definizioni e Mapping per Report Tecnico **/

const REPORT_CONFIG = {
    ALL_CONTRACT_CODES: [
        "1.2", "1.1", "13.3", "3.1", "15.1", "17.1", "20.1", "2.1", "30.1", "40.1", 
        "45.2", "45.1", "49.1", "50.1", "51.1", "52.1", "53.1", "61.1", "64.1", "62.1",
        "59.1", "60.1", "66.1", "67.1", "72.1", "72.2", "73.1", "76.1", "80.1", "81.1"
    ],

    documentationMapping: {
        "HVAC": [
            "Ultimi Rapporti di Controllo di Efficienza Energetica (Analisi fumi) effettuati sui moduli analizzati;",
            "Verifica dei parametri di combustione: in particolare i valori di rendimento, eccesso d'aria e concentrazione di CO (monossido di carbonio);",
            "Certificazione di avvenuta manutenzione del sistema di scarico condensa, per verificare se eventuali problemi di ossidazione siano stati già oggetto di intervento;",
            "Copia del Libretto d'Impianto aggiornato, completo di tutte le schede relative ai componenti analizzati (rampa gas, contatore e collettore idraulico)."
        ],
        "Elettrico": [
            "Certificato di conformità ai sensi del D.M. 37/08 per gli interventi di modifica/rifacimento;",
            "Verifica periodica dell'impianto di messa a terra ai sensi del D.P.R. 462/01;",
            "Registro di manutenzione dell'illuminazione di emergenza con esito prove di autonomia."
        ],
        "Idrico": [
            "Valutazione del Rischio Legionellosi aggiornata (Linee Guida 2015);",
            "Registro degli interventi effettuati e dei dosaggi dei prodotti chimici antilegionella;",
            "Esiti dei campionamenti microbiologici effettuati sulla rete idrico-sanitaria."
        ],
        "Antincendio": [
            "Registro delle verifiche periodiche semestrali idranti e splinker;",
            "Certificato di rinnovo periodico di conformità antincendio (CPI);",
            "Esito prove di portata e pressione della rete idrica antincendio."
        ],
        "Elevatori": [
            "Certificato di verifica periodica ai sensi del D.P.R. 162/99;",
            "Registro di manutenzione con annotazione delle prove di sicurezza paracadute;",
            "Copia dell'assegnazione del numero di matricola dell'impianto."
        ]
    },

    sectionsDefinition: [
        {
            title: "Impianti Climatizzazione e Produzione Energia (HVAC)",
            category: "Servizio energia - Manutenzione impianti di climatizzazione (B2)",
            docKey: "HVAC",
            items: [
                { id: "B.01- B.02 - B.12", name: "Caldaie da 36kW a 350 kW", alias: ["1.1", "1.2", "13.3"], figures: ["Caldaia", "Rampa Gas"] },
                { id: "B.01 - B.02 - B.12", name: "Caldaie da 350 kW a 1000kW", alias: ["2.1"], figures: ["Centrale Termica", "Generatore"] },
                { id: "B.04", name: "Gruppi frigoriferi a vite/centrifughi fino a 100 kW", alias: ["3.1", "15.1"], figures: ["Chiller", "Compressori"] },
                { id: "B.01-B.05-B.06-B.11", name: "Distribuzione impianti idronici e sottocentrali", alias: ["17.1", "20.1"], figures: ["Sottocentrale", "Pompe"] },
                { id: "B.08-B.13-B.15", name: "Unità di Trattamento Aria (UTA)", alias: ["30.1", "40.1"], figures: ["UTA", "Filtri/Motore"] },
                { id: "B.09-B.10", name: "Condizionatori Monosplit / VRF / Localizzati", alias: ["80.1", "81.1"], figures: ["Unità Esterna", "Split Interno"] }
            ]
        },
        {
            title: "Impianti Elettrici e Continuità",
            category: "Manutenzione Impianti elettrici (C)",
            docKey: "Elettrico",
            items: [
                { id: "C2-C6", name: "Distribuzione elettrica, quadri, ecc.", alias: ["45.1", "45.2"], figures: ["Quadro BT", "Termografia"] },
                { id: "C1", name: "Cabine MT / BT e Trasformatori", alias: ["49.1", "50.1"], figures: ["Trasformatore", "Cella MT"] },
                { id: "C4", name: "Gruppi Elettrogeni di Continuità", alias: ["53.1"], figures: ["Motore GE", "Pannello ATS"] }
            ]
        },
        {
            title: "Impianti Idrico-Sanitari",
            category: "Manutenzione Impianti idrici (D)",
            docKey: "Idrico",
            items: [
                { id: "D2.02", name: "Impianti addolcimento", alias: ["51.1"], figures: ["Addolcitore", "Resine"] },
                { id: "D2.03 – D2.04", name: "Distribuzione idrico sanitaria", alias: ["52.1"], figures: ["Collettore Idrico", "Valvolame"] },
                { id: "D3.01", name: "Apparecchiature controllo legionellosi", alias: ["51.1"], figures: ["Dosatore", "Campionamento"] },
                { id: "D3.01.06/07", name: "Prove della legionella della rete idrico-sanitaria", alias: ["51.1"], figures: ["Analisi Microbiologica"] }
            ]
        },
        {
            title: "Impianti e Apparecchiature Antincendio",
            category: "Manutenzione impianti e apparecchiature antincendio (E)",
            docKey: "Antincendio",
            items: [
                { id: "E1.03 - E1.06 - E3.04", name: "Compartimentazioni, serrande tagliafuoco", alias: ["72.1", "72.2"], figures: ["Serranda", "Compartimento"] },
                { id: "E2.01 - E2.04 - E2.05", name: "Impianti rivelazione e segnalazione incendi", alias: ["76.1"], figures: ["Sensore", "Centrale"] },
                { id: "E1.04 - E1.05 - E2.02", name: "Illuminazione di emergenza, segnaletica antincendio e vie di esodo", alias: ["45.1"], figures: ["Lampada Emergenza", "Segnaletica"] },
                { id: "E1.01", name: "Porte Tagliafuoco", alias: ["72.1"], figures: ["Porta", "Maniglione"] },
                { id: "E1.02", name: "Estintori", alias: ["73.1"], figures: ["Estintore", "Manometro"] },
                { id: "E3.01 - E3.08", name: "Centrale di pressurizzazione", alias: ["72.1"], figures: ["Motopompa", "Quadro Antincendio"] },
                { id: "E3.02 - E3.08", name: "Rete idrica e terminali", alias: ["72.1"], figures: ["Idrante UNI 45", "Rete Soffitto"] }
            ]
        },
        {
            title: "Impianti Elevatori e Sistemi di Trasporto",
            category: "Manutenzione Impianti elevatori (F)",
            docKey: "Elevatori",
            items: [
                { id: "F1.01", name: "Elevatori 1-5 piani (fino a 6 fermate)", alias: ["61.1"], figures: ["Locale Macchine", "Cabina"] },
                { id: "F1.01", name: "Elevatori 6-10 piani (fino a 11 fermate)", alias: ["62.1"], figures: ["Locale Macchine", "Vano"] },
                { id: "F1.02", name: "Servoscala", alias: ["64.1"], figures: ["Piattaforma", "Guida"] }
            ]
        },
        {
            title: "Manutenzione Edile e Sistemi Speciali",
            category: "Manutenzione edile (G)",
            docKey: "Edile",
            items: [
                { id: "G1", name: "Pompe di sollevamento acque nere e chiare", alias: ["60.1"], figures: ["Vano Raccolta", "Stazione Sollevamento"] },
                { id: "G2.01.01", name: "Cancelli e sbarre motorizzati", alias: ["59.1"], figures: ["Motore Cancello", "Sbarra"] },
                { id: "G2.01.02", name: "Porte automatiche e portoni sezionali", alias: ["66.1", "67.1"], figures: ["Fotocellula", "Portone"] }
            ]
        }
    ]
};

// Se siamo in un ambiente che supporta window, lo attacchiamo lì
if (typeof window !== 'undefined') {
    window.REPORT_CONFIG = REPORT_CONFIG;
}
