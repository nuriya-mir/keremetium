# QazaqCore & ThoughtPassport — Deterministic Agglutinative Morphological Engine

**Repository:** [https://github.com/nuriya-mir/qazaq-thought-core](https://github.com/nuriya-mir/qazaq-thought-core)  
**Code License:** [MIT](./LICENSE) (`SPDX-License-Identifier: MIT`) | **Linguistic Schemas:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (`SPDX-License-Identifier: CC-BY-4.0`)

---

## Overview

**QazaqCore & ThoughtPassport** is the open-source mathematical and linguistic engine of the **Kazakh Language Thought-Construction Trainer for Adults** — a calm, deterministic learning environment that guides an adult learner from a human communicative intention (*"What do I want to say?"*) to an exact, verified grammatical form in Kazakh.

Unlike cloud LLM wrappers that hallucinate vowel harmony or consonant assimilation at morpheme boundaries — and unlike traditional finite-state transducers (FSTs) that output raw morphological tag strings without pedagogical explanation — `qazaq-thought-core` models agglutinative grammar as a **100% deterministic, zero-dependency TypeScript pipeline** where **AI never invents, guesses, or evaluates grammatical forms**, and without stressful gamification (no streaks, timers, or punitive point loss).

---

## Architecture (`./src`)

### 1. Layer 1 — Semantic Intentions & `ThoughtPassport` (`src/thought-passport.ts`, `src/intentions.ts`, `src/types.ts`)
- **`ThoughtPassport` Schema:** A language-agnostic semantic contract mapping **8 core communicative directions** and **37 meaning routes** across 3 expression depths (`impulse`, `precise`, `nuanced`) and 4 grammatical coordinates:
  1. **Polarity:** `affirmative | negative`
  2. **Speech Act:** `statement | question | request`
  3. **Person & Politeness Register:** 8 explicit registers (`мен`, `сен`, `Сіз` polite singular, `ол`, `біз`, `сендер`, `Сіздер` polite plural, `олар`)
  4. **Time & Inter-Clause Relation:** `present | past | future` and `single | cause | purpose | condition`
- Separates *what the speaker means* (Layer 1) from *how the agglutinative language encodes it* (Layer 2), making the architecture directly reusable across Turkic and other agglutinative languages.

### 2. Layer 2 — 7-Step Deterministic Morphophonological Builder (`src/phonetics.ts`, `src/nominal-builder.ts`, `src/presence.ts`)
- **Step 1 — Effective Vowel Harmony (`HarmonyKind`):** Resolves `hard` (`а, о, ұ, ы`) vs. `soft` (`ә, ө, ү, і, е`) stems by inspecting the final syllable, handling context-dependent mixed vowels (`и, у`) and loanword harmony overrides (`mugalim`, `kitap`, `bank`, etc.).
- **Step 2 — Stem-Ending Consonant Class (`LastSoundClass`):** Classifies the stem boundary into 6 acoustic-articulatory classes (`V` vowels, `UI` diphthongs, `R` sonorants `р/й/у`, `L` sonorants `л`, `ZMN` nasals/voiced `ж/з/м/н/ң`, and `VOICELESS` `к/қ/п/с/т/ф/х/ц/ч/ш/щ/б/в/г/д`).
- **Steps 3–6 — Ordered Suffixation & Assimilation:** Attaches plural (`-лар/-лер/-дар/-дер/-тар/-тер`), possessive (`Тәуелдік жалғау`), spatial/grammatical cases (`Септік`), and personal predicative endings (`Жіктік жалғау`) with strict progressive and regressive consonant assimilation.
- **Step 7 — Boundary Merger Capsule (`BoundaryMergerCapsule`):** Computes regressive stem-final consonant voicing (`п+а→ба`, `қ+а→ға`, `к+е→ге`), vowel elision, and diphthong coalescence (`ы+й→и`), returning an inspectable step-by-step trace for the learner.

### 3. Layer 4 — 5-Step Explainable Diagnostic Checker (`src/answer-checker.ts`, `src/known-alternatives.ts`)
When a learner constructs a word or phrase, `checkBuiltAnswer()` diagnoses the input deterministically in 5 steps:
1. **Orthographic & Homoglyph Normalization:** Normalizes whitespace, punctuation, and Cyrillic/Latin lookalike characters without penalizing formatting.
2. **Optional Pronoun & Synonym Resolution:** Accepts valid pro-drop omissions (e.g. optional `[Мен]` because the personal ending `-мын` already encodes 1st person singular) and registered lexical alternatives (`known-alternatives.ts`).
3. **Exact Morpheme-Boundary Pinpointing:** Compares the learner's suffix chain segment-by-segment (`root → plural → possessive → case → predicative`), identifying whether an error is a vowel harmony mismatch (`hard` vs. `soft`) or a consonant assimilation mismatch (`л/д/т`, `м/б/п`, `н/д/т`).
4. **Cross-Formula Semantic Shift Detection:** Checks whether the learner's input actually forms *another valid grammatical construction* in Kazakh and explains what that form means (turning a "wrong answer" into a structural discovery).
5. **Root Typo Isolation:** Uses Damerau-Levenshtein distance (`<= 1`) on the stem to separate accidental keyboard typos in the root from genuine grammatical errors in the suffixes.

---

## What Is Already Built vs. Open Development Roadmap

### Already Built (`./src`)
- Core TypeScript interfaces (`types.ts`), `ThoughtPassport` 8-direction / 37-route semantic registry (`thought-passport.ts`, `intentions.ts`), 7-step Kazakh morphophonological engine (`phonetics.ts`, `nominal-builder.ts`, `presence.ts`), and 5-step explainable diagnostic verifier (`answer-checker.ts`, `known-alternatives.ts`).

### Planned Next Stage (NLnet Grant Scope)
1. **Full Open Web Application & All 12 Practice Modes:** Completing the interactive browser trainer across all 12 cognitive practice modes (from guided morpheme assembly and reverse meaning decoding to full clause-relation synthesis), offline-capable and free of telemetry or cloud lock-in.
2. **Expanded Verified Root & Verbal Lexicon:** Expanding the audited dictionary of Kazakh nominal and verbal stems with complete phonological exception annotations and native audio alignment.
3. **Open Specification & Turkic Portability Guide:** Publishing the standalone `qazaq-thought-core` npm package, JSON Schema test vectors (`500+` edge-case morphophonological assertions), and a porting guide for adapting `ThoughtPassport` + Layer 2 rules to related Turkic languages (Kyrgyz, Karakalpak, Uzbek, Tatar, Sakha).

---

## Generative AI Policy Declaration

In accordance with the **NLnet Foundation Generative AI Policy (v1.1, January 26, 2026)**:
- **100% Deterministic Linguistic Core:** Every grammatical form, boundary merger, and diagnostic explanation in `qazaq-thought-core` is computed by explicit, verifiable phonological and morphological rules. Generative AI is **never** used to synthesize, guess, or check learner answers.
- **Human Authorship:** Linguistic engineering, architecture, and source code are authored by **Nuriya Mirsalimova** (Almaty, Kazakhstan).

---

## License

- **Source Code:** [MIT License](./LICENSE) (`SPDX-License-Identifier: MIT`)
- **Documentation & Test Vectors:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) (`SPDX-License-Identifier: CC-BY-4.0`)

Copyright (c) 2026 Nuriya Mirsalimova.
