import { actionReferenceRows } from './action';

export const TENSE_TOPIC_IDS = ['T78_MOTION_FOUR_PROG', 'T80_STD_PROG', 'T31_PAST_DY'] as const;
export const isTenseTopic = (id: string) => (TENSE_TOPIC_IDS as readonly string[]).includes(id);
export const isProgressiveTopic = (id: string) => id === TENSE_TOPIC_IDS[0] || id === TENSE_TOPIC_IDS[1];
export const MOTION_ROOT_IDS = ['bar', 'kel', 'apar', 'akel'];
export const PROGRESSIVE_ROOT_IDS = ['ish', 'jaz', 'ait', 'kor', 'oqy', 'tap', 'al', 'ber', 'soile', 'jur'];

/** Conditions for reference lists; form construction stays in form-builder and its pickers. */
export function tenseReferenceRows(topic: string) {
  if (topic === 'T78_MOTION_FOUR_PROG') return actionReferenceRows('T26_PRES_FUT_AFF').filter(row => row.value !== 'й');
  const variants = topic === 'T80_STD_PROG' ? [
    ['ып', 'Суффикс перед вспомогательным словом', 'После согласной, если гласные основы твёрдые. В некоторых основах последний звук меняется.'],
    ['іп', 'Суффикс перед вспомогательным словом', 'После согласной, если гласные основы мягкие. В некоторых основах последний звук меняется.'],
    ['п', 'Суффикс перед вспомогательным словом', 'После гласной.'],
  ] : [
    ['ды', 'Суффикс прошедшего времени', 'После гласной, звонкой согласной или звуков й, у, р, л, м, н, ң; гласные основы твёрдые.'],
    ['ді', 'Суффикс прошедшего времени', 'После гласной, звонкой согласной или звуков й, у, р, л, м, н, ң; гласные основы мягкие.'],
    ['ты', 'Суффикс прошедшего времени', 'После глухой согласной; гласные основы твёрдые.'],
    ['ті', 'Суффикс прошедшего времени', 'После глухой согласной; гласные основы мягкие.'],
  ];
  return variants.map(([value, meaning, condition]) => ({ value, meaning, condition }));
}
