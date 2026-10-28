import { NOMINAL_CARDS } from './nominal-cards';
import { FormulaCard } from '../types';

/**
 * Слой 1 (часть Б): Карточки смысловых формул (К3, К4, К7, К11, К19, К26, К31, К33).
 *
 * Все названия и объяснения написаны своими словами от человеческой мысли («Хочу сделать»,
 * «Могу сделать», «Прямо сейчас делаю», «Предмет, который я сделал ←»), без копирования
 * авторского текста и примеров источников (К26).
 */

export const FORMULA_CARDS: FormulaCard[] = [
  ...NOMINAL_CARDS,
  // ==========================================================================
  // 1. ЖЕЛАНИЕ, ВОЗМОЖНОСТЬ, НЕОБХОДИМОСТЬ (wish_need_can)
  // ==========================================================================
  {
    id: 'T83_WANT_PRESENT',
    topicNumber: 83,
    chapterNumber: 14,
    thoughtTitleRu: 'Хочу сделать',
    searchPhrasesRu: [
      'я хочу',
      'хочу выпить',
      'хочу пойти',
      'хочется',
      'ты хочешь',
      'он хочет',
      'мы хотим',
    ],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + ғы/гі/қы/кі + м + келеді',
    hookAndComparisonRu:
      'По-русски «Я хочу пить» (я — деятель), а по-казахски буквально «Ко мне приходит моё желание-попить» (как русское «Мне хочется…»). Поэтому в начале не «мен», а «(менің)» (моё), а в конце всегда стоит «келеді» (приходит).',
    pieceSelectionGuideRu:
      'Твёрдая основа: после голоса → -ғы, после глухой → -қы. Мягкая основа: после голоса → -гі, после глухой → -кі. Дальше приклеивается хвост «чьё желание» (-м, -ң, -ңыз, -мыз, -сы/-сі).',
    requiredCoreBlocks: ['KB-1', 'KB-2'],
    prerequisiteTopics: [13, 26],
    neighborTopics: [84, 85, 86, 88],
    hasReverseArrowOrder: true,
  },
  {
    id: 'T84_WANT_NEG',
    topicNumber: 84,
    chapterNumber: 14,
    thoughtTitleRu: 'Не хочу делать',
    searchPhrasesRu: ['не хочу', 'не хочется', 'он не хочет', 'ты не хочешь'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + ғы/гі/қы/кі + м + келмейді',
    hookAndComparisonRu:
      'Само слово с желанием («ішкім», «барғым») не меняется — отрицание ставится только на последний глагол-помощник: «келеді» → «келмейді» («моё желание-пойти не приходит»).',
    pieceSelectionGuideRu:
      'Собери «хочу» (-ғы/-гі/-қы/-кі + личный хвост принадлежности) и замени «келеді» на «келмейді».',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-7'],
    prerequisiteTopics: [13, 27, 83],
    neighborTopics: [83, 86, 88],
    hasReverseArrowOrder: true,
  },
  {
    id: 'T86_WANT_PAST',
    topicNumber: 86,
    chapterNumber: 14,
    thoughtTitleRu: 'Хотел(а) сделать (в прошлом)',
    searchPhrasesRu: ['я хотел', 'я хотела', 'хотели', 'не хотел'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + ғы/гі/қы/кі + м + келді',
    hookAndComparisonRu:
      'Чтобы перенести «хочу» в прошлое, достаточно поменять только последнее слово «келеді» (приходит) на «келді» (пришло)!',
    pieceSelectionGuideRu:
      'Первое слово с «-ғы/-гі/-қы/-кі + хвост принадлежности» остаётся тем же самым, а в конце ставится «келді» (или в отрицании «келмеді / келген жоқ»).',
    requiredCoreBlocks: ['KB-1', 'KB-2'],
    prerequisiteTopics: [31, 83],
    neighborTopics: [83, 84, 88],
    hasReverseArrowOrder: true,
  },
  {
    id: 'T88_WANT_COND',
    topicNumber: 88,
    chapterNumber: 14,
    thoughtTitleRu: 'Если захочу сделать',
    searchPhrasesRu: ['если захочу', 'если ты захочешь', 'если захочет'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + ғы/гі/қы/кі + м + келсе',
    hookAndComparisonRu:
      'Условие «если» вешается на помощник «кел-» в конце: «келсе» («если придёт моё желание…»).',
    pieceSelectionGuideRu:
      'Первое слово — как в обычном «хочу», а вместо «келеді» ставится неизменяемое «келсе» (в отрицании — «келмесе»).',
    requiredCoreBlocks: ['KB-1', 'KB-2'],
    prerequisiteTopics: [46, 83],
    neighborTopics: [83, 86],
    hasReverseArrowOrder: true,
  },
  {
    id: 'T72_CAN_PRESENT',
    topicNumber: 72,
    chapterNumber: 12,
    thoughtTitleRu: 'Могу / умею делать',
    searchPhrasesRu: [
      'я могу',
      'я умею',
      'ты можешь',
      'вы можете',
      'смогу',
      'получится',
    ],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: 'корень + а/е/й + аламын (аласың, алады…)',
    hookAndComparisonRu:
      'Помощник «ал-» буквально значит «брать, осилить». Даже если первый глагол мягкий («іше», «келе»), помощник «ала-» всегда твёрдый, поэтому личный хвост в конце всегда твёрдый: «іше аламын»!',
    pieceSelectionGuideRu:
      'На смысловой глагол ставится -а (твёрдый), -е (мягкий) или -й (после гласной), а следом идёт глагол «аламын / аласың / аласыз / аламыз / алады».',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-9'],
    prerequisiteTopics: [26],
    neighborTopics: [73, 74, 75],
  },
  {
    id: 'T73_CAN_NEG',
    topicNumber: 73,
    chapterNumber: 12,
    thoughtTitleRu: 'Не могу / не умею делать',
    searchPhrasesRu: ['не могу', 'не умею', 'не смогу', 'не получается'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: 'корень + а/е/й + алмаймын (алмайсың, алмайды…)',
    hookAndComparisonRu:
      'Первый глагол с «-а/-е/-й» не меняется, а отрицание «-май» входит внутрь помощника «ал-»: «алмаймын» («не могу взять / осилить»).',
    pieceSelectionGuideRu:
      'Смысловой глагол + -а/-е/-й, а второе слово — «алмай» + твёрдое личное окончание (-мын, -сың, -сыз, -мыз, -ды).',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-7', 'KB-9'],
    prerequisiteTopics: [26, 27, 72],
    neighborTopics: [72, 74, 75],
  },
  {
    id: 'T89_INTEND_PRESENT',
    topicNumber: 89,
    chapterNumber: 15,
    thoughtTitleRu: 'Собираюсь сделать',
    searchPhrasesRu: ['собираюсь', 'планирую', 'намерен', 'хотел было'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: 'корень + айын/ейін/йын/йін + деп + жатырмын (отырмын)',
    hookAndComparisonRu:
      'Буквально: «Я сейчас нахожусь с мыслью (деп): „давай-ка я это сделаю (-айын/-ейін)“». Очень живая разговорная связка!',
    pieceSelectionGuideRu:
      'После согласной ставится -айын / -ейін (с озвончением п→б, қ→ғ, к→г), после гласной — -йын / -йін (ы+йын → иын), дальше «деп» и глагол состояния «жатырмын / отырмын».',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-9'],
    prerequisiteTopics: [22, 76],
    neighborTopics: [22, 91],
  },
  {
    id: 'T93_NEED_KEREK',
    topicNumber: 93,
    chapterNumber: 16,
    thoughtTitleRu: 'Мне нужно / я должен сделать',
    searchPhrasesRu: [
      'мне нужно',
      'мне надо',
      'я должен',
      'тебе нужно',
      'нам нужно',
      'необходимо',
    ],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + у + ым/ім + керек (қажет)',
    hookAndComparisonRu:
      'Буквально: «Моё делание нужно». Главный секрет: суффикс «-у» ведёт себя как согласная, поэтому после него всегда берётся личный хвост с гласной «ы/і»: бару+ым, ішу+ім, бару+ы (а не -м и не -сы)!',
    pieceSelectionGuideRu:
      'К основе глагола добавь «-у» (помня про слияния оқы+у→оқу, тап+у→табу), затем личный хвост принадлежности с ы/і (-ым/-ім, -ың/-ің, -ыңыз/-іңіз, -ымыз/-іміз, -ы/-і) и слово «керек».',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-9'],
    prerequisiteTopics: [13, 54],
    neighborTopics: [94, 95, 97],
    synonymFormulaIds: ['T95_NEED_DATIVE_KEREK'],
    hasReverseArrowOrder: true,
  },
  {
    id: 'T94_NEED_NEG_MAU_KEREK',
    topicNumber: 94,
    chapterNumber: 16,
    thoughtTitleRu: 'Мне нужно не делать',
    searchPhrasesRu: ['нужно не', 'надо не', 'необходимо не', 'должен не'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + мау/меу/бау/беу/пау/пеу + ым/ім + керек',
    hookAndComparisonRu:
      'Буквально: «Моё не-делание нужно» (например, «мне нужно не опаздывать / мне не стоит идти»).',
    pieceSelectionGuideRu:
      'Отрицательный кусочек -ма/-ме, -ба/-бе, -па/-пе сливается с «-у» в -мау/-меу и т.д., а дальше идёт тот же хвост принадлежности (-ым/-ім) + «керек».',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-7'],
    prerequisiteTopics: [13, 54, 93],
    neighborTopics: [93, 99, 101],
    hasReverseArrowOrder: true,
  },
  {
    id: 'T99_MAY_PERSONAL',
    topicNumber: 99,
    chapterNumber: 19,
    thoughtTitleRu: 'Мне можно сделать (разрешено)',
    searchPhrasesRu: ['мне можно', 'тебе можно', 'можно ли мне', 'разрешено'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: '(менің) корень + у + ым/ім + а/е + болады',
    hookAndComparisonRu:
      'Здесь в одном слове дружат сразу три кубика: имя действия «-у» + чей хвост «-ым/-ім» + короткий направительный падеж «-а/-е» (в 3-м лице «-на/-не») + «болады» («годится»).',
    pieceSelectionGuideRu:
      'Собери «моё делание» (баруым / ішуім) и добавь короткий падеж направления: для 1-го и 2-го лица — -а/-е (баруыма, баруыңа), для 3-го лица — -на/-не (баруына), для сіз/біз — -ға/-ге (баруымызға).',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-8', 'KB-9'],
    prerequisiteTopics: [13, 17, 54, 93],
    neighborTopics: [100, 101],
    synonymFormulaIds: ['T101_MAY_IMPERSONAL'],
  },
  {
    id: 'T101_MAY_IMPERSONAL',
    topicNumber: 101,
    chapterNumber: 19,
    thoughtTitleRu: 'Можно сделать (вообще / безлично)',
    searchPhrasesRu: ['можно войти', 'можно спросить', 'можно делать', 'нельзя'],
    meaningCluster: 'wish_need_can',
    formulaPatternDisplay: 'корень + у + ға/ге + болады (бола ма?)',
    hookAndComparisonRu:
      'Самая частая бытовая формула («Кіруге бола ма?» — Можно войти?): глагол на «-у» + направительный падеж «-ға/-ге» + «болады».',
    pieceSelectionGuideRu:
      'После «-у» всегда идёт звонкий вариант направительного падежа: в твёрдом слове — «-ға» (баруға), в мягком — «-ге» (кіруге, ішуге).',
    requiredCoreBlocks: ['KB-1', 'KB-8', 'KB-9'],
    prerequisiteTopics: [17, 54],
    neighborTopics: [99, 100],
  },

  // ==========================================================================
  // 2. ВРЕМЯ И ХАРАКТЕР ДЕЙСТВИЯ (time_action)
  // ==========================================================================
  {
    id: 'T26_PRES_FUT_AFF',
    topicNumber: 26,
    chapterNumber: 4,
    thoughtTitleRu: 'Делаю или сделаю',
    searchPhrasesRu: [
      'я делаю',
      'я пойду',
      'я пью',
      'буду делать',
      'настоящее время',
      'будущее время',
    ],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + а/е/й + мын/мін (сың, сыз, мыз, ды/ді)',
    hookAndComparisonRu:
      'Одно время сразу для двух смыслов: «делаю вообще (по жизни)» и «сделаю завтра/скоро» — точно как в русском разговорном «Завтра иду в гости».',
    pieceSelectionGuideRu:
      'После согласной ставится -а (твёрдый) или -е (мягкий), причём п→б, қ→ғ, к→г озвончаются! После гласной ставится -й (а ы+й и і+й сливаются в одну букву «и»: оқы+й+мын → оқимын).',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-9'],
    prerequisiteTopics: [],
    neighborTopics: [27, 28, 78, 80],
  },
  {
    id: 'T27_PRES_FUT_NEG',
    topicNumber: 27,
    chapterNumber: 4,
    thoughtTitleRu: 'Не делаю или не буду делать',
    searchPhrasesRu: ['я не делаю', 'не пойду', 'не пью', 'не буду'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + май/мей/бай/бей/пай/пей + мын/мін…',
    hookAndComparisonRu:
      'Отрицательный кусочек (-ма/-ме, -ба/-бе, -па/-пе) и связка времени (-й) сливаются в единый блок -май/-мей, -бай/-бей, -пай/-пей.',
    pieceSelectionGuideRu:
      'После гласной и й, у, р, л → -май/-мей; после з, ж, м, н, ң → -бай/-бей; после глухой согласной → -пай/-пей. Дальше — обычное личное окончание.',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-7'],
    prerequisiteTopics: [26],
    neighborTopics: [26, 28],
  },
  {
    id: 'T28_PRES_FUT_Q',
    topicNumber: 28,
    chapterNumber: 4,
    thoughtTitleRu: 'Спросить о действии',
    searchPhrasesRu: ['ты пойдёшь?', 'он придёт?', 'делаешь ли', 'спросить о действии', 'вопрос о действии'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + а/е/й + личный хвост (в 3 л. без -ды/-ді!) + ма/ме/ба/бе',
    hookAndComparisonRu:
      'Важная тонкость 3-го лица: в утверждении «Ол барады» есть хвост «-ды/-ді», а перед вопросительной частицей «ма/ме» он исчезает: «Ол бара ма?», «Ол келе ме?»!',
    pieceSelectionGuideRu:
      'Для я/ты/Вы/мы после личного окончания (-мын/-сың/-сыз/-мыз) ставится «ба/бе», а в 3-м лице хвост -ды/-ді убирается и после гласной ставится «ма/ме».',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-6', 'KB-9'],
    prerequisiteTopics: [9, 26],
    neighborTopics: [26, 27],
  },
  {
    id: 'T78_MOTION_FOUR_PROG',
    topicNumber: 78,
    chapterNumber: 13,
    thoughtTitleRu: 'Прямо сейчас иду / еду / несу (4 глагола движения)',
    searchPhrasesRu: ['сейчас иду', 'сейчас еду', 'уже иду', 'идёт сюда'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: '(бар / кел / апар / әкел) + а/е + жатырмын (жатыр)',
    hookAndComparisonRu:
      'Четыре глагола движения (бар — идти туда, кел — идти сюда, апар — относить, әкел — приносить) перед «жатыр» берут гласную «-а/-е», а не «-ып/-іп»: «бара жатырмын», «келе жатырмын»!',
    pieceSelectionGuideRu:
      'К основе бар/апар добавь «-а», к основе кел/әкел — «-е», а второе слово — всегда твёрдое «жатыр» + личное окончание (в 3-м лице просто «бара жатыр»).',
    requiredCoreBlocks: ['KB-1', 'KB-3'],
    prerequisiteTopics: [26, 76],
    neighborTopics: [76, 80],
  },
  {
    id: 'T80_STD_PROG',
    topicNumber: 80,
    chapterNumber: 13,
    thoughtTitleRu: 'Прямо сейчас делаю (в эту минуту)',
    searchPhrasesRu: ['сейчас делаю', 'сейчас пью', 'сейчас пишу', 'в данный момент'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + ып/іп/п + жатырмын (отырмын, тұрмын, жүрмін)',
    hookAndComparisonRu:
      'Как английский Present Continuous (am doing): основной глагол получает кусочек «-ып/-іп/-п», а следом стоит один из четырёх глаголов положения в пространстве (жатыр, отыр, тұр, жүр).',
    pieceSelectionGuideRu:
      'После согласной — -ып (твёрдый) или -іп (мягкий), после гласной — одна буква -п. Помни 4 особых корня: тап → тауып, жап → жауып! Личный хвост вешается на помощник «жатыр/отыр».',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-9'],
    prerequisiteTopics: [26, 76],
    neighborTopics: [78, 81],
  },
  {
    id: 'T31_PAST_DY',
    topicNumber: 31,
    chapterNumber: 5,
    thoughtTitleRu: 'Сделал(а) (обычное прошедшее время)',
    searchPhrasesRu: ['я сделал', 'я ходил', 'я пил', 'он сказал', 'прошедшее время'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + ды/ді/ты/ті + м (ң, ңыз/ңіз, қ/к, —)',
    hookAndComparisonRu:
      'Самое простое и частое прошедшее время. После «-ды/-ді/-ты/-ті» идут короткие личные хвосты: -м (я), -ң (ты), -ңыз/-ңіз (Вы), -қ/-к (мы), и ничего в 3-м лице!',
    pieceSelectionGuideRu:
      'После гласной и звонких/сонорных — -ды (твёрдый) или -ді (мягкий). После глухой согласной — -ты (твёрдый) или -ті (мягкий).',
    requiredCoreBlocks: ['KB-1', 'KB-4'],
    prerequisiteTopics: [],
    neighborTopics: [32, 34, 36],
  },
  {
    id: 'T32_PAST_MADY',
    topicNumber: 32,
    chapterNumber: 5,
    thoughtTitleRu: 'Не сделал(а) (через -мады/-меді)',
    searchPhrasesRu: ['не сделал', 'не ходил', 'не сказал'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + ма/ме/ба/бе/па/пе + ды/ді + короткий личный хвост',
    hookAndComparisonRu:
      'Поскольку отрицательный кусочек (-ма/-ме/-ба/-бе/-па/-пе) всегда заканчивается на гласную, после него прошедшее время всегда звонкое: только «-ды» или «-ді» (никогда не -ты/-ті)!',
    pieceSelectionGuideRu:
      'Выбери отрицание (-ма/-ме после гласной/р/л/й/у, -ба/-бе после з/ж/м/н/ң, -па/-пе после глухой), добавь -ды/-ді и короткий хвост (-м, -ң, -ңыз, -қ/-к).',
    requiredCoreBlocks: ['KB-1', 'KB-4', 'KB-7'],
    prerequisiteTopics: [31],
    neighborTopics: [31, 34, 35],
    synonymFormulaIds: ['T34_PAST_GAN_JOK'],
  },
  {
    id: 'T34_PAST_GAN_JOK',
    topicNumber: 34,
    chapterNumber: 5,
    thoughtTitleRu: 'Ещё не сделал / не делал (через -ған жоқ)',
    searchPhrasesRu: ['ещё не сделал', 'не ходил', 'не видел', 'ған жоқпын'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + ған/ген/қан/кен + жоқ + пын (сың, сыз, пыз, —)',
    hookAndComparisonRu:
      'В разговорной речи звучит даже чаще, чем «-мадым»! Главное правило «последней ступеньки»: слово «жоқ» всегда твёрдое и заканчивается на глухую «қ», поэтому даже после мягкого глагола («ішкен», «келген») хвост всегда твёрдый: «жоқпын, жоқсың, жоқсыз»!',
    pieceSelectionGuideRu:
      'К глаголу приклей -ған/-ген (после голоса) или -қан/-кен (после глухой), а ко второму слову «жоқ» — твёрдое личное окончание (-пын, -сың, -сыз, -пыз).',
    requiredCoreBlocks: ['KB-1', 'KB-3'],
    prerequisiteTopics: [31],
    neighborTopics: [31, 32, 35],
    synonymFormulaIds: ['T32_PAST_MADY'],
  },
  {
    id: 'T36_HABITUAL_ATYN',
    topicNumber: 36,
    chapterNumber: 5,
    thoughtTitleRu: 'Раньше обычно делал / собирался сделать (-атын)',
    searchPhrasesRu: ['раньше делал', 'бывало ходил', 'обычно делал в прошлом'],
    meaningCluster: 'time_action',
    formulaPatternDisplay: 'корень + атын/етін/йтын/йтін + мын/мін (или едім)',
    hookAndComparisonRu:
      'Как английское «used to do»: действие, которое раньше повторялось по привычке, или то, что человек собирался сделать.',
    pieceSelectionGuideRu:
      'После согласной — -атын / -етін (с озвончением п→б, қ→ғ, к→г), после гласной — -йтын / -йтін (ы+йтын → итын). У «біз» после буквы «н» всегда идёт «-быз/-біз» (баратынбыз)!',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-9'],
    prerequisiteTopics: [26, 31],
    neighborTopics: [37, 43],
  },

  // ==========================================================================
  // 3. УСЛОВИЕ, ПРИЧИНА, ОДНОВРЕМЕННОСТЬ, ПРЕДПОЛОЖЕНИЕ (condition_link)
  // ==========================================================================
  {
    id: 'T46_COND_SA',
    topicNumber: 46,
    chapterNumber: 7,
    thoughtTitleRu: 'Если сделаю (-са / -се)',
    searchPhrasesRu: ['если я', 'если пойдёшь', 'если будет', 'когда и если'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: '(егер) корень + са/се + м (ң, ңыз/ңіз, қ/к, —)',
    hookAndComparisonRu:
      'В русском смысл «если» живёт в отдельном союзе, а в казахском — прямо внутри короткого кусочка «-са/-се» на глаголе (поэтому слово «егер» в начале можно спокойно опускать).',
    pieceSelectionGuideRu:
      'В твёрдом слове всегда «-са», в мягком — всегда «-се» (глухость/звонкость не влияет!). Дальше — короткие личные хвосты (-м, -ң, -ңыз, -қ/-к).',
    requiredCoreBlocks: ['KB-1', 'KB-4'],
    prerequisiteTopics: [31],
    neighborTopics: [47, 48, 40],
  },
  {
    id: 'T48_CONCESSIVE_SA_DA',
    topicNumber: 48,
    chapterNumber: 7,
    thoughtTitleRu: 'Даже если сделаю / хотя (-са да / барсақ та)',
    searchPhrasesRu: ['даже если', 'хотя и', 'несмотря на то что'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: 'корень + са/се + личный хвост + да/де (у «біз» → та/те!)',
    hookAndComparisonRu:
      'К обычному условию «-са/-се» добавляется усилительная частица «да/де» («и / даже»). Красивая деталь: у «біз (мы)» форма заканчивается на глухую «-қ/-к» (барсақ, келсек), поэтому частица после неё оглушается в «та/те»: «барсақ та», «келсек те»!',
    pieceSelectionGuideRu:
      'Собери условную форму (-са/-се + короткий хвост) и добавь раздельно «да/де», а для «біз» — «та/те».',
    requiredCoreBlocks: ['KB-1', 'KB-4'],
    prerequisiteTopics: [46],
    neighborTopics: [46, 47],
  },
  {
    id: 'T40_COND_AR_EDI',
    topicNumber: 40,
    chapterNumber: 6,
    thoughtTitleRu: 'Сделал(а) бы (мягкое предположение: -ар еді)',
    searchPhrasesRu: ['я бы сделал', 'пошёл бы', 'выпил бы'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: 'корень + ар/ер/р + еді + м (ң, ңыз, к, —)',
    hookAndComparisonRu:
      'Передаёт мягкое «пожалуй, я бы сделал». Второе слово «еді» всегда мягкое, поэтому короткие личные окончания на нём всегда мягкие (-м, -ң, -ңіз, -к)!',
    pieceSelectionGuideRu:
      'После согласной — -ар (твёрдый) или -ер (мягкий), после гласной — одна буква -р. Второе слово: едім, едің, едіңіз, едік, еді.',
    requiredCoreBlocks: ['KB-1', 'KB-4', 'KB-9'],
    prerequisiteTopics: [31],
    neighborTopics: [41, 43, 105],
    synonymFormulaIds: ['T43_COND_USHY_EDI'],
  },
  {
    id: 'T43_COND_USHY_EDI',
    topicNumber: 43,
    chapterNumber: 6,
    thoughtTitleRu: 'Обязательно сделал бы / раньше бывало делал (-ушы еді)',
    searchPhrasesRu: ['точно сделал бы', 'обязательно пошёл бы', 'барушы едім'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: 'корень + ушы/уші + еді + м (ң, ңыз, к, —)',
    hookAndComparisonRu:
      'В отличие от мягкого «-ар едім», форма «-ушы едім» звучит уверенно: «я бы точно/обязательно сделал!». Поскольку кусочек начинается с «у», на стыке происходят те же слияния, что и в инфинитиве (оқы+ушы → оқушы, тап+ушы → табушы).',
    pieceSelectionGuideRu:
      'Твёрдая основа + -ушы, мягкая основа + -уші, затем «едім / едің / едіңіз / едік / еді».',
    requiredCoreBlocks: ['KB-1', 'KB-4', 'KB-9'],
    prerequisiteTopics: [31, 40],
    neighborTopics: [36, 40, 44],
    synonymFormulaIds: ['T40_COND_AR_EDI'],
  },
  {
    id: 'T49_WHEN_GANDA',
    topicNumber: 49,
    chapterNumber: 8,
    thoughtTitleRu: 'Когда сделал (-ғанда / -генде)',
    searchPhrasesRu: ['когда пришёл', 'когда увидел', 'в то время когда'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: 'корень + ғанда/генде/қанда/кенде',
    hookAndComparisonRu:
      'Причастие свершившегося действия (-ған/-ген/-қан/-кен) + местный падеж «где / в чём» (-да/-де) = «в момент того, как сделал»!',
    pieceSelectionGuideRu:
      'После голоса: -ғанда (твёрдый) / -генде (мягкий). После глухой согласной: -қанда (твёрдый) / -кенде (мягкий). Равнозначно связке «-ған кезде».',
    requiredCoreBlocks: ['KB-1', 'KB-8'],
    prerequisiteTopics: [18, 31],
    neighborTopics: [50, 51],
    synonymFormulaIds: ['T50_WHEN_PERSONAL_GANDA'],
  },
  {
    id: 'T50_WHEN_PERSONAL_GANDA',
    topicNumber: 50,
    chapterNumber: 8,
    thoughtTitleRu: 'Когда я/ты/он сделал (с личным хвостом: барғанымда)',
    searchPhrasesRu: ['когда я пришёл', 'когда ты сказал', 'барғанымда'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: '(менің) корень + ған/ген/қан/кен + ым/ім + да/де (в 3 л. → ында/інде)',
    hookAndComparisonRu:
      'Между «-ған» и местным падежом «-да/-де» вставляется хвост принадлежности («в моём приходе = когда я пришёл»). В 3-м лице перед «-да/-де» появляется вставная «н» (зелёный значок ③): барғанында!',
    pieceSelectionGuideRu:
      'Собери -ған/-ген/-қан/-кен + хвост принадлежности (-ым/-ім, -ың/-ің, -ыңыз/-іңіз, -ымыз/-іміз, -ы/-і) + местный падеж (-да/-де, а в 3-м лице -нда/-нде).',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-8'],
    prerequisiteTopics: [13, 18, 49],
    neighborTopics: [49, 51],
  },
  {
    id: 'T105_SUPPOSE_ARMYN',
    topicNumber: 105,
    chapterNumber: 22,
    thoughtTitleRu: 'Наверное, сделаю (предположение: барармын)',
    searchPhrasesRu: ['наверное пойду', 'возможно сделаю', 'пожалуй'],
    meaningCluster: 'condition_link',
    formulaPatternDisplay: '(мүмкін) корень + ар/ер/р + мын/мін (сың, сыз, мыз, —)',
    hookAndComparisonRu:
      'Тот же кусочек «-ар/-ер/-р», что и в «барар едім», но без «еді» — прямо к нему приклеиваются полные личные окончания (а в 3-м лице окончания нет: «ол барар»).',
    pieceSelectionGuideRu:
      'После согласной — -ар/-ер, после гласной — -р, затем личный хвост -мын/-мін, -сың/-сің, -сыз/-сіз, -мыз/-міз (в 3-м лице пусто).',
    requiredCoreBlocks: ['KB-1', 'KB-3', 'KB-9'],
    prerequisiteTopics: [26, 40],
    neighborTopics: [106, 107],
  },

  // ==========================================================================
  // 4. ПРИНАДЛЕЖНОСТЬ, НАЛИЧИЕ, ПАДЕЖИ (possession_place)
  // ==========================================================================
  {
    id: 'T10_PLURAL',
    topicNumber: 10,
    chapterNumber: 1,
    thoughtTitleRu: 'Много предметов (множественное число)',
    searchPhrasesRu: ['множественное число', 'много', 'лар лер', 'дар дер', 'тар тер'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'слово + лар/лер, дар/дер, тар/тер',
    hookAndComparisonRu:
      'Шесть вариантов одного кусочка «много» выбираются строго по последней букве слова и ряду гласных.',
    pieceSelectionGuideRu:
      'После гласной и «р» → лар/лер; после «л, з, ж, м, н, ң, й, у» → дар/дер; после глухой согласной → тар/тер.',
    requiredCoreBlocks: ['KB-1', 'KB-5'],
    prerequisiteTopics: [],
    neighborTopics: [13, 15],
  },
  {
    id: 'T13_POSSESSIVE',
    topicNumber: 13,
    chapterNumber: 2,
    thoughtTitleRu: 'Мой / твой / его предмет (принадлежность)',
    searchPhrasesRu: ['мой', 'твой', 'ваш', 'наш', 'его', 'принадлежность'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: '(менің) слово + м/ым/ім (ң/ың, ңыз/ыңыз, мыз/ымыз, сы/сі/ы/і)',
    hookAndComparisonRu:
      'В казахском хозяин предмета отмечается прямо на самом предмете! Этот же кубик (КБ-2) потом работает внутри «хочу» (ішкі-м), «мне нужно» (бару-ым керек) и «книга, которую я прочитал» (оқыған кітаб-ым).',
    pieceSelectionGuideRu:
      'После чистой гласной: -м, -ң, -ңыз/-ңіз, -мыз/-міз, -сы/-сі. После согласной (и после у, и, й): -ым/-ім, -ың/-ің, -ыңыз/-іңіз, -ымыз/-іміз, -ы/-і (причём п→б, қ→ғ, к→г озвончаются: кітап → кітабым!).',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-9'],
    prerequisiteTopics: [],
    neighborTopics: [14, 15, 64],
  },
  {
    id: 'T56_LOC_BAR',
    topicNumber: 56,
    chapterNumber: 10,
    thoughtTitleRu: 'У меня (при себе) есть… (менде … бар)',
    searchPhrasesRu: ['у меня есть с собой', 'менде бар', 'при себе есть'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'менде (сенде, сізде, бізде, онда) + предмет + бар',
    hookAndComparisonRu:
      'Когда предмет находится прямо при человеке (в руках, в кармане), используется местный падеж «у кого — менде» без хвоста принадлежности на предмете.',
    pieceSelectionGuideRu:
      'Местоимение в местном падеже (менде, сенде, сізде, бізде, онда) + название предмета + «бар» (в отрицании — «жоқ»).',
    requiredCoreBlocks: ['KB-8'],
    prerequisiteTopics: [18],
    neighborTopics: [57, 58, 64],
    synonymFormulaIds: ['T64_GEN_POSS_BAR'],
  },
  ...(['KZ_PRESENCE_Q', 'KZ_PRESENCE_NEG_Q'] as const).map(id => ({
    id, topicNumber: 0, chapterNumber: 0,
    thoughtTitleRu: id === 'KZ_PRESENCE_Q' ? 'Спросить, есть ли с собой' : 'Спросить, нет ли с собой',
    searchPhrasesRu: id === 'KZ_PRESENCE_Q' ? ['есть ли книга', 'есть ли вода', 'есть ли чай', 'есть ли хлеб', 'есть ли письмо', 'есть книга?', 'есть вода?', 'есть чай?', 'есть хлеб?', 'есть письмо?'] : ['нет ли книги', 'нет ли воды', 'нет ли чая', 'нет ли хлеба', 'нет ли письма', 'нет книги?', 'нет воды?', 'нет чая?', 'нет хлеба?', 'нет письма?'],
    meaningCluster: 'possession_place' as const,
    formulaPatternDisplay: 'у кого, вещь, есть или нет, вопросительная частица',
    hookAndComparisonRu: 'Чтобы спросить о наличии или отсутствии вещи, добавь отдельную вопросительную частицу после последнего слова.',
    pieceSelectionGuideRu: 'Выбирай частицу по слову перед ней, а не по названию вещи.',
    requiredCoreBlocks: ['KB-8' as const], prerequisiteTopics: [18], neighborTopics: [56],
  })),
  {
    id: 'KZ_PRESENCE_NEG', topicNumber: 0, chapterNumber: 0,
    thoughtTitleRu: 'У меня нет с собой',
    searchPhrasesRu: ['у меня нет книги', 'нет с собой', 'с собой нет воды', 'у него нет', 'у нас нет хлеба', 'нет книги', 'нет воды', 'нет чая', 'нет хлеба', 'нет письма'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'у кого + вещь + жоқ',
    hookAndComparisonRu: 'Когда говорим, что вещи сейчас нет у человека, в конце ставим отдельное слово со значением «нет».',
    pieceSelectionGuideRu: 'Сначала скажи, у кого, затем назови вещь и добавь жоқ.',
    requiredCoreBlocks: ['KB-8'], prerequisiteTopics: [18], neighborTopics: [56, 64],
  },
  {
    id: 'T64_GEN_POSS_BAR',
    topicNumber: 64,
    chapterNumber: 11,
    thoughtTitleRu: 'У меня (вообще) есть… ((менің) кітабым бар)',
    searchPhrasesRu: ['у меня есть брат', 'у меня есть время', 'менің бар'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: '(менің) предмет + хвост принадлежности + бар',
    hookAndComparisonRu:
      'Когда речь о родных, друзьях, времени, доме или имуществе вообще — по-казахски говорят буквально «Моя книга есть / Моё время есть» ((менің) уақытым бар).',
    pieceSelectionGuideRu:
      'Приклей к предмету хвост принадлежности (КБ-2) и поставь после него «бар» (или «жоқ» в отрицании).',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-9'],
    prerequisiteTopics: [13],
    neighborTopics: [56, 65],
    synonymFormulaIds: ['T56_LOC_BAR'],
  },
  {
    id: 'T17_DATIVE',
    topicNumber: 17,
    chapterNumber: 2,
    thoughtTitleRu: 'Кому / куда (направление: -ға/-ге, -қа/-ке)',
    searchPhrasesRu: ['в город', 'домой', 'на работу', 'кому', 'куда'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'слово + ға/ге, қа/ке (после -м/-ң → а/е; после -сы/-ы → на/не)',
    hookAndComparisonRu:
      'Отвечает сразу на два вопроса: «кому?» и «куда?». Особый секрет зелёных кружков ①②③: после «мой/твой» (-м/-ң) сокращается до одной гласной «-а/-е» (балама), а после «его» (-сы/-ы) превращается в «-на/-не» (баласына)!',
    pieceSelectionGuideRu:
      'После гласной и звонких/сонорных → -ға (твёрдый) / -ге (мягкий); после глухой → -қа / -ке.',
    requiredCoreBlocks: ['KB-1', 'KB-8'],
    prerequisiteTopics: [],
    neighborTopics: [15, 18, 19, 20, 21],
  },
  {
    id: 'T18_LOCATIVE',
    topicNumber: 18,
    chapterNumber: 2,
    thoughtTitleRu: 'У кого / где (местонахождение: -да/-де, -та/-те)',
    searchPhrasesRu: ['в городе', 'дома', 'на работе', 'где', 'у кого'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'слово + да/де, та/те (после 3-го лица -сы/-ы → нда/нде)',
    hookAndComparisonRu:
      'Показывает, где или у кого находится предмет. После принадлежности 3-го лица («его доме») появляется вставная буква «н»: үйі + нде → үйінде!',
    pieceSelectionGuideRu:
      'После гласной и звонких/сонорных → -да / -де; после глухой → -та / -те.',
    requiredCoreBlocks: ['KB-1', 'KB-8'],
    prerequisiteTopics: [],
    neighborTopics: [17, 19, 56],
  },
  {
    id: 'T19_ABLATIVE',
    topicNumber: 19,
    chapterNumber: 2,
    thoughtTitleRu: 'От кого / откуда (исходная точка: -дан/-ден, -тан/-тен, -нан/-нен)',
    searchPhrasesRu: ['из города', 'с работы', 'из дома', 'откуда', 'от кого'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'слово + дан/ден, тан/тен, нан/нен',
    hookAndComparisonRu:
      'Похож на местный падеж (-да/-де), но с буквой «н» на конце. А если само слово уже заканчивается на носовую «м, н, ң» (или на принадлежность 3-го лица), то и начинается он с «н»: -нан/-нен!',
    pieceSelectionGuideRu:
      'После м, н, ң и 3-го лица принадлежности → -нан/-нен; после глухой → -тан/-тен; в остальных случаях → -дан/-ден.',
    requiredCoreBlocks: ['KB-1', 'KB-8'],
    prerequisiteTopics: [18],
    neighborTopics: [17, 18, 20],
  },
  {
    id: 'T20_INSTRUMENTAL',
    topicNumber: 20,
    chapterNumber: 2,
    thoughtTitleRu: 'С кем / чем (инструмент и компания: -мен/-бен/-пен)',
    searchPhrasesRu: ['с другом', 'с тобой', 'ручкой', 'на автобусе', 'чем'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'слово + мен / бен / пен',
    hookAndComparisonRu:
      'Удивительное окончание-хамелеон: у него нет твёрдого варианта — даже к твёрдым словам приклеивается мягкое «-мен/-бен/-пен»!',
    pieceSelectionGuideRu:
      'После глухой согласной → -пен; после звонких «з, ж» → -бен; после всех остальных букв (гласных, р, л, м, н, ң, й, у) → -мен.',
    requiredCoreBlocks: ['KB-8'],
    prerequisiteTopics: [],
    neighborTopics: [17, 18, 19, 21],
  },
  {
    id: 'T21_ACCUSATIVE',
    topicNumber: 21,
    chapterNumber: 2,
    thoughtTitleRu: 'Кого / что вижу (конкретный предмет: -ны/-ні, -ды/-ді, -ты/-ті)',
    searchPhrasesRu: ['вижу город', 'читаю эту книгу', 'кого что', 'винительный'],
    meaningCluster: 'possession_place',
    formulaPatternDisplay: 'слово + ны/ні, ды/ді, ты/ті (после 3-го лица -сы/-ы → одна буква -н)',
    hookAndComparisonRu:
      'Ставится только тогда, когда предмет конкретный («эту книгу», «моего друга»). А после принадлежности 3-го лица («его книгу») сокращается до одной синей буквы «-н»: кітабы + н → кітабын!',
    pieceSelectionGuideRu:
      'После чистой гласной → -ны/-ні; после р, л, з, ж, м, н, ң, й, у → -ды/-ді; после глухой → -ты/-ті; после принадлежности 3-го лица → -н.',
    requiredCoreBlocks: ['KB-1', 'KB-8'],
    prerequisiteTopics: [],
    neighborTopics: [15, 17, 121],
  },

  // ==========================================================================
  // 5. ЛИЦА, ВЕЖЛИВОСТЬ, ПОБУЖДЕНИЕ (person_politeness)
  // ==========================================================================
  {
    id: 'T22_IMP_1SG',
    topicNumber: 22,
    chapterNumber: 3,
    thoughtTitleRu: 'Давай-ка я сделаю (-айын / -ейін / -йын / -йін)',
    searchPhrasesRu: ['давай я сделаю', 'пойду-ка я', 'скажу-ка я', 'сейчас сделаю'],
    meaningCluster: 'person_politeness',
    formulaPatternDisplay: 'корень + айын/ейін/йын/йін (шы/ші)',
    hookAndComparisonRu:
      'Выражает собственное решение говорящего («давай-ка я пойду / разрешите я скажу»). А если добавить в конце «-шы/-ші», получится тёплая вежливая просьба «дай-ка я сделаю, пожалуйста».',
    pieceSelectionGuideRu:
      'После согласной — -айын (твёрдый) / -ейін (мягкий) с озвончением п→б, қ→ғ, к→г; после гласной — -йын / -йін (причём ы+йын сливается в иын: оқы+йын → оқиын!).',
    requiredCoreBlocks: ['KB-1', 'KB-9'],
    prerequisiteTopics: [],
    neighborTopics: [23, 24, 25, 89],
  },
  {
    id: 'T24_IMP_1PL',
    topicNumber: 24,
    chapterNumber: 3,
    thoughtTitleRu: 'Давайте мы вместе сделаем (-айық / -ейік)',
    searchPhrasesRu: ['давайте сделаем', 'давай пойдём', 'давайте выпьем чаю'],
    meaningCluster: 'person_politeness',
    formulaPatternDisplay: 'корень + айық/ейік/йық/йік (шы/ші)',
    hookAndComparisonRu:
      'Как английское «Let’s go!»: отличается от формы «я сделаю (-айын/-ейін)» всего одной последней буквой: вместо «-н» стоит «-қ/-к» (-айық/-ейік)!',
    pieceSelectionGuideRu:
      'После согласной — -айық (твёрдый) / -ейік (мягкий); после гласной — -йық / -йік (оқы+йық → оқиық).',
    requiredCoreBlocks: ['KB-1', 'KB-9'],
    prerequisiteTopics: [22],
    neighborTopics: [22, 23, 25],
  },

  // ==========================================================================
  // 6. ОПИСАНИЕ ПРЕДМЕТА ЧЕРЕЗ ДЕЙСТВИЕ (participle_desc)
  // ==========================================================================
  {
    id: 'T121_PART_OBJECT_POSS',
    topicNumber: 121,
    chapterNumber: 25,
    thoughtTitleRu: 'Предмет, который я/ты/он сделал (← обратный порядок: оқыған кітабым)',
    searchPhrasesRu: [
      'книга которую я прочитал',
      'слово которое ты сказал',
      'город который мы видели',
      'который я сделал',
    ],
    meaningCluster: 'participle_desc',
    formulaPatternDisplay: '(менің) корень + ған/ген/қан/кен + предмет + хвост принадлежности (-ым/-ім)',
    hookAndComparisonRu:
      'Самый красивый поворот казахской мысли (← стрелка справа налево): по-русски мы говорим «Книга, которую я прочитал», а по-казахски — «(Моя) прочитанная книга-моя» ((менің) оқыған кітабым). При этом хвост «кто прочитал (-ым)» вешается не на глагол, а на саму книгу в конце!',
    pieceSelectionGuideRu:
      'Сначала поставь глагол с -ған/-ген/-қан/-кен (без личных окончаний!), а следом — предмет с хвостом принадлежности того, кто совершил действие (-м/-ым, -ң/-ың, -сы/-ы).',
    requiredCoreBlocks: ['KB-1', 'KB-2', 'KB-9'],
    prerequisiteTopics: [13, 31],
    neighborTopics: [113, 114, 122],
    hasReverseArrowOrder: true,
  },
];

export const FORMULAS_BY_ID: Record<string, FormulaCard> = Object.fromEntries(
  FORMULA_CARDS.map((card) => [card.id, card])
);
