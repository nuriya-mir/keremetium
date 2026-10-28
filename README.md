# Keremetium

**Open-Source Kazakh Language Trainer: From Meaning and Thought to Phrase**  
*(Открытый тренажёр казахского языка: от смысла того, что человек хочет сказать)*

- **Author:** Nuriya Mirsalimova (Founder of [armysyz.kz](https://armysyz.kz))
- **Domain:** [keremetium.kz](https://keremetium.kz)
- **License:** MIT / Apache-2.0 (Dual-licensed Open Source)
- **Language:** TypeScript (Offline-first, runs directly in the browser)

---

## 1. Idea & Story of Creation

Foreign languages have always been difficult for me. I tried to learn them for years, even decades, and joked that I would need a miracle to finally succeed. That is why the name **Keremetium (Кереметиум)** is very personal to me: it comes from the Kazakh word **«керемет»** — *miracle, wonderful, amazing*. This is the name I gave to the trainer where I gathered my own understanding of how it would be clearer for me to learn and practice a language.

Whenever I started learning a language, I always wanted to see the whole system first — to understand how everything is connected and what place each piece holds. Through conventional grammar study, that never worked for me. Even when rules are grouped into topics, they are still taught *as grammar rules*, and it was hard for me to fight my way through rules; the words, forms, tenses, and endings never came together into a whole picture in my head.

It became clearer to me when I looked at language **through the meaning of what a person wants to say**: to tell about oneself, express a wish, describe an action, share a feeling, explain a thought, or ask for something. That gave me a clear starting point: first what I mean, and then how to express it with the means of another language.

That is how I identified **8 meaning directions**:
1. **Existence & presence** (*существование и наличие*);
2. **Desires, possibilities & necessity** (*желания, возможности и необходимость*);
3. **Actions & motion** (*действия и движение*);
4. **Possession & relations** (*принадлежность и отношения*);
5. **Feelings & states** (*чувства и состояния*);
6. **Knowledge, thoughts & assumptions** (*знания, мысли и предположения*);
7. **Qualities & comparison** (*качества и сравнение*);
8. **Communication with others** (*общение с другими людьми — приветствие, просьба, благодарность и многое другое*).

These eight directions give me a whole view of the language. I see the overall map and can gradually explore its details. A specific phrase gets its own place, and its links with other phrases become visible. Directions can intersect: desire, action, time, and feeling can meet inside a single thought.

This map became the foundation of **Keremetium**. In the trainer, you can look at a phrase, change the person, time, or meaning, compare options, and see what happens to how the phrase is built. For example, *"I wanted to buy a book"* reports a wish, but says nothing yet about whether the purchase actually happened. There are no textbook rules here that you have to memorize in isolation first — the explanation is tied to a specific thought and helps you see how it is put together. You can look, change, compare, read the explanation, and try building the phrase yourself.

For me, **Keremetium** is that miracle given the shape of a tool. I have not mastered Kazakh yet myself — I created Keremetium so that I would have the opportunity to learn in a way that makes sense to me. And it may turn out to be useful to other people who also need to see the whole first, understand the connections, and then learn to use the language through their own actions.

---

## 2. How the Code Is Organized (`src/core/`)

The core in `src/core/` is divided into four parts:

```text
src/core/
├── layer1-meanings/       # Part 1 — Meanings: What the person wants to say
│                          # (the 8 meaning directions, working thoughts,
│                          # and connections between meanings)
├── layer2-kazakh/         # Part 2 — Kazakh Realization: Sound rules, roots,
│                          # suffixes, endings, and step-by-step form building
├── layer3-sources/        # Part 3 — Catalog & Evidence: Practical grammar catalog
│                          # and links between neighboring meanings
├── layer4-engine/         # Part 4 — Practice & Answer Checker: Step-by-step
│                          # answer checking and mistake explanations
└── index.ts               # Public exports
```

All Kazakh forms in the trainer are built and checked strictly by the rule-based engine in `src/core/` (roots, stems, suffixes, endings, and sound rules across all 8 persons: `Мен`, `Сен`, polite `Сіз`, `Ол`, `Біз`, `Сендер`, polite `Сіздер`, `Олар`).

---

## 3. Open Roadmap (Next 5 Milestones)

1. **Milestone 1 — Connect All Catalog Topics to the Interactive Constructor & Practice:** Connect the remaining topics and neighbor links across all 8 meaning directions into interactive phrase breakdowns, comparisons, explanations, and practice series.
2. **Milestone 2 — Complete "Own Phrase & Short Text" Mode & Two-Way Translation:** Let the learner type their own sentence in "Want to say..." (`Хочу сказать...`), see its meaning structure, and build it in Kazakh (preserving participants, time, negation, and relationships), plus two-way translation and short connected texts (2–3 linked sentences).
3. **Milestone 3 — Calm Spaced Review, Personal Progress Map & "No-Surprises" Mode:** Add calm review between sessions based on self-assessment, a visual map across the 8 meaning directions, "I know this word" toggles, and short targeted warmups without points, ratings, streaks, or timers.
4. **Milestone 4 — Offline PWA Reliability, Small-Screen Layout & Accessibility:** Verify full offline work, seamless updates preserving active sessions, readable formulas and suffix/ending lists on narrow phone screens (`320 px`), text scaling, keyboard navigation, and `VoiceOver` support.
5. **Milestone 5 — Native-Speaker Philologist Review, Documentation & Public Release:** Have native Kazakh teachers/philologists proofread all examples and explanations, publish clear open documentation, and release `v1.0` on `keremetium.kz` and GitHub.

---

## 4. Generative AI & Development Methodology Disclosure

In accordance with open-source transparency and the **NLnet Foundation Generative AI Policy**:
1. **No AI Guessing of Kazakh Forms at Runtime:** Inside the app, **Keremetium** does **not** use AI to invent, translate, or check Kazakh phrases. Every form, suffix, ending, and mistake explanation is built and checked strictly by `src/core/`.
2. **Human-Led Vision with AI Development & Documentation Assistance:** The idea, the 8 meaning directions, and all product decisions were conceived, directed, and checked step-by-step by the author (Nuriya Mirsalimova). During development, AI coding and drafting assistants are used under the author's direction to write TypeScript code, run automated checks, and translate documentation into English.
