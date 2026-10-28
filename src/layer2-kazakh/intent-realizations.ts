import { isNominalTopic, nominalRootIds, isQuestionNominalTopic } from './nominal-lexicon';
import { nominalEvidence } from '../layer3-sources/nominal-evidence';
import type { ThoughtPassport } from '../layer1-meanings/thought-passport';
import type { LanguageConstruction } from '../layer3-sources/registry';
import { FORMULAS_BY_ID } from '../layer1-meanings/formulas';
import { ROOTS_BY_ID } from './roots';
import { buildForm } from './form-builder';
import type { PersonId } from '../types';

type Sign = 'affirmative' | 'negative' | 'question' | 'negative_question';
type Time = 'now' | 'general' | 'past' | 'future' | 'hypothetical';
type Link = 'none' | 'cause' | 'purpose' | 'condition';
interface RealizationVariant { sign: Sign; time: Time; link: Link; formulaId: string }
interface KazakhRealization { id: string; noun?: boolean; variants: RealizationVariant[] }
const v = (formulaId: string, sign: Sign = 'affirmative', time: Time = 'now', link: Link = 'none'): RealizationVariant => ({ formulaId, sign, time, link });

/** Existing builders are one replaceable adapter. Missing builders never remove intentions. */
export const KAZAKH_REALIZATIONS: KazakhRealization[] = [
  { id: 'identity', variants: [v('KZ_IDENTITY_AFF'), v('KZ_IDENTITY_NEG', 'negative'), v('KZ_IDENTITY_Q', 'question'), v('KZ_IDENTITY_NEG_Q', 'negative_question')] },
  { id: 'quality', variants: [v('KZ_QUALITY_AFF'), v('KZ_QUALITY_NEG', 'negative'), v('KZ_QUALITY_Q', 'question'), v('KZ_QUALITY_NEG_Q', 'negative_question')] },
  { id: 'want', variants: [v('T83_WANT_PRESENT'), v('T84_WANT_NEG', 'negative'), v('T86_WANT_PAST', 'affirmative', 'past'), v('T88_WANT_COND', 'affirmative', 'now', 'condition')] },
  { id: 'can', variants: [v('T72_CAN_PRESENT'), v('T73_CAN_NEG', 'negative')] },
  { id: 'need', variants: [v('T93_NEED_KEREK')] },
  { id: 'intend', variants: [v('T89_INTEND_PRESENT')] },
  { id: 'may', variants: [v('T99_MAY_PERSONAL')] },
  { id: 'action', variants: [v('T80_STD_PROG'), v('T26_PRES_FUT_AFF', 'affirmative', 'general'), v('T26_PRES_FUT_AFF', 'affirmative', 'future'), v('T27_PRES_FUT_NEG', 'negative', 'general'), v('T27_PRES_FUT_NEG', 'negative', 'future'), v('T28_PRES_FUT_Q', 'question', 'general'), v('T28_PRES_FUT_Q', 'question', 'future'), v('T31_PAST_DY', 'affirmative', 'past'), v('T32_PAST_MADY', 'negative', 'past'), v('T40_COND_AR_EDI', 'affirmative', 'hypothetical'), v('T46_COND_SA', 'affirmative', 'future', 'condition')] },
  { id: 'presence', noun: true, variants: [v('T56_LOC_BAR'), v('KZ_PRESENCE_NEG', 'negative'), v('KZ_PRESENCE_Q', 'question'), v('KZ_PRESENCE_NEG_Q', 'negative_question')] },
  { id: 'ownership', noun: true, variants: [v('T64_GEN_POSS_BAR')] },
  { id: 'possessive', noun: true, variants: [v('T13_POSSESSIVE')] },
  { id: 'guess', variants: [v('T105_SUPPOSE_ARMYN', 'affirmative', 'future')] },
];

/** Resolves an exact semantic passport. It never creates an unverified rule. */
export function resolveKazakhThought(thought: ThoughtPassport, actionRootId: string) {
  const participant = thought.participants.actor;
  if (!participant || thought.links.length > 1 || thought.links.some(link => link.targetThoughtId)) return null;
  if (thought.habitual && (thought.time !== 'present' || thought.modality !== 'actual')) return null;
  if (thought.modality === 'hypothetical' && thought.time !== 'unspecified') return null;
  if (participant.person === 2 && participant.address === 'unspecified') return null;
  const family = KAZAKH_REALIZATIONS.find(item => item.id === thought.intentionId);
  if (!family) return null;
  const sign: Sign = thought.speechAct === 'question' ? thought.polarity === 'negative' ? 'negative_question' : 'question' : thought.polarity === 'negative' ? 'negative' : 'affirmative';
  const time = thought.modality === 'hypothetical' ? 'hypothetical' : thought.habitual ? 'general' : thought.time === 'present' ? 'now' : thought.time;
  const link: Link = thought.links.length ? thought.links[0].kind : 'none';
  const match = family.variants.find(item => item.sign === sign && item.time === time && item.link === link);
  if (!match) return null;
  const plural = participant.number === 'plural';
  const person: PersonId = participant.person === 1 ? plural ? 'biz' : 'men' : participant.person === 3 ? plural ? 'olar' : 'ol' : participant.address === 'respectful' ? plural ? 'sizder' : 'siz' : plural ? 'sender' : 'sen';
  const nominal = isNominalTopic(match.formulaId);
  const rootId = nominal ? (nominalRootIds(match.formulaId).includes(actionRootId) ? actionRootId : nominalRootIds(match.formulaId)[0]) : family.noun ? 'kitap' : actionRootId;
  const root = ROOTS_BY_ID[rootId];
  if (!root || (!nominal && !family.noun && root.pos !== 'verb')) return null;
  const construction: LanguageConstruction = {
    id: `kk.${family.id}.${match.sign}.${match.time}.${match.link}`,
    language: 'kk', intentionIds: [family.id],
  };
  return { built: buildForm(match.formulaId, rootId, person), construction, completeness: link === 'none' ? 'expression' as const : 'clause' as const };
}
