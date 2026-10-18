/**
 * RT-FINAL-04C2 — Final 6-Tour Catalog Seed
 *
 * Idempotency strategy:
 * 1. Anchors on fixed deterministic IDs for all seed records.
 * 2. Before creating/upserting Pão de Açúcar (seed-002), it searches for an
 *    existing draft with the same title to avoid semantic duplication.
 * 3. seed-001-cristo-dona-marta is despublished via updateMany (safe for legacy).
 *
 * DEVELOPMENT ONLY (Owner decision 2026-10-13, RT-99/RT-100): this seed populates LOCAL databases. It refuses to run
 * against a non-local DATABASE_URL (see lib/db/local-database.ts). The public catalog's source of truth is the hosted
 * database, never this file; the seed ids below are NOT in the public allowlist (lib/catalog/public-trips.ts).
 *
 * Rules:
 * - NO deleteMany on Trip, Booking, or any other table
 * - NO schema changes, NO migrations
 * - Update on re-run is minimal and non-destructive
 */

import { PrismaClient, PhysicalLevel } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { isLocalDatabaseUrl } from '../lib/db/local-database'
import { assertDatabaseAccess } from '../lib/db/guard-runtime.mjs'

dotenv.config()

// --- Deterministic IDs ---
const SEED_TRIP_ID_001 = 'seed-001-cristo-dona-marta'   // legacy — to be despublished

const SEED_TRIP_ID_002 = 'seed-002-pao-de-acucar'
const SEED_SCHEDULE_ID_002 = 'seed-002-schedule-002'

const SEED_TRIP_ID_003 = 'seed-003-selaron-lapa'
const SEED_SCHEDULE_ID_003 = 'seed-003-schedule-003'

const SEED_TRIP_ID_004 = 'seed-004-centro-porto'
const SEED_SCHEDULE_ID_004 = 'seed-004-schedule-004'

const SEED_TRIP_ID_005 = 'seed-005-favela-rocinha'
const SEED_SCHEDULE_ID_005 = 'seed-005-schedule-005'

const SEED_TRIP_ID_006 = 'seed-006-floresta-tijuca'
const SEED_SCHEDULE_ID_006 = 'seed-006-schedule-006'

const SEED_TRIP_ID_007 = 'seed-007-helicoptero-cristo'
const SEED_SCHEDULE_ID_007 = 'seed-007-schedule-007'

// --- Images ---
const IMAGE_PAO_DE_ACUCAR       = '/images/trips/imagem-pao-de-acucar.jpg'
const IMAGE_SELARON              = '/images/trips/imagem-escadaria-selarao-brasil.jpg'
const IMAGE_CENTRO_PORTO         = '/images/trips/confeitaria-colombo-city-tour.jpeg'
const IMAGE_FAVELA_ROCINHA       = '/images/trips/imagem-tour-favela-rocinha.jpg'
const IMAGE_FLORESTA_TIJUCA      = '/images/trips/imagem-floresta-tijuca.jpg'
const IMAGE_HELICOPTERO_CRISTO   = '/images/trips/imagem-helicoptero-cristo.jpg'

interface LocalizedText {
  pt?: string;
  en?: string;
  es?: string;
  sv?: string;
}

/** Returns a date N days from now at 12:00 UTC. */
function futureScheduleDate(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setUTCHours(12, 0, 0, 0)
  return d
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('[seed] ERROR: DATABASE_URL is not set. Aborting.')
    process.exit(1)
  }

  // Owner decision 2026-10-13: the seed is development-only. Never print the connection string (it holds credentials).
  if (!isLocalDatabaseUrl(connectionString)) {
    console.error('[seed] REFUSING to run: DATABASE_URL does not point to a local database.')
    console.error('[seed] The seed is development-only (Owner decision 2026-10-13). Nothing was changed.')
    process.exit(1)
  }

  assertDatabaseAccess({ operation: 'write', label: 'prisma/seed.ts' }) // RT-104: local isolated database only

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    console.log('[seed] Starting RT-FINAL-04C2 final catalog seed...')

    // -----------------------------------------------------------------------
    // STEP 1: Despublish legacy tour seed-001-cristo-dona-marta
    // Using updateMany: if exists → despublish; if not → no-op (safe).
    // -----------------------------------------------------------------------
    const despublishResult = await prisma.trip.updateMany({
      where: { id: SEED_TRIP_ID_001 },
      data: { isPublished: false },
    })
    console.log(`[seed] seed-001-cristo-dona-marta despublished (matched: ${despublishResult.count})`)

    // -----------------------------------------------------------------------
    // STEP 2: Tour 1 — Pão de Açúcar ao Entardecer
    // Semantic match logic preserved from RT-019A to avoid duplication.
    // -----------------------------------------------------------------------
    let trip2Id = SEED_TRIP_ID_002

    const existingById = await prisma.trip.findUnique({ where: { id: SEED_TRIP_ID_002 } })

    if (!existingById) {
      console.log('[seed] Checking for existing Pão de Açúcar draft by title...')
      const allTrips = await prisma.trip.findMany()
      const byTitle = allTrips.find(
        t => (t.title as unknown as LocalizedText)?.pt === 'Pão de Açúcar ao Entardecer'
      )
      if (byTitle) {
        trip2Id = byTitle.id
        console.log(`[seed] Semantic match found. Reusing existing ID: ${trip2Id}`)
      }
    }

    const trip2 = await prisma.trip.upsert({
      where: { id: trip2Id },
      update: {
        isPublished: true,
        imageUrl: IMAGE_PAO_DE_ACUCAR,
        priceCents: 29500,
      },
      create: {
        id: trip2Id,
        title: {
          pt: 'Pão de Açúcar ao Entardecer',
          en: 'Sugarloaf Mountain at Sunset',
          es: 'Pan de Azúcar al Atardecer',
          sv: 'Sockertoppen vid solnedgången',
        },
        description: {
          pt: 'Uma das vistas mais icônicas do mundo. Suba o teleférico e contemple o pôr do sol inesquecível sobre a Baía de Guanabara com guia bilíngue.',
          en: 'One of the most iconic views in the world. Take the cable car and witness an unforgettable sunset over Guanabara Bay with a bilingual guide.',
          es: 'Una de las vistas más icónicas del mundo. Sube al teleférico y contempla un atardecer inolvidable sobre la Bahía de Guanabara con guía bilingüe.',
          sv: 'En av de mest ikoniska utsikterna i världen. Ta linbanan och upplev en oförglömlig solnedgång över Guanabarabukten med tvåspråkig guide.',
        },
        city: 'Rio de Janeiro',
        location: 'Urca, Rio de Janeiro',
        priceCents: 29500,
        imageUrl: IMAGE_PAO_DE_ACUCAR,
        isPublished: true,
        durationDays: 1,
        physicalLevel: PhysicalLevel.LIGHT,
        childrenAllowed: true,
        highlights: {
          pt: ['Teleférico com vista panorâmica', 'Pôr do sol sobre a Baía de Guanabara', 'Morro da Urca incluso', 'Guia bilíngue credenciado', 'Transporte incluso'],
          en: ['Cable car with panoramic view', 'Sunset over Guanabara Bay', 'Urca Hill included', 'Accredited bilingual guide', 'Transport included'],
          es: ['Teleférico con vista panorámica', 'Atardecer sobre la Bahía de Guanabara', 'Morro de Urca incluido', 'Guía bilingüe acreditado', 'Transporte incluido'],
          sv: ['Linbana med panoramautsikt', 'Solnedgång över Guanabarabukten', 'Urca-kullen inkluderad', 'Ackrediterad tvåspråkig guide', 'Transport inkluderad'],
        },
      },
    })
    console.log(`[seed] Tour 1 (Pão de Açúcar) upserted: ${trip2.id}`)

    // -----------------------------------------------------------------------
    // STEP 3: Tour 2 — Escadaria Selarón + Lapa
    // -----------------------------------------------------------------------
    const trip3 = await prisma.trip.upsert({
      where: { id: SEED_TRIP_ID_003 },
      update: {
        isPublished: true,
        imageUrl: IMAGE_SELARON,
        priceCents: 18000,
      },
      create: {
        id: SEED_TRIP_ID_003,
        title: {
          pt: 'Escadaria Selarón + Lapa',
          en: 'Selarón Steps + Lapa',
          es: 'Escalera Selarón + Lapa',
          sv: 'Selarón-trappan + Lapa',
        },
        description: {
          pt: 'Explore a obra do artista chileno Jorge Selarón e descubra os arcos históricos da Lapa, coração cultural e boêmio do Rio de Janeiro.',
          en: 'Explore the work of Chilean artist Jorge Selarón and discover the historic Lapa arches, the cultural and bohemian heart of Rio de Janeiro.',
          es: 'Explora la obra del artista chileno Jorge Selarón y descubre los arcos históricos de la Lapa, el corazón cultural y bohemio de Río de Janeiro.',
          sv: 'Utforska det chilenske konstnären Jorge Selaróns verk och upptäck de historiska Lapa-bågarna, Rio de Janeiros kulturella och bohemiska hjärta.',
        },
        city: 'Rio de Janeiro',
        location: 'Santa Teresa / Lapa, Rio de Janeiro',
        priceCents: 18000,
        imageUrl: IMAGE_SELARON,
        isPublished: true,
        durationDays: 1,
        physicalLevel: PhysicalLevel.LIGHT,
        childrenAllowed: true,
        highlights: {
          pt: ['Escadaria Selarón — obra de mosaico única no mundo', 'Arcos da Lapa e patrimônio histórico', 'Santa Teresa e vistas do centro', 'Guia bilíngue credenciado', 'A pé com ritmo tranquilo'],
          en: ['Selarón Steps — unique mosaic artwork in the world', 'Lapa arches and historical heritage', 'Santa Teresa and downtown views', 'Accredited bilingual guide', 'Walking tour at a relaxed pace'],
          es: ['Escalera Selarón — obra de mosaico única en el mundo', 'Arcos de la Lapa y patrimonio histórico', 'Santa Teresa y vistas del centro', 'Guía bilingüe acreditado', 'Caminata a ritmo tranquilo'],
          sv: ['Selarón-trappan — unikt mosaikverk i världen', 'Lapa-bågar och historiskt arv', 'Santa Teresa och stadsvyer', 'Ackrediterad tvåspråkig guide', 'Promenad i lugnt tempo'],
        },
      },
    })
    console.log(`[seed] Tour 2 (Selarón + Lapa) upserted: ${trip3.id}`)

    // -----------------------------------------------------------------------
    // STEP 4: Tour 3 — Centro Histórico + Porto Maravilha
    // -----------------------------------------------------------------------
    const trip4 = await prisma.trip.upsert({
      where: { id: SEED_TRIP_ID_004 },
      update: {
        isPublished: true,
        imageUrl: IMAGE_CENTRO_PORTO,
        priceCents: 22000,
      },
      create: {
        id: SEED_TRIP_ID_004,
        title: {
          pt: 'Centro Histórico + Porto Maravilha',
          en: 'Historic Downtown + Porto Maravilha',
          es: 'Centro Histórico + Puerto Maravilla',
          sv: 'Historiska centrum + Porto Maravilha',
        },
        description: {
          pt: 'Conheça os casarões coloniais do Centro do Rio, a Confeitaria Colombo histórica, a Pedra do Sal e a zona portuária revitalizada com o Museu do Amanhã.',
          en: 'Discover the colonial mansions of downtown Rio, the historic Confeitaria Colombo, Pedra do Sal and the revitalized port area with the Museum of Tomorrow.',
          es: 'Conoce los caserones coloniales del centro de Río, la histórica Confeitaria Colombo, la Pedra do Sal y la zona portuaria revitalizada con el Museo del Mañana.',
          sv: 'Upptäck de koloniala herrgårdarna i centrala Rio, historiska Confeitaria Colombo, Pedra do Sal och det revitaliserade hamnområdet med Morgondagens museum.',
        },
        city: 'Rio de Janeiro',
        location: 'Centro / Porto Maravilha, Rio de Janeiro',
        priceCents: 22000,
        imageUrl: IMAGE_CENTRO_PORTO,
        isPublished: true,
        durationDays: 1,
        physicalLevel: PhysicalLevel.LIGHT,
        childrenAllowed: true,
        highlights: {
          pt: ['Confeitaria Colombo e arquitetura colonial', 'Pedra do Sal — berço do samba', 'Praça XV e paço imperial', 'Porto Maravilha e Museu do Amanhã (exterior)', 'Guia bilíngue credenciado'],
          en: ['Confeitaria Colombo and colonial architecture', 'Pedra do Sal — birthplace of samba', 'Praça XV and imperial palace', 'Porto Maravilha and Museum of Tomorrow (exterior)', 'Accredited bilingual guide'],
          es: ['Confeitaria Colombo y arquitectura colonial', 'Pedra do Sal — cuna del samba', 'Plaza XV y palacio imperial', 'Puerto Maravilla y Museo del Mañana (exterior)', 'Guía bilingüe acreditado'],
          sv: ['Confeitaria Colombo och kolonial arkitektur', 'Pedra do Sal — sambans vagga', 'Praça XV och kejserliga palatset', 'Porto Maravilha och Morgondagens museum (exteriör)', 'Ackrediterad tvåspråkig guide'],
        },
      },
    })
    console.log(`[seed] Tour 3 (Centro Histórico + Porto Maravilha) upserted: ${trip4.id}`)

    // -----------------------------------------------------------------------
    // STEP 5: Tour 4 — Tour Favela Rocinha
    // -----------------------------------------------------------------------
    const trip5 = await prisma.trip.upsert({
      where: { id: SEED_TRIP_ID_005 },
      update: {
        isPublished: true,
        imageUrl: IMAGE_FAVELA_ROCINHA,
        priceCents: 23000,
      },
      create: {
        id: SEED_TRIP_ID_005,
        title: {
          pt: 'Tour Favela Rocinha',
          en: 'Rocinha Favela Tour',
          es: 'Tour por la Favela Rocinha',
          sv: 'Favela Rocinha-tur',
        },
        description: {
          pt: 'Uma experiência cultural genuína em uma das comunidades mais conhecidas do Rio de Janeiro. Conheça a Rocinha com guia local credenciado, respeito e contexto histórico.',
          en: 'A genuine cultural experience in one of the most well-known communities in Rio de Janeiro. Explore Rocinha with an accredited local guide, respect and historical context.',
          es: 'Una experiencia cultural genuina en una de las comunidades más conocidas de Río de Janeiro. Conoce la Rocinha con guía local acreditado, respeto y contexto histórico.',
          sv: 'En äkta kulturell upplevelse i ett av de mest kända samhällena i Rio de Janeiro. Utforska Rocinha med en ackrediterad lokal guide, respekt och historiskt sammanhang.',
        },
        city: 'Rio de Janeiro',
        location: 'Rocinha, Rio de Janeiro',
        priceCents: 23000,
        imageUrl: IMAGE_FAVELA_ROCINHA,
        isPublished: true,
        durationDays: 1,
        physicalLevel: PhysicalLevel.MODERATE,
        childrenAllowed: false,
        highlights: {
          pt: ['Guia credenciado e morador local', 'Vista panorâmica do Rio do alto da Rocinha', 'Cultura, arte e gastronomia local', 'Caminhada guiada com ritmo confortável', 'Contexto social e histórico da comunidade'],
          en: ['Accredited local resident guide', 'Panoramic view of Rio from the top of Rocinha', 'Local culture, art and gastronomy', 'Guided walk at a comfortable pace', 'Social and historical context of the community'],
          es: ['Guía local acreditado y residente', 'Vista panorámica de Río desde lo alto de Rocinha', 'Cultura, arte y gastronomía local', 'Caminata guiada a ritmo cómodo', 'Contexto social e histórico de la comunidad'],
          sv: ['Ackrediterad lokal invånare som guide', 'Panoramautsikt över Rio från toppen av Rocinha', 'Lokal kultur, konst och gastronomi', 'Guidad promenad i bekvämt tempo', 'Socialt och historiskt sammanhang för gemenskapen'],
        },
      },
    })
    console.log(`[seed] Tour 4 (Favela Rocinha) upserted: ${trip5.id}`)

    // -----------------------------------------------------------------------
    // STEP 6: Tour 5 — Floresta da Tijuca — Excursão Meio Dia
    // -----------------------------------------------------------------------
    const trip6 = await prisma.trip.upsert({
      where: { id: SEED_TRIP_ID_006 },
      update: {
        isPublished: true,
        imageUrl: IMAGE_FLORESTA_TIJUCA,
        priceCents: 29000,
      },
      create: {
        id: SEED_TRIP_ID_006,
        title: {
          pt: 'Floresta da Tijuca — Excursão Meio Dia',
          en: 'Tijuca Forest — Half-Day Excursion',
          es: 'Bosque de Tijuca — Excursión Medio Día',
          sv: 'Tijuca-skogen — Halvdagsutflykt',
        },
        description: {
          pt: 'Mergulhe em uma das maiores florestas urbanas do mundo, a poucos minutos do centro do Rio. Cascatas, trilhas guiadas e vistas do Cristo Redentor de dentro da mata.',
          en: 'Immerse yourself in one of the largest urban forests in the world, just minutes from downtown Rio. Waterfalls, guided trails and views of Christ the Redeemer from within the forest.',
          es: 'Sumérgete en uno de los bosques urbanos más grandes del mundo, a pocos minutos del centro de Río. Cascadas, senderos guiados y vistas del Cristo Redentor desde el interior del bosque.',
          sv: 'Fördjupa dig i en av världens största urbana skogar, bara några minuter från centrala Rio. Vattenfall, guidade leder och utsikt över Kristusstatyn inifrån skogen.',
        },
        city: 'Rio de Janeiro',
        location: 'Floresta da Tijuca, Rio de Janeiro',
        priceCents: 29000,
        imageUrl: IMAGE_FLORESTA_TIJUCA,
        isPublished: true,
        durationDays: 1,
        physicalLevel: PhysicalLevel.MODERATE,
        childrenAllowed: true,
        highlights: {
          pt: ['Uma das maiores florestas urbanas do mundo', 'Cachoeiras e trilhas sombreadas', 'Vista do Cristo Redentor pela mata', 'Fauna e flora da Mata Atlântica', 'Guia bilíngue credenciado'],
          en: ['One of the largest urban forests in the world', 'Waterfalls and shaded trails', 'View of Christ the Redeemer through the forest', 'Atlantic Forest fauna and flora', 'Accredited bilingual guide'],
          es: ['Uno de los bosques urbanos más grandes del mundo', 'Cascadas y senderos sombreados', 'Vista del Cristo Redentor por el bosque', 'Fauna y flora de la Mata Atlántica', 'Guía bilingüe acreditado'],
          sv: ['En av världens största urbana skogar', 'Vattenfall och skuggiga leder', 'Utsikt över Kristusstatyn genom skogen', 'Atlantskogens fauna och flora', 'Ackrediterad tvåspråkig guide'],
        },
      },
    })
    console.log(`[seed] Tour 5 (Floresta da Tijuca) upserted: ${trip6.id}`)

    // -----------------------------------------------------------------------
    // STEP 7: Tour 6 — Cristo Redentor de Helicóptero
    // -----------------------------------------------------------------------
    const trip7 = await prisma.trip.upsert({
      where: { id: SEED_TRIP_ID_007 },
      update: {
        isPublished: true,
        imageUrl: IMAGE_HELICOPTERO_CRISTO,
        priceCents: 149000,
      },
      create: {
        id: SEED_TRIP_ID_007,
        title: {
          pt: 'Cristo Redentor de Helicóptero',
          en: 'Christ the Redeemer by Helicopter',
          es: 'Cristo Redentor en Helicóptero',
          sv: 'Kristusstatyn med helikopter',
        },
        description: {
          pt: 'A experiência mais exclusiva do Rio. Sobrevoe o Cristo Redentor e a Baía de Guanabara em voo panorâmico com operador especializado.',
          en: 'The most exclusive experience in Rio. Fly over Christ the Redeemer and Guanabara Bay in a panoramic flight with a specialist operator.',
          es: 'La experiencia más exclusiva de Río. Sobrevuela el Cristo Redentor y la Bahía de Guanabara en vuelo panorámico con operador especializado.',
          sv: 'Den mest exklusiva upplevelsen i Rio. Flyg över Kristusstatyn och Guanabarabukten i en panoramaflygning med specialiserad operatör.',
        },
        city: 'Rio de Janeiro',
        location: 'Heliporto / Corcovado, Rio de Janeiro',
        priceCents: 149000,
        imageUrl: IMAGE_HELICOPTERO_CRISTO,
        isPublished: true,
        durationDays: 1,
        physicalLevel: PhysicalLevel.LIGHT,
        childrenAllowed: false,
        highlights: {
          pt: ['Voo panorâmico sobre o Cristo Redentor', 'Vista aérea da Baía de Guanabara e praias', '8 a 12 minutos de voo panorâmico', 'Traslado incluso até o heliporto', 'Capacidade reduzida — experiência privada'],
          en: ['Panoramic flight over Christ the Redeemer', 'Aerial view of Guanabara Bay and beaches', '8 to 12 minutes panoramic flight', 'Transfer to heliport included', 'Reduced capacity — private experience'],
          es: ['Vuelo panorámico sobre el Cristo Redentor', 'Vista aérea de la Bahía de Guanabara y playas', '8 a 12 minutos de vuelo panorámico', 'Traslado al helipuerto incluido', 'Capacidad reducida — experiencia privada'],
          sv: ['Panoramaflygning över Kristusstatyn', 'Flygvy över Guanabarabukten och stränder', '8 till 12 minuters panoramaflygning', 'Transfer till heliport inkluderad', 'Begränsad kapacitet — privat upplevelse'],
        },
      },
    })
    console.log(`[seed] Tour 6 (Helicóptero Cristo) upserted: ${trip7.id}`)

    // -----------------------------------------------------------------------
    // STEP 8: Schedules — idempotent upserts for all active tours
    // -----------------------------------------------------------------------

    const s2 = await prisma.tripSchedule.upsert({
      where: { id: SEED_SCHEDULE_ID_002 },
      update: { startAt: futureScheduleDate(90), capacity: 12, pricePerPersonCents: 29500, status: 'OPEN' },
      create: {
        id: SEED_SCHEDULE_ID_002,
        tripId: trip2.id,
        startAt: futureScheduleDate(90),
        capacity: 12,
        pricePerPersonCents: 29500,
        status: 'OPEN',
      },
    })
    console.log(`[seed] Schedule for Pão de Açúcar upserted: ${s2.id}`)

    const s3 = await prisma.tripSchedule.upsert({
      where: { id: SEED_SCHEDULE_ID_003 },
      update: { startAt: futureScheduleDate(90), capacity: 10, pricePerPersonCents: 18000, status: 'OPEN' },
      create: {
        id: SEED_SCHEDULE_ID_003,
        tripId: trip3.id,
        startAt: futureScheduleDate(90),
        capacity: 10,
        pricePerPersonCents: 18000,
        status: 'OPEN',
      },
    })
    console.log(`[seed] Schedule for Selarón + Lapa upserted: ${s3.id}`)

    const s4 = await prisma.tripSchedule.upsert({
      where: { id: SEED_SCHEDULE_ID_004 },
      update: { startAt: futureScheduleDate(95), capacity: 10, pricePerPersonCents: 22000, status: 'OPEN' },
      create: {
        id: SEED_SCHEDULE_ID_004,
        tripId: trip4.id,
        startAt: futureScheduleDate(95),
        capacity: 10,
        pricePerPersonCents: 22000,
        status: 'OPEN',
      },
    })
    console.log(`[seed] Schedule for Centro Histórico + Porto Maravilha upserted: ${s4.id}`)

    const s5 = await prisma.tripSchedule.upsert({
      where: { id: SEED_SCHEDULE_ID_005 },
      update: { startAt: futureScheduleDate(100), capacity: 8, pricePerPersonCents: 23000, status: 'OPEN' },
      create: {
        id: SEED_SCHEDULE_ID_005,
        tripId: trip5.id,
        startAt: futureScheduleDate(100),
        capacity: 8,
        pricePerPersonCents: 23000,
        status: 'OPEN',
      },
    })
    console.log(`[seed] Schedule for Favela Rocinha upserted: ${s5.id}`)

    const s6 = await prisma.tripSchedule.upsert({
      where: { id: SEED_SCHEDULE_ID_006 },
      update: { startAt: futureScheduleDate(105), capacity: 8, pricePerPersonCents: 29000, status: 'OPEN' },
      create: {
        id: SEED_SCHEDULE_ID_006,
        tripId: trip6.id,
        startAt: futureScheduleDate(105),
        capacity: 8,
        pricePerPersonCents: 29000,
        status: 'OPEN',
      },
    })
    console.log(`[seed] Schedule for Floresta da Tijuca upserted: ${s6.id}`)

    const s7 = await prisma.tripSchedule.upsert({
      where: { id: SEED_SCHEDULE_ID_007 },
      update: { startAt: futureScheduleDate(110), capacity: 4, pricePerPersonCents: 149000, status: 'OPEN' },
      create: {
        id: SEED_SCHEDULE_ID_007,
        tripId: trip7.id,
        startAt: futureScheduleDate(110),
        capacity: 4,
        pricePerPersonCents: 149000,
        status: 'OPEN',
      },
    })
    console.log(`[seed] Schedule for Helicóptero Cristo upserted: ${s7.id}`)

    // -----------------------------------------------------------------------
    // RT-100: partner structure for C2Rio. INACTIVE, no public label and NO tour: nothing is published and no tariff,
    // commission or markup is registered. update: {} keeps any later manual change (e.g. activation) untouched.
    // -----------------------------------------------------------------------
    const c2rio = await prisma.partner.upsert({
      where: { slug: 'c2rio' },
      update: {},
      create: { name: 'C2Rio', slug: 'c2rio', status: 'INACTIVE' },
    })
    console.log(`[seed] Partner structure upserted: ${c2rio.slug} (${c2rio.status}); no partner tour created.`)

    console.log('[seed] RT-FINAL-04C2 final catalog seed completed successfully.')
    console.log('[seed] Active catalog: 6 tours published, seed-001 despublished.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('[seed] FATAL:', e)
  process.exit(1)
})
