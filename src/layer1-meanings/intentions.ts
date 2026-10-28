/** Language-independent intentions. Russian examples are thoughts, not translations. */
export interface MeaningCore {
  id: string;
  title: string;
  impulse: string;
  aliases: string[];
  depths: [string[], string[], string[]];
}

export const MEANING_DEPTHS = [
  { title: 'Коротко', description: 'Сказать главное в нескольких словах.' },
  { title: 'Подробнее', description: 'Добавить, кто, где или что делает.' },
  { title: 'Мнение и чувства', description: 'Добавить своё мнение, чувство, сомнение или пожелание.' },
] as const;

export const MEANING_CORES: MeaningCore[] = [
  { id: 'existence', title: 'Я есть. Есть и нет', impulse: 'Есть · нет · это', aliases: ['наличие и бытие', 'наличие', 'бытие', 'существование'], depths: [
    ['Вода есть.', 'Времени нет.'], ['У меня есть дом, но сегодня нет сил.'], ['Главное, что мы живы и вместе.'],
  ] },
  { id: 'will', title: 'Хочу, могу, надо', impulse: 'Хочу · могу · надо', aliases: ['желание и воля', 'желание', 'воля', 'желания', 'желание и возможность'], depths: [
    ['Хочу спать.', 'Не хочу идти.'], ['Мне нужно закончить дело.', 'Могу помочь.'], ['Пусть у детей всё будет хорошо.', 'Если бы знать заранее…'],
  ] },
  { id: 'action', title: 'Делаю и двигаюсь', impulse: 'Где · куда · откуда', aliases: ['действие и движение', 'действие', 'движение', 'действия'], depths: [
    ['Иду домой.', 'Вышел из дома.'], ['Еду к другу поговорить о деле.'], ['Всё возвращается к своему истоку.'],
  ] },
  { id: 'belonging', title: 'У меня есть', impulse: 'Моё · твоё · наше', aliases: ['принадлежность и связь', 'принадлежность', 'связь'], depths: [
    ['Моя мама.', 'Твой телефон.'], ['Наш общий замысел.', 'Иду вместе с тобой.'], ['Слово предков.', 'Человек своего времени.'],
  ] },
  { id: 'feeling', title: 'Что я чувствую', impulse: 'Чувствую · нравится', aliases: ['состояние и чувство', 'состояние', 'чувство', 'чувства', 'эмоции'], depths: [
    ['Мне холодно.', 'Мне нравится.'], ['Я скучаю по дому.', 'Меня это тревожит.'], ['На душе светло и спокойно.'],
  ] },
  { id: 'knowledge', title: 'Знаю, думаю, говорят', impulse: 'Знаю · думаю · говорят', aliases: ['знание и достоверность', 'знание', 'достоверность', 'сомнение'], depths: [
    ['Я знаю.', 'Я не понял.'], ['По-моему, он прав.', 'Я помню тот день.'], ['Говорят, это было давно: сам не видел.', 'Кажется, так.'],
  ] },
  { id: 'evaluation', title: 'Какой? Больше, меньше, лучше', impulse: 'Качество · сравнение', aliases: ['оценка и сравнение', 'оценка', 'сравнение', 'качество'], depths: [
    ['Хороший чай.', 'Очень далеко.'], ['Сегодня теплее, чем вчера.', 'Это важнее.'], ['Нет ничего дороже чистой совести.'],
  ] },
  { id: 'contact', title: 'Привет, спасибо, пожалуйста', impulse: 'Встреча · просьба · благодарность', aliases: ['встреча и этикет', 'встреча', 'этикет', 'приветствие', 'вежливость'], depths: [
    ['Здравствуйте.', 'Спасибо.', 'Извините.'], ['Будьте гостем.', 'Не беспокойтесь, пожалуйста.'], ['Да будет ваш путь светлым.'],
  ] },
];

const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

/** Deliberately exact: category lookup must not erase negation in a free thought. */
export function findMeaningCores(query: string): MeaningCore[] {
  const value = normalize(query);
  if (!value) return [];
  return MEANING_CORES.filter(core => [core.title, core.impulse, ...core.aliases].some(alias => normalize(alias) === value));
}
