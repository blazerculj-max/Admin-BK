// ─── SLOVENSKA SKLANJATEV IMEN ────────────────────────────────────────────────
// Uporaba:
//   const { sklanjaj } = require('./slovenska-sklanjatev.cjs')
//   const s = sklanjaj('Janez', 'M')
//   s.rod   → "Janeza"   (profil Janeza)
//   s.daj   → "Janezu"   (primerno za Janezu)
//   s.toz   → "Janeza"   (za Janeza)
//   s.mest  → "Janezu"   (o Janezu)
//   s.or    → "Janez"    (Janez je...)
//   s.ime   → "Janez"    (osnovna oblika)

function sklanjajIme(ime, spol) {
  const i = ime.trim()
  const s = (spol || 'M').toUpperCase()
  const lower = i.toLowerCase()

  // Osnova je vedno nespremenjena (imenovalnik)
  const or = i

  // ── ŽENSKA IMENA ──────────────────────────────────────────────────────────
  if (s === 'Z' || s === 'Ž') {
    // Imena na -a (Ana, Maja, Sara, Nina, Eva, Tanja, Petra...)
    if (lower.endsWith('a') && !lower.endsWith('ea')) {
      const koren = i.slice(0, -1)
      return { ime: i, or: i, rod: koren+'e', daj: koren+'i', toz: koren+'o', mest: koren+'i' }
    }
    // Imena na -ea (Rhea, Andrea...)
    if (lower.endsWith('ea')) {
      return { ime: i, or: i, rod: i+'je', daj: i+'ji', toz: i+'jo', mest: i+'ji' }
    }
    // Imena na -ja (Nadja, Sonja, Tanja → že zajeta z -a zgoraj)
    // Imena na soglasnik — tuja ženska imena (Carmen, Isabel...)
    return { ime: i, or: i, rod: i, daj: i, toz: i, mest: i }
  }

  // ── MOŠKA IMENA ───────────────────────────────────────────────────────────

  // Izjeme — nepravilna imena (po abecedi)
  const izjeme = {
    'aleksej': { rod:'Alekseja', daj:'Alekseju', toz:'Alekseja', mest:'Alekseju' },
    'andrej':  { rod:'Andreja',  daj:'Andreju',  toz:'Andreja',  mest:'Andreju'  },
    'blaž':    { rod:'Blaža',    daj:'Blažu',    toz:'Blaža',    mest:'Blažu'    },
    'borut':   { rod:'Boruta',   daj:'Borutu',   toz:'Boruta',   mest:'Borutu'   },
    'boštjan': { rod:'Boštjana', daj:'Boštjanu', toz:'Boštjana', mest:'Boštjanu' },
    'dan':     { rod:'Dana',     daj:'Danu',     toz:'Dana',     mest:'Danu'     },
    'gašper':  { rod:'Gašperja', daj:'Gašperju', toz:'Gašperja', mest:'Gašperju' },
    'gregor':  { rod:'Gregorja', daj:'Gregorju', toz:'Gregorja', mest:'Gregorju' },
    'igor':    { rod:'Igorja',   daj:'Igorju',   toz:'Igorja',   mest:'Igorju'   },
    'jakob':   { rod:'Jakoba',   daj:'Jakobu',   toz:'Jakoba',   mest:'Jakobu'   },
    'jan':     { rod:'Jana',     daj:'Janu',     toz:'Jana',     mest:'Janu'     },
    'janez':   { rod:'Janeza',   daj:'Janezu',   toz:'Janeza',   mest:'Janezu'   },
    'jure':    { rod:'Jureta',   daj:'Juretu',   toz:'Jureta',   mest:'Juretu'   },
    'klemen':  { rod:'Klemena',  daj:'Klemenu',  toz:'Klemena',  mest:'Klemenu'  },
    'lazar':   { rod:'Lazarja',  daj:'Lazarju',  toz:'Lazarja',  mest:'Lazarju'  },
    'luka':    { rod:'Luke',     daj:'Luki',     toz:'Luko',     mest:'Luki'     },
    'marko':   { rod:'Marka',    daj:'Marku',    toz:'Marka',    mest:'Marku'    },
    'matej':   { rod:'Mateja',   daj:'Mateju',   toz:'Mateja',   mest:'Mateju'   },
    'matevž':  { rod:'Matevža',  daj:'Matevžu',  toz:'Matevža',  mest:'Matevžu'  },
    'matjaž':  { rod:'Matjaža',  daj:'Matjažu',  toz:'Matjaža',  mest:'Matjažu'  },
    'miha':    { rod:'Mihe',     daj:'Mihi',     toz:'Miho',     mest:'Mihi'     },
    'mihael':  { rod:'Mihaela',  daj:'Mihaelu',  toz:'Mihaela',  mest:'Mihaelu'  },
    'milan':   { rod:'Milana',   daj:'Milanu',   toz:'Milana',   mest:'Milanu'   },
    'mitja':   { rod:'Mitje',    daj:'Mitji',    toz:'Mitjo',    mest:'Mitji'    },
    'nejc':    { rod:'Nejca',    daj:'Nejcu',    toz:'Nejca',    mest:'Nejcu'    },
    'nikola':  { rod:'Nikole',   daj:'Nikoli',   toz:'Nikolo',   mest:'Nikoli'   },
    'patrik':  { rod:'Patrika',  daj:'Patriku',  toz:'Patrika',  mest:'Patriku'  },
    'peter':   { rod:'Petra',    daj:'Petru',    toz:'Petra',    mest:'Petru'    },
    'rok':     { rod:'Roka',     daj:'Roku',     toz:'Roka',     mest:'Roku'     },
    'sašo':    { rod:'Saša',     daj:'Sašu',     toz:'Saša',     mest:'Sašu'     },
    'simon':   { rod:'Simona',   daj:'Simonu',   toz:'Simona',   mest:'Simonu'   },
    'tadej':   { rod:'Tadeja',   daj:'Tadeju',   toz:'Tadeja',   mest:'Tadeju'   },
    'tibor':   { rod:'Tibora',   daj:'Tiboru',   toz:'Tibora',   mest:'Tiboru'   },
    'tim':     { rod:'Tima',     daj:'Timu',     toz:'Tima',     mest:'Timu'     },
    'tomaž':   { rod:'Tomaža',   daj:'Tomažu',   toz:'Tomaža',   mest:'Tomažu'   },
    'urban':   { rod:'Urbana',   daj:'Urbanu',   toz:'Urbana',   mest:'Urbanu'   },
    'vid':     { rod:'Vida',     daj:'Vidu',     toz:'Vida',     mest:'Vidu'     },
    'žiga':    { rod:'Žige',     daj:'Žigi',     toz:'Žigo',     mest:'Žigi'     },
  }

  const kljuc = lower
  if (izjeme[kljuc]) {
    return { ime: i, or: i, ...izjeme[kljuc] }
  }

  // ── SPLOŠNA PRAVILA za moška imena ────────────────────────────────────────

  // Imena na -o (npr. Sašo, Marko → že v izjemah, ampak kot varnostna mreža)
  if (lower.endsWith('o')) {
    const koren = i.slice(0, -1)
    return { ime: i, or: i, rod: koren+'a', daj: koren+'u', toz: koren+'a', mest: koren+'u' }
  }

  // Moška imena na -a (Luka, Miha, Žiga → v izjemah, varnostna mreža)
  if (lower.endsWith('a')) {
    const koren = i.slice(0, -1)
    return { ime: i, or: i, rod: koren+'e', daj: koren+'i', toz: koren+'o', mest: koren+'i' }
  }

  // Imena na -e (Jure, Mitje → v izjemah)
  if (lower.endsWith('e')) {
    return { ime: i, or: i, rod: i+'ta', daj: i+'tu', toz: i+'ta', mest: i+'tu' }
  }

  // Imena na -ej, -aj (Matej, Andrej, Tadej → izjeme, varnostna mreža)
  if (lower.endsWith('ej') || lower.endsWith('aj')) {
    return { ime: i, or: i, rod: i+'a', daj: i+'u', toz: i+'a', mest: i+'u' }
  }

  // Splošno: moška imena na soglasnik → dodaj -a/-u
  // (Janez, Blaž, Rok, Vid, Simon, Peter → vse v izjemah)
  // Za neznana tuja imena ali manjkajoče — dodaj -a/-u kot default
  return { ime: i, or: i, rod: i+'a', daj: i+'u', toz: i+'a', mest: i+'u' }
}

// ── SKLANJATEV PRIIMKOV ───────────────────────────────────────────────────────
function sklanjajPriimek(priimek, spol) {
  const p = priimek.trim()
  const s = (spol || 'M').toUpperCase()
  const lower = p.toLowerCase()

  // Ženska priimki — slovensko: priimek se ne sklanja (Novak, Kovač, Krajnc...)
  // Razen če se končajo na -ska, -čka ipd. (redko)
  if (s === 'Z' || s === 'Ž') {
    // Priimki na -ova, -eva (Novakova, Krajnceva)
    if (lower.endsWith('ova') || lower.endsWith('eva')) {
      const koren = p.slice(0, -1)
      return { or: p, rod: koren+'e', daj: koren+'i', toz: koren+'o', mest: koren+'i' }
    }
    // Večina ženskih priimkov se ne sklanja
    return { or: p, rod: p, daj: p, toz: p, mest: p }
  }

  // Moški priimki
  // Na -ic, -ič (Kovačič, Horvat...)
  if (lower.endsWith('ič') || lower.endsWith('ic')) {
    return { or: p, rod: p+'a', daj: p+'u', toz: p+'a', mest: p+'u' }
  }
  // Na -ec (Krajnec, Nemec...)
  if (lower.endsWith('ec')) {
    const koren = p.slice(0, -2)
    return { or: p, rod: koren+'ca', daj: koren+'cu', toz: koren+'ca', mest: koren+'cu' }
  }
  // Na -ar, -er, -or (Pekar, Meser...)
  if (lower.match(/(ar|er|or)$/)) {
    return { or: p, rod: p+'ja', daj: p+'ju', toz: p+'ja', mest: p+'ju' }
  }
  // Na -ak, -ok, -ek (Novak, Babič...)
  if (lower.match(/(ak|ok|ek)$/)) {
    return { or: p, rod: p+'a', daj: p+'u', toz: p+'a', mest: p+'u' }
  }
  // Na soglasnik — splošno
  return { or: p, rod: p+'a', daj: p+'u', toz: p+'a', mest: p+'u' }
}

// ── GLAVNA FUNKCIJA ───────────────────────────────────────────────────────────
// Vrne objekt s sklonji za ime IN priimek
// Primer: sklanjaj('Janez Novak', 'M')
// → { ime1: {or,rod,daj,toz,mest}, priimek: {or,rod,daj,toz,mest}, polno: {or,rod,daj,toz,mest} }
function sklanjaj(imeInPriimek, spol) {
  const deli = imeInPriimek.trim().split(/\s+/)
  const ime = deli[0]
  const priimek = deli.slice(1).join(' ')

  const sIme = sklanjajIme(ime, spol)
  const sPriimek = priimek ? sklanjajPriimek(priimek, spol) : null

  return {
    ime1: sIme,
    priimek: sPriimek,
    // Priročni getterji za polno ime v sklonu
    polno: {
      or:   ime + (priimek ? ' ' + priimek : ''),
      rod:  sIme.rod  + (sPriimek ? ' ' + sPriimek.rod  : ''),
      daj:  sIme.daj  + (sPriimek ? ' ' + sPriimek.daj  : ''),
      toz:  sIme.toz  + (sPriimek ? ' ' + sPriimek.toz  : ''),
      mest: sIme.mest + (sPriimek ? ' ' + sPriimek.mest : ''),
    }
  }
}

module.exports = { sklanjaj, sklanjajIme, sklanjajPriimek }
