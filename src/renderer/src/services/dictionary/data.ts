/**
 * Compact offline English dictionary. Covers very common words plus the
 * vocabulary that appears in this app's stories, lessons and watch transcripts,
 * so press-hold lookups resolve instantly with no network. A handful carry
 * Uzbek/Russian glosses for press-hold-to-translate; the online fallback
 * (dictionaryapi.dev) fills anything not bundled here.
 */

export interface DictMeaning {
  pos: string
  definition: string
  example?: string
}

export interface DictEntry {
  word: string
  phonetic?: string
  meanings: DictMeaning[]
  /** Optional native-language glosses, keyed by ISO code. */
  tr?: Record<string, string>
}

function e(
  word: string,
  phonetic: string,
  pos: string,
  definition: string,
  example?: string,
  tr?: Record<string, string>
): DictEntry {
  return { word, phonetic, meanings: [{ pos, definition, example }], tr }
}

export const OFFLINE_DICTIONARY: DictEntry[] = [
  e('hello', '/həˈloʊ/', 'exclamation', 'used as a greeting when you meet someone.', '"Hello, how are you?"', { uz: 'salom', ru: 'привет' }),
  e('greeting', '/ˈɡriːtɪŋ/', 'noun', 'something friendly you say or do when you meet someone.', undefined, { uz: 'salomlashish', ru: 'приветствие' }),
  e('confusing', '/kənˈfjuːzɪŋ/', 'adjective', 'difficult to understand; not clear.', '"The instructions were confusing."', { uz: 'chalkash', ru: 'запутанный' }),
  e('tense', '/tens/', 'noun', 'a form of a verb that shows the time of an action (past, present, future).', '"The present perfect tense."', { uz: 'zamon', ru: 'время (глагола)' }),
  e('notice', '/ˈnoʊtɪs/', 'verb', 'to see or become aware of something.', '"Did you notice the new sign?"', { uz: 'sezmoq', ru: 'замечать' }),
  e('explore', '/ɪkˈsplɔːr/', 'verb', 'to travel through a place to learn about it.', '"We explored the old town."', { uz: 'kashf qilmoq', ru: 'исследовать' }),
  e('market', '/ˈmɑːrkɪt/', 'noun', 'a place where people buy and sell goods.', '"She bought fruit at the market."', { uz: 'bozor', ru: 'рынок' }),
  e('delicious', '/dɪˈlɪʃəs/', 'adjective', 'having a very pleasant taste.', '"The cake was delicious."', { uz: 'mazali', ru: 'вкусный' }),
  e('nervous', '/ˈnɜːrvəs/', 'adjective', 'worried or slightly afraid.', '"I was nervous before the exam."', { uz: 'asabiy', ru: 'нервный' }),
  e('stranger', '/ˈstreɪndʒər/', 'noun', 'a person you do not know.', '"A kind stranger helped her."', { uz: 'notanish odam', ru: 'незнакомец' }),
  e('quiet', '/ˈkwaɪət/', 'adjective', 'making little or no noise.', '"The park was quiet."', { uz: 'jim', ru: 'тихий' }),
  e('signal', '/ˈsɪɡnəl/', 'noun', 'a sound, sign, or message that gives information.', '"The radio signal was weak."', { uz: 'signal', ru: 'сигнал' }),
  e('reflection', '/rɪˈflekʃən/', 'noun', 'light, heat, or an image thrown back from a surface.', '"A reflection in the window."', { uz: 'aks etish', ru: 'отражение' }),
  e('satellite', '/ˈsætəlaɪt/', 'noun', 'an object sent into space to orbit the Earth.', '"A weather satellite."', { uz: 'sun\'iy yo\'ldosh', ru: 'спутник' }),
  e('demanding', '/dɪˈmændɪŋ/', 'adjective', 'needing a lot of time, effort, or skill.', '"A demanding job."', { uz: 'talabchan', ru: 'требовательный' }),
  e('perseverance', '/ˌpɜːrsəˈvɪrəns/', 'noun', 'continued effort despite difficulty.', '"Success takes perseverance."', { uz: 'qat\'iyat', ru: 'настойчивость' }),
  e('passion', '/ˈpæʃən/', 'noun', 'a very strong feeling or enthusiasm for something.', '"She has a passion for music."', { uz: 'ishtiyoq', ru: 'страсть' }),
  e('grit', '/ɡrɪt/', 'noun', 'courage and determination to keep going.', '"It takes grit to finish."', { uz: 'matonat', ru: 'упорство' }),
  e('stamina', '/ˈstæmɪnə/', 'noun', 'the energy to keep doing something for a long time.', undefined, { uz: 'chidamlilik', ru: 'выносливость' }),
  e('vulnerability', '/ˌvʌlnərəˈbɪləti/', 'noun', 'the state of being open to being hurt emotionally.', undefined, { uz: 'zaiflik', ru: 'уязвимость' }),
  e('researcher', '/rɪˈsɜːrtʃər/', 'noun', 'a person who studies a subject in detail to discover facts.', undefined, { uz: 'tadqiqotchi', ru: 'исследователь' }),
  e('storyteller', '/ˈstɔːriˌtelər/', 'noun', 'a person who tells or writes stories.', undefined, { uz: 'hikoyachi', ru: 'рассказчик' }),
  e('struggle', '/ˈstrʌɡəl/', 'verb', 'to try very hard to do something difficult.', '"I struggled to understand."', { uz: 'qiynalmoq', ru: 'бороться' }),
  e('measure', '/ˈmeʒər/', 'verb', 'to find the size, amount, or degree of something.', undefined, { uz: 'o\'lchamoq', ru: 'измерять' }),
  e('spread', '/spred/', 'verb', 'to open out or distribute over an area or time.', '"Spread the work over a week."', { uz: 'tarqatmoq', ru: 'распределять' }),
  e('thesis', '/ˈθiːsɪs/', 'noun', 'a long piece of writing on a subject, for a university degree.', undefined, { uz: 'dissertatsiya', ru: 'диссертация' }),
  e('appreciate', '/əˈpriːʃieɪt/', 'verb', 'to be grateful for something.', '"I\'d appreciate your help."', { uz: 'qadrlamoq', ru: 'ценить' }),
  e('confirm', '/kənˈfɜːrm/', 'verb', 'to state that something is true or definite.', '"I\'m writing to confirm the meeting."', { uz: 'tasdiqlamoq', ru: 'подтверждать' }),
  e('polite', '/pəˈlaɪt/', 'adjective', 'having good manners; respectful.', '"A polite request."', { uz: 'xushmuomala', ru: 'вежливый' }),
  e('interrupt', '/ˌɪntəˈrʌpt/', 'verb', 'to stop someone while they are speaking or doing something.', undefined, { uz: 'bo\'lmoq (gapni)', ru: 'перебивать' }),
  e('summary', '/ˈsʌməri/', 'noun', 'a short statement of the main points.', undefined, { uz: 'xulosa', ru: 'краткое изложение' }),
  e('weather', '/ˈweðər/', 'noun', 'the state of the air outside (sun, rain, wind, etc.).', undefined, { uz: 'ob-havo', ru: 'погода' }),
  e('travel', '/ˈtrævəl/', 'verb', 'to go from one place to another, especially far.', undefined, { uz: 'sayohat qilmoq', ru: 'путешествовать' }),
  e('order', '/ˈɔːrdər/', 'verb', 'to ask for food, drink, or goods to be made or brought.', '"I\'d like to order a coffee."', { uz: 'buyurtma bermoq', ru: 'заказывать' }),
  e('practice', '/ˈpræktɪs/', 'noun', 'doing something regularly to improve.', undefined, { uz: 'mashq', ru: 'практика' }),
  e('fluency', '/ˈfluːənsi/', 'noun', 'the ability to speak smoothly and easily.', undefined, { uz: 'ravonlik', ru: 'беглость' }),
  e('example', '/ɪɡˈzæmpəl/', 'noun', 'a thing that shows what a larger group is like.', undefined, { uz: 'misol', ru: 'пример' }),
  e('reason', '/ˈriːzən/', 'noun', 'an explanation for why something happens.', undefined, { uz: 'sabab', ru: 'причина' }),
  e('proud', '/praʊd/', 'adjective', 'feeling pleased about something you did.', '"She was proud of her work."', { uz: 'faxrlanuvchi', ru: 'гордый' }),
  e('patient', '/ˈpeɪʃənt/', 'adjective', 'able to wait calmly without getting annoyed.', undefined, { uz: 'sabrli', ru: 'терпеливый' }),
  e('welcome', '/ˈwelkəm/', 'verb', 'to greet someone in a friendly way.', '"They welcomed us warmly."', { uz: 'kutib olmoq', ru: 'приветствовать' })
]

const INDEX = new Map(OFFLINE_DICTIONARY.map((d) => [d.word.toLowerCase(), d]))
export function lookupOffline(word: string): DictEntry | undefined {
  return INDEX.get(word.trim().toLowerCase())
}

// ─── Phrasebook ──────────────────────────────────────────────────────────────

export interface Phrase {
  en: string
  tr: Record<string, string> // native-language translations
}

export interface PhraseCategory {
  id: string
  title: string
  emoji: string
  phrases: Phrase[]
}

export const PHRASEBOOK: PhraseCategory[] = [
  {
    id: 'greetings',
    title: 'Greetings',
    emoji: '👋',
    phrases: [
      { en: 'Hello / Hi', tr: { uz: 'Salom', ru: 'Привет', es: 'Hola', fr: 'Bonjour' } },
      { en: 'How are you?', tr: { uz: 'Qalaysiz?', ru: 'Как дела?', es: '¿Cómo estás?', fr: 'Comment ça va ?' } },
      { en: 'Nice to meet you.', tr: { uz: 'Tanishganimdan xursandman.', ru: 'Приятно познакомиться.', es: 'Encantado de conocerte.', fr: 'Enchanté.' } },
      { en: 'See you later.', tr: { uz: 'Keyinroq ko\'rishamiz.', ru: 'До скорого.', es: 'Hasta luego.', fr: 'À plus tard.' } }
    ]
  },
  {
    id: 'travel',
    title: 'Travel',
    emoji: '✈️',
    phrases: [
      { en: 'Where is the station?', tr: { uz: 'Bekat qayerda?', ru: 'Где вокзал?', es: '¿Dónde está la estación?', fr: 'Où est la gare ?' } },
      { en: 'How much is it?', tr: { uz: 'Bu qancha turadi?', ru: 'Сколько это стоит?', es: '¿Cuánto cuesta?', fr: 'Combien ça coûte ?' } },
      { en: 'I\'m lost.', tr: { uz: 'Men adashib qoldim.', ru: 'Я заблудился.', es: 'Estoy perdido.', fr: 'Je suis perdu.' } },
      { en: 'Can you help me?', tr: { uz: 'Menga yordam bera olasizmi?', ru: 'Можете мне помочь?', es: '¿Puedes ayudarme?', fr: 'Pouvez-vous m\'aider ?' } }
    ]
  },
  {
    id: 'dining',
    title: 'Dining',
    emoji: '🍽️',
    phrases: [
      { en: 'I\'d like a coffee, please.', tr: { uz: 'Menga qahva bering, iltimos.', ru: 'Кофе, пожалуйста.', es: 'Un café, por favor.', fr: 'Un café, s\'il vous plaît.' } },
      { en: 'The menu, please.', tr: { uz: 'Menyuni bering, iltimos.', ru: 'Меню, пожалуйста.', es: 'La carta, por favor.', fr: 'La carte, s\'il vous plaît.' } },
      { en: 'For here or to go?', tr: { uz: 'Shu yerdami yoki olib ketasizmi?', ru: 'Здесь или с собой?', es: '¿Para aquí o para llevar?', fr: 'Sur place ou à emporter ?' } },
      { en: 'That\'s all, thanks.', tr: { uz: 'Hammasi shu, rahmat.', ru: 'Это всё, спасибо.', es: 'Eso es todo, gracias.', fr: 'C\'est tout, merci.' } }
    ]
  },
  {
    id: 'emergencies',
    title: 'Essentials',
    emoji: '🆘',
    phrases: [
      { en: 'Thank you very much.', tr: { uz: 'Katta rahmat.', ru: 'Большое спасибо.', es: 'Muchas gracias.', fr: 'Merci beaucoup.' } },
      { en: 'Excuse me.', tr: { uz: 'Kechirasiz.', ru: 'Извините.', es: 'Disculpe.', fr: 'Excusez-moi.' } },
      { en: 'I don\'t understand.', tr: { uz: 'Tushunmadim.', ru: 'Я не понимаю.', es: 'No entiendo.', fr: 'Je ne comprends pas.' } },
      { en: 'Please speak slowly.', tr: { uz: 'Iltimos, sekin gapiring.', ru: 'Говорите медленно, пожалуйста.', es: 'Habla despacio, por favor.', fr: 'Parlez lentement, s\'il vous plaît.' } }
    ]
  }
]
