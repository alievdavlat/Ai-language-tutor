/**
 * UI string tables for the i18n scaffold (Task #38 / #A24). This is the
 * *interface* language (chrome / labels / buttons), distinct from the learner's
 * `targetLanguage` (the language they're studying) — and driven by the user's
 * `nativeLanguage` where we ship a table for it.
 *
 * Three languages: the user's own (Uzbek), English, Russian. Missing keys fall
 * back to English, then to the raw key, so nothing ever renders blank.
 *
 * Keep English as the source of truth; every key here must exist in all three
 * tables (the `Table` type enforces this at compile time).
 */

export type UILanguage = 'en' | 'uz' | 'ru'

export const UI_LANGUAGES: { code: UILanguage; label: string; nativeName: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'uz', label: 'Uzbek', nativeName: "O‘zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
]

/** Keys are dot-namespaced by area. Keep English as the source of truth. */
export type StringKey =
  // ── Navigation / chrome ──────────────────────────────────────────────
  | 'nav.home' | 'nav.courses' | 'nav.library' | 'nav.vocabulary' | 'nav.progress'
  | 'nav.speaking' | 'nav.clips' | 'nav.writing' | 'nav.community' | 'nav.explore'
  | 'nav.live' | 'nav.exams' | 'nav.settings' | 'nav.profile' | 'nav.notifications'
  | 'nav.inbox' | 'nav.dashboard' | 'nav.studio' | 'nav.channel' | 'nav.admin'
  | 'nav.tagline' | 'nav.collapse' | 'nav.expand'
  | 'nav.section.learn' | 'nav.section.practice' | 'nav.section.social'
  | 'nav.section.manage' | 'nav.section.engage'
  | 'role.studentAccount' | 'role.teacherAccount' | 'role.adminAccount'
  // ── Common ───────────────────────────────────────────────────────────
  | 'common.save' | 'common.cancel' | 'common.delete' | 'common.continue'
  | 'common.back' | 'common.search' | 'common.loading' | 'common.signOut'
  | 'common.signIn' | 'common.signUp' | 'common.close' | 'common.edit'
  | 'common.create' | 'common.you' | 'common.level' | 'common.start'
  | 'common.viewAll' | 'common.seeAll' | 'common.next' | 'common.done'
  // ── Home ─────────────────────────────────────────────────────────────
  | 'home.greeting' | 'home.dailyGoal' | 'home.streak' | 'home.minutesToday'
  | 'home.continueLearning' | 'home.popularCourses' | 'home.quests'
  | 'home.subtitle'
  // ── Courses ──────────────────────────────────────────────────────────
  | 'courses.title' | 'courses.subtitle' | 'courses.continueLearning'
  | 'courses.skillTracks' | 'courses.allCourses' | 'courses.enroll'
  | 'courses.continue' | 'courses.allLevels'
  // ── Vocabulary ───────────────────────────────────────────────────────
  | 'vocab.title' | 'vocab.subtitle' | 'vocab.myWords' | 'vocab.saved'
  | 'vocab.dictionary' | 'vocab.addWord' | 'vocab.review' | 'vocab.flashcards'
  | 'vocab.empty'
  // ── Progress ─────────────────────────────────────────────────────────
  | 'progress.title' | 'progress.subtitle' | 'progress.overview'
  | 'progress.goalsStreak' | 'progress.xp' | 'progress.level'
  // ── Exams ────────────────────────────────────────────────────────────
  | 'exams.title' | 'exams.subtitle' | 'exams.recentResults' | 'exams.startMock'
  // ── Speaking ─────────────────────────────────────────────────────────
  | 'speaking.title' | 'speaking.subtitle' | 'speaking.startTalking'
  | 'speaking.partner' | 'speaking.roleplays'
  // ── Settings ─────────────────────────────────────────────────────────
  | 'settings.title' | 'settings.subtitle' | 'settings.saving'
  | 'settings.tab.ai' | 'settings.tab.language' | 'settings.tab.companion'
  | 'settings.tab.microphone' | 'settings.tab.productivity'
  | 'settings.tab.privacy' | 'settings.tab.about'
  | 'settings.uiLanguage' | 'settings.privacy' | 'settings.account'
  | 'settings.learningLanguage' | 'settings.learningLanguageHint'
  | 'settings.nativeLanguage' | 'settings.nativeLanguageHint'
  | 'settings.changeLater'
  // ── Privacy ──────────────────────────────────────────────────────────
  | 'privacy.exportData' | 'privacy.deleteAccount' | 'privacy.contentSafety'
  | 'privacy.incognito' | 'privacy.incognitoHint' | 'privacy.yourData'

type Table = Record<StringKey, string>

const en: Table = {
  // Navigation / chrome
  'nav.home': 'Home',
  'nav.courses': 'Courses',
  'nav.library': 'Library',
  'nav.vocabulary': 'Vocabulary',
  'nav.progress': 'Progress',
  'nav.speaking': 'Speaking',
  'nav.clips': 'Clips',
  'nav.writing': 'Writing Coach',
  'nav.community': 'Community',
  'nav.explore': 'Explore',
  'nav.live': 'Live',
  'nav.exams': 'Exams',
  'nav.settings': 'Settings',
  'nav.profile': 'Profile',
  'nav.notifications': 'Notifications',
  'nav.inbox': 'Inbox',
  'nav.dashboard': 'Dashboard',
  'nav.studio': 'Creator Studio',
  'nav.channel': 'My channel',
  'nav.admin': 'Admin',
  'nav.tagline': 'Your coach',
  'nav.collapse': 'Collapse',
  'nav.expand': 'Expand sidebar',
  'nav.section.learn': 'Learn',
  'nav.section.practice': 'Practice',
  'nav.section.social': 'Social',
  'nav.section.manage': 'Manage',
  'nav.section.engage': 'Engage',
  'role.studentAccount': 'Student account',
  'role.teacherAccount': 'Teacher account',
  'role.adminAccount': 'Admin account',
  // Common
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
  'common.close': 'Close',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.you': 'You',
  'common.level': 'Level',
  'common.start': 'Start',
  'common.viewAll': 'View all',
  'common.seeAll': 'See all',
  'common.next': 'Next',
  'common.done': 'Done',
  // Home
  'home.greeting': 'Welcome back',
  'home.dailyGoal': 'Daily goal',
  'home.streak': 'Streak',
  'home.minutesToday': 'Minutes today',
  'home.continueLearning': 'Continue learning',
  'home.popularCourses': 'Popular courses',
  'home.quests': 'Daily quests',
  'home.subtitle': 'Pick up where you left off.',
  // Courses
  'courses.title': 'Courses',
  'courses.subtitle': 'Structured paths to fluency.',
  'courses.continueLearning': 'Continue learning',
  'courses.skillTracks': 'Skill tracks',
  'courses.allCourses': 'All courses',
  'courses.enroll': 'Enroll',
  'courses.continue': 'Continue',
  'courses.allLevels': 'All levels',
  // Vocabulary
  'vocab.title': 'Vocabulary',
  'vocab.subtitle': 'Build and review your words.',
  'vocab.myWords': 'My words',
  'vocab.saved': 'Saved',
  'vocab.dictionary': 'Dictionary',
  'vocab.addWord': 'Add word',
  'vocab.review': 'Review',
  'vocab.flashcards': 'Flashcards',
  'vocab.empty': 'No words yet — add your first one.',
  // Progress
  'progress.title': 'Progress',
  'progress.subtitle': 'Your learning, measured.',
  'progress.overview': 'Overview',
  'progress.goalsStreak': 'Goals & streak',
  'progress.xp': 'XP',
  'progress.level': 'Level',
  // Exams
  'exams.title': 'Exams',
  'exams.subtitle': 'Practice and track your test prep.',
  'exams.recentResults': 'Recent results',
  'exams.startMock': 'Start mock test',
  // Speaking
  'speaking.title': 'Speaking',
  'speaking.subtitle': 'Practice talking, your way.',
  'speaking.startTalking': 'Start talking',
  'speaking.partner': 'Speaking partner',
  'speaking.roleplays': 'Role-play labs',
  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Personalise your AI conversation partner and speaking experience.',
  'settings.saving': 'Saving…',
  'settings.tab.ai': 'AI',
  'settings.tab.language': 'Language',
  'settings.tab.companion': 'Companion',
  'settings.tab.microphone': 'Microphone',
  'settings.tab.productivity': 'Productivity',
  'settings.tab.privacy': 'Privacy',
  'settings.tab.about': 'About',
  'settings.uiLanguage': 'Interface language',
  'settings.privacy': 'Privacy',
  'settings.account': 'Account',
  'settings.learningLanguage': "Language you're learning",
  'settings.learningLanguageHint':
    'Exams, courses, library, vocabulary decks and the AI tutor all switch to this language.',
  'settings.nativeLanguage': 'Your language',
  'settings.nativeLanguageHint':
    'Word meanings are translated into this language, and the app interface follows it where a translation exists.',
  'settings.changeLater': 'You can change this anytime.',
  // Privacy
  'privacy.exportData': 'Export my data',
  'privacy.deleteAccount': 'Delete my account',
  'privacy.contentSafety': 'Safe content filter',
  'privacy.incognito': 'Incognito mode',
  'privacy.incognitoHint': 'Pause activity tracking — streaks and stats won’t update.',
  'privacy.yourData': 'Your data'
}

const uz: Table = {
  // Navigation / chrome
  'nav.home': 'Bosh sahifa',
  'nav.courses': 'Kurslar',
  'nav.library': 'Kutubxona',
  'nav.vocabulary': 'Lug‘at',
  'nav.progress': 'Natijalar',
  'nav.speaking': 'Gapirish',
  'nav.clips': 'Kliplar',
  'nav.writing': 'Yozuv murabbiyi',
  'nav.community': 'Hamjamiyat',
  'nav.explore': 'Kashf etish',
  'nav.live': 'Jonli',
  'nav.exams': 'Imtihonlar',
  'nav.settings': 'Sozlamalar',
  'nav.profile': 'Profil',
  'nav.notifications': 'Bildirishnomalar',
  'nav.inbox': 'Xabarlar',
  'nav.dashboard': 'Boshqaruv paneli',
  'nav.studio': 'Ijodkor studiyasi',
  'nav.channel': 'Mening kanalim',
  'nav.admin': 'Admin',
  'nav.tagline': 'Sizning murabbiyingiz',
  'nav.collapse': 'Yig‘ish',
  'nav.expand': 'Yon panelni ochish',
  'nav.section.learn': 'O‘rganish',
  'nav.section.practice': 'Mashq',
  'nav.section.social': 'Ijtimoiy',
  'nav.section.manage': 'Boshqarish',
  'nav.section.engage': 'Faollik',
  'role.studentAccount': 'O‘quvchi hisobi',
  'role.teacherAccount': 'O‘qituvchi hisobi',
  'role.adminAccount': 'Admin hisobi',
  // Common
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
  'common.close': 'Yopish',
  'common.edit': 'Tahrirlash',
  'common.create': 'Yaratish',
  'common.you': 'Siz',
  'common.level': 'Daraja',
  'common.start': 'Boshlash',
  'common.viewAll': 'Hammasini ko‘rish',
  'common.seeAll': 'Barchasini ko‘rish',
  'common.next': 'Keyingi',
  'common.done': 'Tayyor',
  // Home
  'home.greeting': 'Xush kelibsiz',
  'home.dailyGoal': 'Kunlik maqsad',
  'home.streak': 'Ketma-ketlik',
  'home.minutesToday': 'Bugungi daqiqalar',
  'home.continueLearning': 'O‘qishni davom ettirish',
  'home.popularCourses': 'Mashhur kurslar',
  'home.quests': 'Kunlik topshiriqlar',
  'home.subtitle': 'To‘xtagan joyingizdan davom eting.',
  // Courses
  'courses.title': 'Kurslar',
  'courses.subtitle': 'Ravon nutqqa tartibli yo‘l.',
  'courses.continueLearning': 'O‘qishni davom ettirish',
  'courses.skillTracks': 'Ko‘nikma yo‘nalishlari',
  'courses.allCourses': 'Barcha kurslar',
  'courses.enroll': 'Yozilish',
  'courses.continue': 'Davom etish',
  'courses.allLevels': 'Barcha darajalar',
  // Vocabulary
  'vocab.title': 'Lug‘at',
  'vocab.subtitle': 'So‘zlaringizni to‘plang va takrorlang.',
  'vocab.myWords': 'Mening so‘zlarim',
  'vocab.saved': 'Saqlangan',
  'vocab.dictionary': 'Lug‘at',
  'vocab.addWord': 'So‘z qo‘shish',
  'vocab.review': 'Takrorlash',
  'vocab.flashcards': 'Kartochkalar',
  'vocab.empty': 'Hali so‘z yo‘q — birinchisini qo‘shing.',
  // Progress
  'progress.title': 'Natijalar',
  'progress.subtitle': 'O‘qishingiz o‘lchovda.',
  'progress.overview': 'Umumiy ko‘rinish',
  'progress.goalsStreak': 'Maqsad va ketma-ketlik',
  'progress.xp': 'XP',
  'progress.level': 'Daraja',
  // Exams
  'exams.title': 'Imtihonlar',
  'exams.subtitle': 'Mashq qiling va tayyorgarligingizni kuzating.',
  'exams.recentResults': 'So‘nggi natijalar',
  'exams.startMock': 'Sinov imtihonini boshlash',
  // Speaking
  'speaking.title': 'Gapirish',
  'speaking.subtitle': 'O‘zingizga qulay tarzda gaplashing.',
  'speaking.startTalking': 'Gaplashishni boshlash',
  'speaking.partner': 'Suhbatdosh',
  'speaking.roleplays': 'Rol o‘yini mashqlari',
  // Settings
  'settings.title': 'Sozlamalar',
  'settings.subtitle': 'AI suhbatdoshingiz va gapirish tajribangizni moslang.',
  'settings.saving': 'Saqlanmoqda…',
  'settings.tab.ai': 'AI',
  'settings.tab.language': 'Til',
  'settings.tab.companion': 'Hamroh',
  'settings.tab.microphone': 'Mikrofon',
  'settings.tab.productivity': 'Samaradorlik',
  'settings.tab.privacy': 'Maxfiylik',
  'settings.tab.about': 'Dastur haqida',
  'settings.uiLanguage': 'Interfeys tili',
  'settings.privacy': 'Maxfiylik',
  'settings.account': 'Hisob',
  'settings.learningLanguage': 'O‘rganayotgan tilingiz',
  'settings.learningLanguageHint':
    'Imtihonlar, kurslar, kutubxona, lug‘at to‘plamlari va AI murabbiy shu tilga o‘tadi.',
  'settings.nativeLanguage': 'Sizning tilingiz',
  'settings.nativeLanguageHint':
    'So‘z ma’nolari shu tilga tarjima qilinadi va tarjima mavjud bo‘lsa, ilova interfeysi ham shunga ergashadi.',
  'settings.changeLater': 'Buni istalgan vaqtda o‘zgartirishingiz mumkin.',
  // Privacy
  'privacy.exportData': 'Ma’lumotlarimni yuklab olish',
  'privacy.deleteAccount': 'Hisobimni o‘chirish',
  'privacy.contentSafety': 'Xavfsiz kontent filtri',
  'privacy.incognito': 'Inkognito rejimi',
  'privacy.incognitoHint': 'Faollikni kuzatishni to‘xtatadi — ketma-ketlik va statistika yangilanmaydi.',
  'privacy.yourData': 'Ma’lumotlaringiz'
}

const ru: Table = {
  // Navigation / chrome
  'nav.home': 'Главная',
  'nav.courses': 'Курсы',
  'nav.library': 'Библиотека',
  'nav.vocabulary': 'Словарь',
  'nav.progress': 'Прогресс',
  'nav.speaking': 'Разговор',
  'nav.clips': 'Клипы',
  'nav.writing': 'Тренер письма',
  'nav.community': 'Сообщество',
  'nav.explore': 'Обзор',
  'nav.live': 'Эфир',
  'nav.exams': 'Экзамены',
  'nav.settings': 'Настройки',
  'nav.profile': 'Профиль',
  'nav.notifications': 'Уведомления',
  'nav.inbox': 'Сообщения',
  'nav.dashboard': 'Панель',
  'nav.studio': 'Студия автора',
  'nav.channel': 'Мой канал',
  'nav.admin': 'Админ',
  'nav.tagline': 'Ваш тренер',
  'nav.collapse': 'Свернуть',
  'nav.expand': 'Развернуть панель',
  'nav.section.learn': 'Учиться',
  'nav.section.practice': 'Практика',
  'nav.section.social': 'Сообщество',
  'nav.section.manage': 'Управление',
  'nav.section.engage': 'Взаимодействие',
  'role.studentAccount': 'Аккаунт ученика',
  'role.teacherAccount': 'Аккаунт преподавателя',
  'role.adminAccount': 'Аккаунт админа',
  // Common
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
  'common.close': 'Закрыть',
  'common.edit': 'Изменить',
  'common.create': 'Создать',
  'common.you': 'Вы',
  'common.level': 'Уровень',
  'common.start': 'Начать',
  'common.viewAll': 'Смотреть все',
  'common.seeAll': 'Показать все',
  'common.next': 'Далее',
  'common.done': 'Готово',
  // Home
  'home.greeting': 'С возвращением',
  'home.dailyGoal': 'Дневная цель',
  'home.streak': 'Серия',
  'home.minutesToday': 'Минут сегодня',
  'home.continueLearning': 'Продолжить обучение',
  'home.popularCourses': 'Популярные курсы',
  'home.quests': 'Ежедневные задания',
  'home.subtitle': 'Продолжите с того места, где остановились.',
  // Courses
  'courses.title': 'Курсы',
  'courses.subtitle': 'Структурированный путь к свободному владению.',
  'courses.continueLearning': 'Продолжить обучение',
  'courses.skillTracks': 'Направления навыков',
  'courses.allCourses': 'Все курсы',
  'courses.enroll': 'Записаться',
  'courses.continue': 'Продолжить',
  'courses.allLevels': 'Все уровни',
  // Vocabulary
  'vocab.title': 'Словарь',
  'vocab.subtitle': 'Собирайте и повторяйте свои слова.',
  'vocab.myWords': 'Мои слова',
  'vocab.saved': 'Сохранённые',
  'vocab.dictionary': 'Словарь',
  'vocab.addWord': 'Добавить слово',
  'vocab.review': 'Повторение',
  'vocab.flashcards': 'Карточки',
  'vocab.empty': 'Пока нет слов — добавьте первое.',
  // Progress
  'progress.title': 'Прогресс',
  'progress.subtitle': 'Ваше обучение в цифрах.',
  'progress.overview': 'Обзор',
  'progress.goalsStreak': 'Цели и серия',
  'progress.xp': 'XP',
  'progress.level': 'Уровень',
  // Exams
  'exams.title': 'Экзамены',
  'exams.subtitle': 'Тренируйтесь и отслеживайте подготовку.',
  'exams.recentResults': 'Последние результаты',
  'exams.startMock': 'Начать пробный тест',
  // Speaking
  'speaking.title': 'Разговор',
  'speaking.subtitle': 'Практикуйте речь по-своему.',
  'speaking.startTalking': 'Начать разговор',
  'speaking.partner': 'Собеседник',
  'speaking.roleplays': 'Ролевые сценарии',
  // Settings
  'settings.title': 'Настройки',
  'settings.subtitle': 'Настройте вашего ИИ-собеседника и опыт общения.',
  'settings.saving': 'Сохранение…',
  'settings.tab.ai': 'ИИ',
  'settings.tab.language': 'Язык',
  'settings.tab.companion': 'Компаньон',
  'settings.tab.microphone': 'Микрофон',
  'settings.tab.productivity': 'Продуктивность',
  'settings.tab.privacy': 'Приватность',
  'settings.tab.about': 'О программе',
  'settings.uiLanguage': 'Язык интерфейса',
  'settings.privacy': 'Приватность',
  'settings.account': 'Аккаунт',
  'settings.learningLanguage': 'Язык, который вы изучаете',
  'settings.learningLanguageHint':
    'Экзамены, курсы, библиотека, словарные наборы и ИИ-репетитор переключаются на этот язык.',
  'settings.nativeLanguage': 'Ваш язык',
  'settings.nativeLanguageHint':
    'Значения слов переводятся на этот язык, и интерфейс приложения следует ему там, где есть перевод.',
  'settings.changeLater': 'Вы можете изменить это в любой момент.',
  // Privacy
  'privacy.exportData': 'Экспорт моих данных',
  'privacy.deleteAccount': 'Удалить аккаунт',
  'privacy.contentSafety': 'Фильтр безопасного контента',
  'privacy.incognito': 'Режим инкогнито',
  'privacy.incognitoHint': 'Приостановить отслеживание активности — серии и статистика не обновляются.',
  'privacy.yourData': 'Ваши данные'
}

export const STRINGS: Record<UILanguage, Table> = { en, uz, ru }
