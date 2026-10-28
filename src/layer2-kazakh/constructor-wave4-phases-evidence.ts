/** Internal evidence. Source labels and URLs are not learner-facing content. */
export const CONSTRUCTOR_WAVE4_PHASES_EVIDENCE = [
  { id: 'wave4-phases-begin', url: 'https://kaz-tili.kz/glv04.htm', supportsRu: 'Связующая форма -а/-е/-й перед бастау обозначает начало действия.' },
  { id: 'wave4-phases-continue', url: 'https://kaz-tili.kz/glv06.htm', supportsRu: '-а/-е/-й + беру обозначает продолжение; -ып/-іп/-п + беру обслуживает другой смысл: действие для другого.' },
  { id: 'wave4-phases-finish', url: 'https://kaz-tili.kz/glv12.htm', supportsRu: 'Пункт 4: -ып/-іп/-п + болу обозначает завершение; другие связующие формы перед болу могут означать намерение или возможность.' },
  { id: 'wave4-phases-read-through', url: 'https://kaz-tili.kz/glvat04.htm', supportsRu: 'Полное выполнение с шығу; отдельно приведено оқып шығу. Это не буквальный выход из помещения.' },
  { id: 'wave4-phases-write-through', url: 'https://kaz-tili.kz/glvat10.htm', supportsRu: 'Полное выполнение с бітіру; отдельно приведено жазып бітіру. Повторные подходы не объявляются обязательными для каждого сочетания.' },
  { id: 'wave4-phases-retain', url: 'https://kaz-tili.kz/glvat03.htm', supportsRu: 'Результативное -п қою; подготовлены жауып қою и ашып қою. Сохранность сейчас сообщается отдельным предложением, не выводится из одной формы қою.' },
  { id: 'wave4-phases-academic', url: 'https://www.kaznpu.kz/docs/institut_filologii/practikalyk_tilder/zhinak.pdf', supportsRu: 'Обзор работ И. Маманова и Н. Оралбаевой: начало, ход и завершение действия; способы протекания казахского действия не являются механической копией русского вида.' },
  { id: 'wave4-phases-person', url: 'https://kaz-tili.kz/glag3.htm', supportsRu: 'Лицо и краткие окончания прошедшего времени; окончание получает последний глагол.' },
  { id: 'wave4-phases-future', url: 'https://kaz-tili.kz/glag2.htm', supportsRu: 'Переходная форма с личными окончаниями и отдельным указанием будущего времени.' },
  { id: 'wave4-phases-lexicon', url: 'https://tilqural.kz/assets/books/cb629afb50c5776e46abd6f854b9056f.pdf', supportsRu: 'Казах сөзі, 1200 слов: есік, жабу, жабық, жазу; общеупотребительная предметная лексика.' },
  { id: 'wave4-phases-still', url: 'https://kaz-tili.kz/slovar04.htm', supportsRu: 'Әлі: ещё, пока. Указание на сохраняющееся состояние ограничено текущим моментом.' },
] as const;

export type ConstructorWave4PhasesSourceId = typeof CONSTRUCTOR_WAVE4_PHASES_EVIDENCE[number]['id'];
