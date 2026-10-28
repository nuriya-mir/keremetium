/** Internal evidence only. The learner receives explanations, never source identifiers. */
export const CONSTRUCTOR_WAVE4_QUESTIONS_EVIDENCE = {
  'wave4-question-words': {
    url: 'https://kaz-tili.kz/mest4.htm',
    checkedAt: '2026-10-28',
    supportsRu: 'Вопросы к человеку, предмету, владельцу, качеству, выбору, количеству, месту, времени и способу. Склонение вопросительных слов; множественное кімдер. Различие места и направления определяется всей фразой.',
  },
  'wave4-question-syntax': {
    url: 'https://soyle.kz/storage/article/800629_1385807715.pdf',
    checkedAt: '2026-10-28',
    supportsRu: 'Вопросительные слова и порядок слов: определение перед именем, дополнение и обстоятельство перед действием. Подготовленные пары вопроса и ответа сохраняют падеж предмета.',
  },
  'wave4-question-reference': {
    url: 'https://portal.mtdi.kz/storage/media-files/1195/Грамматикалық-анықтағыш.pdf',
    checkedAt: '2026-10-28',
    supportsRu: 'Урок 34: вопросительные местоимения и ответы с восстановлением неизвестного места, времени и человека. Короткий ответ восстанавливается из данного вопроса.',
  },
  'wave4-question-ownership': {
    url: 'https://tilqural.kz/assets/books/74f4de591669fcb3d2da468082d04509.pdf',
    checkedAt: '2026-10-28',
    supportsRu: 'Самостоятельная форма принадлежности и вопрос к владельцу. Она отличается от родительного слова перед именем с притяжательным окончанием.',
  },
  'wave4-question-time': {
    url: 'https://kaz-tili.kz/chislit01vr.htm',
    checkedAt: '2026-10-28',
    supportsRu: 'Число перед названием часа обозначает длительность; название часа перед числом обозначает время на часах. Пакет использует только длительность в часах.',
  },
  'wave4-question-lexicon': {
    url: 'https://kaz-tili.kz/slovarob2a2.htm',
    checkedAt: '2026-10-28',
    supportsRu: 'Словарное значение признака и способа действия: красиво. Формы письма, чтения, прихода и движения переиспользуют ранее проверенное ядро.',
  },
  'wave4-question-cases': {
    url: 'https://www.kaz-tili.kz/su_npad.htm',
    checkedAt: '2026-10-28',
    supportsRu: 'Вопросы и окончания местного, дательного, исходного, винительного и творительного падежей. Краткое заполнение неизвестной роли сохраняет её падеж.',
  },
} as const;

export type ConstructorWave4QuestionsSourceId = keyof typeof CONSTRUCTOR_WAVE4_QUESTIONS_EVIDENCE;
