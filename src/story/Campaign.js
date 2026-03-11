// ============================================================
// Campaign — Fight definitions & progression
// ============================================================

export const fights = [
    {
        name: 'QUALIFIER',
        enemies: 2,
        freeBikes: 3,
        managerBefore: [
            "Hey kid, welcome to the big leagues.",
            "I got you a warm-up match tonight. Two rookies on the grid.",
            "Nothing fancy — just get in there and derezz 'em.",
            "Show 'em what you're made of. I'll be watching from up here."
        ],
        managerAfter: [
            "Not bad, not bad at all!",
            "The crowd loved it. You're gonna be a star, kid.",
            "I already got calls coming in for your next match."
        ]
    },
    {
        name: 'RISING HEAT',
        enemies: 3,
        freeBikes: 4,
        managerBefore: [
            "Alright champ, word's getting around about you.",
            "Tonight you've got three riders — they're not rookies either.",
            "Watch for the yellow one. Heard he likes to cut people off.",
            "Stay sharp and use your disc. You got this."
        ],
        managerAfter: [
            "Three down! The sponsors are calling!",
            "You're moving up the ranks fast, kid.",
            "Next one's gonna be tougher though. Rest up."
        ]
    },
    {
        name: 'NEON GAUNTLET',
        enemies: 4,
        freeBikes: 5,
        managerBefore: [
            "Big night tonight. Four riders and they're hungry.",
            "This is the match that put me on the map back in my day.",
            "They'll try to box you in with trails. Don't let 'em.",
            "Use the open bikes if yours gets trashed. Go get 'em."
        ],
        managerAfter: [
            "FOUR! You took down four! Unbelievable!",
            "The whole city's talking about you.",
            "I'm booking you into the invitational. This is the big time."
        ]
    },
    {
        name: 'THE INVITATIONAL',
        enemies: 5,
        freeBikes: 6,
        managerBefore: [
            "This is it. The Invitational. Five elite riders.",
            "Each one of them has earned their spot. Just like you.",
            "The red one — they call him 'The Virus'. Watch your back.",
            "No second chances in there. Win this and you're a legend."
        ],
        managerAfter: [
            "You absolute MONSTER! Five elites — GONE!",
            "They're already calling you 'The Anomaly'.",
            "But there's one more fight. The champion wants you personally."
        ]
    },
    {
        name: 'GRID CHAMPIONSHIP',
        enemies: 6,
        freeBikes: 8,
        managerBefore: [
            "Kid... this is the Grid Championship.",
            "Six of the deadliest riders the system has ever produced.",
            "The champion's in there too. Cyan bike. Never been beaten.",
            "Everything we've worked for comes down to this.",
            "Go out there and make history."
        ],
        managerAfter: [
            "CHAMPION! YOU ARE THE GRID CHAMPION!",
            "I can't believe it! From nobody to the top of the grid!",
            "The whole system is yours now, kid.",
            "...But between you and me, I hear there's a secret circuit.",
            "We'll talk about that later. Tonight — we celebrate!"
        ]
    },
    {
        name: 'SECRET CIRCUIT',
        enemies: 8,
        freeBikes: 10,
        managerBefore: [
            "So... the secret circuit. It's real.",
            "Eight riders. No rules. The arena is bigger.",
            "Nobody's ever walked out of this one.",
            "But nobody's ever been you, either. Let's end this."
        ],
        managerAfter: [
            "It's over. You've beaten every rider in the system.",
            "There's nobody left who can touch you.",
            "You are the GRID MASTER.",
            "Take it easy up here. You've earned it."
        ]
    }
];

export function getFight(index) {
    if (index >= fights.length) return null;
    return fights[index];
}
