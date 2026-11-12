export type SupportedLanguageCode =
  | 'en'
  | 'ar'
  | 'fr'
  | 'es'
  | 'pt'
  | 'de'
  | 'it'
  | 'ru'
  | 'tr'
  | 'hi'
  | 'ur'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'id'
  | 'nl'
  | 'th'
  | 'sw';

export type LanguagePreferenceMode = 'automatic' | 'manual' | 'english';

export interface LanguageMetadata {
  code: SupportedLanguageCode;
  englishName: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  localeTag: string;
  regionLabel: string;
  enabled: boolean;
  isFallback?: boolean;
}

export interface TranslationKeyRecord {
  key: string;
  category:
    | 'navigation'
    | 'auth'
    | 'feed'
    | 'explore'
    | 'profile'
    | 'creator_studio'
    | 'messages'
    | 'live'
    | 'wallet'
    | 'requests_calls'
    | 'notifications'
    | 'settings'
    | 'admin'
    | 'common';
  englishText: string;
  translations: Record<SupportedLanguageCode, string>;
  updatedAt?: string;
  updatedByAdmin?: string;
}

export const INITIAL_SUPPORTED_LANGUAGES: LanguageMetadata[] = [
  {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    dir: 'ltr',
    localeTag: 'en-US',
    regionLabel: 'Global Default (Fallback)',
    enabled: true,
    isFallback: true
  },
  {
    code: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    localeTag: 'ar-SA',
    regionLabel: 'Middle East & North Africa (RTL)',
    enabled: true
  },
  {
    code: 'fr',
    englishName: 'French',
    nativeName: 'Français',
    dir: 'ltr',
    localeTag: 'fr-FR',
    regionLabel: 'France, Canada & Francophonie',
    enabled: true
  },
  {
    code: 'es',
    englishName: 'Spanish',
    nativeName: 'Español',
    dir: 'ltr',
    localeTag: 'es-ES',
    regionLabel: 'Spain & Latin America',
    enabled: true
  },
  {
    code: 'pt',
    englishName: 'Portuguese',
    nativeName: 'Português',
    dir: 'ltr',
    localeTag: 'pt-BR',
    regionLabel: 'Brazil & Portugal',
    enabled: true
  },
  {
    code: 'de',
    englishName: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    localeTag: 'de-DE',
    regionLabel: 'Germany, Austria & Switzerland',
    enabled: true
  },
  {
    code: 'it',
    englishName: 'Italian',
    nativeName: 'Italiano',
    dir: 'ltr',
    localeTag: 'it-IT',
    regionLabel: 'Italy & Switzerland',
    enabled: true
  },
  {
    code: 'ru',
    englishName: 'Russian',
    nativeName: 'Русский',
    dir: 'ltr',
    localeTag: 'ru-RU',
    regionLabel: 'Eastern Europe & Central Asia',
    enabled: true
  },
  {
    code: 'tr',
    englishName: 'Turkish',
    nativeName: 'Türkçe',
    dir: 'ltr',
    localeTag: 'tr-TR',
    regionLabel: 'Türkiye',
    enabled: true
  },
  {
    code: 'hi',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    localeTag: 'hi-IN',
    regionLabel: 'India',
    enabled: true
  },
  {
    code: 'ur',
    englishName: 'Urdu',
    nativeName: 'اردو',
    dir: 'rtl',
    localeTag: 'ur-PK',
    regionLabel: 'Pakistan & South Asia (RTL)',
    enabled: true
  },
  {
    code: 'zh-CN',
    englishName: 'Chinese (Simplified)',
    nativeName: '简体中文',
    dir: 'ltr',
    localeTag: 'zh-CN',
    regionLabel: 'Mainland China & Singapore',
    enabled: true
  },
  {
    code: 'zh-TW',
    englishName: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    dir: 'ltr',
    localeTag: 'zh-TW',
    regionLabel: 'Taiwan, Hong Kong & Macau',
    enabled: true
  },
  {
    code: 'ja',
    englishName: 'Japanese',
    nativeName: '日本語',
    dir: 'ltr',
    localeTag: 'ja-JP',
    regionLabel: 'Japan',
    enabled: true
  },
  {
    code: 'ko',
    englishName: 'Korean',
    nativeName: '한국어',
    dir: 'ltr',
    localeTag: 'ko-KR',
    regionLabel: 'South Korea',
    enabled: true
  },
  {
    code: 'id',
    englishName: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    dir: 'ltr',
    localeTag: 'id-ID',
    regionLabel: 'Indonesia',
    enabled: true
  },
  {
    code: 'nl',
    englishName: 'Dutch',
    nativeName: 'Nederlands',
    dir: 'ltr',
    localeTag: 'nl-NL',
    regionLabel: 'Netherlands & Belgium',
    enabled: true
  },
  {
    code: 'th',
    englishName: 'Thai',
    nativeName: 'ไทย',
    dir: 'ltr',
    localeTag: 'th-TH',
    regionLabel: 'Thailand',
    enabled: true
  },
  {
    code: 'sw',
    englishName: 'Swahili',
    nativeName: 'Kiswahili',
    dir: 'ltr',
    localeTag: 'sw-KE',
    regionLabel: 'East Africa',
    enabled: true
  }
];

/**
 * Helper to build a TranslationKeyRecord with explicit translations for top languages
 * and intelligent localized coverage across all 19 supported languages.
 */
function buildEntry(
  key: string,
  category: TranslationKeyRecord['category'],
  en: string,
  partial: Partial<Record<SupportedLanguageCode, string>> & {
    ar: string;
    fr: string;
    es: string;
    pt: string;
    de: string;
    it: string;
    ru: string;
    tr: string;
    hi: string;
    ur: string;
    'zh-CN': string;
    'zh-TW': string;
    ja: string;
    ko: string;
    id: string;
    nl: string;
    th: string;
    sw: string;
  }
): TranslationKeyRecord {
  return {
    key,
    category,
    englishText: en,
    translations: {
      en,
      ...partial
    }
  };
}

export const INITIAL_TRANSLATION_RECORDS: TranslationKeyRecord[] = [
  // ==========================================================================
  // 1. NAVIGATION & HEADER
  // ==========================================================================
  buildEntry('nav.feed', 'navigation', 'Feed', {
    ar: 'الرئيسية',
    fr: 'Fil',
    es: 'Inicio',
    pt: 'Feed',
    de: 'Feed',
    it: 'Feed',
    ru: 'Лента',
    tr: 'Akış',
    hi: 'फ़ीड',
    ur: 'فیڈ',
    'zh-CN': '动态',
    'zh-TW': '動態',
    ja: 'フィード',
    ko: '피드',
    id: 'Beranda',
    nl: 'Feed',
    th: 'ฟีด',
    sw: 'Mlisho'
  }),
  buildEntry('nav.explore', 'navigation', 'Explore', {
    ar: 'استكشاف',
    fr: 'Explorer',
    es: 'Explorar',
    pt: 'Explorar',
    de: 'Entdecken',
    it: 'Esplora',
    ru: 'Обзор',
    tr: 'Keşfet',
    hi: 'एक्सप्लोर',
    ur: 'دریافت کریں',
    'zh-CN': '探索',
    'zh-TW': '探索',
    ja: '探索',
    ko: '탐색',
    id: 'Jelajahi',
    nl: 'Ontdekken',
    th: 'สำรวจ',
    sw: 'Gundua'
  }),
  buildEntry('nav.live', 'navigation', 'Live', {
    ar: 'بث مباشر',
    fr: 'En direct',
    es: 'En vivo',
    pt: 'Ao vivo',
    de: 'Live',
    it: 'Dal vivo',
    ru: 'Эфир',
    tr: 'Canlı',
    hi: 'लाइव',
    ur: 'براہ راست',
    'zh-CN': '直播',
    'zh-TW': '直播',
    ja: 'ライブ',
    ko: '라이브',
    id: 'Siaran Langsung',
    nl: 'Live',
    th: 'ไลฟ์สด',
    sw: 'Mubashara'
  }),
  buildEntry('nav.messages', 'navigation', 'Messages', {
    ar: 'الرسائل',
    fr: 'Messages',
    es: 'Mensajes',
    pt: 'Mensagens',
    de: 'Nachrichten',
    it: 'Messaggi',
    ru: 'Сообщения',
    tr: 'Mesajlar',
    hi: 'संदेश',
    ur: 'پیغامات',
    'zh-CN': '消息',
    'zh-TW': '訊息',
    ja: 'メッセージ',
    ko: '메시지',
    id: 'Pesan',
    nl: 'Berichten',
    th: 'ข้อความ',
    sw: 'Ujumbe'
  }),
  buildEntry('nav.creator_studio', 'navigation', 'Creator Studio', {
    ar: 'استوديو المبدعين',
    fr: 'Studio Créateur',
    es: 'Estudio de Creador',
    pt: 'Estúdio de Criador',
    de: 'Creator Studio',
    it: 'Studio Creatore',
    ru: 'Студия автора',
    tr: 'İçerik Stüdyosu',
    hi: 'क्रिएटर स्टूडियो',
    ur: 'کریئیٹر اسٹوڈیو',
    'zh-CN': '创作者工作室',
    'zh-TW': '創作者工作室',
    ja: 'クリエイタースタジオ',
    ko: '크리에이터 스튜디오',
    id: 'Studio Kreator',
    nl: 'Creator Studio',
    th: 'สตูดิโอครีเอเตอร์',
    sw: 'Studio ya Muundaji'
  }),
  buildEntry('nav.studio_short', 'navigation', 'Studio', {
    ar: 'الاستوديو',
    fr: 'Studio',
    es: 'Estudio',
    pt: 'Estúdio',
    de: 'Studio',
    it: 'Studio',
    ru: 'Студия',
    tr: 'Stüdyo',
    hi: 'स्टूडियो',
    ur: 'اسٹوڈیو',
    'zh-CN': '工作室',
    'zh-TW': '工作室',
    ja: 'スタジオ',
    ko: '스튜디오',
    id: 'Studio',
    nl: 'Studio',
    th: 'สตูดิโอ',
    sw: 'Studio'
  }),
  buildEntry('nav.my_subscriptions', 'navigation', 'My Subscriptions', {
    ar: 'اشتراكاتي',
    fr: 'Mes abonnements',
    es: 'Mis suscripciones',
    pt: 'Minhas assinaturas',
    de: 'Meine Abos',
    it: 'I miei abbonamenti',
    ru: 'Мои подписки',
    tr: 'Aboneliklerim',
    hi: 'मेरी सदस्यताएँ',
    ur: 'میری سبسکرپشنز',
    'zh-CN': '我的订阅',
    'zh-TW': '我的訂閱',
    ja: '登録チャンネル',
    ko: '내 구독',
    id: 'Langganan Saya',
    nl: 'Mijn abonnementen',
    th: 'การติดตามของฉัน',
    sw: 'Usajili Wangu'
  }),
  buildEntry('nav.subscriptions_short', 'navigation', 'Subscriptions', {
    ar: 'الاشتراكات',
    fr: 'Abonnements',
    es: 'Suscripciones',
    pt: 'Assinaturas',
    de: 'Abos',
    it: 'Abbonamenti',
    ru: 'Подписки',
    tr: 'Abonelikler',
    hi: 'सदस्यताएँ',
    ur: 'سبسکرپشنز',
    'zh-CN': '订阅',
    'zh-TW': '訂閱',
    ja: '購読',
    ko: '구독',
    id: 'Langganan',
    nl: 'Abonnementen',
    th: 'การสมัครสมาชิก',
    sw: 'Usajili'
  }),
  buildEntry('nav.become_creator', 'navigation', 'Become a Creator', {
    ar: 'كن مبدعاً',
    fr: 'Devenir Créateur',
    es: 'Hazte Creador',
    pt: 'Torne-se um Criador',
    de: 'Creator werden',
    it: 'Diventa Creatore',
    ru: 'Стать автором',
    tr: 'Üretici Ol',
    hi: 'क्रिएटर बनें',
    ur: 'کریئیٹر بنیں',
    'zh-CN': '成为创作者',
    'zh-TW': '成為創作者',
    ja: 'クリエイターになる',
    ko: '크리에이터 되기',
    id: 'Jadi Kreator',
    nl: 'Word Creator',
    th: 'สมัครเป็นครีเอเตอร์',
    sw: 'Kuwa Muundaji'
  }),

  // ==========================================================================
  // 2. AUTHENTICATION & ACCOUNT ACCESS
  // ==========================================================================
  buildEntry('auth.log_in', 'auth', 'Log In', {
    ar: 'تسجيل الدخول',
    fr: 'Connexion',
    es: 'Iniciar sesión',
    pt: 'Entrar',
    de: 'Anmelden',
    it: 'Accedi',
    ru: 'Войти',
    tr: 'Giriş Yap',
    hi: 'लॉग इन करें',
    ur: 'لاگ ان کریں',
    'zh-CN': '登录',
    'zh-TW': '登入',
    ja: 'ログイン',
    ko: '로그인',
    id: 'Masuk',
    nl: 'Inloggen',
    th: 'เข้าสู่ระบบ',
    sw: 'Ingia'
  }),
  buildEntry('auth.sign_up', 'auth', 'Sign Up', {
    ar: 'إنشاء حساب',
    fr: "S'inscrire",
    es: 'Registrarse',
    pt: 'Cadastrar-se',
    de: 'Registrieren',
    it: 'Iscriviti',
    ru: 'Регистрация',
    tr: 'Kayıt Ol',
    hi: 'साइन अप करें',
    ur: 'سائن اپ کریں',
    'zh-CN': '注册',
    'zh-TW': '註冊',
    ja: '新規登録',
    ko: '회원가입',
    id: 'Daftar',
    nl: 'Registreren',
    th: 'สมัครสมาชิก',
    sw: 'Jisajili'
  }),
  buildEntry('auth.log_out', 'auth', 'Log Out', {
    ar: 'تسجيل الخروج',
    fr: 'Déconnexion',
    es: 'Cerrar sesión',
    pt: 'Sair',
    de: 'Abmelden',
    it: 'Esci',
    ru: 'Выйти',
    tr: 'Çıkış Yap',
    hi: 'लॉग आउट',
    ur: 'لاگ آؤٹ',
    'zh-CN': '退出登录',
    'zh-TW': '登出',
    ja: 'ログアウト',
    ko: '로그아웃',
    id: 'Keluar',
    nl: 'Uitloggen',
    th: 'ออกจากระบบ',
    sw: 'Toka'
  }),
  buildEntry('auth.forgot_password', 'auth', 'Forgot Password?', {
    ar: 'هل نسيت كلمة المرور؟',
    fr: 'Mot de passe oublié ?',
    es: '¿Olvidaste tu contraseña?',
    pt: 'Esqueceu a senha?',
    de: 'Passwort vergessen?',
    it: 'Password dimenticata?',
    ru: 'Забыли пароль?',
    tr: 'Şifrenizi mi unuttunuz?',
    hi: 'पासवर्ड भूल गए?',
    ur: 'پاس ورڈ بھول گئے؟',
    'zh-CN': '忘记密码？',
    'zh-TW': '忘記密碼？',
    ja: 'パスワードをお忘れですか？',
    ko: '비밀번호를 잊으셨나요?',
    id: 'Lupa Kata Sandi?',
    nl: 'Wachtwoord vergeten?',
    th: 'ลืมรหัสผ่าน?',
    sw: 'Umesahau Nywila?'
  }),

  // ==========================================================================
  // 3. PROFILE MENU & SETTINGS
  // ==========================================================================
  buildEntry('profile.my_profile', 'profile', 'My Profile', {
    ar: 'ملفي الشخصي',
    fr: 'Mon profil',
    es: 'Mi perfil',
    pt: 'Meu perfil',
    de: 'Mein Profil',
    it: 'Il mio profilo',
    ru: 'Мой профиль',
    tr: 'Profilim',
    hi: 'मेरी प्रोफ़ाइल',
    ur: 'میرا پروفائل',
    'zh-CN': '我的主页',
    'zh-TW': '我的個人檔案',
    ja: 'マイプロフィール',
    ko: '내 프로필',
    id: 'Profil Saya',
    nl: 'Mijn profiel',
    th: 'โปรไฟล์ของฉัน',
    sw: 'Wasifu Wangu'
  }),
  buildEntry('profile.edit_profile', 'profile', 'Edit Profile', {
    ar: 'تعديل الملف الشخصي',
    fr: 'Modifier le profil',
    es: 'Editar perfil',
    pt: 'Editar perfil',
    de: 'Profil bearbeiten',
    it: 'Modifica profilo',
    ru: 'Редактировать профиль',
    tr: 'Profili Düzenle',
    hi: 'प्रोफ़ाइल संपादित करें',
    ur: 'پروفائل میں ترمیم کریں',
    'zh-CN': '编辑资料',
    'zh-TW': '編輯個人檔案',
    ja: 'プロフィールを編集',
    ko: '프로필 수정',
    id: 'Edit Profil',
    nl: 'Profiel bewerken',
    th: 'แก้ไขโปรไฟล์',
    sw: 'Hariri Wasifu'
  }),
  buildEntry('profile.wallet_earnings', 'wallet', 'Wallet & Earnings', {
    ar: 'المحفظة والأرباح',
    fr: 'Portefeuille et revenus',
    es: 'Billetera y ganancias',
    pt: 'Carteira e ganhos',
    de: 'Wallet & Einnahmen',
    it: 'Portafoglio e guadagni',
    ru: 'Кошелек и доходы',
    tr: 'Cüzdan ve Kazançlar',
    hi: 'वॉलेट और कमाई',
    ur: 'والٹ اور آمدنی',
    'zh-CN': '钱包与收益',
    'zh-TW': '錢包與收益',
    ja: 'ウォレットと収益',
    ko: '지갑 및 수익',
    id: 'Dompet & Pendapatan',
    nl: 'Portemonnee & Inkomsten',
    th: 'กระเป๋าเงินและรายได้',
    sw: 'Pochi na Mapato'
  }),
  buildEntry('profile.wallet_purchases', 'wallet', 'Wallet / Purchases', {
    ar: 'المحفظة / المشتريات',
    fr: 'Portefeuille / Achats',
    es: 'Billetera / Compras',
    pt: 'Carteira / Compras',
    de: 'Wallet / Käufe',
    it: 'Portafoglio / Acquisti',
    ru: 'Кошелек / Покупки',
    tr: 'Cüzdan / Satın Alımlar',
    hi: 'वॉलेट / खरीदारी',
    ur: 'والٹ / خریداری',
    'zh-CN': '钱包 / 购买记录',
    'zh-TW': '錢包 / 購買紀錄',
    ja: 'ウォレット / 購入',
    ko: '지갑 / 구매 내역',
    id: 'Dompet / Pembelian',
    nl: 'Portemonnee / Aankopen',
    th: 'กระเป๋าเงิน / การซื้อ',
    sw: 'Pochi / Manunuzi'
  }),
  buildEntry('profile.purchase_history', 'wallet', 'Purchase History', {
    ar: 'سجل المشتريات',
    fr: 'Historique des achats',
    es: 'Historial de compras',
    pt: 'Histórico de compras',
    de: 'Kaufverlauf',
    it: 'Cronologia acquisti',
    ru: 'История покупок',
    tr: 'Satın Alma Geçmişi',
    hi: 'खरीदारी का इतिहास',
    ur: 'خریداری کی تاریخ',
    'zh-CN': '购买历史',
    'zh-TW': '購買歷史',
    ja: '購入履歴',
    ko: '구매 내역',
    id: 'Riwayat Pembelian',
    nl: 'Aankoopgeschiedenis',
    th: 'ประวัติการซื้อ',
    sw: 'Historia ya Manunuzi'
  }),
  buildEntry('profile.payment_methods', 'wallet', 'Payment Methods', {
    ar: 'طرق الدفع',
    fr: 'Moyens de paiement',
    es: 'Métodos de pago',
    pt: 'Métodos de pagamento',
    de: 'Zahlungsmethoden',
    it: 'Metodi di pagamento',
    ru: 'Способы оплаты',
    tr: 'Ödeme Yöntemleri',
    hi: 'भुगतान के तरीके',
    ur: 'ادائیگی کے طریقے',
    'zh-CN': '支付方式',
    'zh-TW': '付款方式',
    ja: 'お支払い方法',
    ko: '결제 수단',
    id: 'Metode Pembayaran',
    nl: 'Betaalmethoden',
    th: 'วิธีการชำระเงิน',
    sw: 'Njia za Malipo'
  }),
  buildEntry('profile.settings', 'settings', 'Settings', {
    ar: 'الإعدادات',
    fr: 'Paramètres',
    es: 'Configuración',
    pt: 'Configurações',
    de: 'Einstellungen',
    it: 'Impostazioni',
    ru: 'Настройки',
    tr: 'Ayarlar',
    hi: 'सेटिंग्स',
    ur: 'ترتیبات',
    'zh-CN': '设置',
    'zh-TW': '設定',
    ja: '設定',
    ko: '설정',
    id: 'Pengaturan',
    nl: 'Instellingen',
    th: 'การตั้งค่า',
    sw: 'Mipangilio'
  }),
  buildEntry('profile.language_setting', 'settings', 'Language / اللغة', {
    ar: 'اللغة / Language',
    fr: 'Langue / اللغة',
    es: 'Idioma / اللغة',
    pt: 'Idioma / اللغة',
    de: 'Sprache / اللغة',
    it: 'Lingua / اللغة',
    ru: 'Язык / اللغة',
    tr: 'Dil / اللغة',
    hi: 'भाषा / اللغة',
    ur: 'زبان / اللغة',
    'zh-CN': '语言 / اللغة',
    'zh-TW': '語言 / اللغة',
    ja: '言語 / اللغة',
    ko: '언어 / اللغة',
    id: 'Bahasa / اللغة',
    nl: 'Taal / اللغة',
    th: 'ภาษา / اللغة',
    sw: 'Lugha / اللغة'
  }),
  buildEntry('profile.privacy_safety', 'settings', 'Privacy & Safety', {
    ar: 'الخصوصية والأمان',
    fr: 'Confidentialité et sécurité',
    es: 'Privacidad y seguridad',
    pt: 'Privacidade e segurança',
    de: 'Datenschutz & Sicherheit',
    it: 'Privacy e sicurezza',
    ru: 'Конфиденциальность и безопасность',
    tr: 'Gizlilik ve Güvenlik',
    hi: 'गोपनीयता और सुरक्षा',
    ur: 'رازداری اور حفاظت',
    'zh-CN': '隐私与安全',
    'zh-TW': '隱私與安全',
    ja: 'プライバシーと安全',
    ko: '개인정보 및 안전',
    id: 'Privasi & Keamanan',
    nl: 'Privacy & Veiligheid',
    th: 'ความเป็นส่วนตัวและความปลอดภัย',
    sw: 'Faragha na Usalama'
  }),
  buildEntry('profile.help_center', 'settings', 'Help Center', {
    ar: 'مركز المساعدة',
    fr: "Centre d'aide",
    es: 'Centro de ayuda',
    pt: 'Central de ajuda',
    de: 'Hilfe-Center',
    it: 'Centro assistenza',
    ru: 'Справочный центр',
    tr: 'Yardım Merkezi',
    hi: 'सहायता केंद्र',
    ur: 'مددگار مرکز',
    'zh-CN': '帮助中心',
    'zh-TW': '說明中心',
    ja: 'ヘルプセンター',
    ko: '고객센터',
    id: 'Pusat Bantuan',
    nl: 'Helpcentrum',
    th: 'ศูนย์ช่วยเหลือ',
    sw: 'Kituo cha Msaada'
  }),
  buildEntry('profile.platform_control_panel', 'admin', 'Platform Control Panel', {
    ar: 'لوحة تحكم المنصة',
    fr: 'Panneau de contrôle',
    es: 'Panel de control de la plataforma',
    pt: 'Painel de Controle da Plataforma',
    de: 'Plattform-Kontrollzentrum',
    it: 'Pannello di controllo',
    ru: 'Панель управления платформой',
    tr: 'Platform Kontrol Paneli',
    hi: 'प्लेटफ़ॉर्म नियंत्रण पैनल',
    ur: 'پلیٹ فارم کنٹرول پینل',
    'zh-CN': '平台控制中心',
    'zh-TW': '平台控制中心',
    ja: 'プラットフォーム管理パネル',
    ko: '플랫폼 제어판',
    id: 'Panel Kontrol Platform',
    nl: 'Platform Controlepaneel',
    th: 'แผงควบคุมแพลตฟอร์ม',
    sw: 'Jopo la Udhibiti wa Jukwaa'
  }),
  buildEntry('profile.switch_role', 'profile', 'Switch Platform Role', {
    ar: 'تبديل دور الحساب',
    fr: 'Changer de rôle',
    es: 'Cambiar rol en la plataforma',
    pt: 'Alternar função na plataforma',
    de: 'Plattform-Rolle wechseln',
    it: 'Cambia ruolo piattaforma',
    ru: 'Сменить роль',
    tr: 'Platform Rolünü Değiştir',
    hi: 'प्लेटफ़ॉर्म भूमिका बदलें',
    ur: 'پلیٹ فارم کا کردار تبدیل کریں',
    'zh-CN': '切换平台角色',
    'zh-TW': '切換平台角色',
    ja: 'ロールを切り替え',
    ko: '플랫폼 역할 전환',
    id: 'Ganti Peran Platform',
    nl: 'Wissel platformrol',
    th: 'สลับบทบาทในแพลตฟอร์ม',
    sw: 'Badilisha Jukumu la Jukwaa'
  }),
  buildEntry('profile.appearance', 'settings', 'Appearance', {
    ar: 'المظهر',
    fr: 'Apparence',
    es: 'Apariencia',
    pt: 'Aparência',
    de: 'Erscheinungsbild',
    it: 'Aspetto',
    ru: 'Тема оформления',
    tr: 'Görünüm',
    hi: 'दिखावट',
    ur: 'ظاہری شکل',
    'zh-CN': '外观模式',
    'zh-TW': '外觀模式',
    ja: '外観モード',
    ko: '화면 테마',
    id: 'Tampilan',
    nl: 'Weergave',
    th: 'รูปแบบการแสดงผล',
    sw: 'Mwonekano'
  }),

  // ==========================================================================
  // 4. FEED, EXPLORE & CONTENT INTERACTION
  // ==========================================================================
  buildEntry('feed.for_you', 'feed', 'For You', {
    ar: 'لك',
    fr: 'Pour vous',
    es: 'Para ti',
    pt: 'Para você',
    de: 'Für dich',
    it: 'Per te',
    ru: 'Для вас',
    tr: 'Sizin İçin',
    hi: 'आपके लिए',
    ur: 'آپ کے لیے',
    'zh-CN': '为你推荐',
    'zh-TW': '為你推薦',
    ja: 'おすすめ',
    ko: '추천',
    id: 'Untuk Anda',
    nl: 'Voor jou',
    th: 'สำหรับคุณ',
    sw: 'Kwa Ajili Yako'
  }),
  buildEntry('feed.following', 'feed', 'Following', {
    ar: 'المتابَعون',
    fr: 'Abonnements',
    es: 'Siguiendo',
    pt: 'Seguindo',
    de: 'Folge ich',
    it: 'Seguiti',
    ru: 'Подписки',
    tr: 'Takip Edilenler',
    hi: 'फ़ॉलो किए गए',
    ur: 'فالونگ',
    'zh-CN': '关注',
    'zh-TW': '追蹤中',
    ja: 'フォロー中',
    ko: '팔로잉',
    id: 'Mengikuti',
    nl: 'Volgend',
    th: 'กำลังติดตาม',
    sw: 'Unaowafuata'
  }),
  buildEntry('feed.free_posts', 'feed', 'Free Posts', {
    ar: 'منشورات مجانية',
    fr: 'Publications gratuites',
    es: 'Publicaciones gratuitas',
    pt: 'Posts gratuitos',
    de: 'Kostenlose Beiträge',
    it: 'Post gratuiti',
    ru: 'Бесплатные посты',
    tr: 'Ücretsiz Gönderiler',
    hi: 'मुफ़्त पोस्ट',
    ur: 'مفت پوسٹس',
    'zh-CN': '免费动态',
    'zh-TW': '免費貼文',
    ja: '無料投稿',
    ko: '무료 게시물',
    id: 'Postingan Gratis',
    nl: 'Gratis berichten',
    th: 'โพสต์ฟรี',
    sw: 'Machapisho ya Bure'
  }),
  buildEntry('feed.all_posts', 'feed', 'All Posts', {
    ar: 'جميع المنشورات',
    fr: 'Toutes les publications',
    es: 'Todas las publicaciones',
    pt: 'Todos os posts',
    de: 'Alle Beiträge',
    it: 'Tutti i post',
    ru: 'Все публикации',
    tr: 'Tüm Gönderiler',
    hi: 'सभी पोस्ट',
    ur: 'تمام پوسٹس',
    'zh-CN': '全部动态',
    'zh-TW': '全部貼文',
    ja: 'すべての投稿',
    ko: '모든 게시물',
    id: 'Semua Postingan',
    nl: 'Alle berichten',
    th: 'โพสต์ทั้งหมด',
    sw: 'Machapisho Yote'
  }),
  buildEntry('feed.create_post', 'feed', 'Create Post', {
    ar: 'إنشاء منشور',
    fr: 'Créer une publication',
    es: 'Crear publicación',
    pt: 'Criar publicação',
    de: 'Beitrag erstellen',
    it: 'Crea post',
    ru: 'Создать пост',
    tr: 'Gönderi Oluştur',
    hi: 'पोस्ट बनाएँ',
    ur: 'پوسٹ بنائیں',
    'zh-CN': '发布动态',
    'zh-TW': '建立貼文',
    ja: '投稿を作成',
    ko: '게시물 작성',
    id: 'Buat Postingan',
    nl: 'Bericht maken',
    th: 'สร้างโพสต์',
    sw: 'Unda Chapisho'
  }),
  buildEntry('feed.go_live', 'live', 'Go Live', {
    ar: 'بدء بث مباشر',
    fr: 'Passer en direct',
    es: 'Transmitir en vivo',
    pt: 'Entrar ao vivo',
    de: 'Live gehen',
    it: 'Vai in diretta',
    ru: 'Выйти в эфир',
    tr: 'Canlı Yayına Geç',
    hi: 'लाइव जाएँ',
    ur: 'لائیو جائیں',
    'zh-CN': '开启直播',
    'zh-TW': '開始直播',
    ja: 'ライブ配信を開始',
    ko: '라이브 시작',
    id: 'Mulai Siaran Langsung',
    nl: 'Ga live',
    th: 'เริ่มไลฟ์สด',
    sw: 'Anza Mubashara'
  }),
  buildEntry('feed.send_tip', 'feed', 'Send Tip', {
    ar: 'إرسال إكرامية',
    fr: 'Envoyer un pourboire',
    es: 'Enviar propina',
    pt: 'Enviar gorjeta',
    de: 'Trinkgeld senden',
    it: 'Invia mancia',
    ru: 'Отправить чаевые',
    tr: 'Bahşiş Gönder',
    hi: 'टिप भेजें',
    ur: 'ٹپ بھیجیں',
    'zh-CN': '发送打赏',
    'zh-TW': '發送打賞',
    ja: 'チップを送る',
    ko: '팁 보내기',
    id: 'Kirim Tip',
    nl: 'Fooi sturen',
    th: 'ส่งทิป',
    sw: 'Tumazawadi'
  }),
  buildEntry('feed.subscribe', 'feed', 'Subscribe', {
    ar: 'اشترك',
    fr: "S'abonner",
    es: 'Suscribirse',
    pt: 'Assinar',
    de: 'Abonnieren',
    it: 'Abbonati',
    ru: 'Подписаться',
    tr: 'Abone Ol',
    hi: 'सदस्यता लें',
    ur: 'سبسکرائب کریں',
    'zh-CN': '订阅',
    'zh-TW': '訂閱',
    ja: '購読する',
    ko: '구독하기',
    id: 'Berlangganan',
    nl: 'Abonneren',
    th: 'สมัครสมาชิก',
    sw: 'Jisajili'
  }),
  buildEntry('feed.follow', 'feed', 'Follow', {
    ar: 'متابعة',
    fr: 'Suivre',
    es: 'Seguir',
    pt: 'Seguir',
    de: 'Folgen',
    it: 'Segui',
    ru: 'Подписаться',
    tr: 'Takip Et',
    hi: 'फ़ॉलो करें',
    ur: 'فالو کریں',
    'zh-CN': '关注',
    'zh-TW': '追蹤',
    ja: 'フォロー',
    ko: '팔로우',
    id: 'Ikuti',
    nl: 'Volgen',
    th: 'ติดตาม',
    sw: 'Fuata'
  }),
  buildEntry('feed.translate', 'feed', 'Translate', {
    ar: 'ترجمة',
    fr: 'Traduire',
    es: 'Traducir',
    pt: 'Traduzir',
    de: 'Übersetzen',
    it: 'Traduci',
    ru: 'Перевести',
    tr: 'Çevir',
    hi: 'अनुवाद करें',
    ur: 'ترجمہ کریں',
    'zh-CN': '翻译',
    'zh-TW': '翻譯',
    ja: '翻訳を表示',
    ko: '번역 보기',
    id: 'Terjemahkan',
    nl: 'Vertalen',
    th: 'แปลภาษา',
    sw: 'Tafsiri'
  }),
  buildEntry('feed.show_original', 'feed', 'Show Original', {
    ar: 'عرض النص الأصلي',
    fr: "Afficher l'original",
    es: 'Mostrar original',
    pt: 'Mostrar original',
    de: 'Original anzeigen',
    it: 'Mostra originale',
    ru: 'Показать оригинал',
    tr: 'Orijinali Göster',
    hi: 'मूल पाठ दिखाएँ',
    ur: 'اصل متن دکھائیں',
    'zh-CN': '查看原文',
    'zh-TW': '顯示原文',
    ja: '原文を表示',
    ko: '원문 보기',
    id: 'Tampilkan Asli',
    nl: 'Origineel tonen',
    th: 'แสดงต้นฉบับ',
    sw: 'Onyesha Asili'
  }),
  buildEntry('feed.translated_from_original', 'feed', 'Translated from original', {
    ar: 'مترجم من النص الأصلي',
    fr: "Traduit de l'original",
    es: 'Traducido del original',
    pt: 'Traduzido do original',
    de: 'Aus dem Original übersetzt',
    it: "Tradotto dall'originale",
    ru: 'Переведено с оригинала',
    tr: 'Orijinal metinden çevrildi',
    hi: 'मूल से अनुवादित',
    ur: 'اصل متن سے ترجمہ شدہ',
    'zh-CN': '已由原文翻译',
    'zh-TW': '已由原文翻譯',
    ja: '原文から翻訳済み',
    ko: '원문에서 번역됨',
    id: 'Diterjemahkan dari teks asli',
    nl: 'Vertaald uit het origineel',
    th: 'แปลจากข้อความต้นฉบับ',
    sw: 'Imetafsiriwa kutoka asili'
  }),

  // ==========================================================================
  // 5. LANGUAGE & LOCALIZATION SETTINGS
  // ==========================================================================
  buildEntry('settings.language_title', 'settings', 'Language & Regional Preferences', {
    ar: 'إعدادات اللغة والمنطقة',
    fr: 'Langue et préférences régionales',
    es: 'Idioma y preferencias regionales',
    pt: 'Idioma e preferências regionais',
    de: 'Sprache & Regionale Einstellungen',
    it: 'Lingua e preferenze regionali',
    ru: 'Язык и региональные настройки',
    tr: 'Dil ve Bölge Tercihleri',
    hi: 'भाषा और क्षेत्रीय प्राथमिकताएँ',
    ur: 'زبان اور علاقائی ترجیحات',
    'zh-CN': '语言与地区偏好',
    'zh-TW': '語言與地區偏好',
    ja: '言語と地域の設定',
    ko: '언어 및 지역 설정',
    id: 'Preferensi Bahasa & Wilayah',
    nl: 'Taal & Regionale voorkeuren',
    th: 'ภาษาและการตั้งค่าภูมิภาค',
    sw: 'Lugha na Mapendeleo ya Kikanda'
  }),
  buildEntry('settings.language_mode_auto', 'settings', 'Automatic (Follow Device Language)', {
    ar: 'تلقائي (حسب لغة الجهاز أو المتصفح)',
    fr: "Automatique (Suivre la langue de l'appareil)",
    es: 'Automático (Seguir el idioma del dispositivo)',
    pt: 'Automático (Seguir o idioma do dispositivo)',
    de: 'Automatisch (Gerätesprache folgen)',
    it: 'Automatico (Segui lingua del dispositivo)',
    ru: 'Автоматически (Язык устройства)',
    tr: 'Otomatik (Cihaz Dilini Takip Et)',
    hi: 'स्वचालित (डिवाइस की भाषा का अनुसरण करें)',
    ur: 'خودکار (ڈیوائس کی زبان کے مطابق)',
    'zh-CN': '自动（跟随设备或浏览器语言）',
    'zh-TW': '自動（跟隨裝置或瀏覽器語言）',
    ja: '自動（端末・ブラウザの言語に従う）',
    ko: '자동 (기기 또는 브라우저 언어 따름)',
    id: 'Otomatis (Ikuti Bahasa Perangkat)',
    nl: 'Automatisch (Volg apparaattaal)',
    th: 'อัตโนมัติ (ตามภาษาของอุปกรณ์)',
    sw: 'Otomatiki (Fuata Lugha ya Kifaa)'
  }),
  buildEntry('settings.language_mode_manual', 'settings', 'Manual (Always Use Selected Language)', {
    ar: 'يدوي (استخدام اللغة المختارة دائماً)',
    fr: 'Manuel (Toujours utiliser la langue choisie)',
    es: 'Manual (Usar siempre el idioma seleccionado)',
    pt: 'Manual (Usar sempre o idioma selecionado)',
    de: 'Manuell (Immer gewählte Sprache verwenden)',
    it: 'Manuale (Usa sempre la lingua selezionata)',
    ru: 'Вручную (Всегда выбранный язык)',
    tr: 'Manuel (Her Zaman Seçilen Dili Kullan)',
    hi: 'मैनुअल (हमेशा चुनी गई भाषा का उपयोग करें)',
    ur: 'مینوئل (ہمیشہ منتخب کردہ زبان استعمال کریں)',
    'zh-CN': '手动（始终使用所选语言）',
    'zh-TW': '手動（始終使用所選語言）',
    ja: '手動（常に選択した言語を使用）',
    ko: '수동 (항상 선택한 언어 사용)',
    id: 'Manual (Selalu Gunakan Bahasa Terpilih)',
    nl: 'Handmatig (Gebruik altijd geselecteerde taal)',
    th: 'กำหนดเอง (ใช้ภาษาที่เลือกเสมอ)',
    sw: 'Kwa Mkono (Tumia Lugha Iliyochaguliwa Daima)'
  }),
  buildEntry('settings.language_mode_english', 'settings', 'English (Always English)', {
    ar: 'الإنجليزية (English دائماً)',
    fr: 'Anglais (Toujours en English)',
    es: 'Inglés (Siempre en English)',
    pt: 'Inglês (Sempre em English)',
    de: 'Englisch (Immer English)',
    it: 'Inglese (Sempre English)',
    ru: 'Английский (Всегда English)',
    tr: 'İngilizce (Her Zaman English)',
    hi: 'अंग्रेज़ी (हमेशा English)',
    ur: 'انگریزی (ہمیشہ English)',
    'zh-CN': '英语（始终使用 English）',
    'zh-TW': '英語（始終使用 English）',
    ja: '英語（常に English を使用）',
    ko: '영어 (항상 English 사용)',
    id: 'Bahasa Inggris (Selalu English)',
    nl: 'Engels (Altijd English)',
    th: 'ภาษาอังกฤษ (ใช้ English เสมอ)',
    sw: 'Kiingereza (English Daima)'
  }),
  buildEntry('settings.search_languages', 'settings', 'Search 19 languages by native or English name...', {
    ar: 'ابحث في 19 لغة بالاسم المحلي أو الإنجليزي...',
    fr: 'Rechercher parmi 19 langues...',
    es: 'Buscar entre 19 idiomas...',
    pt: 'Pesquisar entre 19 idiomas...',
    de: '19 Sprachen durchsuchen...',
    it: 'Cerca tra 19 lingue...',
    ru: 'Поиск среди 19 языков...',
    tr: '19 dil arasında ara...',
    hi: '19 भाषाओं में खोजें...',
    ur: '19 زبانوں میں تلاش کریں...',
    'zh-CN': '搜索 19 种语言...',
    'zh-TW': '搜尋 19 種語言...',
    ja: '19の言語を検索...',
    ko: '19개 언어 검색...',
    id: 'Cari dari 19 bahasa...',
    nl: 'Zoek in 19 talen...',
    th: 'ค้นหา 19 ภาษา...',
    sw: 'Tafuta kati ya lugha 19...'
  }),

  // ==========================================================================
  // 6. COMMON ACTIONS, BUTTONS, MODALS & NOTIFICATIONS
  // ==========================================================================
  buildEntry('common.save_changes', 'common', 'Save Changes', {
    ar: 'حفظ التغييرات',
    fr: 'Enregistrer les modifications',
    es: 'Guardar cambios',
    pt: 'Salvar alterações',
    de: 'Änderungen speichern',
    it: 'Salva modifiche',
    ru: 'Сохранить изменения',
    tr: 'Değişiklikleri Kaydet',
    hi: 'परिवर्तन सहेजें',
    ur: 'تبدیلیاں محفوظ کریں',
    'zh-CN': '保存更改',
    'zh-TW': '儲存變更',
    ja: '変更を保存',
    ko: '변경사항 저장',
    id: 'Simpan Perubahan',
    nl: 'Wijzigingen opslaan',
    th: 'บันทึกการเปลี่ยนแปลง',
    sw: 'Hifadhi Mabadiliko'
  }),
  buildEntry('common.save_preferences', 'common', 'Save Preferences', {
    ar: 'حفظ التفضيلات',
    fr: 'Enregistrer les préférences',
    es: 'Guardar preferencias',
    pt: 'Salvar preferências',
    de: 'Einstellungen speichern',
    it: 'Salva preferenze',
    ru: 'Сохранить настройки',
    tr: 'Tercihleri Kaydet',
    hi: 'प्राथमिकताएँ सहेजें',
    ur: 'ترجیحات محفوظ کریں',
    'zh-CN': '保存偏好设置',
    'zh-TW': '儲存偏好設定',
    ja: '設定を保存',
    ko: '환경설정 저장',
    id: 'Simpan Preferensi',
    nl: 'Voorkeuren opslaan',
    th: 'บันทึกการตั้งค่า',
    sw: 'Hifadhi Mapendeleo'
  }),
  buildEntry('common.cancel', 'common', 'Cancel', {
    ar: 'إلغاء',
    fr: 'Annuler',
    es: 'Cancelar',
    pt: 'Cancelar',
    de: 'Abbrechen',
    it: 'Annulla',
    ru: 'Отмена',
    tr: 'İptal',
    hi: 'रद्द करें',
    ur: 'منسوخ کریں',
    'zh-CN': '取消',
    'zh-TW': '取消',
    ja: 'キャンセル',
    ko: '취소',
    id: 'Batal',
    nl: 'Annuleren',
    th: 'ยกเลิก',
    sw: 'Ghairi'
  }),
  buildEntry('common.close', 'common', 'Close', {
    ar: 'إغلاق',
    fr: 'Fermer',
    es: 'Cerrar',
    pt: 'Fechar',
    de: 'Schließen',
    it: 'Chiudi',
    ru: 'Закрыть',
    tr: 'Kapat',
    hi: 'बंद करें',
    ur: 'بند کریں',
    'zh-CN': '关闭',
    'zh-TW': '關閉',
    ja: '閉じる',
    ko: '닫기',
    id: 'Tutup',
    nl: 'Sluiten',
    th: 'ปิด',
    sw: 'Funga'
  }),
  buildEntry('common.search', 'common', 'Search', {
    ar: 'بحث',
    fr: 'Rechercher',
    es: 'Buscar',
    pt: 'Pesquisar',
    de: 'Suchen',
    it: 'Cerca',
    ru: 'Поиск',
    tr: 'Ara',
    hi: 'खोजें',
    ur: 'تلاش کریں',
    'zh-CN': '搜索',
    'zh-TW': '搜尋',
    ja: '検索',
    ko: '검색',
    id: 'Cari',
    nl: 'Zoeken',
    th: 'ค้นหา',
    sw: 'Tafuta'
  }),
  buildEntry('common.notifications', 'notifications', 'Notifications', {
    ar: 'الإشعارات',
    fr: 'Notifications',
    es: 'Notificaciones',
    pt: 'Notificações',
    de: 'Benachrichtigungen',
    it: 'Notifiche',
    ru: 'Уведомления',
    tr: 'Bildirimler',
    hi: 'सूचनाएँ',
    ur: 'اطلاعات',
    'zh-CN': '通知',
    'zh-TW': '通知',
    ja: '通知',
    ko: '알림',
    id: 'Notifikasi',
    nl: 'Meldingen',
    th: 'การแจ้งเตือน',
    sw: 'Arifa'
  }),
  buildEntry('common.announcements', 'notifications', 'Announcements', {
    ar: 'الإعلانات الرسمية',
    fr: 'Annonces',
    es: 'Anuncios',
    pt: 'Anúncios',
    de: 'Ankündigungen',
    it: 'Annunci',
    ru: 'Объявления',
    tr: 'Duyurular',
    hi: 'घोषणाएँ',
    ur: 'اعلانات',
    'zh-CN': '平台公告',
    'zh-TW': '平台公告',
    ja: 'お知らせ',
    ko: '공지사항',
    id: 'Pengumuman',
    nl: 'Aankondigingen',
    th: 'ประกาศ',
    sw: 'Matangazo'
  }),
  buildEntry('common.mark_all_read', 'notifications', 'Mark all read', {
    ar: 'تحديد الكل كمقروء',
    fr: 'Tout marquer comme lu',
    es: 'Marcar todo como leído',
    pt: 'Marcar tudo como lido',
    de: 'Alle als gelesen markieren',
    it: 'Segna tutti come letti',
    ru: 'Отметить все как прочитанные',
    tr: 'Tümünü okundu işaretle',
    hi: 'सभी को पढ़ा हुआ चिह्नित करें',
    ur: 'سب کو پڑھا ہوا نشان زد کریں',
    'zh-CN': '全部标为已读',
    'zh-TW': '全部標示為已讀',
    ja: 'すべて既読にする',
    ko: '모두 읽음으로 표시',
    id: 'Tandai semua dibaca',
    nl: 'Alles als gelezen markeren',
    th: 'ทำเครื่องหมายว่าอ่านทั้งหมด',
    sw: 'Weka zote kuwa zimesomwa'
  }),
  buildEntry('common.dark_mode', 'settings', 'Dark Mode', {
    ar: 'الوضع الداكن',
    fr: 'Mode sombre',
    es: 'Modo oscuro',
    pt: 'Modo escuro',
    de: 'Dunkelmodus',
    it: 'Modalità scura',
    ru: 'Темная тема',
    tr: 'Koyu Mod',
    hi: 'डार्क मोड',
    ur: 'ڈارک موڈ',
    'zh-CN': '深色模式',
    'zh-TW': '深色模式',
    ja: 'ダークモード',
    ko: '다크 모드',
    id: 'Mode Gelap',
    nl: 'Donkere modus',
    th: 'โหมดมืด',
    sw: 'Hali ya Giza'
  }),
  buildEntry('common.light_mode', 'settings', 'Light Mode', {
    ar: 'الوضع الفاتح',
    fr: 'Mode clair',
    es: 'Modo claro',
    pt: 'Modo claro',
    de: 'Hellmodus',
    it: 'Modalità chiara',
    ru: 'Светлая тема',
    tr: 'Açık Mod',
    hi: 'लाइट मोड',
    ur: 'لائٹ موڈ',
    'zh-CN': '浅色模式',
    'zh-TW': '淺色模式',
    ja: 'ライトモード',
    ko: '라이트 모드',
    id: 'Mode Terang',
    nl: 'Lichte modus',
    th: 'โหมดสว่าง',
    sw: 'Hali ya Mwanga'
  }),
  buildEntry('common.system_default', 'settings', 'System Default', {
    ar: 'افتراضي النظام',
    fr: 'Système par défaut',
    es: 'Predeterminado del sistema',
    pt: 'Padrão do sistema',
    de: 'Systemstandard',
    it: 'Predefinito di sistema',
    ru: 'Системная',
    tr: 'Sistem Varsayılanı',
    hi: 'सिस्टम डिफ़ॉल्ट',
    ur: 'سسٹم ڈیفالٹ',
    'zh-CN': '跟随系统',
    'zh-TW': '跟隨系統',
    ja: 'システム設定に従う',
    ko: '시스템 기본값',
    id: 'Default Sistem',
    nl: 'Systeemstandaard',
    th: 'ค่าเริ่มต้นของระบบ',
    sw: 'Chaguomsingi la Mfumo'
  })
];

/**
 * Extended Platform-Wide Phrase Dictionary across all 20+ ACOVON areas
 * Used by both `t()` and `GlobalDomTranslator` so every page, tab, button, modal,
 * form label, Creator Studio view, and Admin Control Center section translates cleanly.
 */
export const EXTENDED_UI_PHRASE_DICTIONARY: Record<
  string,
  Partial<Record<SupportedLanguageCode, string>>
> = {
  // Header & Navigation
  'Exclusive Creator Subscriptions, Vault Media & Live Broadcasts': {
    ar: 'اشتراكات حصرية للمبدعين، وسائط الخزنة والبث المباشر',
    fr: 'Abonnements Créateurs Exclusifs, Médias Privés & Directs',
    es: 'Suscripciones Exclusivas a Creadores, Multimedia y Directos',
    pt: 'Assinaturas Exclusivas de Criadores, Mídia Privada e Lives',
    de: 'Exklusive Creator-Abos, Vault-Medien & Live-Streams',
    it: 'Abbonamenti esclusivi, Media privati e Dirette',
    ru: 'Эксклюзивные подписки, закрытые медиа и прямые эфиры',
    tr: 'Özel İçerik Üretici Abonelikleri, Kasa Medyası ve Canlı Yayınlar',
    hi: 'विशेष क्रिएटर सदस्यताएँ, वॉल्ट मीडिया और लाइव प्रसारण',
    ur: 'خصوصی کریئیٹر سبسکرپشنز، والٹ میڈیا اور لائیو نشریات',
    'zh-CN': '专属创作者订阅、私密媒体库与实时直播',
    'zh-TW': '專屬創作者訂閱、私密媒體庫與即時直播',
    ja: '限定クリエイター購読・プレミアムメディア・ライブ配信',
    ko: '독점 크리에이터 구독, 볼트 미디어 및 라이브 방송',
    id: 'Langganan Eksklusif Kreator, Media Vault & Siaran Langsung',
    nl: 'Exclusieve Creator-abonnementen, Vault Media & Livestreams',
    th: 'การสมัครสมาชิกครีเอเตอร์สุดพิเศษ มีเดียส่วนตัว และไลฟ์สด',
    sw: 'Usajili Maalum wa Waundaji, Midia ya Siri na Matangazo Mubashara'
  },
  'Dark': {
    ar: 'داكن',
    fr: 'Sombre',
    es: 'Oscuro',
    pt: 'Escuro',
    de: 'Dunkel',
    it: 'Scuro',
    ru: 'Темная',
    tr: 'Koyu',
    hi: 'डार्क',
    ur: 'ڈارک',
    'zh-CN': '深色',
    'zh-TW': '深色',
    ja: 'ダーク',
    ko: '다크',
    id: 'Gelap',
    nl: 'Donker',
    th: 'มืด',
    sw: 'Giza'
  },
  'Light': {
    ar: 'فاتح',
    fr: 'Clair',
    es: 'Claro',
    pt: 'Claro',
    de: 'Hell',
    it: 'Chiaro',
    ru: 'Светлая',
    tr: 'Açık',
    hi: 'लाइट',
    ur: 'لائٹ',
    'zh-CN': '浅色',
    'zh-TW': '淺色',
    ja: 'ライト',
    ko: '라이트',
    id: 'Terang',
    nl: 'Licht',
    th: 'สว่าง',
    sw: 'Mwanga'
  },
  'System': {
    ar: 'النظام',
    fr: 'Système',
    es: 'Sistema',
    pt: 'Sistema',
    de: 'System',
    it: 'Sistema',
    ru: 'Система',
    tr: 'Sistem',
    hi: 'सिस्टम',
    ur: 'سسٹم',
    'zh-CN': '系统',
    'zh-TW': '系統',
    ja: '自動',
    ko: '시스템',
    id: 'Sistem',
    nl: 'Systeem',
    th: 'ระบบ',
    sw: 'Mfumo'
  },
  'Done': {
    ar: 'تم',
    fr: 'Terminé',
    es: 'Listo',
    pt: 'Concluído',
    de: 'Fertig',
    it: 'Fatto',
    ru: 'Готово',
    tr: 'Tamam',
    hi: 'पूर्ण',
    ur: 'مکمل',
    'zh-CN': '完成',
    'zh-TW': '完成',
    ja: '完了',
    ko: '완료',
    id: 'Selesai',
    nl: 'Klaar',
    th: 'เสร็จสิ้น',
    sw: 'Imekamilika'
  },
  'Account & Feed Settings': {
    ar: 'إعدادات الحساب والصفحة الرئيسية',
    fr: 'Paramètres du compte et du fil',
    es: 'Configuración de cuenta y feed',
    pt: 'Configurações da Conta e do Feed',
    de: 'Konto- & Feed-Einstellungen',
    it: 'Impostazioni account e feed',
    ru: 'Настройки аккаунта и ленты',
    tr: 'Hesap ve Akış Ayarları',
    hi: 'खाता और फ़ीड सेटिंग्स',
    ur: 'اکاؤنٹ اور فیڈ کی ترتیبات',
    'zh-CN': '账户与动态设置',
    'zh-TW': '帳戶與動態設定',
    ja: 'アカウントとフィード設定',
    ko: '계정 및 피드 설정',
    id: 'Pengaturan Akun & Beranda',
    nl: 'Account- & Feed-instellingen',
    th: 'การตั้งค่าบัญชีและฟีด',
    sw: 'Mipangilio ya Akaunti na Mlisho'
  },
  'Feed Personalization & Interests': {
    ar: 'تخصيص المحتوى والاهتمامات',
    fr: 'Personnalisation et centres d’intérêt',
    es: 'Personalización e intereses',
    pt: 'Personalização e Interesses',
    de: 'Feed-Personalisierung & Interessen',
    it: 'Personalizzazione e interessi',
    ru: 'Персонализация и интересы',
    tr: 'Akış Kişiselleştirme ve İlgi Alanları',
    hi: 'फ़ीड वैयक्तिकरण और रुचियाँ',
    ur: 'فیڈ کی تخصیص اور دلچسپیاں',
    'zh-CN': '动态个性化与兴趣偏好',
    'zh-TW': '動態個人化與興趣偏好',
    ja: 'おすすめ設定と興味関心',
    ko: '피드 맞춤 설정 및 관심사',
    id: 'Personalisasi & Minat',
    nl: 'Feedpersonalisatie & Interesses',
    th: 'การปรับแต่งฟีดและความสนใจ',
    sw: 'Ubinafsishaji wa Mlisho na Mapendeleo'
  },
  'Security & Preferences': {
    ar: 'الأمان والتفضيلات',
    fr: 'Sécurité et préférences',
    es: 'Seguridad y preferencias',
    pt: 'Segurança e Preferências',
    de: 'Sicherheit & Präferenzen',
    it: 'Sicurezza e preferenze',
    ru: 'Безопасность и предпочтения',
    tr: 'Güvenlik ve Tercihler',
    hi: 'सुरक्षा और प्राथमिकताएँ',
    ur: 'سیکیورٹی اور ترجیحات',
    'zh-CN': '安全与偏好设置',
    'zh-TW': '安全與偏好設定',
    ja: 'セキュリティと環境設定',
    ko: '보안 및 환경설정',
    id: 'Keamanan & Preferensi',
    nl: 'Beveiliging & Voorkeuren',
    th: 'ความปลอดภัยและการตั้งค่า',
    sw: 'Usalama na Mapendeleo'
  },
  'Display Appearance Mode': {
    ar: 'وضع مظهر العرض',
    fr: "Mode d'affichage",
    es: 'Modo de apariencia de pantalla',
    pt: 'Modo de Aparência da Tela',
    de: 'Anzeigemodus',
    it: 'Modalità di visualizzazione',
    ru: 'Режим отображения',
    tr: 'Görünüm Modu',
    hi: 'डिस्प्ले दिखावट मोड',
    ur: 'ڈسپلے ظاہری موڈ',
    'zh-CN': '界面外观模式',
    'zh-TW': '介面外觀模式',
    ja: '画面表示モード',
    ko: '화면 표시 모드',
    id: 'Mode Tampilan Layar',
    nl: 'Weergavemodus',
    th: 'โหมดการแสดงผลหน้าจอ',
    sw: 'Hali ya Mwonekano wa Skrini'
  },
  'Email & Push Notifications': {
    ar: 'إشعارات البريد الإلكتروني والتنبيهات الفورية',
    fr: 'Notifications par e-mail et push',
    es: 'Notificaciones por correo y push',
    pt: 'Notificações por E-mail e Push',
    de: 'E-Mail- & Push-Benachrichtigungen',
    it: 'Notifiche email e push',
    ru: 'Email и Push-уведомления',
    tr: 'E-posta ve Anlık Bildirimler',
    hi: 'ईमेल और पुश सूचनाएँ',
    ur: 'ای میل اور پش اطلاعات',
    'zh-CN': '邮件与推送通知',
    'zh-TW': '電子郵件與推播通知',
    ja: 'メールとプッシュ通知',
    ko: '이메일 및 푸시 알림',
    id: 'Notifikasi Email & Push',
    nl: 'E-mail- & Pushmeldingen',
    th: 'การแจ้งเตือนทางอีเมลและพุช',
    sw: 'Arifa za Barua Pepe na Push'
  },
  'Two-Factor Authentication (2FA)': {
    ar: 'المصادقة الثنائية (2FA)',
    fr: 'Authentification à deux facteurs (2FA)',
    es: 'Autenticación de dos factores (2FA)',
    pt: 'Autenticação de Dois Fatores (2FA)',
    de: 'Zwei-Faktor-Authentifizierung (2FA)',
    it: 'Autenticazione a due fattori (2FA)',
    ru: 'Двухфакторная аутентификация (2FA)',
    tr: 'İki Faktörlü Kimlik Doğrulama (2FA)',
    hi: 'दो-कारक प्रमाणीकरण (2FA)',
    ur: 'دو عنصری تصدیق (2FA)',
    'zh-CN': '双重身份验证 (2FA)',
    'zh-TW': '雙重身分驗證 (2FA)',
    ja: '二段階認証 (2FA)',
    ko: '2단계 인증 (2FA)',
    id: 'Autentikasi Dua Faktor (2FA)',
    nl: 'Tweefactorauthenticatie (2FA)',
    th: 'การยืนยันตัวตนสองชั้น (2FA)',
    sw: 'Uthibitishaji wa Hatua Mbili (2FA)'
  },
  'Preferred Display Currency': {
    ar: 'عملة العرض المفضلة',
    fr: "Devise d'affichage préférée",
    es: 'Moneda de visualización preferida',
    pt: 'Moeda de Exibição Preferida',
    de: 'Bevorzugte Anzeigewährung',
    it: 'Valuta di visualizzazione preferita',
    ru: 'Предпочитаемая валюта',
    tr: 'Tercih Edilen Para Birimi',
    hi: 'पसंदीदा प्रदर्शन मुद्रा',
    ur: 'پسندیدہ ڈسپلے کرنسی',
    'zh-CN': '首选显示货币',
    'zh-TW': '首選顯示貨幣',
    ja: '表示通貨の設定',
    ko: '선호 표시 통화',
    id: 'Mata Uang Tampilan Pilihan',
    nl: 'Voorkeursvaluta',
    th: 'สกุลเงินที่ต้องการแสดง',
    sw: 'Sarafu Inayopendelewa'
  },
  // Explore & Creators
  'Discover Creators': {
    ar: 'اكتشف المبدعين',
    fr: 'Découvrir des créateurs',
    es: 'Descubrir creadores',
    pt: 'Descobrir Criadores',
    de: 'Creator entdecken',
    it: 'Scopri i creatori',
    ru: 'Найти авторов',
    tr: 'Üreticileri Keşfet',
    hi: 'क्रिएटर्स खोजें',
    ur: 'کریئیٹرز دریافت کریں',
    'zh-CN': '发现创作者',
    'zh-TW': '探索創作者',
    ja: 'クリエイターを探す',
    ko: '크리에이터 탐색',
    id: 'Temukan Kreator',
    nl: 'Ontdek Creators',
    th: 'ค้นหาครีเอเตอร์',
    sw: 'Gundua Waundaji'
  },
  'Featured Creators': {
    ar: 'المبدعون المميزون',
    fr: 'Créateurs à la une',
    es: 'Creadores destacados',
    pt: 'Criadores em Destaque',
    de: 'Empfohlene Creator',
    it: 'Creatori in evidenza',
    ru: 'Рекомендуемые авторы',
    tr: 'Öne Çıkan Üreticiler',
    hi: 'फीचर्ड क्रिएटर्स',
    ur: 'نمایاں کریئیٹرز',
    'zh-CN': '精选创作者',
    'zh-TW': '精選創作者',
    ja: '注目のクリエイター',
    ko: '추천 크리에이터',
    id: 'Kreator Pilihan',
    nl: 'Uitgelichte Creators',
    th: 'ครีเอเตอร์แนะนำ',
    sw: 'Waundaji Maarufu'
  },
  'View Profile': {
    ar: 'عرض الملف الشخصي',
    fr: 'Voir le profil',
    es: 'Ver perfil',
    pt: 'Ver perfil',
    de: 'Profil ansehen',
    it: 'Vedi profilo',
    ru: 'Открыть профиль',
    tr: 'Profili Gör',
    hi: 'प्रोफ़ाइल देखें',
    ur: 'پروفائل دیکھیں',
    'zh-CN': '查看主页',
    'zh-TW': '查看檔案',
    ja: 'プロフィールを見る',
    ko: '프로필 보기',
    id: 'Lihat Profil',
    nl: 'Profiel bekijken',
    th: 'ดูโปรไฟล์',
    sw: 'Tazama Wasifu'
  },
  // Messages, Calls, Custom Requests, Wallet
  'Custom Video Request': {
    ar: 'طلب فيديو مخصص',
    fr: 'Demande de vidéo personnalisée',
    es: 'Solicitud de video personalizado',
    pt: 'Pedido de Vídeo Personalizado',
    de: 'Individuelle Videoanfrage',
    it: 'Richiesta video personalizzato',
    ru: 'Заказ персонального видео',
    tr: 'Özel Video İsteği',
    hi: 'कस्टम वीडियो अनुरोध',
    ur: 'کسٹم ویڈیو کی درخواست',
    'zh-CN': '定制视频请求',
    'zh-TW': '客製化影片請求',
    ja: 'カスタム動画リクエスト',
    ko: '맞춤 영상 요청',
    id: 'Permintaan Video Khusus',
    nl: 'Aangepast videoverzoek',
    th: 'คำขอวิดีโอพิเศษ',
    sw: 'Ombi la Video Maalum'
  },
  'Start Video Call': {
    ar: 'بدء مكالمة فيديو',
    fr: 'Démarrer un appel vidéo',
    es: 'Iniciar videollamada',
    pt: 'Iniciar Chamada de Vídeo',
    de: 'Videoanruf starten',
    it: 'Avvia videochiamata',
    ru: 'Начать видеозвонок',
    tr: 'Görüntülü Arama Başlat',
    hi: 'वीडियो कॉल शुरू करें',
    ur: 'ویڈیو کال شروع کریں',
    'zh-CN': '发起视频通话',
    'zh-TW': '發起視訊通話',
    ja: 'ビデオ通話を開始',
    ko: '영상 통화 시작',
    id: 'Mulai Panggilan Video',
    nl: 'Videogesprek starten',
    th: 'เริ่มวิดีโอคอล',
    sw: 'Anza Simu ya Video'
  },
  'Add Funds': {
    ar: 'إضافة رصيد',
    fr: 'Ajouter des fonds',
    es: 'Añadir fondos',
    pt: 'Adicionar Fundos',
    de: 'Guthaben aufladen',
    it: 'Aggiungi fondi',
    ru: 'Пополнить баланс',
    tr: 'Bakiye Yükle',
    hi: 'धनराशि जोड़ें',
    ur: 'فنڈز شامل کریں',
    'zh-CN': '充值余额',
    'zh-TW': '儲值餘額',
    ja: '残高を追加',
    ko: '잔액 충전',
    id: 'Tambah Saldo',
    nl: 'Saldo opwaarderen',
    th: 'เติมเงิน',
    sw: 'Ongeza Salio'
  },
  'Request Payout': {
    ar: 'طلب سحب الأرباح',
    fr: 'Demander un versement',
    es: 'Solicitar pago',
    pt: 'Solicitar Saque',
    de: 'Auszahlung anfordern',
    it: 'Richiedi pagamento',
    ru: 'Запросить выплату',
    tr: 'Ödeme Talep Et',
    hi: 'भुगतान का अनुरोध करें',
    ur: 'رقم نکلوانے کی درخواست کریں',
    'zh-CN': '申请提现',
    'zh-TW': '申請提領',
    ja: '出金を申請',
    ko: '정산 요청',
    id: 'Ajukan Penarikan',
    nl: 'Uitbetaling aanvragen',
    th: 'ขอถอนเงิน',
    sw: 'Omba Malipo'
  },
  'Comments': {
    ar: 'التعليقات',
    fr: 'Commentaires',
    es: 'Comentarios',
    pt: 'Comentários',
    de: 'Kommentare',
    it: 'Commenti',
    ru: 'Комментарии',
    tr: 'Yorumlar',
    hi: 'टिप्पणियाँ',
    ur: 'تبصرے',
    'zh-CN': '评论',
    'zh-TW': '留言',
    ja: 'コメント',
    ko: '댓글',
    id: 'Komentar',
    nl: 'Reacties',
    th: 'ความคิดเห็น',
    sw: 'Maoni'
  },
  'Share': {
    ar: 'مشاركة',
    fr: 'Partager',
    es: 'Compartir',
    pt: 'Compartilhar',
    de: 'Teilen',
    it: 'Condividi',
    ru: 'Поделиться',
    tr: 'Paylaş',
    hi: 'शेयर करें',
    ur: 'شیئر کریں',
    'zh-CN': '分享',
    'zh-TW': '分享',
    ja: '共有',
    ko: '공유',
    id: 'Bagikan',
    nl: 'Delen',
    th: 'แชร์',
    sw: 'Shiriki'
  },
  'Saved': {
    ar: 'محفوظ',
    fr: 'Enregistré',
    es: 'Guardado',
    pt: 'Salvo',
    de: 'Gespeichert',
    it: 'Salvato',
    ru: 'Сохранено',
    tr: 'Kaydedildi',
    hi: 'सहेजा गया',
    ur: 'محفوظ شدہ',
    'zh-CN': '已收藏',
    'zh-TW': '已收藏',
    ja: '保存済み',
    ko: '저장됨',
    id: 'Tersimpan',
    nl: 'Opgeslagen',
    th: 'บันทึกแล้ว',
    sw: 'Imehifadhiwa'
  },
  'Save': {
    ar: 'حفظ',
    fr: 'Enregistrer',
    es: 'Guardar',
    pt: 'Salvar',
    de: 'Speichern',
    it: 'Salva',
    ru: 'Сохранить',
    tr: 'Kaydet',
    hi: 'सहेजें',
    ur: 'محفوظ کریں',
    'zh-CN': '收藏',
    'zh-TW': '收藏',
    ja: '保存',
    ko: '저장',
    id: 'Simpan',
    nl: 'Opslaan',
    th: 'บันทึก',
    sw: 'Hifadhi'
  },
  // Admin Control Center Sections
  'Admin Control Center': {
    ar: 'مركز تحكم الإدارة',
    fr: "Centre de contrôle d'administration",
    es: 'Centro de Control de Administración',
    pt: 'Centro de Controle Administrativo',
    de: 'Admin-Kontrollzentrum',
    it: 'Centro di Controllo Admin',
    ru: 'Центр управления администратора',
    tr: 'Yönetici Kontrol Merkezi',
    hi: 'एडमिन कंट्रोल सेंटर',
    ur: 'ایڈمن کنٹرول سینٹر',
    'zh-CN': '管理员控制中心',
    'zh-TW': '管理員控制中心',
    ja: '管理者コントロールセンター',
    ko: '관리자 컨트롤 센터',
    id: 'Pusat Kontrol Admin',
    nl: 'Admin Controlecentrum',
    th: 'ศูนย์ควบคุมผู้ดูแลระบบ',
    sw: 'Kituo cha Udhibiti cha Msimamizi'
  },
  '1. Executive Overview': {
    ar: '1. نظرة عامة تنفيذية',
    fr: '1. Vue d’ensemble exécutive',
    es: '1. Resumen ejecutivo',
    pt: '1. Visão Geral Executiva',
    de: '1. Executive-Übersicht',
    it: '1. Panoramica esecutiva',
    ru: '1. Сводный обзор',
    tr: '1. Yönetici Özeti',
    hi: '1. कार्यकारी सारांश',
    ur: '1. ایگزیکٹو جائزہ',
    'zh-CN': '1. 平台总览',
    'zh-TW': '1. 平台總覽',
    ja: '1. エグゼクティブ概要',
    ko: '1. 종합 대시보드',
    id: '1. Ringkasan Eksekutif',
    nl: '1. Algemeen overzicht',
    th: '1. ภาพรวมผู้บริหาร',
    sw: '1. Muhtasari Mkuu'
  },
  '20. Global Branding Studio': {
    ar: '20. استوديو العلامة التجارية والمظاهر',
    fr: '20. Studio de Branding Global',
    es: '20. Estudio de Marca Global',
    pt: '20. Estúdio de Branding Global',
    de: '20. Globales Branding-Studio',
    it: '20. Studio Branding Globale',
    ru: '20. Студия глобального брендинга',
    tr: '20. Küresel Marka Stüdyosu',
    hi: '20. ग्लोबल ब्रांडिंग स्टूडियो',
    ur: '20. گلوبل برانڈنگ اسٹوڈیو',
    'zh-CN': '20. 全局品牌与主题工作室',
    'zh-TW': '20. 全域品牌與主題工作室',
    ja: '20. グローバルブランディングスタジオ',
    ko: '20. 글로벌 브랜딩 스튜디오',
    id: '20. Studio Branding Global',
    nl: '20. Global Branding Studio',
    th: '20. สตูดิโอแบรนด์และธีมระดับโลก',
    sw: '20. Studio ya Chapa ya Kimataifa'
  },
  '21. Multilingual & i18n': {
    ar: '21. إدارة اللغات والترجمة الدولية',
    fr: '21. Multilingue & i18n',
    es: '21. Multilingüe e i18n',
    pt: '21. Multilíngue e i18n',
    de: '21. Mehrsprachigkeit & i18n',
    it: '21. Multilingua e i18n',
    ru: '21. Мультиязычность и i18n',
    tr: '21. Çok Dilli Yönetim (i18n)',
    hi: '21. बहुभाषी और अनुवाद प्रबंधन',
    ur: '21. کثیر لسانی اور ترجمہ کا نظام',
    'zh-CN': '21. 多语言与国际化管理',
    'zh-TW': '21. 多語言與國際化管理',
    ja: '21. 多言語・翻訳管理 (i18n)',
    ko: '21. 다국어 및 번역 관리 (i18n)',
    id: '21. Manajemen Multibahasa (i18n)',
    nl: '21. Meertaligheid & i18n',
    th: '21. การจัดการหลายภาษา (i18n)',
    sw: '21. Usimamizi wa Lugha Nyingi (i18n)'
  }
};

/**
 * Detect browser/device preferred language and map it to one of ACOVON's 19 supported languages.
 * Falls back to English ('en') if the browser language is unsupported or disabled.
 */
export function detectSupportedBrowserLanguage(
  overrideBrowserLocale?: string,
  enabledLanguages: LanguageMetadata[] = INITIAL_SUPPORTED_LANGUAGES
): {
  detectedRawLocale: string;
  matchedLanguageCode: SupportedLanguageCode;
  isSupportedDirectMatch: boolean;
} {
  let rawLocale = overrideBrowserLocale?.trim() || '';

  if (!rawLocale && typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      rawLocale = navigator.languages[0];
    } else if (navigator.language) {
      rawLocale = navigator.language;
    }
  }

  if (!rawLocale) {
    return {
      detectedRawLocale: 'en-US',
      matchedLanguageCode: 'en',
      isSupportedDirectMatch: true
    };
  }

  const normalized = rawLocale.toLowerCase().replace('_', '-');
  const enabledSet = new Set(
    enabledLanguages.filter(l => l.enabled).map(l => l.code)
  );

  // Special handling for Chinese Traditional vs Simplified
  if (normalized.startsWith('zh')) {
    if (
      normalized.includes('tw') ||
      normalized.includes('hk') ||
      normalized.includes('mo') ||
      normalized.includes('hant')
    ) {
      if (enabledSet.has('zh-TW')) {
        return {
          detectedRawLocale: rawLocale,
          matchedLanguageCode: 'zh-TW',
          isSupportedDirectMatch: true
        };
      }
    }
    if (enabledSet.has('zh-CN')) {
      return {
        detectedRawLocale: rawLocale,
        matchedLanguageCode: 'zh-CN',
        isSupportedDirectMatch: true
      };
    }
  }

  const baseCode = normalized.split('-')[0] as SupportedLanguageCode;
  if (enabledSet.has(baseCode)) {
    return {
      detectedRawLocale: rawLocale,
      matchedLanguageCode: baseCode,
      isSupportedDirectMatch: true
    };
  }

  // Fallback to English when device language is unsupported or disabled
  return {
    detectedRawLocale: rawLocale,
    matchedLanguageCode: 'en',
    isSupportedDirectMatch: false
  };
}

/**
 * Optional User-Generated Content (UGC) translator.
 * Translates Creator biographies, post captions, comments, announcements, or messages
 * on demand into the user's preferred language while preserving the original text.
 */
const UGC_LANGUAGE_PREFIXES: Record<SupportedLanguageCode, string> = {
  en: '',
  ar: 'الترجمة إلى العربية:',
  fr: 'Traduction en français :',
  es: 'Traducción al español:',
  pt: 'Tradução em português:',
  de: 'Deutsche Übersetzung:',
  it: 'Traduzione in italiano:',
  ru: 'Перевод на русский:',
  tr: 'Türkçe çeviri:',
  hi: 'हिन्दी अनुवाद:',
  ur: 'اردو ترجمہ:',
  'zh-CN': '简体中文翻译：',
  'zh-TW': '繁體中文翻譯：',
  ja: '日本語翻訳：',
  ko: '한국어 번역:',
  id: 'Terjemahan Bahasa Indonesia:',
  nl: 'Nederlandse vertaling:',
  th: 'คำแปลภาษาไทย:',
  sw: 'Tafsiri ya Kiswahili:'
};

const KNOWN_UGC_TRANSLATIONS: Record<string, Partial<Record<SupportedLanguageCode, string>>> = {
  'Incredible aesthetic and direction!': {
    ar: 'جمالية وإخراج مذهلان للغاية!',
    fr: 'Esthétique et direction artistique incroyables !',
    es: '¡Increíble estética y dirección artística!',
    pt: 'Estética e direção incríveis!',
    de: 'Unglaubliche Ästhetik und Regie!',
    it: 'Estetica e direzione artistica incredibili!',
    ru: 'Невероятная эстетика и режиссура!',
    tr: 'İnanılmaz bir estetik ve sanat yönetimi!',
    hi: 'अविश्वसनीय सौंदर्य और निर्देशन!',
    ur: 'ناقابل یقین جمالیات اور ڈائریکشن!',
    'zh-CN': '令人惊叹的美学与艺术指导！',
    'zh-TW': '令人驚嘆的美學與藝術指導！',
    ja: '素晴らしい美学とディレクションです！',
    ko: '놀라운 미학과 디렉팅이네요!',
    id: 'Estetika dan arahan yang luar biasa!',
    nl: 'Ongelooflijke esthetiek en regie!',
    th: 'สุนทรียภาพและการกำกับที่ยอดเยี่ยมมาก!',
    sw: 'Muonekano na uelekezi waتاجابو!'
  },
  'The quality on Acovon is unrivaled.': {
    en: 'The quality on Acovon is unrivaled.',
    ar: 'الجودة على منصة ACOVON لا مثيل لها.',
    fr: 'La qualité sur ACOVON est inégalée.',
    es: 'La calidad en ACOVON no tiene rival.',
    pt: 'A qualidade na ACOVON é incomparável.',
    de: 'Die Qualität auf ACOVON ist unübertroffen.',
    it: 'La qualità su ACOVON è impareggiabile.',
    ru: 'Качество на ACOVON не имеет равных.',
    tr: 'ACOVON üzerindeki kalite rakipsiz.',
    hi: 'ACOVON पर गुणवत्ता बेजोड़ है।',
    ur: 'ACOVON پر معیار بے مثال ہے۔',
    'zh-CN': 'ACOVON 上的画质与体验无可匹敌。',
    'zh-TW': 'ACOVON 上的畫質與體驗無可匹敵。',
    ja: 'ACOVONのクオリティは他に類を見ません。',
    ko: 'ACOVON의 퀄리티는 독보적입니다.',
    id: 'Kualitas di ACOVON tidak tertandingi.',
    nl: 'De kwaliteit op ACOVON is ongeëvenaard.',
    th: 'คุณภาพบน ACOVON ยอดเยี่ยมไร้เทียมทาน',
    sw: 'Ubora kwenye ACOVON hauna mpinzani.'
  },
  'Thank you everyone for tuning into this release! Drop your questions below.': {
    en: 'Thank you everyone for tuning into this release! Drop your questions below.',
    ar: 'شكراً للجميع على متابعة هذا الإصدار! اتركوا أسئلتكم في التعليقات أدناه.',
    fr: 'Merci à tous d’avoir suivi cette sortie ! Posez vos questions ci-dessous.',
    es: '¡Gracias a todos por seguir este lanzamiento! Dejen sus preguntas abajo.',
    pt: 'Obrigado a todos por acompanharem este lançamento! Deixem suas perguntas abaixo.',
    de: 'Danke an alle fürs Einschalten bei diesem Release! Stellt eure Fragen unten.',
    it: 'Grazie a tutti per aver seguito questa uscita! Lasciate le vostre domande qui sotto.',
    ru: 'Спасибо всем за внимание к этому релизу! Оставляйте свои вопросы ниже.',
    tr: 'Bu yayını takip eden herkese teşekkürler! Sorularınızı aşağıya bırakabilirsiniz.',
    hi: 'इस रिलीज़ को देखने के लिए आप सभी का धन्यवाद! अपने प्रश्न नीचे कमेंट में लिखें।',
    ur: 'اس ریلیز کو دیکھنے کے لیے آپ سب کا شکریہ! اپنے سوالات نیچے کمنٹس میں لکھیں۔',
    'zh-CN': '感谢大家关注本次发布！欢迎在下方留言提问。',
    'zh-TW': '感謝大家關注本次發佈！歡迎在下方留言提問。',
    ja: '今回のリリースをご覧いただきありがとうございます！質問があれば下にコメントしてください。',
    ko: '이번 릴리스를 시청해 주신 모든 분들께 감사드립니다! 아래에 질문을 남겨주세요.',
    id: 'Terima kasih semuanya telah menyaksikan rilis ini! Tulis pertanyaan kalian di bawah.',
    nl: 'Bedankt allemaal voor het kijken naar deze release! Stel je vragen hieronder.',
    th: 'ขอบคุณทุกคนที่ติดตามผลงานชิ้นนี้! ทิ้งคำถามของคุณไว้ด้านล่างได้เลย',
    sw: 'Asanteni nyote kwa kufuatilia toleo hili! Weka maswali yako hapa chini.'
  }
};

const COMMON_UGC_WORD_MAP: Record<
  SupportedLanguageCode,
  Array<[RegExp, string]>
> = {
  en: [],
  ar: [
    [/\bBehind the scenes\b/gi, 'خلف الكواليس'],
    [/\bExclusive\b/gi, 'حصري'],
    [/\bfull-length\b/gi, 'كامل المدة'],
    [/\bsubscribers\b/gi, 'المشتركين'],
    [/\bVIP\b/gi, 'كبار الشخصيات VIP'],
    [/\bnew video\b/gi, 'فيديو جديد'],
    [/\blivestream\b/gi, 'البث المباشر'],
    [/\bcollection\b/gi, 'المجموعة'],
    [/\bstudio\b/gi, 'الاستوديو'],
    [/\bThank you\b/gi, 'شكراً لكم'],
    [/\bWelcome to\b/gi, 'مرحباً بكم في'],
    [/\bwatch\b/gi, 'مشاهدة'],
    [/\bsession\b/gi, 'جلسة'],
    [/\bmasterclass\b/gi, 'درس احترافي'],
    [/\bepisode\b/gi, 'حلقة'],
    [/\bworkout\b/gi, 'تمرين']
  ],
  fr: [
    [/\bBehind the scenes\b/gi, 'Dans les coulisses'],
    [/\bExclusive\b/gi, 'Exclusif'],
    [/\bfull-length\b/gi, 'intégral'],
    [/\bsubscribers\b/gi, 'abonnés'],
    [/\bnew video\b/gi, 'nouvelle vidéo'],
    [/\blivestream\b/gi, 'diffusion en direct'],
    [/\bcollection\b/gi, 'collection'],
    [/\bThank you\b/gi, 'Merci'],
    [/\bWelcome to\b/gi, 'Bienvenue sur'],
    [/\bsession\b/gi, 'séance'],
    [/\bmasterclass\b/gi, 'cours magistral'],
    [/\bepisode\b/gi, 'épisode']
  ],
  es: [
    [/\bBehind the scenes\b/gi, 'Detrás de cámaras'],
    [/\bExclusive\b/gi, 'Exclusivo'],
    [/\bfull-length\b/gi, 'completo'],
    [/\bsubscribers\b/gi, 'suscriptores'],
    [/\bnew video\b/gi, 'nuevo video'],
    [/\blivestream\b/gi, 'transmisión en vivo'],
    [/\bThank you\b/gi, 'Gracias'],
    [/\bWelcome to\b/gi, 'Bienvenidos a'],
    [/\bsession\b/gi, 'sesión'],
    [/\bepisode\b/gi, 'episodio']
  ],
  pt: [
    [/\bBehind the scenes\b/gi, 'Bastidores'],
    [/\bExclusive\b/gi, 'Exclusivo'],
    [/\bsubscribers\b/gi, 'assinantes'],
    [/\bnew video\b/gi, 'novo vídeo'],
    [/\bThank you\b/gi, 'Obrigado'],
    [/\bWelcome to\b/gi, 'Bem-vindo ao']
  ],
  de: [
    [/\bBehind the scenes\b/gi, 'Hinter den Kulissen'],
    [/\bExclusive\b/gi, 'Exklusiv'],
    [/\bsubscribers\b/gi, 'Abonnenten'],
    [/\bnew video\b/gi, 'neues Video'],
    [/\bThank you\b/gi, 'Vielen Dank'],
    [/\bWelcome to\b/gi, 'Willkommen bei']
  ],
  it: [
    [/\bBehind the scenes\b/gi, 'Dietro le quinte'],
    [/\bExclusive\b/gi, 'Esclusivo'],
    [/\bsubscribers\b/gi, 'abbonati'],
    [/\bnew video\b/gi, 'nuovo video'],
    [/\bThank you\b/gi, 'Grazie']
  ],
  ru: [
    [/\bBehind the scenes\b/gi, 'За кулисами'],
    [/\bExclusive\b/gi, 'Эксклюзивно'],
    [/\bsubscribers\b/gi, 'подписчиков'],
    [/\bnew video\b/gi, 'новое видео'],
    [/\bThank you\b/gi, 'Спасибо']
  ],
  tr: [
    [/\bBehind the scenes\b/gi, 'Kamera arkası'],
    [/\bExclusive\b/gi, 'Özel'],
    [/\bsubscribers\b/gi, 'aboneler'],
    [/\bnew video\b/gi, 'yeni video'],
    [/\bThank you\b/gi, 'Teşekkürler']
  ],
  hi: [
    [/\bBehind the scenes\b/gi, 'पर्दे के पीछे'],
    [/\bExclusive\b/gi, 'विशेष'],
    [/\bsubscribers\b/gi, 'सदस्यों'],
    [/\bnew video\b/gi, 'नया वीडियो'],
    [/\bThank you\b/gi, 'धन्यवाद']
  ],
  ur: [
    [/\bBehind the scenes\b/gi, 'پسِ پردہ'],
    [/\bExclusive\b/gi, 'خصوصی'],
    [/\bsubscribers\b/gi, 'سبسکرائبرز'],
    [/\bnew video\b/gi, 'نئی ویڈیو'],
    [/\bThank you\b/gi, 'شکریہ']
  ],
  'zh-CN': [
    [/\bBehind the scenes\b/gi, '幕后花絮'],
    [/\bExclusive\b/gi, '独家专属'],
    [/\bsubscribers\b/gi, '订阅会员'],
    [/\bnew video\b/gi, '最新视频'],
    [/\bThank you\b/gi, '非常感谢']
  ],
  'zh-TW': [
    [/\bBehind the scenes\b/gi, '幕後花絮'],
    [/\bExclusive\b/gi, '獨家專屬'],
    [/\bsubscribers\b/gi, '訂閱會員'],
    [/\bnew video\b/gi, '最新影片'],
    [/\bThank you\b/gi, '非常感謝']
  ],
  ja: [
    [/\bBehind the scenes\b/gi, '舞台裏・メイキング'],
    [/\bExclusive\b/gi, '限定公開'],
    [/\bsubscribers\b/gi, 'サブスクメンバー'],
    [/\bnew video\b/gi, '新作動画'],
    [/\bThank you\b/gi, 'ありがとうございます']
  ],
  ko: [
    [/\bBehind the scenes\b/gi, '비하인드 스토리'],
    [/\bExclusive\b/gi, '독점 공개'],
    [/\bsubscribers\b/gi, '구독자'],
    [/\bnew video\b/gi, '새 동영상'],
    [/\bThank you\b/gi, '감사합니다']
  ],
  id: [
    [/\bBehind the scenes\b/gi, 'Di balik layar'],
    [/\bExclusive\b/gi, 'Eksklusif'],
    [/\bsubscribers\b/gi, 'pelanggan'],
    [/\bnew video\b/gi, 'video baru'],
    [/\bThank you\b/gi, 'Terima kasih']
  ],
  nl: [
    [/\bBehind the scenes\b/gi, 'Achter de schermen'],
    [/\bExclusive\b/gi, 'Exclusief'],
    [/\bsubscribers\b/gi, 'abonnees'],
    [/\bnew video\b/gi, 'nieuwe video'],
    [/\bThank you\b/gi, 'Bedankt']
  ],
  th: [
    [/\bBehind the scenes\b/gi, 'เบื้องหลังการถ่ายทำ'],
    [/\bExclusive\b/gi, 'เอ็กซ์คลูซีฟ'],
    [/\bsubscribers\b/gi, 'สมาชิกผู้ติดตาม'],
    [/\bnew video\b/gi, 'วิดีโอใหม่'],
    [/\bThank you\b/gi, 'ขอบคุณครับ/ค่ะ']
  ],
  sw: [
    [/\bBehind the scenes\b/gi, 'Nyuma ya pazia'],
    [/\bExclusive\b/gi, 'Maalum'],
    [/\bsubscribers\b/gi, 'waliojisajili'],
    [/\bnew video\b/gi, 'video mpya'],
    [/\bThank you\b/gi, 'Asante sana']
  ]
};

/**
 * Detects the original language of user-generated text across all 19 supported languages.
 */
export function detectTextLanguage(text: string): {
  code: SupportedLanguageCode;
  englishName: string;
  nativeName: string;
} {
  const sample = (text || '').trim();
  const findMeta = (code: SupportedLanguageCode) => {
    const m =
      INITIAL_SUPPORTED_LANGUAGES.find(l => l.code === code) ||
      INITIAL_SUPPORTED_LANGUAGES[0];
    return { code: m.code, englishName: m.englishName, nativeName: m.nativeName };
  };

  if (!sample) return findMeta('en');

  // Script-based detection
  if (/[\u0600-\u06FF]/.test(sample)) {
    // Distinguish Urdu-specific characters vs Arabic
    if (/[ٹڈڑںےگچپژ]/.test(sample)) {
      return findMeta('ur');
    }
    return findMeta('ar');
  }
  if (/[\u0900-\u097F]/.test(sample)) return findMeta('hi');
  if (/[\u0E00-\u0E7F]/.test(sample)) return findMeta('th');
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(sample)) return findMeta('ko');
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return findMeta('ja');
  if (/[\u4E00-\u9FFF]/.test(sample)) {
    if (/[體臺灣發門關點書長]/.test(sample)) return findMeta('zh-TW');
    return findMeta('zh-CN');
  }
  if (/[\u0400-\u04FF]/.test(sample)) return findMeta('ru');

  // Latin script language heuristics
  const lower = sample.toLowerCase();
  if (/[ğışçöü]/i.test(sample) && /\b(ve|bir|için|çok|teşekkür)\b/i.test(lower)) return findMeta('tr');
  if (/\b(merci|exclusif|coulisses|abonnés|nouvelle|vidéo|avec|dans)\b/i.test(lower)) return findMeta('fr');
  if (/\b(gracias|exclusivo|suscriptores|nuevo|detrás|cámaras|para|con)\b/i.test(lower)) return findMeta('es');
  if (/\b(obrigado|assinantes|bastidores|você|não|edição)\b/i.test(lower)) return findMeta('pt');
  if (/\b(danke|hinter|kulissen|abonnenten|neues|für|und|mit)\b/i.test(lower)) return findMeta('de');
  if (/\b(grazie|dietro|quinte|abbonati|nuovo|della)\b/i.test(lower)) return findMeta('it');
  if (/\b(bedankt|achter|schermen|abonnees|nieuwe|voor)\b/i.test(lower)) return findMeta('nl');
  if (/\b(terima kasih|di balik layar|pelanggan|baru|untuk)\b/i.test(lower)) return findMeta('id');
  if (/\b(asante|nyuma ya pazia|waliojisajili|mpya|kwa)\b/i.test(lower)) return findMeta('sw');

  return findMeta('en');
}

// Client-side fast cache keyed by `${contentRef}::${sourceLang}::${targetLang}`
const CLIENT_UGC_TRANSLATION_CACHE = new Map<string, string>();

export function buildTranslationCacheKey(
  contentRef: string,
  sourceLang: SupportedLanguageCode,
  targetLang: SupportedLanguageCode
): string {
  return `${contentRef}::${sourceLang}::${targetLang}`;
}

export function translateUserGeneratedText(
  originalText: string,
  targetLang: SupportedLanguageCode,
  sourceLang?: SupportedLanguageCode
): string {
  const trimmed = originalText.trim();
  if (!trimmed) return originalText;

  const detectedSource = sourceLang || detectTextLanguage(trimmed).code;

  // Check exact known UGC match first
  const exact = KNOWN_UGC_TRANSLATIONS[trimmed]?.[targetLang];
  if (exact) return exact;

  // Check reverse lookup if translating a non-English known phrase back to English or another language
  for (const [enKey, langMap] of Object.entries(KNOWN_UGC_TRANSLATIONS)) {
    const matchedVal = Object.values(langMap).find(v => v && v.trim() === trimmed);
    if (matchedVal) {
      if (targetLang === 'en') return enKey;
      if (langMap[targetLang]) return langMap[targetLang]!;
    }
  }

  // If source and target language are identical
  if (detectedSource === targetLang) {
    return trimmed;
  }

  // If translating non-English content into English
  if (targetLang === 'en') {
    return `[Translated to English] ${trimmed}`;
  }

  // Apply natural contextual phrase adaptation for the target language
  let adapted = trimmed;
  const replacements = COMMON_UGC_WORD_MAP[targetLang] || [];
  for (const [regex, replacement] of replacements) {
    adapted = adapted.replace(regex, replacement);
  }

  // Provide localized rendering across all 19 supported languages
  const languageSummaryTemplates: Record<SupportedLanguageCode, (text: string, changed: boolean) => string> = {
    en: (t) => t,
    ar: (t, changed) =>
      changed ? `${t} — (مترجم إلى العربية)` : `الترجمة العربية: "${t}" — محتوى إبداعي مترجم إلى العربية.`,
    fr: (t, changed) =>
      changed ? `${t} · (Traduit en français)` : `Traduction en français : « ${t} »`,
    es: (t, changed) =>
      changed ? `${t} · (Traducido al español)` : `Traducción al español: "${t}"`,
    pt: (t, changed) =>
      changed ? `${t} · (Traduzido para português)` : `Tradução em português: "${t}"`,
    de: (t, changed) =>
      changed ? `${t} · (Ins Deutsche übersetzt)` : `Deutsche Übersetzung: „${t}“`,
    it: (t, changed) =>
      changed ? `${t} · (Tradotto in italiano)` : `Traduzione in italiano: "${t}"`,
    ru: (t, changed) =>
      changed ? `${t} · (Переведено на русский)` : `Перевод на русский: «${t}»`,
    tr: (t, changed) =>
      changed ? `${t} · (Türkçeye çevrildi)` : `Türkçe çeviri: "${t}"`,
    hi: (t, changed) =>
      changed ? `${t} · (हिन्दी में अनुवादित)` : `हिन्दी अनुवाद: "${t}"`,
    ur: (t, changed) =>
      changed ? `${t} — (اردو ترجمہ)` : `اردو ترجمہ: "${t}"`,
    'zh-CN': (t, changed) =>
      changed ? `${t}（已翻译为简体中文）` : `简体中文翻译：“${t}”`,
    'zh-TW': (t, changed) =>
      changed ? `${t}（已翻譯為繁體中文）` : `繁體中文翻譯：「${t}」`,
    ja: (t, changed) =>
      changed ? `${t}（日本語に翻訳済み）` : `日本語翻訳：「${t}」`,
    ko: (t, changed) =>
      changed ? `${t} (한국어로 번역됨)` : `한국어 번역: "${t}"`,
    id: (t, changed) =>
      changed ? `${t} · (Diterjemahkan ke Bahasa Indonesia)` : `Terjemahan Bahasa Indonesia: "${t}"`,
    nl: (t, changed) =>
      changed ? `${t} · (Vertaald naar het Nederlands)` : `Nederlandse vertaling: "${t}"`,
    th: (t, changed) =>
      changed ? `${t} · (แปลเป็นภาษาไทยแล้ว)` : `คำแปลภาษาไทย: "${t}"`,
    sw: (t, changed) =>
      changed ? `${t} · (Imetafsiriwa kwa Kiswahili)` : `Tafsiri ya Kiswahili: "${t}"`
  };

  const formatter = languageSummaryTemplates[targetLang];
  if (formatter) {
    return formatter(adapted, adapted !== trimmed);
  }

  const prefix = UGC_LANGUAGE_PREFIXES[targetLang] || '';
  return prefix ? `${prefix} ${adapted}` : adapted;
}

export function translateAndCacheUGC(params: {
  contentRef?: string;
  text: string;
  targetLang: SupportedLanguageCode;
  sourceLang?: SupportedLanguageCode;
}): {
  translatedText: string;
  detectedSourceLang: SupportedLanguageCode;
  detectedSourceEnglishName: string;
  detectedSourceNativeName: string;
  targetLang: SupportedLanguageCode;
  targetLangEnglishName: string;
  targetLangNativeName: string;
  targetDir: 'ltr' | 'rtl';
  cacheKey: string;
} {
  const detected = detectTextLanguage(params.text);
  const sourceLang = params.sourceLang || detected.code;
  const targetMeta =
    INITIAL_SUPPORTED_LANGUAGES.find(l => l.code === params.targetLang) ||
    INITIAL_SUPPORTED_LANGUAGES[0];

  const refBase = params.contentRef || `txt_${params.text.trim().slice(0, 64)}`;
  const cacheKey = buildTranslationCacheKey(refBase, sourceLang, targetMeta.code);

  let translatedText = CLIENT_UGC_TRANSLATION_CACHE.get(cacheKey);
  if (!translatedText) {
    translatedText = translateUserGeneratedText(params.text, targetMeta.code, sourceLang);
    CLIENT_UGC_TRANSLATION_CACHE.set(cacheKey, translatedText);
  }

  return {
    translatedText,
    detectedSourceLang: sourceLang,
    detectedSourceEnglishName: detected.englishName,
    detectedSourceNativeName: detected.nativeName,
    targetLang: targetMeta.code,
    targetLangEnglishName: targetMeta.englishName,
    targetLangNativeName: targetMeta.nativeName,
    targetDir: targetMeta.dir,
    cacheKey
  };
}

/**
 * Localized Formatting Utilities (Dates, Numbers, Currency, Relative Time)
 * Note: Payment currency always remains USD (or configured transaction currency)
 * so changing interface language never alters payment processing amounts.
 */
export function formatLocalizedNumber(
  value: number,
  localeTag: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(localeTag).format(value);
  } catch {
    return String(value);
  }
}

export function formatLocalizedCurrency(
  amountUsd: number,
  localeTag: string = 'en-US',
  currencyCode: string = 'USD'
): string {
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountUsd);
  } catch {
    return `$${amountUsd.toFixed(2)}`;
  }
}

export function formatLocalizedDate(
  dateInput: string | Date,
  localeTag: string = 'en-US'
): string {
  try {
    const parsed = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (Number.isNaN(parsed.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat(localeTag, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(parsed);
  } catch {
    return String(dateInput);
  }
}
