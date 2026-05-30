/**
 * UI string tables for the i18n scaffold (Task #38). This is the *interface*
 * language (chrome / labels / buttons), distinct from the learner's
 * `targetLanguage` (the language they're studying).
 *
 * Three languages to start — the user's own (Uzbek), English, Russian. Feature
 * sessions add keys as they localise their screens; missing keys fall back to
 * English, then to the raw key, so nothing ever renders blank.
 */

export type UILanguage = 'en' | 'uz' | 'ru'

export const UI_LANGUAGES: { code: UILanguage; label: string; nativeName: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'uz', label: 'Uzbek', nativeName: "O‘zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
]

/** Keys are dot-namespaced by area. Keep English as the source of truth. */
export type StringKey =
  | 'nav.home' | 'nav.courses' | 'nav.library' | 'nav.vocabulary' | 'nav.progress'
  | 'nav.speaking' | 'nav.community' | 'nav.live' | 'nav.exams' | 'nav.settings'
  | 'nav.profile' | 'nav.notifications' | 'nav.inbox'
  | 'common.save' | 'common.cancel' | 'common.delete' | 'common.continue'
  | 'common.back' | 'common.search' | 'common.loading' | 'common.signOut'
  | 'common.signIn' | 'common.signUp'
  | 'home.greeting' | 'home.dailyGoal' | 'home.streak' | 'home.minutesToday'
  | 'settings.uiLanguage' | 'settings.privacy' | 'settings.account'
  | 'privacy.exportData' | 'privacy.deleteAccount' | 'privacy.contentSafety'
  | 'privacy.incognito' | 'privacy.incognitoHint'

type Table = Record<StringKey, string>

const en: Table = {
  'nav.home': 'Home',
  'nav.courses': 'Courses',
  'nav.library': 'Library',
  'nav.vocabulary': 'Vocabulary',
  'nav.progress': 'Progress',
  'nav.speaking': 'Speaking',
  'nav.community': 'Community',
  'nav.live': 'Live',
  'nav.exams': 'Exams',
  'nav.settings': 'Settings',
  'nav.profile': 'Profile',
  'nav.notifications': 'Notifications',
  'nav.inbox': 'Inbox',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.signOut': 'Sign out',
  'common.signIn': 'Sign in',
  'common.signUp': 'Sign up',
  'home.greeting': 'Welcome back',
  'home.dailyGoal': 'Daily goal',
  'home.streak': 'Streak',
  'home.minutesToday': 'Minutes today',
  'settings.uiLanguage': 'Interface language',
  'settings.privacy': 'Privacy',
  'settings.account': 'Account',
  'privacy.exportData': 'Export my data',
  'privacy.deleteAccount': 'Delete my account',
  'privacy.contentSafety': 'Safe content filter',
  'privacy.incognito': 'Incognito mode',
  'privacy.incognitoHint': 'Pause activity tracking — streaks and stats won’t update.'
}

const uz: Table = {
  'nav.home': 'Bosh sahifa',
  'nav.courses': 'Kurslar',
  'nav.library': 'Kutubxona',
  'nav.vocabulary': 'Lug‘at',
  'nav.progress': 'Natijalar',
  'nav.speaking': 'Gapirish',
  'nav.community': 'Hamjamiyat',
  'nav.live': 'Jonli',
  'nav.exams': 'Imtihonlar',
  'nav.settings': 'Sozlamalar',
  'nav.profile': 'Profil',
  'nav.notifications': 'Bildirishnomalar',
  'nav.inbox': 'Xabarlar',
  'common.save': 'Saqlash',
  'common.cancel': 'Bekor qilish',
  'common.delete': 'O‘chirish',
  'common.continue': 'Davom etish',
  'common.back': 'Orqaga',
  'common.search': 'Qidirish',
  'common.loading': 'Yuklanmoqda…',
  'common.signOut': 'Chiqish',
  'common.signIn': 'Kirish',
  'common.signUp': 'Ro‘yxatdan o‘tish',
  'home.greeting': 'Xush kelibsiz',
  'home.dailyGoal': 'Kunlik maqsad',
  'home.streak': 'Ketma-ketlik',
  'home.minutesToday': 'Bugungi daqiqalar',
  'settings.uiLanguage': 'Interfeys tili',
  'settings.privacy': 'Maxfiylik',
  'settings.account': 'Hisob',
  'privacy.exportData': 'Ma’lumotlarimni yuklab olish',
  'privacy.deleteAccount': 'Hisobimni o‘chirish',
  'privacy.contentSafety': 'Xavfsiz kontent filtri',
  'privacy.incognito': 'Inkognito rejimi',
  'privacy.incognitoHint': 'Faollikni kuzatishni to‘xtatadi — ketma-ketlik va statistika yangilanmaydi.'
}

const ru: Table = {
  'nav.home': 'Главная',
  'nav.courses': 'Курсы',
  'nav.library': 'Библиотека',
  'nav.vocabulary': 'Словарь',
  'nav.progress': 'Прогресс',
  'nav.speaking': 'Разговор',
  'nav.community': 'Сообщество',
  'nav.live': 'Эфир',
  'nav.exams': 'Экзамены',
  'nav.settings': 'Настройки',
  'nav.profile': 'Профиль',
  'nav.notifications': 'Уведомления',
  'nav.inbox': 'Сообщения',
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.delete': 'Удалить',
  'common.continue': 'Продолжить',
  'common.back': 'Назад',
  'common.search': 'Поиск',
  'common.loading': 'Загрузка…',
  'common.signOut': 'Выйти',
  'common.signIn': 'Войти',
  'common.signUp': 'Регистрация',
  'home.greeting': 'С возвращением',
  'home.dailyGoal': 'Дневная цель',
  'home.streak': 'Серия',
  'home.minutesToday': 'Минут сегодня',
  'settings.uiLanguage': 'Язык интерфейса',
  'settings.privacy': 'Приватность',
  'settings.account': 'Аккаунт',
  'privacy.exportData': 'Экспорт моих данных',
  'privacy.deleteAccount': 'Удалить аккаунт',
  'privacy.contentSafety': 'Фильтр безопасного контента',
  'privacy.incognito': 'Режим инкогнито',
  'privacy.incognitoHint': 'Приостановить отслеживание активности — серии и статистика не обновляются.'
}

export const STRINGS: Record<UILanguage, Table> = { en, uz, ru }
