// Fantasy Top Chef Scoring Simulation
// Run: npx tsx scripts/simulate.ts

type EpResult = {
  qf?: "WIN" | "HIGH" | "LOW";
  elim: "WIN" | "HIGH" | "IN" | "LOW" | "OUT" | null;
  lck?: boolean;
};

type ChefSeason = { name: string; episodes: EpResult[] };
type Season = { name: string; chefs: ChefSeason[] };

// Helper to build episode arrays concisely
// elim string: W=WIN, H=HIGH, I=IN, L=LOW, O=OUT, -=null (not competing)
// qf string: W=WIN, H=HIGH, L=LOW, .=none
function parseChef(
  name: string,
  elim: string,
  qf?: string,
  lckEpisodes?: number[]
): ChefSeason {
  const elimCodes: Record<string, EpResult["elim"]> = {
    W: "WIN", H: "HIGH", I: "IN", L: "LOW", O: "OUT", "-": null,
  };
  const qfCodes: Record<string, EpResult["qf"] | undefined> = {
    W: "WIN", H: "HIGH", L: "LOW", ".": undefined,
  };
  const episodes: EpResult[] = [];
  for (let i = 0; i < elim.length; i++) {
    episodes.push({
      elim: elimCodes[elim[i]] ?? null,
      qf: qf ? qfCodes[qf[i]] : undefined,
      lck: lckEpisodes?.includes(i) ?? false,
    });
  }
  return { name, episodes };
}

// ============================================================
// SEASON 19: Houston (15 chefs, 14 episodes)
// Quickfire: only winners known (no top/bottom)
// ============================================================
const season19: Season = {
  name: "Season 19 (Houston)",
  chefs: [
    //                   Ep: 1  2  3  4  5  6  7  8  9 10 11 12 13 14
    //                  QF:  W=win only known
    parseChef("Buddha",      "IILWHHI HLWWHIW", "W..........W....".replace(/\./g, ".").slice(0, 14), undefined),
  ],
};

// Actually let me redo this more carefully with the parse function.
// The elim/qf strings must be exactly 14 chars for 14 episodes.

// Season 19 - only QF winners known
// QF winners by episode: Ep1:Buddha/Jo/Monique, Ep2:Damarr, Ep4:Jackson, Ep5:Nick,
// Ep6:Ashleigh/Nick, Ep7:Buddha, Ep9:Damarr, Ep10:Nick, Ep11:Evelyn, Ep13:Sarah
// Chefs not competing in an episode get null elim

const s19: Season = {
  name: "Season 19 (Houston)",
  chefs: [
    // Buddha: QF wins Ep1, Ep7
    parseChef("Buddha",
      "IILWHHI" + "HLWWHIW",
      "W.....W" + "...... .",
    ),
    // Evelyn: QF win Ep11
    parseChef("Evelyn",
      "IIHLWWW" + "LIHHIWI", // Ep14 = I for runner-up, let's use HIGH or IN. Actually WINNER/RUNNER-UP - let me think.
      // WINNER and RUNNER-UP aren't scored differently in the plan. Let me treat WINNER as WIN and RUNNER-UP as HIGH for finale.
      ".........." + "W...",
    ),
    // etc.
  ],
};

// OK, this approach with string concatenation is error-prone. Let me use arrays directly.

// ============================================================
// Let me restart with a cleaner approach
// ============================================================

function ep(elim: "W"|"H"|"I"|"L"|"O"|null, qf?: "W"|"H"|"L", lck?: boolean): EpResult {
  const elimMap = { W: "WIN", H: "HIGH", I: "IN", L: "LOW", O: "OUT" } as const;
  const qfMap = { W: "WIN", H: "HIGH", L: "LOW" } as const;
  return {
    elim: elim ? elimMap[elim] : null,
    qf: qf ? qfMap[qf] : undefined,
    lck: lck ?? false,
  };
}

// Shorthand
const W = "W" as const, H = "H" as const, I = "I" as const, L = "L" as const, O = "O" as const;
const qW = "W" as const, qH = "H" as const, qL = "L" as const;

// ============================================================
// SEASON 19: Houston
// Finale: WINNER = WIN, RUNNER-UP = HIGH
// QF only has winners (no top/bottom). Everyone else gets no QF score.
// ============================================================

const season19Data: Season = {
  name: "Season 19 (Houston)",
  chefs: [
    { name: "Buddha", episodes: [
      ep(I, qW), ep(I), ep(L), ep(W), ep(H), ep(H), ep(I), ep(H), ep(L), ep(W, qW), ep(W), ep(H), ep(I), ep(W),
      //QF: Ep1 win, Ep7 win => wait, let me recheck. QF wins: Ep1:Buddha, Ep7:Buddha
      // Correction: Ep10 QF winner is Nick not Buddha. Let me fix.
    ]},
    // Let me be more careful and lay this out properly.
  ],
};

// I'll redo this completely, being very precise about the data.

// ============================================================
// SEASON 19: Houston - 15 chefs, 14 episodes
// QF winners: Ep1:Buddha/Jo/Monique, Ep2:Damarr, Ep3:none, Ep4:Jackson,
//   Ep5:Nick, Ep6:Ashleigh/Nick, Ep7:Buddha, Ep8:none, Ep9:Damarr,
//   Ep10:Nick, Ep11:Evelyn, Ep12:none, Ep13:Sarah, Ep14:none
// LCK: Ashleigh returned Ep6, Sarah returned Ep11
// Finale (Ep14): Buddha=WINNER, Evelyn=RUNNER-UP, Sarah=RUNNER-UP
// ============================================================

const S19_CHEFS: ChefSeason[] = [
  { name: "Buddha", episodes: [
    ep(I,qW), ep(I), ep(L), ep(W), ep(H), ep(H), ep(I,qW), ep(H), ep(L), ep(W), ep(W), ep(H), ep(I), ep(W),
  ]},
  { name: "Evelyn", episodes: [
    ep(I), ep(I), ep(H), ep(L), ep(W), ep(W), ep(W), ep(L), ep(I), ep(H), ep(H,qW), ep(I), ep(W), ep(H),
  ]},
  { name: "Sarah", episodes: [
    ep(H), ep(L), ep(I), ep(O), null,null,null,null,null,null, ep(L,undefined,true), ep(W), ep(I,qW), ep(H),
    // OUT Ep4, returns Ep11 via LCK. Ep11: LOW elim. Ep13: QF win.
  ].map(e => e ?? { elim: null }),
  },
  { name: "Damarr", episodes: [
    ep(I), ep(W,qW), ep(I), ep(I), ep(I), ep(I), ep(I), ep(H), ep(H,qW), ep(L), ep(H), ep(L), ep(O), null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Nick", episodes: [
    ep(I), ep(I), ep(I), ep(I), ep(I,qW), ep(I,qW), ep(W), ep(H), ep(I), ep(H,qW), ep(L), ep(O), null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Ashleigh", episodes: [
    ep(I), ep(I), ep(L), ep(H), ep(O), ep(L,qW,true), ep(I), ep(W), ep(L), ep(L), ep(O), null, null, null,
    // OUT Ep5, returns Ep6 via LCK. QF win Ep6.
  ].map(e => e ?? { elim: null }),
  },
  { name: "Jae", episodes: [
    ep(L), ep(I), ep(W), ep(I), ep(I), ep(I), ep(L), ep(I), ep(W), ep(O), null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Luke", episodes: [
    ep(I), ep(L), ep(I), ep(H), ep(I), ep(L), ep(I), ep(L), ep(O), null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Jackson", episodes: [
    ep(H), ep(I), ep(H), ep(W,qW), ep(H), ep(H), ep(W), ep(O), null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Jo", episodes: [
    ep(I,qW), ep(I), ep(I), ep(L), ep(L), ep(I), ep(O), null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Monique", episodes: [
    ep(I,qW), ep(I), ep(I), ep(I), ep(L), ep(O), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Robert", episodes: [
    ep(W), ep(I), ep(I), ep(O), null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Sam", episodes: [
    ep(I), ep(I), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Stephanie", episodes: [
    ep(L), ep(O), null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Leia", episodes: [
    ep(O), null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
];

// ============================================================
// SEASON 21: Wisconsin - 16 chefs, 14 episodes
// QF data: full win/top/bottom
// LCK: Kaleena returned Ep6, Soo new at Ep6, Laura returned Ep11
// Finale (Ep14): Danny=WINNER, Dan=RUNNER-UP, Savannah=RUNNER-UP
// ============================================================

const S21_CHEFS: ChefSeason[] = [
  { name: "Danny", episodes: [
    ep(H), ep(I), ep(I), ep(W), ep(I), ep(W), ep(I,qW), ep(H), ep(I,qW), ep(W,qL), ep(H,qL), ep(L,qH), ep(W,qW), ep(W),
  ]},
  { name: "Dan", episodes: [
    ep(I), ep(I), ep(H), ep(I), ep(W), ep(H), ep(L), ep(W), ep(H,qH), ep(H,qL), ep(H,qH), ep(L,qL), ep(I,qW), ep(H),
  ]},
  { name: "Savannah", episodes: [
    ep(I), ep(I), ep(I,qH), ep(I), ep(H), ep(H), ep(L), ep(H), ep(W), ep(L,qW), ep(I,qW), ep(W,qW), ep(L), ep(H),
  ]},
  { name: "Laura", episodes: [
    ...[ep(I), ep(I,qW), ep(I), ep(I), ep(L), ep(I), ep(I), ep(L), ep(O)],
    null, // Ep10: not competing
    ep(W,qL,true), // Ep11: LCK return, QF bottom
    ep(H,qH), // Ep12
    ep(O), // Ep13
    null, // Ep14
  ].map(e => e ?? { elim: null }),
  },
  { name: "Manny", episodes: [
    ep(W), ep(H), ep(L,qL), ep(I), ep(L,qL), ep(I,qL), ep(I), ep(L), ep(I,qL), ep(L,qL), ep(L,qL), ep(O,qW), null, null,
    // Ep12: QF win (part 1) but also bottom (part 2). I'll count QF WIN since that's more significant.
  ].map(e => e ?? { elim: null }),
  },
  { name: "Michelle", episodes: [
    ep(H), ep(I), ep(W,qH), ep(I), ep(H,qL), ep(L,qW), ep(W), ep(H), ep(L,qH), ep(H,qL), ep(O,qH), null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Soo", episodes: [
    // Entered at Ep6 (new competitor)
    ...[null, null, null, null, null],
    ep(H), ep(I), ep(L), ep(H,qH), ep(O), null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Amanda", episodes: [
    ep(L), ep(I), ep(I), ep(I), ep(I,qL), ep(I,qH), ep(H,qH), ep(H), ep(O,qL), null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Kaleena", episodes: [
    ep(I), ep(I), ep(H), ep(O),
    null, // Ep5: not competing (LCK)
    ep(I,qH,true), // Ep6: LCK return
    ep(H), ep(O), null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Kevin", episodes: [
    ep(I), ep(L,qH), ep(L,qH), ep(I), ep(I,qL), ep(I), ep(O), null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Rasika", episodes: [
    ep(I), ep(W,qW), ep(I), ep(W), ep(I), ep(O), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Charly", episodes: [
    ep(I), ep(L), ep(I,qL), ep(I), ep(O,qW), null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Alisha", episodes: [
    ep(I), ep(I), ep(I,qL), ep(O), null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Kenny", episodes: [
    ep(L), ep(H,qL), ep(O,qL), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Valentine", episodes: [
    ep(I), ep(O,qL), null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "David", episodes: [
    ep(O), null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
];

// ============================================================
// SEASON 22: Destination Canada - 15 chefs, 14 episodes
// QF data: full win/top/bottom
// LCK: Bailey returned Ep5, Cesar returned Ep10
// Finale (Ep14): Tristen=WINNER, Shuai=RUNNER-UP, Bailey=RUNNER-UP
// ============================================================

const S22_CHEFS: ChefSeason[] = [
  { name: "Tristen", episodes: [
    ep(I,qH), ep(H), ep(H), ep(W), ep(W), ep(H,qW), ep(W), ep(W), ep(H,qH), ep(L,qL), ep(H,qH), ep(H), ep(I,qW), ep(W),
  ]},
  { name: "Shuai", episodes: [
    ep(H,qH), ep(H,qW), ep(I,qH), ep(L,qH), ep(I), ep(L,qL), ep(H), ep(L), ep(I,qH), ep(W,qH), ep(H,qW), ep(W), ep(W), ep(H),
  ]},
  { name: "Bailey", episodes: [
    ep(I), ep(O),
    null, null, // Ep3-4: not competing (LCK)
    ep(W,undefined,true), // Ep5: LCK return, won elimination
    ep(I), ep(I), ep(I), ep(H,qL), ep(H,qL), ep(L,qH), ep(L), ep(I), ep(H),
  ].map(e => e ?? { elim: null }),
  },
  { name: "Cesar", episodes: [
    ep(H,qW), ep(H), ep(I,qL), ep(I), ep(H), ep(H,qH), ep(L,qL), ep(I), ep(O,qL),
    ep(L,undefined,true), // Ep10: LCK return
    ep(L,qL), ep(H), ep(O), null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Massimo", episodes: [
    ep(I,qH), ep(I,qH), ep(L,qL), ep(I,qL), ep(I), ep(W,qH), ep(I,qH), ep(H), ep(W,qL), ep(H,qH), ep(W,qL), ep(O), null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Lana", episodes: [
    ep(I,qH), ep(H), ep(I), ep(I), ep(L), ep(H), ep(I), ep(H), ep(L,qW), ep(L,qL), ep(O,qL), null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Vinny", episodes: [
    ep(W,qH), ep(I), ep(I), ep(I), ep(L), ep(I,qL), ep(H), ep(H), ep(L,qH), ep(O,qL), null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Paula", episodes: [
    ep(I,qH), ep(H,qL), ep(L), ep(I), ep(I), ep(H,qH), ep(L,qL), ep(O), null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Henry", episodes: [
    ep(H,qH), ep(L), ep(I), ep(L,qL), ep(I), ep(L,qL), ep(O,qW), null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Katianna", episodes: [
    ep(I,qW), ep(I), ep(W,qW), ep(I), ep(H), ep(O), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Corwin", episodes: [
    ep(I), ep(I), ep(H), ep(H,qW), ep(O), null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Kat", episodes: [
    ep(L), ep(I,qH), ep(I,qL), ep(H,qH), ep(O), null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Zubair", episodes: [
    ep(I), ep(W), ep(I,qH), ep(O), null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Anya", episodes: [
    ep(H,qH), ep(I), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
  { name: "Mimi", episodes: [
    ep(O,qW), null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }),
  },
];

// ============================================================
// SEASON 15: Colorado - 15 chefs (+1 LCK entry Lee Anne, but she withdrew)
// + 4 LCK returnees competed; Lee Anne joined at Ep5, withdrew Ep6
// 14 episodes. QF only has winners.
// Joe F. OUT Ep9, returned Ep11 via LCK. Claudette OUT Ep2, returned Ep5 via LCK, OUT Ep8.
// Laura eliminated in QF (Ep3). Lee Anne joined Ep5, withdrew Ep6.
// Finale: Joe F.=WINNER, Adrienne=RUNNER-UP
// QF winners: Ep1:Tu, Ep2:JoeF, Ep3:Brother, Ep4:Adrienne, Ep5:none,
//   Ep6:Chris, Ep7:Carrie, Ep8:none, Ep9:Carrie, Ep10:Chris, Ep11:Carrie, Ep12:JoeS, Ep13:JoeF, Ep14:none
// ============================================================

const S15_CHEFS: ChefSeason[] = [
  // Joe Flamm: IN,IN,IN,LOW,IN,IN,HIGH,WIN,OUT,-,HIGH(LCK),IN,WIN,WINNER
  { name: "Joe F.", episodes: [
    ep(I), ep(I,qW), ep(I), ep(L), ep(I), ep(I), ep(H), ep(W), ep(O),
    null,
    ep(H,undefined,true), ep(I), ep(W,qW), ep(W),
  ].map(e => e ?? { elim: null }) },
  // Adrienne: LOW,LOW,LOW,IN(QFwin),IN,LOW,IN,HIGH,LOW,HIGH,HIGH,WIN,LOW,RUNNER-UP
  { name: "Adrienne", episodes: [
    ep(L), ep(L), ep(L), ep(I,qW), ep(I), ep(L), ep(I), ep(H), ep(L), ep(H), ep(H), ep(W), ep(L), ep(H),
  ] },
  // Joe Sasto: IN,IN,WIN,HIGH,IN,LOW,WIN,LOW,LOW,WIN,WIN,IN,OUT,-
  { name: "Joe S.", episodes: [
    ep(I), ep(I), ep(W), ep(H), ep(I), ep(L), ep(W), ep(L), ep(L), ep(W), ep(W), ep(I,qW), ep(O), null,
  ].map(e => e ?? { elim: null }) },
  // Carrie: LOW,WIN,IN,IN,HIGH,IN,IN,HIGH,WIN,HIGH,LOW,OUT,-,-
  { name: "Carrie", episodes: [
    ep(L), ep(W), ep(I), ep(I), ep(H), ep(I), ep(I,qW), ep(H), ep(W,qW), ep(H), ep(L,qW), ep(O), null, null,
  ].map(e => e ?? { elim: null }) },
  // Chris Scott: HIGH,HIGH,LOW,WIN,LOW,IN(QFwin),LOW,LOW,WIN,LOW,OUT,-,-,-
  { name: "Chris", episodes: [
    ep(H), ep(H), ep(L), ep(W), ep(L), ep(I,qW), ep(L), ep(L), ep(W), ep(L,qW), ep(O), null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Bruce: IN,IN,LOW,LOW,WIN,HIGH,HIGH,HIGH,LOW,OUT,-,-,-,-
  { name: "Bruce", episodes: [
    ep(I), ep(I), ep(L), ep(L), ep(W), ep(H), ep(H), ep(H), ep(L), ep(O), null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Fatima: HIGH,HIGH,HIGH,IN,IN,IN,IN,LOW,OUT,-,-,-,-,-
  { name: "Fatima", episodes: [
    ep(H), ep(H), ep(H), ep(I), ep(I), ep(I), ep(I), ep(L), ep(O), null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Claudette: IN,OUT,-,-,IN(LCK),HIGH,LOW,OUT,-,-,-,-,-,-
  { name: "Claudette", episodes: [
    ep(I), ep(O), null, null, ep(I,undefined,true), ep(H), ep(L), ep(O), null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Tanya: IN,HIGH,IN,HIGH,LOW,WIN,OUT,-,-,-,-,-,-,-
  { name: "Tanya", episodes: [
    ep(I), ep(H), ep(I), ep(H), ep(L), ep(W), ep(O), null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Brother: IN,IN,LOW,IN,IN,OUT,-,-,-,-,-,-,-,-
  { name: "Brother", episodes: [
    ep(I), ep(I), ep(L,qW), ep(I), ep(I), ep(O), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Lee Anne: joined Ep5, withdrew Ep6. HIGH,WDR
  { name: "Lee Anne", episodes: [
    null, null, null, null, ep(H), ep(I), null, null, null, null, null, null, null, null,
    // WDR = withdrawal, treat as OUT effectively but she got HIGH in ep5
    // Actually she withdrew ep6, so ep6 is not really scored. Let's say null for ep6 onwards.
  ].map(e => e ?? { elim: null }) },
  // Tu: IN,IN,LOW,IN,OUT,-,-,-,-,-,-,-,-,-  (QF win Ep1)
  { name: "Tu", episodes: [
    ep(I,qW), ep(I), ep(L), ep(I), ep(O), null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Tyler: WIN,LOW,HIGH,OUT,-,-,-,-,-,-,-,-,-,-
  { name: "Tyler", episodes: [
    ep(W), ep(L), ep(H), ep(O), null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Rogelio: IN,LOW,OUT,-,-,-,-,-,-,-,-,-,-,-
  { name: "Rogelio", episodes: [
    ep(I), ep(L), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Laura: IN,HIGH,OUT(QF elim),-,-,-,-,-,-,-,-,-,-,-
  { name: "Laura", episodes: [
    ep(I), ep(H), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Melissa: OUT,-,-,-,-,-,-,-,-,-,-,-,-,-
  { name: "Melissa", episodes: [
    ep(O), null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
];

// ============================================================
// SEASON 16: Kentucky - 15 chefs (+3 LCK returnees, Brother joined Ep6)
// 15 episodes. QF only has winners.
// Michelle OUT Ep10, returned Ep12 via LCK. Nini OUT Ep4/5 (two-part).
// Ep4-5 was a two-part episode (both count as one elimination result).
// Brother entered Ep6 via LCK.
// Finale: Kelsey=WINNER, Sara=RUNNER-UP
// QF winners: Ep1:Justin/Pablo/Sara, Ep2:David, Ep3:David, Ep4-5:Michelle,
//   Ep6:none, Ep7:Justin, Ep8:none, Ep9:Adrienne, Ep10:Eddie, Ep11:Sara, Ep12:Justin, Ep13:Michelle, Ep14:Michelle, Ep15:none
// ============================================================

const S16_CHEFS: ChefSeason[] = [
  // Kelsey: IN,IN,HIGH,LOW,HIGH,IN,WIN,LOW,IN,LOW,IN,WIN,LOW,WINNER
  // Note: Ep4-5 is two-part, treated as one episode result in the table. Actually the table shows 15 episodes.
  // Let me just follow the 15-episode structure from the table.
  { name: "Kelsey", episodes: [
    ep(I), ep(I), ep(H), ep(L), ep(H), ep(I), ep(W), ep(L), ep(I), ep(L), ep(I), ep(W), ep(L), ep(W),
    // Wait, the table has 15 episodes. Let me recount.
    // Ep1:IN, Ep2:IN, Ep3:HIGH, Ep4-5:LOW (colspan=2), Ep6:HIGH, Ep7:IN, Ep8:WIN, Ep9:LOW, Ep10:IN, Ep11:LOW, Ep12:IN, Ep13:WIN, Ep14:LOW, Ep15:WINNER
  ] },
  // Sara: IN,HIGH,IN,LOW,LOW,LOW,LOW,HIGH,HIGH,LOW,HIGH,WIN,LOW,WIN,RUNNER-UP
  { name: "Sara", episodes: [
    ep(I,qW), ep(H), ep(I), ep(L), ep(L), ep(L), ep(L), ep(H), ep(H), ep(L), ep(H,qW), ep(W), ep(L), ep(W), ep(H),
  ] },
  // Eric: IN,IN,IN,HIGH,WIN,IN,HIGH,IN,WIN,WIN,IN,LOW,LOW,OUT
  { name: "Eric", episodes: [
    ep(I), ep(I), ep(I), ep(H), ep(W), ep(I), ep(H), ep(I), ep(W), ep(W), ep(I), ep(L), ep(L), ep(O), null,
  ].map(e => e ?? { elim: null }) },
  // Michelle: IN,IN,IN,LOW,IN,IN,LOW,WIN,OUT,-,IN(LCK),HIGH,OUT,-
  { name: "Michelle", episodes: [
    ep(I,qW), ep(I), ep(I), ep(L), ep(I), ep(I), ep(L), ep(W,qW), ep(O), null,
    ep(I,undefined,true), ep(H,qW), ep(O,qW), null, null,
  ].map(e => e ?? { elim: null }) },
  // Adrienne W: LOW,HIGH,IN,HIGH,IN,HIGH,LOW,LOW,IN,HIGH,LOW,LOW,OUT,-,-
  { name: "Adrienne W.", episodes: [
    ep(L), ep(H), ep(I), ep(H), ep(I), ep(H), ep(L), ep(L), ep(I,qW), ep(H), ep(L), ep(L), ep(O), null, null,
  ].map(e => e ?? { elim: null }) },
  // Justin: IN,IN,IN,LOW,IN,HIGH,HIGH,HIGH,HIGH,LOW,OUT,-,-,-
  { name: "Justin", episodes: [
    ep(I,qW), ep(I), ep(I), ep(L), ep(I), ep(H,qW), ep(H), ep(H), ep(H), ep(L), ep(O,qW), null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Eddie: IN,IN,HIGH,HIGH,HIGH,WIN,LOW,LOW,IN,OUT,-,-,-,-,-
  // Note: Ep10 Eddie won QF and didn't compete in elimination. Treat as IN.
  { name: "Eddie", episodes: [
    ep(I), ep(I), ep(H), ep(H), ep(H), ep(W), ep(L), ep(L), ep(I,qW), ep(I), ep(O), null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // David: HIGH,HIGH,IN,LOW,IN,IN,LOW,OUT,-,-,-,-,-,-,-
  { name: "David", episodes: [
    ep(H), ep(H,qW), ep(I,qW), ep(L), ep(I), ep(I), ep(L), ep(O), null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Brian: IN,IN,LOW,WIN,LOW,LOW,OUT,-,-,-,-,-,-,-,-
  { name: "Brian", episodes: [
    ep(I), ep(I), ep(L), ep(W), ep(L), ep(L), ep(O), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Brandon: IN,LOW,IN,LOW,IN,OUT,-,-,-,-,-,-,-,-,-
  { name: "Brandon", episodes: [
    ep(I), ep(L), ep(I), ep(L), ep(I), ep(O), null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Brother: joined Ep6 via LCK, OUT Ep6
  { name: "Brother", episodes: [
    null, null, null, null, null, ep(O,undefined,true), null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Nini: IN,WIN,WIN,OUT,-,-,-,-,-,-,-,-,-,-,-
  { name: "Nini", episodes: [
    ep(I), ep(W), ep(W), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Pablo: HIGH,LOW,LOW,OUT,-,-,-,-,-,-,-,-,-,-,-
  { name: "Pablo", episodes: [
    ep(H,qW), ep(L), ep(L), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Kevin: LOW,HIGH,OUT,-,-,-,-,-,-,-,-,-,-,-,-
  { name: "Kevin", episodes: [
    ep(L), ep(H), ep(O), null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Natalie: WIN,OUT,-,-,-,-,-,-,-,-,-,-,-,-,-
  { name: "Natalie", episodes: [
    ep(W), ep(O), null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Caitlin: OUT,-,-,-,-,-,-,-,-,-,-,-,-,-,-
  { name: "Caitlin", episodes: [
    ep(O), null, null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
];

// ============================================================
// SEASON 18: Portland - 15 chefs, 14 episodes
// QF only has winners.
// Jamie OUT Ep5, returned Ep7 via LCK. Ep10 tournament format (no HIGH/LOW, just IN).
// Finale (Ep14): Gabe=WINNER, Shota=RUNNER-UP, Dawn=RUNNER-UP
// QF winners: Ep1:Kiki/Sara/Sasha, Ep2:Jamie, Ep3:Avishar, Ep4:Chris, Ep5:Chris,
//   Ep6:Gabriel, Ep7:Shota, Ep8:none, Ep9:Dawn, Ep10:Dawn, Ep11:Dawn, Ep12:Jamie, Ep13:Gabe, Ep14:none
// ============================================================

const S18_CHEFS: ChefSeason[] = [
  // Gabe: HIGH,HIGH,IN,WIN,IN,HIGH,IN,LOW,WIN,IN,WIN,LOW,IN,WINNER
  { name: "Gabe", episodes: [
    ep(H), ep(H), ep(I), ep(W), ep(I), ep(H), ep(I), ep(L), ep(W), ep(I), ep(W), ep(L), ep(I,qW), ep(W),
  ] },
  // Shota: HIGH,WIN,HIGH,IN,LOW,WIN,IN,HIGH,HIGH,IN,HIGH,WIN,WIN,RUNNER-UP
  { name: "Shota", episodes: [
    ep(H), ep(W), ep(H), ep(I), ep(L), ep(W), ep(I,qW), ep(H), ep(H), ep(I), ep(H), ep(W), ep(W), ep(H),
  ] },
  // Dawn: IN,HIGH,WIN,IN,HIGH,HIGH,HIGH,LOW,HIGH,IN,HIGH,LOW,IN,RUNNER-UP
  { name: "Dawn", episodes: [
    ep(I), ep(H), ep(W), ep(I), ep(H), ep(H), ep(H), ep(L), ep(H,qW), ep(I,qW), ep(H,qW), ep(L), ep(I), ep(H),
  ] },
  // Jamie: LOW,IN,HIGH,IN,OUT,-,WIN(LCK),HIGH,LOW,IN,LOW,OUT,-,-
  { name: "Jamie", episodes: [
    ep(L), ep(I,qW), ep(H), ep(I), ep(O), null,
    ep(W,undefined,true), ep(H), ep(L), ep(I), ep(L), ep(O,qW), null, null,
  ].map(e => e ?? { elim: null }) },
  // Maria: IN,IN,IN,IN,HIGH,LOW,LOW,WIN,HIGH,IN,OUT,-,-,-
  { name: "Maria", episodes: [
    ep(I), ep(I), ep(I), ep(I), ep(H), ep(L), ep(L), ep(W), ep(H), ep(I), ep(O), null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Byron: IN,LOW,IN,IN,WIN,LOW,IN,HIGH,LOW,OUT,-,-,-,-
  { name: "Byron", episodes: [
    ep(I), ep(L), ep(I), ep(I), ep(W), ep(L), ep(I), ep(H), ep(L), ep(O), null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Chris: IN,LOW,LOW,HIGH,IN,LOW,LOW,LOW,OUT,-,-,-,-,-
  { name: "Chris", episodes: [
    ep(I), ep(L), ep(L), ep(H,qW), ep(I,qW), ep(L), ep(L), ep(L), ep(O), null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Sara: WIN,HIGH,IN,IN,IN,WIN,HIGH,OUT,-,-,-,-,-,-
  { name: "Sara", episodes: [
    ep(W,qW), ep(H), ep(I), ep(I), ep(I), ep(W), ep(H), ep(O), null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Avishar: LOW,WIN,IN,LOW,HIGH,LOW,OUT,-,-,-,-,-,-,-
  { name: "Avishar", episodes: [
    ep(L), ep(W), ep(I,qW), ep(L), ep(H), ep(L), ep(O), null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Gabriel: HIGH,HIGH,IN,HIGH,LOW,OUT,-,-,-,-,-,-,-,-
  { name: "Gabriel", episodes: [
    ep(H), ep(H), ep(I), ep(H), ep(L), ep(O,qW), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Nelson: IN,IN,IN,LOW,IN,OUT,-,-,-,-,-,-,-,-
  { name: "Nelson", episodes: [
    ep(I), ep(I), ep(I), ep(L), ep(I), ep(O), null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Kiki: IN,IN,LOW,OUT,-,-,-,-,-,-,-,-,-,-
  { name: "Kiki", episodes: [
    ep(I,qW), ep(I), ep(L), ep(O), null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Brittanny: IN,LOW,OUT,-,-,-,-,-,-,-,-,-,-,-
  { name: "Brittanny", episodes: [
    ep(I), ep(L), ep(O), null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Sasha: LOW,OUT,-,-,-,-,-,-,-,-,-,-,-,-
  { name: "Sasha", episodes: [
    ep(L,qW), ep(O), null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
  // Roscoe: OUT,-,-,-,-,-,-,-,-,-,-,-,-,-
  { name: "Roscoe", episodes: [
    ep(O), null, null, null, null, null, null, null, null, null, null, null, null, null,
  ].map(e => e ?? { elim: null }) },
];

// ============================================================
// Scoring
// ============================================================

type ScoringConfig = {
  label: string;
  qfWin: number;
  qfHigh: number;
  qfLow: number;
  elimWin: number;
  elimHigh: number;
  elimLow: number;
  lck: number;
};

const BASELINE_SCORING: ScoringConfig = {
  label: "baseline", qfWin: 3, qfHigh: 1, qfLow: -1, elimWin: 5, elimHigh: 1, elimLow: -1, lck: 1,
};

function scoreChef(chef: ChefSeason, cfg: ScoringConfig): number {
  let score = 0;
  for (const e of chef.episodes) {
    if (e.qf === "WIN") score += cfg.qfWin;
    if (e.qf === "HIGH") score += cfg.qfHigh;
    if (e.qf === "LOW") score += cfg.qfLow;
    if (e.elim === "WIN") score += cfg.elimWin;
    if (e.elim === "HIGH") score += cfg.elimHigh;
    if (e.elim === "LOW") score += cfg.elimLow;
    if (e.lck) score += cfg.lck;
  }
  return score;
}

// ============================================================
// Draft Simulation
// ============================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function simulateDraft(chefScores: number[], numTeams: number, chefsPerTeam: number, maxPerChef: number): number[] {
  // Create a pool: each chef appears maxPerChef times
  const pool: number[] = [];
  for (let i = 0; i < chefScores.length; i++) {
    for (let j = 0; j < maxPerChef; j++) {
      pool.push(i);
    }
  }

  // Shuffle and deal
  const shuffled = shuffle(pool);
  const totalSlots = numTeams * chefsPerTeam;

  // Take first totalSlots from shuffled pool
  const picks = shuffled.slice(0, totalSlots);

  const teamScores: number[] = [];
  for (let t = 0; t < numTeams; t++) {
    let teamScore = 0;
    for (let p = 0; p < chefsPerTeam; p++) {
      const chefIdx = picks[t * chefsPerTeam + p];
      teamScore += chefScores[chefIdx];
    }
    teamScores.push(teamScore);
  }

  return teamScores;
}

// ============================================================
// Statistics
// ============================================================

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  return {
    mean: mean.toFixed(1),
    median: percentile(sorted, 50).toFixed(1),
    stdev: stdev.toFixed(1),
    min: sorted[0],
    max: sorted[n - 1],
    p10: percentile(sorted, 10).toFixed(1),
    p25: percentile(sorted, 25).toFixed(1),
    p75: percentile(sorted, 75).toFixed(1),
    p90: percentile(sorted, 90).toFixed(1),
  };
}

// ============================================================
// Main
// ============================================================

const SEASONS: Season[] = [
  { name: "Season 15 (Colorado)", chefs: S15_CHEFS },
  { name: "Season 16 (Kentucky)", chefs: S16_CHEFS },
  { name: "Season 18 (Portland)", chefs: S18_CHEFS },
  { name: "Season 19 (Houston)", chefs: S19_CHEFS },
  { name: "Season 21 (Wisconsin)", chefs: S21_CHEFS },
  { name: "Season 22 (Destination Canada)", chefs: S22_CHEFS },
];

// ============================================================
// Redraft Simulation
// ============================================================

// Score a chef for a range of episodes only
function scoreChefRange(chef: ChefSeason, cfg: ScoringConfig, fromEp: number, toEp: number): number {
  let score = 0;
  for (let i = fromEp; i < toEp && i < chef.episodes.length; i++) {
    const e = chef.episodes[i];
    if (e.qf === "WIN") score += cfg.qfWin;
    if (e.qf === "HIGH") score += cfg.qfHigh;
    if (e.qf === "LOW") score += cfg.qfLow;
    if (e.elim === "WIN") score += cfg.elimWin;
    if (e.elim === "HIGH") score += cfg.elimHigh;
    if (e.elim === "LOW") score += cfg.elimLow;
    if (e.lck) score += cfg.lck;
  }
  return score;
}

// Is a chef still active (competing) after episode N?
// Active = has at least one episode after N with a non-null elim result
function isActiveAfter(chef: ChefSeason, afterEp: number): boolean {
  for (let i = afterEp; i < chef.episodes.length; i++) {
    if (chef.episodes[i].elim !== null) return true;
  }
  return false;
}

// Simulate one full season with optional redraft
function simulateSeasonWithRedraft(
  chefs: ChefSeason[],
  cfg: ScoringConfig,
  numTeams: number,
  chefsPerTeam: number,
  maxPerChef: number,
  redraftAfterEp: number | null, // null = no redraft
  redraftMaxPerChefOverride?: number,
  redraftChefsPerTeam?: number, // if set, use different roster size for redraft
): number[] {
  const totalEps = chefs[0].episodes.length;

  if (redraftAfterEp === null) {
    // No redraft: random draft, score full season
    const fullScores = chefs.map(c => scoreChef(c, cfg));
    return simulateDraft(fullScores, numTeams, chefsPerTeam, maxPerChef);
  }

  // --- Phase 1: Random initial draft, score episodes 1..redraftAfterEp ---
  const phase1Scores = chefs.map(c => scoreChefRange(c, cfg, 0, redraftAfterEp));
  const phase1TeamScores = simulateDraft(phase1Scores, numTeams, chefsPerTeam, maxPerChef);

  // --- Redraft: reverse order by phase 1 score, pick best available ---
  // Determine active chefs for phase 2
  const activeChefIndices: number[] = [];
  const phase1ChefScores: { idx: number; score: number }[] = [];
  for (let i = 0; i < chefs.length; i++) {
    if (isActiveAfter(chefs[i], redraftAfterEp)) {
      activeChefIndices.push(i);
      phase1ChefScores.push({ idx: i, score: phase1Scores[i] });
    }
  }

  // Sort active chefs by phase 1 score descending (best first = picked first)
  phase1ChefScores.sort((a, b) => b.score - a.score);

  // Rank teams by phase 1 score ascending (worst first picks first)
  const teamOrder = phase1TeamScores
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => a.score - b.score)
    .map(t => t.idx);

  // Snake draft: round 1 worst-to-best, round 2 best-to-worst, etc.
  const teamRosters: number[][] = Array.from({ length: numTeams }, () => []);
  const chefPickCount: Record<number, number> = {};

  // Figure out max picks per chef for redraft
  const numActive = activeChefIndices.length;
  const rdRosterSize = redraftChefsPerTeam ?? chefsPerTeam;
  const totalNeeded = numTeams * rdRosterSize;
  const minRequired = Math.ceil(totalNeeded / numActive);
  const redraftMaxPerChef = redraftMaxPerChefOverride
    ? Math.max(redraftMaxPerChefOverride, minRequired)
    : minRequired;

  let chefQueue = [...phase1ChefScores]; // sorted best-to-worst
  let pickIdx = 0;

  for (let round = 0; round < rdRosterSize; round++) {
    const order = round % 2 === 0 ? [...teamOrder] : [...teamOrder].reverse();
    for (const teamIdx of order) {
      // Pick best available chef not at max
      let picked = false;
      for (const chef of chefQueue) {
        const count = chefPickCount[chef.idx] ?? 0;
        if (count < redraftMaxPerChef) {
          teamRosters[teamIdx].push(chef.idx);
          chefPickCount[chef.idx] = count + 1;
          picked = true;
          break;
        }
      }
      if (!picked) {
        // Fallback: just pick anyone (shouldn't happen with correct maxPerChef)
        teamRosters[teamIdx].push(chefQueue[0].idx);
      }
    }
  }

  // --- Phase 2: Score each team's redrafted roster for remaining episodes ---
  const phase2ChefScores = chefs.map(c => scoreChefRange(c, cfg, redraftAfterEp, totalEps));

  const totalTeamScores: number[] = [];
  for (let t = 0; t < numTeams; t++) {
    let total = phase1TeamScores[t];
    for (const chefIdx of teamRosters[t]) {
      total += phase2ChefScores[chefIdx];
    }
    totalTeamScores.push(total);
  }

  return totalTeamScores;
}

// ============================================================
// Main
// ============================================================

const NUM_SIMULATIONS = 10_000;
const NUM_TEAMS = 10;
const CHEFS_PER_TEAM = 4;
const cfg = BASELINE_SCORING;

// First, show capacity analysis for each season at ep6
console.log("=== REDRAFT CAPACITY ANALYSIS (ep6, max 3/chef) ===\n");
for (const season of SEASONS) {
  const active = season.chefs.filter(c => isActiveAfter(c, 6)).length;
  const capacity3 = active * 3;
  console.log(`${season.name}: ${active} active chefs × 3 = ${capacity3} slots`);
  console.log(`  10 teams × 2 chefs = 20  ${capacity3 >= 20 ? "OK" : "NO"}`);
  console.log(`  10 teams × 3 chefs = 30  ${capacity3 >= 30 ? "OK" : "NO"}`);
  console.log(`  8 teams × 3 chefs = 24   ${capacity3 >= 24 ? "OK" : "NO"}`);
  console.log(`  8 teams × 4 chefs = 32   ${capacity3 >= 32 ? "OK" : "NO"}`);
}
console.log();

const SCENARIOS = [
  { label: "No redraft, max 3/chef", maxPerChef: 3, redraftAfterEp: null as number | null, redraftMax: 3, redraftRoster: 4 },
  { label: "Ep6 redraft, max 3, redraft 2 chefs", maxPerChef: 3, redraftAfterEp: 6, redraftMax: 3, redraftRoster: 2 },
  { label: "Ep6 redraft, max 3, redraft 3 chefs", maxPerChef: 3, redraftAfterEp: 6, redraftMax: 3, redraftRoster: 3 },
];

for (const season of SEASONS) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${season.name} (${season.chefs.length} chefs)`);
  console.log(`${"=".repeat(70)}`);

  for (const scenario of SCENARIOS) {
    // Check capacity for initial draft
    const capacity = season.chefs.length * scenario.maxPerChef;
    const needed = NUM_TEAMS * CHEFS_PER_TEAM;
    if (needed > capacity) {
      console.log(`\n--- ${scenario.label} --- SKIPPED (need ${needed} slots, have ${capacity})`);
      continue;
    }

    const allTeamScores: number[] = [];
    for (let i = 0; i < NUM_SIMULATIONS; i++) {
      const teamScores = simulateSeasonWithRedraft(
        season.chefs, cfg, NUM_TEAMS, CHEFS_PER_TEAM, scenario.maxPerChef,
        scenario.redraftAfterEp, scenario.redraftMax, scenario.redraftRoster,
      );
      allTeamScores.push(...teamScores);
    }

    const s = stats(allTeamScores);
    const iqr = (parseFloat(s.p75) - parseFloat(s.p25)).toFixed(1);
    const cv = (parseFloat(s.stdev) / parseFloat(s.mean) * 100).toFixed(1);
    console.log(`\n--- ${scenario.label} ---`);
    console.log(`  Mean: ${s.mean}  StdDev: ${s.stdev}  IQR: ${iqr}  CV: ${cv}%`);
    console.log(`  Min: ${s.min}  P10: ${s.p10}  P25: ${s.p25}  Median: ${s.median}  P75: ${s.p75}  P90: ${s.p90}  Max: ${s.max}`);
  }
}
