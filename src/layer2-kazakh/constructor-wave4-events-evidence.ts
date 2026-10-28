/** Internal evidence. These references are not learner-facing content. */
export const CONSTRUCTOR_WAVE4_EVENTS_EVIDENCE = [
  { id: 'wave4-events-time', url: 'https://www.kaz-tili.kz/predl_pod4_2.htm', locator: '2.1, 2.2, 2.4', supportsRu: 'Время через причастие и местный показатель; немедленное следование через название действия, принадлежность третьего лица и -мен.' },
  { id: 'wave4-events-before', url: 'https://www.kaz-tili.kz/predl_pod4_1.htm', locator: '1.3', supportsRu: 'Отрицательное будущее причастие перед бұрын: событие ещё не наступило к главному действию; это не утверждение, что оно никогда не произошло.' },
  { id: 'wave4-events-condition', url: 'https://www.kaz-tili.kz/predl_pod1.htm', locator: '1', supportsRu: 'Отрицательная основа, -са/-се и короткое личное окончание; условие первого события и самостоятельное главное сообщение.' },
  { id: 'wave4-events-cause', url: 'https://www.kaz-tili.kz/predl_pod5.htm', locator: '1', supportsRu: 'В причине отрицание предшествует причастию; после него причинное -дықтан/-діктен.' },
  { id: 'wave4-events-order', url: 'https://www.kaz-tili.kz/predl_soch.htm', locator: '3', supportsRu: 'Главное сообщение перед өйткені, затем причина в личной форме. Перестановка требует смены способа связи.' },
  { id: 'wave4-events-finite', url: 'https://kaz-tili.kz/glag.htm', locator: 'Таблицы времён и личных окончаний', supportsRu: 'Простое прошедшее и условие используют короткие окончания; настоящее длительное и переходное время — полные.' },
  { id: 'wave4-events-process', url: 'https://kaz-tili.kz/statmarafon02.htm', locator: 'Причастные формы сложных глаголов', supportsRu: 'Продолжающееся чтение сохраняет -ып и вспомогательную основу в форме жатқан; время целой фразы задаёт подготовленная ситуация.' },
  { id: 'wave4-events-academic-time', url: 'https://emle.kz/kz/rule?id=529', locator: 'Мезгіл мәнді сөйлемдер синонимиясы; Қазақ грамматикасы, 2002', supportsRu: 'Различаются продолжительность, временная граница и начало следующего события; морфология связи не подменяет эти значения.' },
  { id: 'wave4-events-academic-condition', url: 'https://emle.kz/kz/rule?id=526', locator: 'Шарт мәнді сөйлемдер синонимиясы; Қазақ грамматикасы, 2002', supportsRu: 'Условие определяется отношением событий и контекстом. Формы -са и -йынша не считаются безусловно взаимозаменяемыми.' },
] as const;
export type ConstructorWave4EventsSourceId = typeof CONSTRUCTOR_WAVE4_EVENTS_EVIDENCE[number]['id'];
