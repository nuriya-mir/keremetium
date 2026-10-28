# Keremetium (`QazaqCore` & `ThoughtPassport`)

**Kazakh Thought-Construction Trainer & Deterministic Agglutinative Morphological Engine**  
*(Тренажёр построения мысли на казахском языке и детерминированное морфологическое ядро)*

- **Author:** Nuriya Mirsalimova (Founder of [armysyz.kz](https://armysyz.kz))
- **License:** MIT / Apache-2.0 (Dual-licensed Open Source Core)
- **Language:** TypeScript (Zero-dependency, offline-first deterministic core)

---

## 1. Why Keremetium Exists (Idea & Origin)

The name **Keremetium (Кереметиум)** comes from the Kazakh word **«керемет»** (*miracle, wonderful*).

The project grew out of a personal problem I faced for many years while learning foreign languages: traditional courses and apps teach isolated words and scattered grammar rules, but those pieces rarely come together into a single, whole picture of the language in the learner's head. When you actually want to say something of your own, you either freeze or translate word-for-word from Russian or English — which breaks down immediately in an agglutinative Turkic language like Kazakh.

Instead of organizing the trainer around textbook chapters (*"Lesson 14: The Instrumental Case"*), **Keremetium** organizes the entire language around **what a person wants, can, or needs to say** — **8 meaning directions**:

1. **Existence & presence** (*существование и наличие* — what exists, is present, or is absent);
2. **Desires, possibilities & necessity** (*желания, возможности и необходимость* — wanting, intending, being able, needing, asking permission);
3. **Actions & motion** (*действия и движение* — what happens, when, how, and in which direction);
4. **Possession & relations** (*принадлежность и отношения* — whose something is, for whom, and how people/things relate);
5. **Feelings & states** (*чувства и состояния* — what a person feels and what state they are in);
6. **Knowledge, thoughts & assumptions** (*знания, мысли и предположения* — knowing, thinking, doubting, assuming, retelling);
7. **Qualities & comparison** (*качества и сравнение* — what something is like and how it compares to others);
8. **Communication with others** (*общение с другим человеком* — greeting, asking, requesting, thanking, apologizing, agreeing).

### How Keremetium Works as a Whole System

Instead of forcing the learner to piece together rules from separate textbook chapters, **Keremetium** combines the entire language map, interactive parameter changes (person, politeness, tense, negation, quantity, spatial relation), visual assembly schemas, side-by-side meaning comparisons, plain-language explanations, and 12-item practice series inside a single **100% deterministic linguistic engine**.

---

## 2. Four-Layer Architecture (`src/core/`)

To make the engine maintainable and reusable across other Turkic languages (Kyrgyz, Uzbek, Tatar, Karakalpak, Bashkir), the core is strictly separated into four independent layers:

```text
src/core/
├── layer1-meanings/       # Universal Layer 1: Meaning Passports (ThoughtPassport),
│                          # 8 meaning directions, 93 working thoughts,
│                          # 214-entry thought corpus (221 readings), & thought graph
├── layer2-kazakh/         # Kazakh Layer 2: Phonetics (vowel/consonant harmony),
│                          # morphology (cases, possession, personal endings, tenses,
│                          # moods, participles, converbs, auxiliaries, frames),
│                          # and the 7-step deterministic phrase builder
├── layer3-sources/        # Layer 3: Practical catalog of 783 grammar items (IDs),
│                          # 2,037 conditional nearest-neighbor links,
│                          # and 21 interactive constructor entry points (8,840 contexts)
├── layer4-engine/         # Layer 4: 5-step diagnostic answer checker,
│                          # interactive constructor engine, own-phrase analyzer,
│                          # progress & spaced-return tracker, and card/flow builders
└── index.ts               # Public API exports
```

### Layer 1: Universal Meaning Passports (`layer1-meanings/`)
- **`types.ts`**: Defines the language-independent `ThoughtPassport` — speech goal (`IntentType`), semantic frame (`SemanticFrameType`: `action`, `existence`, `location`, `possession`, `naming`, `quality`, `state`, `desire`, `ability`, `necessity`, `obligation`), 8-register speaker/listener matrix (`1sg`, `2sg_informal`, `2sg_polite`, `2sg_plural`, `2pl_polite`, `3sg`, `1pl`, `3pl`), time reference, reality/modality, aspect (`habitual`, `ongoing_now`, `completed_result`, `attempt`, `sudden`), evidentiality, and participant roles.
- **`directions.ts`**: The 8 meaning directions, **93 working thoughts**, and 20 foundational rule groups.
- **`thought-corpus.ts` & `thought-graph.ts`**: Initial corpus of **214 Russian thought expressions (221 semantic readings)** and graph traversal between related meanings.

### Layer 2: Kazakh Phonetics, Morphology & 7-Step Builder (`layer2-kazakh/`)
- **`phonetics.ts`**: Exact vowel harmony (*үндестік заңы* — front/back, rounded/unrounded) and consonant assimilation (*ілгерінді ықпал* — unvoiced `к/қ/п/т/с/ш/...`, voiced `б/в/г/ғ/д/ж/з`, sonorants `р/л/й/у/м/н/ң`). Automatically handles Russian/Arabic/Persian loanword exceptions (*кітап → кітабым*, *мұғалім → мұғалімге*, *цех → цехқа*).
- **`morphology.ts` & `extended-morphology.ts`**: Complete tables for plural (`-лар/-лер/-дар/-дер/-тар/-тер`), possessive, 7 cases (`Атау, Ілік, Барыс, Табыс, Жатыс, Шығыс, Көмектес`), personal predicates (`-мын/-мін/-бын/-бін/-пын/-пін`), tenses, negation (`-ма/-ме/-ба/-бе/-па/-пе`, `емес`, `жоқ`), moods (`-ғы келу`, `-са/-се`, `-мақ/-мек`), participles (`-ған/-ген`, `-атын/-етін`, `-ар/-ер`), converbs (`-ып/-іп/-п`, `-а/-е/-й`, `-ғалы/-гелі`), postpositions, and auxiliary aspect verbs (`жатыр, отыр, тұр, жүр, қал, қой, жібер, сал, шық, ал, бер, көр, баста, біт`).
- **`builder.ts`**: Deterministic 7-step Kazakh sentence synthesizer that outputs both the target Kazakh phrase and a step-by-step `BuildStepTrace` explaining *why* each morpheme and consonant/vowel variant was chosen.

### Layer 3: Practical Catalog & Interactive Constructor (`layer3-sources/`)
- **`catalog.ts` & `practical-items-details.ts`**: **783 unique practical grammar items (IDs)** across 16 structural clusters (`A–P`), with assembly steps, usage boundaries, and **2,037 conditional nearest-neighbor links** (`conditional-links.ts`).
- **`constructor-v1-data.ts` & Waves 1–4 (`constructor-wave1-data.ts` .. `constructor-wave4-data.ts`)**: **21 interactive constructor entry points** and **8,840 prepared searchable contexts** (`154` source IDs bound). Learners can enter or pick a Russian thought, toggle parameters (person, politeness, tense, negation, quantity, case/postposition), see the visual assembly schema, compare neighboring meanings (e.g., *«хотел купить»* vs. whether the purchase actually happened), and launch a 12-item practice series.

### Layer 4: Diagnostic Answer Checker & Learning Engine (`layer4-engine/`)
- **`checker.ts`**: A 5-step diagnostic validator that never simply marks an answer "Wrong". It distinguishes between:
  1. Exact match;
  2. Accepted normative synonym (e.g., dropped optional pronoun `Мен бардым` = `Бардым`);
  3. Keyboard/Cyrillic layout typo (`қ/к`, `ң/н`, `ә/а`, `ү/ұ`, `і/и`);
  4. Vowel or consonant harmony mismatch (`-ге` instead of `-ға`) with exact phonetic explanation;
  5. Morpheme order or case confusion (e.g., swapping plural and possessive suffixes, or confusing *Барыс* `-ға` with *Жатыс* `-да`).
- **`own-phrase.ts`**: Parses a learner's own Russian sentence into a `ThoughtPassport` and routes it to the constructor and builder.
- **`progress.ts`**: Local-first skill mastery and self-assessment tracker without streaks, countdown timers, or punitive gamification.

---

## 3. Current Verified Status (as of October 28, 2026)

| Component | Verified Metric |
| :--- | :--- |
| **Meaning Architecture** | **8** meaning directions, **93** working thoughts, **20** foundational rule groups |
| **Initial Thought Corpus** | **214** Russian thought entries (**221** semantic readings) |
| **Practical Grammar Catalog** | **783** unique practical items (IDs) with **2,037** conditional nearest-neighbor links |
| **Interactive Constructor (Waves 1–4)** | **21** interactive entry points, **8,840** prepared searchable contexts, **154** bound catalog IDs |
| **Main Practice & Reference** | **50** cards, **23** main practice constructions, **58** core dictionary entries, **6** bottom reference guides (*Лица, Местоимения, Множественное число, Падежи, Отрицание, Звуки*), **12** exploration modes |

---

## 4. Open Roadmap (Next 5 Milestones)

1. **Milestone 1 — Full Interactive Constructor Coverage across the 783-Item Catalog:** Connect the remaining **629 practical items** (and complete the 154 partial bindings and 2,037 conditional neighbor links) into interactive visual schemas, search index, plain-language explanations, and 12-step practice series.
2. **Milestone 2 — Complete "Own Phrase & Short Text" Pipeline & Bidirectional Translation:** Upgrade the `own-phrase.ts` analyzer to resolve named participants, bridge arbitrary parsed thoughts to verified Kazakh synthesis, complete independent Kazakh-to-Russian and Russian-to-Kazakh translation flows, and support short connected texts (2–3 linked sentences).
3. **Milestone 3 — Spaced Return, Personal Mastery & Predictable "No-Surprises" Mode:** Connect the progress engine to voluntary self-assessment-driven spaced returns between sessions, confidence maps, "known word" toggles, global predictable "No-Surprises Mode", and targeted micro-warmups without streaks or timers.
4. **Milestone 4 — Daily-Use Reliability, Verified Offline PWA, Mobile Schema Legibility & Accessibility:** Verify cold offline launch, service-worker updates preserving active session state, client performance optimization for the 8,840+ context corpus on mobile devices, narrow-screen (`320 px`) visual schema legibility, text scaling, keyboard navigation, and screen-reader (`VoiceOver`) support.
5. **Milestone 5 — Independent Linguistic Review, Open Core Documentation & Public Release:** Conduct normative native-speaker/linguist proofreading of the expanded corpus, publish developer documentation for the separated 4-layer architecture so other Turkic languages can plug in, and ship the reproducible open release.

---

## 5. Generative AI & Development Methodology Disclosure

In accordance with open-source transparency and the **NLnet Foundation Generative AI Policy**:
1. **100% Deterministic Runtime Linguistic Engine:** At runtime, **Keremetium** does **not** use any Large Language Model or generative AI to generate, inflect, translate, or check Kazakh phrases. Every vowel/consonant harmony choice, suffix chain, visual schema, and diagnostic error hint is computed deterministically by the rule-based TypeScript engine in `src/core/`.
2. **Human-Led Architecture with AI Development & Documentation Assistance:** The learning methodology, the 8 meaning directions, the 4-layer architecture, and all 240+ documented product and linguistic decisions were conceived, directed, and verified step-by-step by the author (Nuriya Mirsalimova). During development, AI coding and drafting assistants were used under the author's supervision to help structure TypeScript code, run verification checks across the 783-item catalog, and edit/translate project documentation into English.
