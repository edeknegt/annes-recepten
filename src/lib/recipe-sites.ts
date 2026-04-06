/**
 * Nederlandse receptensites en hun import-compatibiliteit.
 *
 * status:
 *   'full'    — JSON-LD werkt volledig, alle receptdata wordt opgehaald
 *   'partial' — JSON-LD werkt bij sommige recepten, niet bij alle
 *   'blocked' — Site blokkeert geautomatiseerde requests (403)
 *   'offline' — Site is niet bereikbaar
 *   'none'    — Geen JSON-LD aanwezig, handmatig invoeren nodig
 */

export type SiteStatus = 'full' | 'partial' | 'blocked' | 'offline' | 'none'

export interface RecipeSite {
  domain: string
  name: string
  description: string
  status: SiteStatus
}

export const recipeSites: RecipeSite[] = [
  // =====================================================================
  // VOLLEDIG ONDERSTEUND (34 sites)
  // =====================================================================
  { domain: 'ah.nl', name: 'Albert Heijn Allerhande', description: 'Grootste Nederlandse receptensite, onderdeel van Albert Heijn', status: 'full' },
  { domain: 'jumbo.com', name: 'Jumbo Recepten', description: 'Recepten van supermarktketen Jumbo', status: 'full' },
  { domain: 'leukerecepten.nl', name: 'Leuke Recepten', description: 'Populaire Nederlandse receptenblog', status: 'full' },
  { domain: '24kitchen.nl', name: '24Kitchen', description: 'Recepten van het tv-kookkanaal', status: 'full' },
  { domain: 'rutgerbakt.nl', name: 'Rutger Bakt', description: 'Bakrecepten van Heel Holland Bakt-winnaar Rutger van den Broek', status: 'full' },
  { domain: 'francescakookt.nl', name: 'Francesca Kookt', description: 'Italiaans geïnspireerde recepten', status: 'full' },
  { domain: 'uitpaulineskeuken.nl', name: 'Uit Paulines Keuken', description: 'Makkelijke recepten voor elke dag', status: 'full' },
  { domain: 'keukenliefde.nl', name: 'KeukenLiefde', description: 'Lekkere makkelijke recepten om thuis te maken', status: 'full' },
  { domain: 'laurasbakery.nl', name: "Laura's Bakery", description: 'Nederlandse bakblog met taarten, koekjes en brood', status: 'full' },
  { domain: 'bakken.nl', name: 'Bakken.nl', description: 'Alles over bakken: recepten, tips en technieken', status: 'full' },
  { domain: 'foodiesmagazine.nl', name: 'Foodies Magazine', description: 'Culinair magazine met recepten en restauranttips', status: 'full' },
  { domain: 'chickslovefood.com', name: 'Chickslovefood', description: 'Simpele recepten met weinig ingrediënten', status: 'full' },
  { domain: 'koopmans.com', name: 'Koopmans', description: 'Recepten van het meel- en bakmerk Koopmans', status: 'full' },
  { domain: 'culy.nl', name: 'Culy', description: 'Online foodmagazine met recepten en culinair nieuws', status: 'full' },
  { domain: 'ohmyfoodness.nl', name: 'OhMyFoodness', description: 'Foodblog met internationale recepten', status: 'full' },
  { domain: 'eatertainment.nl', name: 'Eatertainment', description: 'Platform voor receptinspiratie, Website van het Jaar 2025', status: 'full' },
  { domain: 'smaakmenutie.nl', name: 'SmaakMenutie', description: 'Toegankelijke recepten die iedereen kan maken', status: 'full' },
  { domain: 'baktotaal.nl', name: 'Baktotaal', description: 'Meer dan 700 taart- en gebakrecepten', status: 'full' },
  { domain: 'dagelijksekost.vrt.be', name: 'Dagelijkse Kost (VRT)', description: 'Vlaamse kooksite van chef Jeroen Meus', status: 'full' },
  { domain: 'hellofresh.nl', name: 'HelloFresh', description: 'Maaltijdbox service met recepten', status: 'full' },
  { domain: 'maggi.nl', name: 'MAGGI', description: 'Recepten van het Nestlé kruidenmerk', status: 'full' },
  { domain: 'okokorecepten.nl', name: 'Okoko Recepten', description: 'Klassieke en moderne gerechten', status: 'full' },
  { domain: 'culinea.nl', name: 'Culinea', description: 'Traditionele Nederlandse gerechten', status: 'full' },
  { domain: 'lekkertafelen.nl', name: 'Lekker Tafelen', description: 'Recepten en kooktips voor een lekkere maaltijd', status: 'full' },
  { domain: 'beaufood.nl', name: 'Beaufood', description: 'Gezonde en lekkere recepten, culinaire lifestyle blog', status: 'full' },
  { domain: 'lowcarbchef.nl', name: 'Lowcarbchef', description: '500+ koolhydraatarme recepten', status: 'full' },
  { domain: 'yesrecepten.nl', name: 'Yes Recepten', description: 'Recepten zoeken, uitproberen en delen', status: 'full' },
  { domain: 'gezonderecepten.nl', name: 'Gezonde Recepten', description: 'Gezonde en koolhydraatarme recepten voor elke dag', status: 'full' },
  { domain: 'njam.tv', name: 'Njam!', description: 'Vlaamse kooksite en TV-zender met recepten van bekende koks', status: 'full' },
  { domain: 'kookfans.nl', name: 'KookFans', description: 'Populaire recepten met tips van bekende koks', status: 'full' },
  { domain: 'miljuschka.nl', name: 'Miljuschka', description: 'Recepten van Miljuschka Witzenhausen', status: 'full' },
  { domain: 'brendakookt.nl', name: 'Brenda Kookt', description: 'Makkelijke maaltijden, binnen 30 minuten op tafel', status: 'full' },
  { domain: 'eefkooktzo.nl', name: 'Eef Kookt Zo', description: 'Een van de meest bezochte foodblogs van Nederland', status: 'full' },
  { domain: 'boodschappen.nl', name: 'Boodschappen.nl', description: 'Receptensite van Boodschappen magazine', status: 'full' },

  // --- Brood & bakken sites ---
  { domain: 'broodgodin.nl', name: 'Broodgodin', description: 'Gespecialiseerde broodbakblog met desembrood-recepten', status: 'full' },
  { domain: 'annabellas.nl', name: "Annabella's Foodblog", description: 'Foodblog met uitgebreide zuurdesembrood-recepten', status: 'full' },
  { domain: 'maison-viridi.com', name: 'Maison Viridi', description: 'Foodblog met brood- en zuurdesemrecepten', status: 'full' },
  { domain: 'flyingfoodie.nl', name: 'Flying Foodie', description: 'Foodblog met brood- en focaccia-recepten', status: 'full' },
  { domain: 'eetspiratie.nl', name: 'Eetspiratie', description: 'Receptensite met o.a. volkorenbrood-recepten', status: 'full' },
  { domain: 'familieoverdekook.nl', name: 'Familie over de Kook', description: 'Gezinsblog met broodrecepten zoals no-knead bread', status: 'full' },
  { domain: 'itsnotaboutcooking.nl', name: "It's Not About Cooking", description: 'Foodblog met snelle broodrecepten (sodabrood in 30 min)', status: 'full' },
  { domain: 'goedboerenindestad.nl', name: 'Goed Boeren in de Stad', description: 'Receptensite met basis broodrecepten', status: 'full' },

  // =====================================================================
  // GEDEELTELIJK ONDERSTEUND (8 sites)
  // =====================================================================
  { domain: 'lekkerensimpel.com', name: 'Lekker en Simpel', description: 'Niet alle receptpagina\'s hebben JSON-LD (WordPress plugin inconsistentie)', status: 'partial' },
  { domain: 'plus.nl', name: 'PLUS supermarkt', description: 'SPA-site, minimale server HTML zonder JSON-LD', status: 'partial' },
  { domain: 'receptenvandaag.nl', name: 'Recepten Vandaag', description: 'SPA-site, JSON-LD niet detecteerbaar in server HTML', status: 'partial' },
  { domain: 'marielleindekeuken.nl', name: 'Mariëlle in de Keuken', description: 'Bakblog met broodrecepten, soms onvolledige JSON-LD velden', status: 'partial' },
  { domain: 'recepten.vuurenrook.nl', name: 'Vuur & Rook', description: 'BBQ/bakblog met krentenbrood-recepten, description veld leeg', status: 'partial' },
  { domain: 'greentwist.nl', name: 'GreenTwist Cooking School', description: 'Kookschool met zuurdesembrood-recepten, description veld leeg', status: 'partial' },
  { domain: 'wimke.nl', name: 'Wimke', description: 'Creatieve blog met focaccia-recepten, description veld leeg', status: 'partial' },
  { domain: 'arla.nl', name: 'Arla', description: 'Zuivelmerk met broodrecepten, beperkte Recipe velden', status: 'partial' },

  // =====================================================================
  // GEEN JSON-LD — handmatig invoeren nodig (24 sites)
  // =====================================================================
  { domain: 'recepten.lidl.nl', name: 'Lidl Recepten', description: 'Receptdata zit in React client state, geen JSON-LD', status: 'none' },
  { domain: 'voedingscentrum.nl', name: 'Voedingscentrum', description: 'Heeft JSON-LD maar alleen Organization type, geen Recipe', status: 'none' },
  { domain: 'projectgezond.nl', name: 'Project Gezond', description: 'Geen Recipe JSON-LD, alleen WebSite/WebPage types', status: 'none' },
  { domain: 'myfoodblog.nl', name: 'My Food Blog', description: 'Geen Recipe JSON-LD, alleen WebSite/WebPage types', status: 'none' },
  { domain: 'lovemyfood.nl', name: 'LoveMyFood', description: 'Geen Recipe JSON-LD, alleen Article types', status: 'none' },
  { domain: 'libelle-lekker.be', name: 'Libelle Lekker', description: 'Belgisch kookplatform, geen JSON-LD op receptpagina\'s', status: 'none' },
  { domain: 'heelhollandbakt.nl', name: 'Heel Holland Bakt', description: 'TV-programma baksite, Article schema geen Recipe', status: 'none' },
  { domain: 'oetker.nl', name: 'Dr. Oetker', description: 'Bakmerk met broodrecepten, receptdata in JS-object niet als JSON-LD', status: 'none' },
  { domain: 'brouwbrood.nl', name: 'BrouwBrood', description: 'Broodbaksite met gistbrood-recepten, Article/FAQPage geen Recipe', status: 'none' },
  { domain: 'graanenzo.nl', name: 'Graan&Zo', description: 'Broodbakblog met krentenbrood, BlogPosting geen Recipe', status: 'none' },
  { domain: 'madebyellen.com', name: 'Made by Ellen', description: 'Bakblog met zuurdesemrecepten, Article geen Recipe', status: 'none' },
  { domain: 'cynthia.nl', name: 'Cynthia', description: 'Lifestyleblog met zuurdesemrecepten, WebPage geen Recipe', status: 'none' },
  { domain: 'keukenrebellen.nl', name: 'Keukenrebellen', description: 'Receptensite met zuurdesembrood, geen JSON-LD', status: 'none' },
  { domain: 'eetman.nl', name: 'Eetman', description: 'Foodblog met broodrecepten, Article geen Recipe', status: 'none' },
  { domain: 'bakkerijremon.nl', name: 'Bakkerij Rémon', description: 'Gespecialiseerde baksite, CollectionPage geen Recipe', status: 'none' },
  { domain: 'broodsmakelijk.nl', name: 'Brood Smakelijk', description: 'Broodbakinfo-site, geen JSON-LD', status: 'none' },
  { domain: 'susanaretz.nl', name: 'Susana Retz', description: 'Blog met desembrood-recepten, Article geen Recipe', status: 'none' },
  { domain: 'italieplein.nl', name: 'Italiëplein', description: 'Blog over Italiaans eten incl. focaccia, Article geen Recipe', status: 'none' },

  // =====================================================================
  // GEBLOKKEERD / OFFLINE (8 sites)
  // =====================================================================
  { domain: 'smulweb.nl', name: 'Smulweb', description: 'Community receptensite, momenteel niet bereikbaar', status: 'offline' },
  { domain: 'knorr.com/nl', name: 'Knorr Nederland', description: 'Blokkeert alle geautomatiseerde requests (403)', status: 'blocked' },
  { domain: 'foody.nl', name: 'Foody.nl', description: 'Site niet bereikbaar', status: 'offline' },
  { domain: 'bakkenzoalsoma.nl', name: 'Bakken Zoals Oma', description: 'Bakblog met broodrecepten (503 Service Unavailable)', status: 'blocked' },
  { domain: 'heerlijkehappen.nl', name: 'Heerlijke Happen', description: 'Foodblog met focaccia (403 Forbidden)', status: 'blocked' },
  { domain: 'dolcevia.com', name: 'Dolcevia', description: 'Italiaans receptensite met focaccia (403 Forbidden)', status: 'blocked' },
  { domain: 'debroodbakschool.nl', name: 'De Broodbakschool', description: 'Broodbakcursus-site van Marije Bakt Brood, content dynamisch geladen', status: 'blocked' },
]
