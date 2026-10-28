# Keremetium

**Open-Source Kazakh Language Trainer for Building Your Own Thoughts**  
*(Открытый тренажёр казахского языка: от смысла и мысли — к живой фразе)*

- **Author:** Nuriya Mirsalimova (Founder of [armysyz.kz](https://armysyz.kz))
- **License:** MIT / Apache-2.0 (Dual-licensed Open Source)
- **Language:** TypeScript (Offline-first, works directly in the browser without a server)

---

## 1. Why Keremetium Exists (Idea & Origin)

The name **Keremetium (Кереметиум)** comes from the Kazakh word **«керемет»** (*miracle, wonderful*).

The project grew out of a personal problem I faced for many years while learning foreign languages: traditional courses, textbooks, and apps teach isolated words and scattered grammar rules, but those pieces rarely come together into a single, whole picture of the language in the learner's head. When you actually want to say something of your own, you either freeze or try to translate word-for-word from Russian or English — which immediately breaks down in Kazakh, where meaning is built by attaching endings step by step to the root word.

Instead of dividing the language into formal textbook chapters (*"Lesson 14: The Instrumental Case"*), **Keremetium** organizes the entire language around **what a person wants, can, or needs to say** — **8 meaning directions**:

1. **Existence & presence** (*существование и наличие* — what exists, is present, or is absent);
2. **Desires, possibilities & necessity** (*желания, возможности и необходимость* — wanting, intending, being able, needing, asking permission);
3. **Actions & motion** (*действия и движение* — what happens, when, how, and in which direction);
4. **Possession & relations** (*принадлежность и отношения* — whose something is, for whom, and how people/things relate);
5. **Feelings & states** (*чувства и состояния* — what a person feels and what state they are in);
6. **Knowledge, thoughts & assumptions** (*знания, мысли и предположения* — knowing, thinking, doubting, assuming, retelling);
7. **Qualities & comparison** (*качества и сравнение* — what something is like and how it compares to others);
8. **Communication with others** (*общение с другим человеком* — greeting, asking, requesting, thanking, apologizing, agreeing).

### How Keremetium Works as a Whole System

Instead of forcing the learner to piece together rules from separate textbook chapters, **Keremetium** brings together:
- the whole map of the language (8 meaning directions and 93 working thoughts);
- an **interactive phrase constructor** where you can change one detail of a thought (who is speaking, polite or informal address, time, negation, quantity, or place/direction) and immediately see how the Kazakh phrase rebuilds itself;
- visual block-by-block assembly schemas and plain-language explanations;
- side-by-side comparisons of close meanings (for example, *wanting to buy* vs. whether the purchase actually happened);
- a 12-item practice series and a smart answer checker that explains the exact reason for any mistake.

---

## 2. How the Code Is Organized (`src/core/`)

To keep the system clear and reusable for other Turkic languages (Kyrgyz, Uzbek, Tatar, Karakalpak, Bashkir), the core code in `src/core/` is divided into four parts:

```text
src/core/
├── layer1-meanings/       # Part 1 — Meanings: What the person wants to say
│                          # (8 meaning directions, 93 working thoughts,
│                          # 214 Russian thought expressions with 221 meanings)
├── layer2-kazakh/         # Part 2 — Kazakh Rules: Sound matching (hard/soft vowels,
│                          # consonant endings), word endings, and the 7-step phrase builder
├── layer3-sources/        # Part 3 — Catalog & Constructor Data: 783 practical grammar items,
│                          # 2,037 links between close meanings, and 21 constructor flows
├── layer4-engine/         # Part 4 — Practice & Answer Checker: 5-step mistake explanation,
│                          # own-phrase analysis, and calm progress tracking
└── index.ts               # Public exports
```

### Part 1: Meanings (`layer1-meanings/`)
- **`types.ts` & `directions.ts`**: Describes the meaning of a phrase before any Kazakh endings are attached — the 8 meaning directions, **93 working thoughts**, 20 foundational rule groups, who is speaking to whom (`Мен`, `Сен`, polite `Сіз`, `Ол`, `Біз`, `Сендер`, `Сіздер`, `Олар`), time, and certainty.
- **`thought-corpus.ts` & `thought-graph.ts`**: Initial collection of **214 everyday Russian thoughts (221 distinct meanings)** and links between related thoughts.

### Part 2: Kazakh Sound & Phrase-Building Rules (`layer2-kazakh/`)
- **`phonetics.ts`**: Handles Kazakh sound harmony — choosing the right hard or soft vowel variant and the right consonant variant (`к/қ`, `г/ғ`, `б/п/д/т`, `л/д/т`, `м/б/п`) when adding endings, including loanword exceptions (*кітап → кітабым*, *мұғалім → мұғалімге*, *цех → цехқа*).
- **`morphology.ts` & `extended-morphology.ts`**: All Kazakh endings and helper verbs — plural, possession (*my, your, his/her*), 7 cases (*where, where to, where from, whom, with whom*), personal endings, tenses, negation, moods, and helper verbs that show how an action unfolds (`жатыр, отыр, тұр, жүр, қал, қой, жібер, сал, шық, ал, бер, көр`).
- **`builder.ts`**: Assembles a Kazakh phrase in 7 clear steps and records a plain-language explanation of why each ending was chosen.

### Part 3: Catalog of 783 Constructions & Interactive Constructor (`layer3-sources/`)
- **`catalog.ts` & `practical-items-details.ts`**: **783 practical grammar constructions** with step-by-step assembly rules, usage boundaries, and **2,037 links to neighboring constructions** (`conditional-links.ts`).
- **`constructor-v1-data.ts` & Waves 1–4**: **21 interactive constructor entry points** and **8,840 prepared searchable contexts** (`154` catalog items already connected).

### Part 4: Mistake Explanation & Calm Practice (`layer4-engine/`)
- **`checker.ts`**: Checks the learner's answer in 5 steps instead of just saying "Wrong":
  1. Exact match;
  2. Valid alternative way to say the same thought (for example, omitting an optional pronoun: `Мен бардым` = `Бардым`);
  3. Simple keyboard typo (`қ/к`, `ң/н`, `ә/а`, `ү/ұ`, `і/и`);
  4. Hard/soft vowel or consonant mismatch (`-ге` instead of `-ға`) with a clear explanation of the sound rule;
  5. Wrong ending order or mixed-up case ending (for example, confusing *where to* `-ға` with *where* `-да`).
- **`own-phrase.ts`**: Lets the learner type their own Russian phrase and finds the matching Kazakh construction.
- **`progress.ts`**: Saves learning progress locally on the device without streaks, points, or countdown timers.

---

## 3. Current Verified Status (as of October 28, 2026)

| Component | Verified Metric |
| :--- | :--- |
| **Meaning Structure** | **8** meaning directions, **93** working thoughts, **20** foundational rule groups |
| **Initial Thought Collection** | **214** Russian thought entries (**221** meanings) |
| **Practical Grammar Catalog** | **783** unique practical items (IDs) with **2,037** links between close meanings |
| **Interactive Constructor (Waves 1–4)** | **21** interactive entry points, **8,840** prepared searchable contexts, **154** connected catalog IDs |
| **Main Practice & Reference** | **50** cards, **23** main practice constructions, **58** core dictionary words, **6** bottom reference guides (*Лица, Местоимения, Множественное число, Падежи, Отрицание, Звуки*), **12** exploration modes |

---

## 4. Open Roadmap (Next 5 Milestones)

1. **Milestone 1 — Connect All 783 Catalog Items to the Interactive Constructor:** Wire the remaining **629 practical items** (and complete the 154 partial connections and 2,037 neighbor links) into interactive visual assembly schemas, search, plain-language explanations, and 12-step practice series.
2. **Milestone 2 — Complete "Own Phrase & Short Text" Mode & Two-Way Translation:** Upgrade the `own-phrase.ts` analyzer to recognize names of people, connect parsed thoughts to Kazakh phrase assembly, complete independent Kazakh-to-Russian and Russian-to-Kazakh translation flows, and add practice with short connected texts (2–3 linked sentences).
3. **Milestone 3 — Spaced Review, Personal Mastery Map & "No-Surprises" Mode:** Connect progress tracking to calm spaced review between sessions based on the learner's own self-assessment, a confidence map across the 8 meaning directions, "I know this word" toggles, a predictable "No-Surprises Mode", and short targeted warmups without streaks or timers.
4. **Milestone 4 — Offline PWA Reliability, Mobile Visual Schemas & Accessibility:** Verify full offline operation, seamless updates without losing an active session, fast search across 8,840+ contexts on budget phones, readable visual schemas on narrow screens (`320 px`), text scaling, keyboard navigation, and screen-reader (`VoiceOver`) support.
5. **Milestone 5 — Native Linguist Proofreading, Open Documentation & Public Release:** Have native Kazakh teachers/philologists review the expanded examples and explanations, publish clear developer documentation so other Turkic languages can reuse the meaning layer, and ship the `v1.0` open release.

---

## 5. Generative AI & Development Methodology Disclosure

In accordance with open-source transparency and the **NLnet Foundation Generative AI Policy**:
1. **100% Rule-Based Phrase Building (No AI Guessing at Runtime):** Inside the app, **Keremetium** does **not** use AI to generate, translate, or check Kazakh phrases. Every ending, sound match, visual schema, and mistake explanation works strictly by verified rules in `src/core/`.
2. **Human-Led Design with AI Development & Documentation Assistance:** The learning method, the 8 meaning directions, the 4-part code structure, and all 246 documented product decisions (`K1–K246`) were created, directed, and verified step-by-step by the author (Nuriya Mirsalimova). During development, AI coding and drafting assistants were used under the author's direction to help write TypeScript code, run automated checks across the 783-item catalog, and translate project documentation into English.
