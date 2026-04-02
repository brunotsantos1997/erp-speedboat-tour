import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (ES)', flag: '🇪🇸' }
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
  };

  return (
    <div className="space-y-3">
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleLanguageChange(language.code)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors ${
            i18n.language === language.code
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <span className="text-2xl">{language.flag}</span>
          <div className="text-left">
            <div className="font-medium">{language.name}</div>
            <div className="text-sm text-gray-500">{language.code}</div>
          </div>
          {i18n.language === language.code && (
            <div className="ml-auto">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
