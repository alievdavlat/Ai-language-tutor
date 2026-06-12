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

export type UILanguage =
  | 'en' | 'uz' | 'ru' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'tr' | 'ja' | 'ko' | 'zh' | 'ar'

export const UI_LANGUAGES: { code: UILanguage; label: string; nativeName: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'uz', label: 'Uzbek', nativeName: "O‘zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'tr', label: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
]

/** RTL languages — the app shell flips direction for these. */
export const RTL_LANGUAGES: readonly UILanguage[] = ['ar']

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

// ── Additional native languages ───────────────────────────────────────────────
// These are typed Partial<Table>: any key not yet translated falls back to
// English at runtime (see `translate`). They are kept complete below, but the
// Partial type means a future new StringKey won't break the build for them.

const es: Partial<Table> = {
  'nav.home': 'Inicio', 'nav.courses': 'Cursos', 'nav.library': 'Biblioteca', 'nav.vocabulary': 'Vocabulario', 'nav.progress': 'Progreso',
  'nav.speaking': 'Hablar', 'nav.clips': 'Clips', 'nav.writing': 'Tutor de escritura', 'nav.community': 'Comunidad', 'nav.explore': 'Explorar',
  'nav.live': 'En vivo', 'nav.exams': 'Exámenes', 'nav.settings': 'Ajustes', 'nav.profile': 'Perfil', 'nav.notifications': 'Notificaciones',
  'nav.inbox': 'Mensajes', 'nav.dashboard': 'Panel', 'nav.studio': 'Estudio de creador', 'nav.channel': 'Mi canal', 'nav.admin': 'Admin',
  'nav.tagline': 'Tu entrenador', 'nav.collapse': 'Contraer', 'nav.expand': 'Expandir panel',
  'nav.section.learn': 'Aprender', 'nav.section.practice': 'Practicar', 'nav.section.social': 'Social', 'nav.section.manage': 'Gestionar', 'nav.section.engage': 'Participar',
  'role.studentAccount': 'Cuenta de estudiante', 'role.teacherAccount': 'Cuenta de profesor', 'role.adminAccount': 'Cuenta de admin',
  'common.save': 'Guardar', 'common.cancel': 'Cancelar', 'common.delete': 'Eliminar', 'common.continue': 'Continuar', 'common.back': 'Atrás',
  'common.search': 'Buscar', 'common.loading': 'Cargando…', 'common.signOut': 'Cerrar sesión', 'common.signIn': 'Iniciar sesión', 'common.signUp': 'Registrarse',
  'common.close': 'Cerrar', 'common.edit': 'Editar', 'common.create': 'Crear', 'common.you': 'Tú', 'common.level': 'Nivel', 'common.start': 'Empezar',
  'common.viewAll': 'Ver todo', 'common.seeAll': 'Ver todo', 'common.next': 'Siguiente', 'common.done': 'Hecho',
  'home.greeting': 'Bienvenido de nuevo', 'home.dailyGoal': 'Meta diaria', 'home.streak': 'Racha', 'home.minutesToday': 'Minutos hoy',
  'home.continueLearning': 'Continuar aprendiendo', 'home.popularCourses': 'Cursos populares', 'home.quests': 'Misiones diarias', 'home.subtitle': 'Retoma donde lo dejaste.',
  'courses.title': 'Cursos', 'courses.subtitle': 'Rutas estructuradas hacia la fluidez.', 'courses.continueLearning': 'Continuar aprendiendo',
  'courses.skillTracks': 'Itinerarios de habilidades', 'courses.allCourses': 'Todos los cursos', 'courses.enroll': 'Inscribirse', 'courses.continue': 'Continuar', 'courses.allLevels': 'Todos los niveles',
  'vocab.title': 'Vocabulario', 'vocab.subtitle': 'Crea y repasa tus palabras.', 'vocab.myWords': 'Mis palabras', 'vocab.saved': 'Guardadas',
  'vocab.dictionary': 'Diccionario', 'vocab.addWord': 'Añadir palabra', 'vocab.review': 'Repasar', 'vocab.flashcards': 'Tarjetas', 'vocab.empty': 'Aún no hay palabras: añade la primera.',
  'progress.title': 'Progreso', 'progress.subtitle': 'Tu aprendizaje, medido.', 'progress.overview': 'Resumen', 'progress.goalsStreak': 'Metas y racha', 'progress.xp': 'XP', 'progress.level': 'Nivel',
  'exams.title': 'Exámenes', 'exams.subtitle': 'Practica y sigue tu preparación.', 'exams.recentResults': 'Resultados recientes', 'exams.startMock': 'Empezar simulacro',
  'speaking.title': 'Hablar', 'speaking.subtitle': 'Practica hablar a tu manera.', 'speaking.startTalking': 'Empezar a hablar', 'speaking.partner': 'Compañero de conversación', 'speaking.roleplays': 'Juegos de rol',
  'settings.title': 'Ajustes', 'settings.subtitle': 'Personaliza tu compañero de IA y tu experiencia al hablar.', 'settings.saving': 'Guardando…',
  'settings.tab.ai': 'IA', 'settings.tab.language': 'Idioma', 'settings.tab.companion': 'Compañero', 'settings.tab.microphone': 'Micrófono', 'settings.tab.productivity': 'Productividad', 'settings.tab.privacy': 'Privacidad', 'settings.tab.about': 'Acerca de',
  'settings.uiLanguage': 'Idioma de la interfaz', 'settings.privacy': 'Privacidad', 'settings.account': 'Cuenta',
  'settings.learningLanguage': 'Idioma que estás aprendiendo', 'settings.learningLanguageHint': 'Exámenes, cursos, biblioteca, listas de vocabulario y el tutor de IA cambian a este idioma.',
  'settings.nativeLanguage': 'Tu idioma', 'settings.nativeLanguageHint': 'Los significados se traducen a este idioma y la interfaz lo sigue cuando hay traducción.',
  'settings.changeLater': 'Puedes cambiarlo en cualquier momento.',
  'privacy.exportData': 'Exportar mis datos', 'privacy.deleteAccount': 'Eliminar mi cuenta', 'privacy.contentSafety': 'Filtro de contenido seguro', 'privacy.incognito': 'Modo incógnito',
  'privacy.incognitoHint': 'Pausa el seguimiento de actividad: rachas y estadísticas no se actualizan.', 'privacy.yourData': 'Tus datos'
}

const fr: Partial<Table> = {
  'nav.home': 'Accueil', 'nav.courses': 'Cours', 'nav.library': 'Bibliothèque', 'nav.vocabulary': 'Vocabulaire', 'nav.progress': 'Progrès',
  'nav.speaking': 'Parler', 'nav.clips': 'Clips', 'nav.writing': 'Coach d’écriture', 'nav.community': 'Communauté', 'nav.explore': 'Explorer',
  'nav.live': 'En direct', 'nav.exams': 'Examens', 'nav.settings': 'Paramètres', 'nav.profile': 'Profil', 'nav.notifications': 'Notifications',
  'nav.inbox': 'Messages', 'nav.dashboard': 'Tableau de bord', 'nav.studio': 'Studio créateur', 'nav.channel': 'Ma chaîne', 'nav.admin': 'Admin',
  'nav.tagline': 'Votre coach', 'nav.collapse': 'Réduire', 'nav.expand': 'Agrandir le panneau',
  'nav.section.learn': 'Apprendre', 'nav.section.practice': 'Pratiquer', 'nav.section.social': 'Social', 'nav.section.manage': 'Gérer', 'nav.section.engage': 'Participer',
  'role.studentAccount': 'Compte étudiant', 'role.teacherAccount': 'Compte enseignant', 'role.adminAccount': 'Compte admin',
  'common.save': 'Enregistrer', 'common.cancel': 'Annuler', 'common.delete': 'Supprimer', 'common.continue': 'Continuer', 'common.back': 'Retour',
  'common.search': 'Rechercher', 'common.loading': 'Chargement…', 'common.signOut': 'Se déconnecter', 'common.signIn': 'Se connecter', 'common.signUp': 'S’inscrire',
  'common.close': 'Fermer', 'common.edit': 'Modifier', 'common.create': 'Créer', 'common.you': 'Vous', 'common.level': 'Niveau', 'common.start': 'Commencer',
  'common.viewAll': 'Tout voir', 'common.seeAll': 'Tout voir', 'common.next': 'Suivant', 'common.done': 'Terminé',
  'home.greeting': 'Bon retour', 'home.dailyGoal': 'Objectif quotidien', 'home.streak': 'Série', 'home.minutesToday': 'Minutes aujourd’hui',
  'home.continueLearning': 'Continuer l’apprentissage', 'home.popularCourses': 'Cours populaires', 'home.quests': 'Quêtes quotidiennes', 'home.subtitle': 'Reprenez où vous vous êtes arrêté.',
  'courses.title': 'Cours', 'courses.subtitle': 'Des parcours structurés vers l’aisance.', 'courses.continueLearning': 'Continuer l’apprentissage',
  'courses.skillTracks': 'Parcours de compétences', 'courses.allCourses': 'Tous les cours', 'courses.enroll': 'S’inscrire', 'courses.continue': 'Continuer', 'courses.allLevels': 'Tous les niveaux',
  'vocab.title': 'Vocabulaire', 'vocab.subtitle': 'Constituez et révisez vos mots.', 'vocab.myWords': 'Mes mots', 'vocab.saved': 'Enregistrés',
  'vocab.dictionary': 'Dictionnaire', 'vocab.addWord': 'Ajouter un mot', 'vocab.review': 'Réviser', 'vocab.flashcards': 'Cartes', 'vocab.empty': 'Pas encore de mots — ajoutez le premier.',
  'progress.title': 'Progrès', 'progress.subtitle': 'Votre apprentissage, mesuré.', 'progress.overview': 'Aperçu', 'progress.goalsStreak': 'Objectifs et série', 'progress.xp': 'XP', 'progress.level': 'Niveau',
  'exams.title': 'Examens', 'exams.subtitle': 'Entraînez-vous et suivez votre préparation.', 'exams.recentResults': 'Résultats récents', 'exams.startMock': 'Commencer l’examen blanc',
  'speaking.title': 'Parler', 'speaking.subtitle': 'Pratiquez l’oral à votre façon.', 'speaking.startTalking': 'Commencer à parler', 'speaking.partner': 'Partenaire de conversation', 'speaking.roleplays': 'Jeux de rôle',
  'settings.title': 'Paramètres', 'settings.subtitle': 'Personnalisez votre partenaire IA et votre expérience orale.', 'settings.saving': 'Enregistrement…',
  'settings.tab.ai': 'IA', 'settings.tab.language': 'Langue', 'settings.tab.companion': 'Compagnon', 'settings.tab.microphone': 'Microphone', 'settings.tab.productivity': 'Productivité', 'settings.tab.privacy': 'Confidentialité', 'settings.tab.about': 'À propos',
  'settings.uiLanguage': 'Langue de l’interface', 'settings.privacy': 'Confidentialité', 'settings.account': 'Compte',
  'settings.learningLanguage': 'Langue que vous apprenez', 'settings.learningLanguageHint': 'Examens, cours, bibliothèque, listes de vocabulaire et tuteur IA passent à cette langue.',
  'settings.nativeLanguage': 'Votre langue', 'settings.nativeLanguageHint': 'Les définitions sont traduites dans cette langue, et l’interface la suit lorsqu’une traduction existe.',
  'settings.changeLater': 'Vous pouvez changer cela à tout moment.',
  'privacy.exportData': 'Exporter mes données', 'privacy.deleteAccount': 'Supprimer mon compte', 'privacy.contentSafety': 'Filtre de contenu sûr', 'privacy.incognito': 'Mode navigation privée',
  'privacy.incognitoHint': 'Suspend le suivi d’activité — séries et statistiques ne sont pas mises à jour.', 'privacy.yourData': 'Vos données'
}

const de: Partial<Table> = {
  'nav.home': 'Start', 'nav.courses': 'Kurse', 'nav.library': 'Bibliothek', 'nav.vocabulary': 'Vokabeln', 'nav.progress': 'Fortschritt',
  'nav.speaking': 'Sprechen', 'nav.clips': 'Clips', 'nav.writing': 'Schreibcoach', 'nav.community': 'Community', 'nav.explore': 'Entdecken',
  'nav.live': 'Live', 'nav.exams': 'Prüfungen', 'nav.settings': 'Einstellungen', 'nav.profile': 'Profil', 'nav.notifications': 'Benachrichtigungen',
  'nav.inbox': 'Nachrichten', 'nav.dashboard': 'Übersicht', 'nav.studio': 'Creator-Studio', 'nav.channel': 'Mein Kanal', 'nav.admin': 'Admin',
  'nav.tagline': 'Dein Coach', 'nav.collapse': 'Einklappen', 'nav.expand': 'Leiste ausklappen',
  'nav.section.learn': 'Lernen', 'nav.section.practice': 'Üben', 'nav.section.social': 'Sozial', 'nav.section.manage': 'Verwalten', 'nav.section.engage': 'Mitmachen',
  'role.studentAccount': 'Schülerkonto', 'role.teacherAccount': 'Lehrerkonto', 'role.adminAccount': 'Admin-Konto',
  'common.save': 'Speichern', 'common.cancel': 'Abbrechen', 'common.delete': 'Löschen', 'common.continue': 'Weiter', 'common.back': 'Zurück',
  'common.search': 'Suchen', 'common.loading': 'Lädt…', 'common.signOut': 'Abmelden', 'common.signIn': 'Anmelden', 'common.signUp': 'Registrieren',
  'common.close': 'Schließen', 'common.edit': 'Bearbeiten', 'common.create': 'Erstellen', 'common.you': 'Du', 'common.level': 'Niveau', 'common.start': 'Starten',
  'common.viewAll': 'Alle ansehen', 'common.seeAll': 'Alle ansehen', 'common.next': 'Weiter', 'common.done': 'Fertig',
  'home.greeting': 'Willkommen zurück', 'home.dailyGoal': 'Tagesziel', 'home.streak': 'Serie', 'home.minutesToday': 'Minuten heute',
  'home.continueLearning': 'Weiterlernen', 'home.popularCourses': 'Beliebte Kurse', 'home.quests': 'Tägliche Aufgaben', 'home.subtitle': 'Mach dort weiter, wo du aufgehört hast.',
  'courses.title': 'Kurse', 'courses.subtitle': 'Strukturierte Wege zur Sprachgewandtheit.', 'courses.continueLearning': 'Weiterlernen',
  'courses.skillTracks': 'Kompetenz-Pfade', 'courses.allCourses': 'Alle Kurse', 'courses.enroll': 'Einschreiben', 'courses.continue': 'Fortsetzen', 'courses.allLevels': 'Alle Niveaus',
  'vocab.title': 'Vokabeln', 'vocab.subtitle': 'Sammle und wiederhole deine Wörter.', 'vocab.myWords': 'Meine Wörter', 'vocab.saved': 'Gespeichert',
  'vocab.dictionary': 'Wörterbuch', 'vocab.addWord': 'Wort hinzufügen', 'vocab.review': 'Wiederholen', 'vocab.flashcards': 'Karteikarten', 'vocab.empty': 'Noch keine Wörter — füge dein erstes hinzu.',
  'progress.title': 'Fortschritt', 'progress.subtitle': 'Dein Lernen, gemessen.', 'progress.overview': 'Übersicht', 'progress.goalsStreak': 'Ziele & Serie', 'progress.xp': 'XP', 'progress.level': 'Niveau',
  'exams.title': 'Prüfungen', 'exams.subtitle': 'Übe und verfolge deine Vorbereitung.', 'exams.recentResults': 'Aktuelle Ergebnisse', 'exams.startMock': 'Probetest starten',
  'speaking.title': 'Sprechen', 'speaking.subtitle': 'Übe das Sprechen auf deine Weise.', 'speaking.startTalking': 'Sprechen beginnen', 'speaking.partner': 'Gesprächspartner', 'speaking.roleplays': 'Rollenspiele',
  'settings.title': 'Einstellungen', 'settings.subtitle': 'Personalisiere deinen KI-Partner und dein Sprecherlebnis.', 'settings.saving': 'Speichern…',
  'settings.tab.ai': 'KI', 'settings.tab.language': 'Sprache', 'settings.tab.companion': 'Begleiter', 'settings.tab.microphone': 'Mikrofon', 'settings.tab.productivity': 'Produktivität', 'settings.tab.privacy': 'Datenschutz', 'settings.tab.about': 'Über',
  'settings.uiLanguage': 'Oberflächensprache', 'settings.privacy': 'Datenschutz', 'settings.account': 'Konto',
  'settings.learningLanguage': 'Sprache, die du lernst', 'settings.learningLanguageHint': 'Prüfungen, Kurse, Bibliothek, Vokabellisten und der KI-Tutor wechseln zu dieser Sprache.',
  'settings.nativeLanguage': 'Deine Sprache', 'settings.nativeLanguageHint': 'Wortbedeutungen werden in diese Sprache übersetzt, und die Oberfläche folgt ihr, wo eine Übersetzung existiert.',
  'settings.changeLater': 'Du kannst dies jederzeit ändern.',
  'privacy.exportData': 'Meine Daten exportieren', 'privacy.deleteAccount': 'Konto löschen', 'privacy.contentSafety': 'Sicherer Inhaltsfilter', 'privacy.incognito': 'Inkognito-Modus',
  'privacy.incognitoHint': 'Aktivitätsverfolgung pausieren — Serien und Statistiken werden nicht aktualisiert.', 'privacy.yourData': 'Deine Daten'
}

const it: Partial<Table> = {
  'nav.home': 'Home', 'nav.courses': 'Corsi', 'nav.library': 'Biblioteca', 'nav.vocabulary': 'Vocabolario', 'nav.progress': 'Progressi',
  'nav.speaking': 'Parlare', 'nav.clips': 'Clip', 'nav.writing': 'Coach di scrittura', 'nav.community': 'Comunità', 'nav.explore': 'Esplora',
  'nav.live': 'Live', 'nav.exams': 'Esami', 'nav.settings': 'Impostazioni', 'nav.profile': 'Profilo', 'nav.notifications': 'Notifiche',
  'nav.inbox': 'Messaggi', 'nav.dashboard': 'Pannello', 'nav.studio': 'Studio creatore', 'nav.channel': 'Il mio canale', 'nav.admin': 'Admin',
  'nav.tagline': 'Il tuo coach', 'nav.collapse': 'Comprimi', 'nav.expand': 'Espandi pannello',
  'nav.section.learn': 'Imparare', 'nav.section.practice': 'Pratica', 'nav.section.social': 'Social', 'nav.section.manage': 'Gestisci', 'nav.section.engage': 'Partecipa',
  'role.studentAccount': 'Account studente', 'role.teacherAccount': 'Account insegnante', 'role.adminAccount': 'Account admin',
  'common.save': 'Salva', 'common.cancel': 'Annulla', 'common.delete': 'Elimina', 'common.continue': 'Continua', 'common.back': 'Indietro',
  'common.search': 'Cerca', 'common.loading': 'Caricamento…', 'common.signOut': 'Esci', 'common.signIn': 'Accedi', 'common.signUp': 'Registrati',
  'common.close': 'Chiudi', 'common.edit': 'Modifica', 'common.create': 'Crea', 'common.you': 'Tu', 'common.level': 'Livello', 'common.start': 'Inizia',
  'common.viewAll': 'Vedi tutto', 'common.seeAll': 'Vedi tutto', 'common.next': 'Avanti', 'common.done': 'Fatto',
  'home.greeting': 'Bentornato', 'home.dailyGoal': 'Obiettivo giornaliero', 'home.streak': 'Serie', 'home.minutesToday': 'Minuti oggi',
  'home.continueLearning': 'Continua a imparare', 'home.popularCourses': 'Corsi popolari', 'home.quests': 'Missioni giornaliere', 'home.subtitle': 'Riprendi da dove avevi lasciato.',
  'courses.title': 'Corsi', 'courses.subtitle': 'Percorsi strutturati verso la fluidità.', 'courses.continueLearning': 'Continua a imparare',
  'courses.skillTracks': 'Percorsi di abilità', 'courses.allCourses': 'Tutti i corsi', 'courses.enroll': 'Iscriviti', 'courses.continue': 'Continua', 'courses.allLevels': 'Tutti i livelli',
  'vocab.title': 'Vocabolario', 'vocab.subtitle': 'Crea e ripassa le tue parole.', 'vocab.myWords': 'Le mie parole', 'vocab.saved': 'Salvate',
  'vocab.dictionary': 'Dizionario', 'vocab.addWord': 'Aggiungi parola', 'vocab.review': 'Ripassa', 'vocab.flashcards': 'Flashcard', 'vocab.empty': 'Ancora nessuna parola — aggiungi la prima.',
  'progress.title': 'Progressi', 'progress.subtitle': 'Il tuo apprendimento, misurato.', 'progress.overview': 'Panoramica', 'progress.goalsStreak': 'Obiettivi e serie', 'progress.xp': 'XP', 'progress.level': 'Livello',
  'exams.title': 'Esami', 'exams.subtitle': 'Esercitati e monitora la preparazione.', 'exams.recentResults': 'Risultati recenti', 'exams.startMock': 'Inizia simulazione',
  'speaking.title': 'Parlare', 'speaking.subtitle': 'Esercitati a parlare a modo tuo.', 'speaking.startTalking': 'Inizia a parlare', 'speaking.partner': 'Partner di conversazione', 'speaking.roleplays': 'Giochi di ruolo',
  'settings.title': 'Impostazioni', 'settings.subtitle': 'Personalizza il tuo partner IA e l’esperienza di conversazione.', 'settings.saving': 'Salvataggio…',
  'settings.tab.ai': 'IA', 'settings.tab.language': 'Lingua', 'settings.tab.companion': 'Compagno', 'settings.tab.microphone': 'Microfono', 'settings.tab.productivity': 'Produttività', 'settings.tab.privacy': 'Privacy', 'settings.tab.about': 'Info',
  'settings.uiLanguage': 'Lingua dell’interfaccia', 'settings.privacy': 'Privacy', 'settings.account': 'Account',
  'settings.learningLanguage': 'Lingua che stai imparando', 'settings.learningLanguageHint': 'Esami, corsi, biblioteca, elenchi di vocaboli e il tutor IA passano a questa lingua.',
  'settings.nativeLanguage': 'La tua lingua', 'settings.nativeLanguageHint': 'I significati vengono tradotti in questa lingua e l’interfaccia la segue dove esiste una traduzione.',
  'settings.changeLater': 'Puoi cambiarlo in qualsiasi momento.',
  'privacy.exportData': 'Esporta i miei dati', 'privacy.deleteAccount': 'Elimina account', 'privacy.contentSafety': 'Filtro contenuti sicuri', 'privacy.incognito': 'Modalità incognito',
  'privacy.incognitoHint': 'Sospende il tracciamento — serie e statistiche non si aggiornano.', 'privacy.yourData': 'I tuoi dati'
}

const pt: Partial<Table> = {
  'nav.home': 'Início', 'nav.courses': 'Cursos', 'nav.library': 'Biblioteca', 'nav.vocabulary': 'Vocabulário', 'nav.progress': 'Progresso',
  'nav.speaking': 'Falar', 'nav.clips': 'Clipes', 'nav.writing': 'Tutor de escrita', 'nav.community': 'Comunidade', 'nav.explore': 'Explorar',
  'nav.live': 'Ao vivo', 'nav.exams': 'Exames', 'nav.settings': 'Configurações', 'nav.profile': 'Perfil', 'nav.notifications': 'Notificações',
  'nav.inbox': 'Mensagens', 'nav.dashboard': 'Painel', 'nav.studio': 'Estúdio do criador', 'nav.channel': 'Meu canal', 'nav.admin': 'Admin',
  'nav.tagline': 'Seu treinador', 'nav.collapse': 'Recolher', 'nav.expand': 'Expandir painel',
  'nav.section.learn': 'Aprender', 'nav.section.practice': 'Praticar', 'nav.section.social': 'Social', 'nav.section.manage': 'Gerenciar', 'nav.section.engage': 'Participar',
  'role.studentAccount': 'Conta de aluno', 'role.teacherAccount': 'Conta de professor', 'role.adminAccount': 'Conta de admin',
  'common.save': 'Salvar', 'common.cancel': 'Cancelar', 'common.delete': 'Excluir', 'common.continue': 'Continuar', 'common.back': 'Voltar',
  'common.search': 'Pesquisar', 'common.loading': 'Carregando…', 'common.signOut': 'Sair', 'common.signIn': 'Entrar', 'common.signUp': 'Cadastrar-se',
  'common.close': 'Fechar', 'common.edit': 'Editar', 'common.create': 'Criar', 'common.you': 'Você', 'common.level': 'Nível', 'common.start': 'Começar',
  'common.viewAll': 'Ver tudo', 'common.seeAll': 'Ver tudo', 'common.next': 'Próximo', 'common.done': 'Concluído',
  'home.greeting': 'Bem-vindo de volta', 'home.dailyGoal': 'Meta diária', 'home.streak': 'Sequência', 'home.minutesToday': 'Minutos hoje',
  'home.continueLearning': 'Continuar aprendendo', 'home.popularCourses': 'Cursos populares', 'home.quests': 'Missões diárias', 'home.subtitle': 'Continue de onde parou.',
  'courses.title': 'Cursos', 'courses.subtitle': 'Trilhas estruturadas para a fluência.', 'courses.continueLearning': 'Continuar aprendendo',
  'courses.skillTracks': 'Trilhas de habilidades', 'courses.allCourses': 'Todos os cursos', 'courses.enroll': 'Inscrever-se', 'courses.continue': 'Continuar', 'courses.allLevels': 'Todos os níveis',
  'vocab.title': 'Vocabulário', 'vocab.subtitle': 'Crie e revise suas palavras.', 'vocab.myWords': 'Minhas palavras', 'vocab.saved': 'Salvas',
  'vocab.dictionary': 'Dicionário', 'vocab.addWord': 'Adicionar palavra', 'vocab.review': 'Revisar', 'vocab.flashcards': 'Cartões', 'vocab.empty': 'Ainda sem palavras — adicione a primeira.',
  'progress.title': 'Progresso', 'progress.subtitle': 'Seu aprendizado, medido.', 'progress.overview': 'Visão geral', 'progress.goalsStreak': 'Metas e sequência', 'progress.xp': 'XP', 'progress.level': 'Nível',
  'exams.title': 'Exames', 'exams.subtitle': 'Pratique e acompanhe sua preparação.', 'exams.recentResults': 'Resultados recentes', 'exams.startMock': 'Iniciar simulado',
  'speaking.title': 'Falar', 'speaking.subtitle': 'Pratique falar do seu jeito.', 'speaking.startTalking': 'Começar a falar', 'speaking.partner': 'Parceiro de conversa', 'speaking.roleplays': 'Dramatizações',
  'settings.title': 'Configurações', 'settings.subtitle': 'Personalize seu parceiro de IA e sua experiência de fala.', 'settings.saving': 'Salvando…',
  'settings.tab.ai': 'IA', 'settings.tab.language': 'Idioma', 'settings.tab.companion': 'Companheiro', 'settings.tab.microphone': 'Microfone', 'settings.tab.productivity': 'Produtividade', 'settings.tab.privacy': 'Privacidade', 'settings.tab.about': 'Sobre',
  'settings.uiLanguage': 'Idioma da interface', 'settings.privacy': 'Privacidade', 'settings.account': 'Conta',
  'settings.learningLanguage': 'Idioma que você está aprendendo', 'settings.learningLanguageHint': 'Exames, cursos, biblioteca, listas de vocabulário e o tutor de IA mudam para este idioma.',
  'settings.nativeLanguage': 'Seu idioma', 'settings.nativeLanguageHint': 'Os significados são traduzidos para este idioma e a interface o segue quando há tradução.',
  'settings.changeLater': 'Você pode alterar isso a qualquer momento.',
  'privacy.exportData': 'Exportar meus dados', 'privacy.deleteAccount': 'Excluir minha conta', 'privacy.contentSafety': 'Filtro de conteúdo seguro', 'privacy.incognito': 'Modo anônimo',
  'privacy.incognitoHint': 'Pausa o rastreamento de atividade — sequências e estatísticas não são atualizadas.', 'privacy.yourData': 'Seus dados'
}

const tr: Partial<Table> = {
  'nav.home': 'Ana sayfa', 'nav.courses': 'Kurslar', 'nav.library': 'Kütüphane', 'nav.vocabulary': 'Kelime', 'nav.progress': 'İlerleme',
  'nav.speaking': 'Konuşma', 'nav.clips': 'Klipler', 'nav.writing': 'Yazma koçu', 'nav.community': 'Topluluk', 'nav.explore': 'Keşfet',
  'nav.live': 'Canlı', 'nav.exams': 'Sınavlar', 'nav.settings': 'Ayarlar', 'nav.profile': 'Profil', 'nav.notifications': 'Bildirimler',
  'nav.inbox': 'Mesajlar', 'nav.dashboard': 'Panel', 'nav.studio': 'Yaratıcı stüdyosu', 'nav.channel': 'Kanalım', 'nav.admin': 'Yönetici',
  'nav.tagline': 'Koçun', 'nav.collapse': 'Daralt', 'nav.expand': 'Paneli genişlet',
  'nav.section.learn': 'Öğren', 'nav.section.practice': 'Pratik', 'nav.section.social': 'Sosyal', 'nav.section.manage': 'Yönet', 'nav.section.engage': 'Katıl',
  'role.studentAccount': 'Öğrenci hesabı', 'role.teacherAccount': 'Öğretmen hesabı', 'role.adminAccount': 'Yönetici hesabı',
  'common.save': 'Kaydet', 'common.cancel': 'İptal', 'common.delete': 'Sil', 'common.continue': 'Devam', 'common.back': 'Geri',
  'common.search': 'Ara', 'common.loading': 'Yükleniyor…', 'common.signOut': 'Çıkış yap', 'common.signIn': 'Giriş yap', 'common.signUp': 'Kayıt ol',
  'common.close': 'Kapat', 'common.edit': 'Düzenle', 'common.create': 'Oluştur', 'common.you': 'Sen', 'common.level': 'Seviye', 'common.start': 'Başla',
  'common.viewAll': 'Tümünü gör', 'common.seeAll': 'Tümünü gör', 'common.next': 'İleri', 'common.done': 'Tamam',
  'home.greeting': 'Tekrar hoş geldin', 'home.dailyGoal': 'Günlük hedef', 'home.streak': 'Seri', 'home.minutesToday': 'Bugünkü dakika',
  'home.continueLearning': 'Öğrenmeye devam et', 'home.popularCourses': 'Popüler kurslar', 'home.quests': 'Günlük görevler', 'home.subtitle': 'Kaldığın yerden devam et.',
  'courses.title': 'Kurslar', 'courses.subtitle': 'Akıcılığa giden yapılandırılmış yollar.', 'courses.continueLearning': 'Öğrenmeye devam et',
  'courses.skillTracks': 'Beceri rotaları', 'courses.allCourses': 'Tüm kurslar', 'courses.enroll': 'Kaydol', 'courses.continue': 'Devam et', 'courses.allLevels': 'Tüm seviyeler',
  'vocab.title': 'Kelime', 'vocab.subtitle': 'Kelimelerini oluştur ve tekrar et.', 'vocab.myWords': 'Kelimelerim', 'vocab.saved': 'Kaydedilenler',
  'vocab.dictionary': 'Sözlük', 'vocab.addWord': 'Kelime ekle', 'vocab.review': 'Tekrar et', 'vocab.flashcards': 'Kartlar', 'vocab.empty': 'Henüz kelime yok — ilkini ekle.',
  'progress.title': 'İlerleme', 'progress.subtitle': 'Öğrenmen, ölçülü.', 'progress.overview': 'Genel bakış', 'progress.goalsStreak': 'Hedefler ve seri', 'progress.xp': 'XP', 'progress.level': 'Seviye',
  'exams.title': 'Sınavlar', 'exams.subtitle': 'Pratik yap ve hazırlığını takip et.', 'exams.recentResults': 'Son sonuçlar', 'exams.startMock': 'Deneme sınavı başlat',
  'speaking.title': 'Konuşma', 'speaking.subtitle': 'Konuşmayı kendi tarzında pratik et.', 'speaking.startTalking': 'Konuşmaya başla', 'speaking.partner': 'Konuşma partneri', 'speaking.roleplays': 'Rol yapma',
  'settings.title': 'Ayarlar', 'settings.subtitle': 'Yapay zeka partnerini ve konuşma deneyimini kişiselleştir.', 'settings.saving': 'Kaydediliyor…',
  'settings.tab.ai': 'YZ', 'settings.tab.language': 'Dil', 'settings.tab.companion': 'Arkadaş', 'settings.tab.microphone': 'Mikrofon', 'settings.tab.productivity': 'Üretkenlik', 'settings.tab.privacy': 'Gizlilik', 'settings.tab.about': 'Hakkında',
  'settings.uiLanguage': 'Arayüz dili', 'settings.privacy': 'Gizlilik', 'settings.account': 'Hesap',
  'settings.learningLanguage': 'Öğrendiğin dil', 'settings.learningLanguageHint': 'Sınavlar, kurslar, kütüphane, kelime listeleri ve YZ eğitmeni bu dile geçer.',
  'settings.nativeLanguage': 'Senin dilin', 'settings.nativeLanguageHint': 'Kelime anlamları bu dile çevrilir ve çeviri varsa arayüz de bu dili izler.',
  'settings.changeLater': 'Bunu istediğin zaman değiştirebilirsin.',
  'privacy.exportData': 'Verilerimi dışa aktar', 'privacy.deleteAccount': 'Hesabımı sil', 'privacy.contentSafety': 'Güvenli içerik filtresi', 'privacy.incognito': 'Gizli mod',
  'privacy.incognitoHint': 'Etkinlik takibini duraklatır — seriler ve istatistikler güncellenmez.', 'privacy.yourData': 'Verilerin'
}

const ja: Partial<Table> = {
  'nav.home': 'ホーム', 'nav.courses': 'コース', 'nav.library': 'ライブラリ', 'nav.vocabulary': '単語', 'nav.progress': '進捗',
  'nav.speaking': 'スピーキング', 'nav.clips': 'クリップ', 'nav.writing': 'ライティングコーチ', 'nav.community': 'コミュニティ', 'nav.explore': '探す',
  'nav.live': 'ライブ', 'nav.exams': '試験', 'nav.settings': '設定', 'nav.profile': 'プロフィール', 'nav.notifications': '通知',
  'nav.inbox': 'メッセージ', 'nav.dashboard': 'ダッシュボード', 'nav.studio': 'クリエイタースタジオ', 'nav.channel': 'マイチャンネル', 'nav.admin': '管理',
  'nav.tagline': 'あなたのコーチ', 'nav.collapse': '折りたたむ', 'nav.expand': 'サイドバーを開く',
  'nav.section.learn': '学ぶ', 'nav.section.practice': '練習', 'nav.section.social': 'ソーシャル', 'nav.section.manage': '管理', 'nav.section.engage': '参加',
  'role.studentAccount': '生徒アカウント', 'role.teacherAccount': '講師アカウント', 'role.adminAccount': '管理者アカウント',
  'common.save': '保存', 'common.cancel': 'キャンセル', 'common.delete': '削除', 'common.continue': '続ける', 'common.back': '戻る',
  'common.search': '検索', 'common.loading': '読み込み中…', 'common.signOut': 'ログアウト', 'common.signIn': 'ログイン', 'common.signUp': '登録',
  'common.close': '閉じる', 'common.edit': '編集', 'common.create': '作成', 'common.you': 'あなた', 'common.level': 'レベル', 'common.start': '開始',
  'common.viewAll': 'すべて表示', 'common.seeAll': 'すべて見る', 'common.next': '次へ', 'common.done': '完了',
  'home.greeting': 'おかえりなさい', 'home.dailyGoal': '今日の目標', 'home.streak': '連続記録', 'home.minutesToday': '今日の分数',
  'home.continueLearning': '学習を続ける', 'home.popularCourses': '人気のコース', 'home.quests': '毎日のクエスト', 'home.subtitle': '前回の続きから始めましょう。',
  'courses.title': 'コース', 'courses.subtitle': '流暢さへの体系的な道。', 'courses.continueLearning': '学習を続ける',
  'courses.skillTracks': 'スキルトラック', 'courses.allCourses': 'すべてのコース', 'courses.enroll': '受講する', 'courses.continue': '続ける', 'courses.allLevels': 'すべてのレベル',
  'vocab.title': '単語', 'vocab.subtitle': '単語を集めて復習しましょう。', 'vocab.myWords': 'マイ単語', 'vocab.saved': '保存済み',
  'vocab.dictionary': '辞書', 'vocab.addWord': '単語を追加', 'vocab.review': '復習', 'vocab.flashcards': 'フラッシュカード', 'vocab.empty': 'まだ単語がありません — 最初の単語を追加しましょう。',
  'progress.title': '進捗', 'progress.subtitle': 'あなたの学習を数値で。', 'progress.overview': '概要', 'progress.goalsStreak': '目標と連続記録', 'progress.xp': 'XP', 'progress.level': 'レベル',
  'exams.title': '試験', 'exams.subtitle': '練習して対策の進み具合を確認。', 'exams.recentResults': '最近の結果', 'exams.startMock': '模擬試験を始める',
  'speaking.title': 'スピーキング', 'speaking.subtitle': '自分のやり方で話す練習を。', 'speaking.startTalking': '話し始める', 'speaking.partner': '会話パートナー', 'speaking.roleplays': 'ロールプレイ',
  'settings.title': '設定', 'settings.subtitle': 'AIパートナーと会話体験をカスタマイズ。', 'settings.saving': '保存中…',
  'settings.tab.ai': 'AI', 'settings.tab.language': '言語', 'settings.tab.companion': 'コンパニオン', 'settings.tab.microphone': 'マイク', 'settings.tab.productivity': '生産性', 'settings.tab.privacy': 'プライバシー', 'settings.tab.about': '情報',
  'settings.uiLanguage': 'インターフェース言語', 'settings.privacy': 'プライバシー', 'settings.account': 'アカウント',
  'settings.learningLanguage': '学習中の言語', 'settings.learningLanguageHint': '試験・コース・ライブラリ・単語帳・AIチューターがこの言語に切り替わります。',
  'settings.nativeLanguage': 'あなたの言語', 'settings.nativeLanguageHint': '語の意味はこの言語に翻訳され、翻訳がある場合はUIもこれに従います。',
  'settings.changeLater': 'いつでも変更できます。',
  'privacy.exportData': 'データをエクスポート', 'privacy.deleteAccount': 'アカウントを削除', 'privacy.contentSafety': '安全なコンテンツフィルター', 'privacy.incognito': 'シークレットモード',
  'privacy.incognitoHint': 'アクティビティの記録を一時停止します — 連続記録や統計は更新されません。', 'privacy.yourData': 'あなたのデータ'
}

const ko: Partial<Table> = {
  'nav.home': '홈', 'nav.courses': '코스', 'nav.library': '라이브러리', 'nav.vocabulary': '어휘', 'nav.progress': '진행 상황',
  'nav.speaking': '말하기', 'nav.clips': '클립', 'nav.writing': '작문 코치', 'nav.community': '커뮤니티', 'nav.explore': '탐색',
  'nav.live': '라이브', 'nav.exams': '시험', 'nav.settings': '설정', 'nav.profile': '프로필', 'nav.notifications': '알림',
  'nav.inbox': '메시지', 'nav.dashboard': '대시보드', 'nav.studio': '크리에이터 스튜디오', 'nav.channel': '내 채널', 'nav.admin': '관리자',
  'nav.tagline': '당신의 코치', 'nav.collapse': '접기', 'nav.expand': '사이드바 펼치기',
  'nav.section.learn': '학습', 'nav.section.practice': '연습', 'nav.section.social': '소셜', 'nav.section.manage': '관리', 'nav.section.engage': '참여',
  'role.studentAccount': '학생 계정', 'role.teacherAccount': '교사 계정', 'role.adminAccount': '관리자 계정',
  'common.save': '저장', 'common.cancel': '취소', 'common.delete': '삭제', 'common.continue': '계속', 'common.back': '뒤로',
  'common.search': '검색', 'common.loading': '로딩 중…', 'common.signOut': '로그아웃', 'common.signIn': '로그인', 'common.signUp': '가입',
  'common.close': '닫기', 'common.edit': '편집', 'common.create': '만들기', 'common.you': '나', 'common.level': '레벨', 'common.start': '시작',
  'common.viewAll': '모두 보기', 'common.seeAll': '모두 보기', 'common.next': '다음', 'common.done': '완료',
  'home.greeting': '다시 오신 걸 환영해요', 'home.dailyGoal': '일일 목표', 'home.streak': '연속 기록', 'home.minutesToday': '오늘의 분',
  'home.continueLearning': '학습 계속하기', 'home.popularCourses': '인기 코스', 'home.quests': '일일 퀘스트', 'home.subtitle': '멈춘 곳부터 이어서 하세요.',
  'courses.title': '코스', 'courses.subtitle': '유창함으로 가는 체계적인 길.', 'courses.continueLearning': '학습 계속하기',
  'courses.skillTracks': '스킬 트랙', 'courses.allCourses': '모든 코스', 'courses.enroll': '등록', 'courses.continue': '계속', 'courses.allLevels': '모든 레벨',
  'vocab.title': '어휘', 'vocab.subtitle': '단어를 모으고 복습하세요.', 'vocab.myWords': '내 단어', 'vocab.saved': '저장됨',
  'vocab.dictionary': '사전', 'vocab.addWord': '단어 추가', 'vocab.review': '복습', 'vocab.flashcards': '플래시카드', 'vocab.empty': '아직 단어가 없어요 — 첫 단어를 추가하세요.',
  'progress.title': '진행 상황', 'progress.subtitle': '수치로 보는 학습.', 'progress.overview': '개요', 'progress.goalsStreak': '목표와 연속 기록', 'progress.xp': 'XP', 'progress.level': '레벨',
  'exams.title': '시험', 'exams.subtitle': '연습하고 준비 상황을 추적하세요.', 'exams.recentResults': '최근 결과', 'exams.startMock': '모의시험 시작',
  'speaking.title': '말하기', 'speaking.subtitle': '내 방식대로 말하기 연습.', 'speaking.startTalking': '말하기 시작', 'speaking.partner': '대화 파트너', 'speaking.roleplays': '역할극',
  'settings.title': '설정', 'settings.subtitle': 'AI 파트너와 말하기 경험을 맞춤 설정하세요.', 'settings.saving': '저장 중…',
  'settings.tab.ai': 'AI', 'settings.tab.language': '언어', 'settings.tab.companion': '동반자', 'settings.tab.microphone': '마이크', 'settings.tab.productivity': '생산성', 'settings.tab.privacy': '개인정보', 'settings.tab.about': '정보',
  'settings.uiLanguage': '인터페이스 언어', 'settings.privacy': '개인정보', 'settings.account': '계정',
  'settings.learningLanguage': '학습 중인 언어', 'settings.learningLanguageHint': '시험, 코스, 라이브러리, 단어장, AI 튜터가 이 언어로 전환됩니다.',
  'settings.nativeLanguage': '내 언어', 'settings.nativeLanguageHint': '단어 뜻이 이 언어로 번역되며, 번역이 있는 경우 UI도 이를 따릅니다.',
  'settings.changeLater': '언제든지 변경할 수 있습니다.',
  'privacy.exportData': '내 데이터 내보내기', 'privacy.deleteAccount': '계정 삭제', 'privacy.contentSafety': '안전 콘텐츠 필터', 'privacy.incognito': '시크릿 모드',
  'privacy.incognitoHint': '활동 추적을 일시 중지 — 연속 기록과 통계가 업데이트되지 않습니다.', 'privacy.yourData': '내 데이터'
}

const zh: Partial<Table> = {
  'nav.home': '主页', 'nav.courses': '课程', 'nav.library': '资料库', 'nav.vocabulary': '词汇', 'nav.progress': '进度',
  'nav.speaking': '口语', 'nav.clips': '片段', 'nav.writing': '写作教练', 'nav.community': '社区', 'nav.explore': '探索',
  'nav.live': '直播', 'nav.exams': '考试', 'nav.settings': '设置', 'nav.profile': '个人资料', 'nav.notifications': '通知',
  'nav.inbox': '消息', 'nav.dashboard': '仪表板', 'nav.studio': '创作者工作室', 'nav.channel': '我的频道', 'nav.admin': '管理',
  'nav.tagline': '你的教练', 'nav.collapse': '收起', 'nav.expand': '展开侧栏',
  'nav.section.learn': '学习', 'nav.section.practice': '练习', 'nav.section.social': '社交', 'nav.section.manage': '管理', 'nav.section.engage': '互动',
  'role.studentAccount': '学生账户', 'role.teacherAccount': '教师账户', 'role.adminAccount': '管理员账户',
  'common.save': '保存', 'common.cancel': '取消', 'common.delete': '删除', 'common.continue': '继续', 'common.back': '返回',
  'common.search': '搜索', 'common.loading': '加载中…', 'common.signOut': '退出', 'common.signIn': '登录', 'common.signUp': '注册',
  'common.close': '关闭', 'common.edit': '编辑', 'common.create': '创建', 'common.you': '你', 'common.level': '等级', 'common.start': '开始',
  'common.viewAll': '查看全部', 'common.seeAll': '查看全部', 'common.next': '下一步', 'common.done': '完成',
  'home.greeting': '欢迎回来', 'home.dailyGoal': '每日目标', 'home.streak': '连续天数', 'home.minutesToday': '今日分钟',
  'home.continueLearning': '继续学习', 'home.popularCourses': '热门课程', 'home.quests': '每日任务', 'home.subtitle': '从上次的地方继续。',
  'courses.title': '课程', 'courses.subtitle': '通往流利的系统路径。', 'courses.continueLearning': '继续学习',
  'courses.skillTracks': '技能路线', 'courses.allCourses': '所有课程', 'courses.enroll': '报名', 'courses.continue': '继续', 'courses.allLevels': '所有级别',
  'vocab.title': '词汇', 'vocab.subtitle': '积累并复习你的词汇。', 'vocab.myWords': '我的词汇', 'vocab.saved': '已保存',
  'vocab.dictionary': '词典', 'vocab.addWord': '添加单词', 'vocab.review': '复习', 'vocab.flashcards': '抽认卡', 'vocab.empty': '还没有单词 — 添加第一个吧。',
  'progress.title': '进度', 'progress.subtitle': '量化你的学习。', 'progress.overview': '概览', 'progress.goalsStreak': '目标与连续天数', 'progress.xp': '经验', 'progress.level': '等级',
  'exams.title': '考试', 'exams.subtitle': '练习并追踪你的备考。', 'exams.recentResults': '最近成绩', 'exams.startMock': '开始模拟考试',
  'speaking.title': '口语', 'speaking.subtitle': '用你的方式练习说话。', 'speaking.startTalking': '开始说话', 'speaking.partner': '对话伙伴', 'speaking.roleplays': '角色扮演',
  'settings.title': '设置', 'settings.subtitle': '个性化你的 AI 伙伴和口语体验。', 'settings.saving': '保存中…',
  'settings.tab.ai': 'AI', 'settings.tab.language': '语言', 'settings.tab.companion': '伙伴', 'settings.tab.microphone': '麦克风', 'settings.tab.productivity': '效率', 'settings.tab.privacy': '隐私', 'settings.tab.about': '关于',
  'settings.uiLanguage': '界面语言', 'settings.privacy': '隐私', 'settings.account': '账户',
  'settings.learningLanguage': '你正在学习的语言', 'settings.learningLanguageHint': '考试、课程、资料库、词汇表和 AI 导师都会切换到这种语言。',
  'settings.nativeLanguage': '你的语言', 'settings.nativeLanguageHint': '词义会翻译成这种语言，有翻译时界面也会跟随它。',
  'settings.changeLater': '你可以随时更改。',
  'privacy.exportData': '导出我的数据', 'privacy.deleteAccount': '删除我的账户', 'privacy.contentSafety': '安全内容过滤', 'privacy.incognito': '隐身模式',
  'privacy.incognitoHint': '暂停活动追踪 — 连续天数和统计不会更新。', 'privacy.yourData': '你的数据'
}

const ar: Partial<Table> = {
  'nav.home': 'الرئيسية', 'nav.courses': 'الدورات', 'nav.library': 'المكتبة', 'nav.vocabulary': 'المفردات', 'nav.progress': 'التقدم',
  'nav.speaking': 'التحدث', 'nav.clips': 'المقاطع', 'nav.writing': 'مدرب الكتابة', 'nav.community': 'المجتمع', 'nav.explore': 'استكشاف',
  'nav.live': 'مباشر', 'nav.exams': 'الامتحانات', 'nav.settings': 'الإعدادات', 'nav.profile': 'الملف الشخصي', 'nav.notifications': 'الإشعارات',
  'nav.inbox': 'الرسائل', 'nav.dashboard': 'لوحة التحكم', 'nav.studio': 'استوديو المنشئ', 'nav.channel': 'قناتي', 'nav.admin': 'المشرف',
  'nav.tagline': 'مدربك', 'nav.collapse': 'طي', 'nav.expand': 'توسيع الشريط',
  'nav.section.learn': 'تعلّم', 'nav.section.practice': 'تدرّب', 'nav.section.social': 'اجتماعي', 'nav.section.manage': 'إدارة', 'nav.section.engage': 'تفاعل',
  'role.studentAccount': 'حساب طالب', 'role.teacherAccount': 'حساب معلم', 'role.adminAccount': 'حساب مشرف',
  'common.save': 'حفظ', 'common.cancel': 'إلغاء', 'common.delete': 'حذف', 'common.continue': 'متابعة', 'common.back': 'رجوع',
  'common.search': 'بحث', 'common.loading': 'جارٍ التحميل…', 'common.signOut': 'تسجيل الخروج', 'common.signIn': 'تسجيل الدخول', 'common.signUp': 'إنشاء حساب',
  'common.close': 'إغلاق', 'common.edit': 'تعديل', 'common.create': 'إنشاء', 'common.you': 'أنت', 'common.level': 'المستوى', 'common.start': 'ابدأ',
  'common.viewAll': 'عرض الكل', 'common.seeAll': 'عرض الكل', 'common.next': 'التالي', 'common.done': 'تم',
  'home.greeting': 'مرحبًا بعودتك', 'home.dailyGoal': 'الهدف اليومي', 'home.streak': 'سلسلة الأيام', 'home.minutesToday': 'دقائق اليوم',
  'home.continueLearning': 'متابعة التعلّم', 'home.popularCourses': 'الدورات الشائعة', 'home.quests': 'المهام اليومية', 'home.subtitle': 'تابع من حيث توقفت.',
  'courses.title': 'الدورات', 'courses.subtitle': 'مسارات منظمة نحو الطلاقة.', 'courses.continueLearning': 'متابعة التعلّم',
  'courses.skillTracks': 'مسارات المهارات', 'courses.allCourses': 'كل الدورات', 'courses.enroll': 'التسجيل', 'courses.continue': 'متابعة', 'courses.allLevels': 'كل المستويات',
  'vocab.title': 'المفردات', 'vocab.subtitle': 'اجمع كلماتك وراجعها.', 'vocab.myWords': 'كلماتي', 'vocab.saved': 'المحفوظة',
  'vocab.dictionary': 'القاموس', 'vocab.addWord': 'إضافة كلمة', 'vocab.review': 'مراجعة', 'vocab.flashcards': 'البطاقات', 'vocab.empty': 'لا توجد كلمات بعد — أضف أول كلمة.',
  'progress.title': 'التقدم', 'progress.subtitle': 'تعلّمك بالأرقام.', 'progress.overview': 'نظرة عامة', 'progress.goalsStreak': 'الأهداف والسلسلة', 'progress.xp': 'نقاط', 'progress.level': 'المستوى',
  'exams.title': 'الامتحانات', 'exams.subtitle': 'تدرّب وتابع استعدادك.', 'exams.recentResults': 'النتائج الأخيرة', 'exams.startMock': 'بدء امتحان تجريبي',
  'speaking.title': 'التحدث', 'speaking.subtitle': 'تدرّب على التحدث بطريقتك.', 'speaking.startTalking': 'ابدأ التحدث', 'speaking.partner': 'شريك المحادثة', 'speaking.roleplays': 'تمثيل الأدوار',
  'settings.title': 'الإعدادات', 'settings.subtitle': 'خصّص شريك الذكاء الاصطناعي وتجربة التحدث.', 'settings.saving': 'جارٍ الحفظ…',
  'settings.tab.ai': 'الذكاء الاصطناعي', 'settings.tab.language': 'اللغة', 'settings.tab.companion': 'الرفيق', 'settings.tab.microphone': 'الميكروفون', 'settings.tab.productivity': 'الإنتاجية', 'settings.tab.privacy': 'الخصوصية', 'settings.tab.about': 'حول',
  'settings.uiLanguage': 'لغة الواجهة', 'settings.privacy': 'الخصوصية', 'settings.account': 'الحساب',
  'settings.learningLanguage': 'اللغة التي تتعلمها', 'settings.learningLanguageHint': 'تتحول الامتحانات والدورات والمكتبة وقوائم المفردات والمعلّم الذكي إلى هذه اللغة.',
  'settings.nativeLanguage': 'لغتك', 'settings.nativeLanguageHint': 'تُترجم معاني الكلمات إلى هذه اللغة، وتتبعها الواجهة حيثما توفرت ترجمة.',
  'settings.changeLater': 'يمكنك تغيير ذلك في أي وقت.',
  'privacy.exportData': 'تصدير بياناتي', 'privacy.deleteAccount': 'حذف حسابي', 'privacy.contentSafety': 'مرشّح المحتوى الآمن', 'privacy.incognito': 'وضع التصفح المتخفي',
  'privacy.incognitoHint': 'إيقاف تتبع النشاط مؤقتًا — لن تتحدث السلاسل والإحصاءات.', 'privacy.yourData': 'بياناتك'
}

export const STRINGS: Record<UILanguage, Partial<Table>> = {
  en, uz, ru, es, fr, de, it, pt, tr, ja, ko, zh, ar
}
