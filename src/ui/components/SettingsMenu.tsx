import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, X, Palette, Bell, Shield, Database } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('language');

  const tabs = [
    { id: 'language', label: t('settings.language', 'Idioma'), icon: Globe },
    { id: 'appearance', label: t('settings.appearance', 'Aparência'), icon: Palette },
    { id: 'notifications', label: t('settings.notifications', 'Notificações'), icon: Bell },
    { id: 'security', label: t('settings.security', 'Segurança'), icon: Shield },
    { id: 'integrations', label: t('settings.integrations', 'Integrações'), icon: Database },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-800">{t('settings.title', 'Configurações')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'language' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('settings.language', 'Idioma')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.selectLanguage', 'Selecione o idioma')}
                    </label>
                    <LanguageSelector />
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {t('settings.languageNote', 'A alteração do idioma será aplicada imediatamente em toda a aplicação.')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('settings.appearance', 'Aparência')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.theme', 'Tema')}
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="light">{t('settings.lightTheme', 'Claro')}</option>
                      <option value="dark">{t('settings.darkTheme', 'Escuro')}</option>
                      <option value="auto">{t('settings.autoTheme', 'Automático')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('settings.notifications', 'Notificações')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {t('settings.emailNotifications', 'Notificações por email')}
                    </label>
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {t('settings.pushNotifications', 'Notificações push')}
                    </label>
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('settings.security', 'Segurança')}
                </h3>
                <div className="space-y-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    {t('settings.changePassword', 'Alterar Senha')}
                  </button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                    {t('settings.twoFactorAuth', 'Autenticação de Dois Fatores')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('settings.integrations', 'Integrações')}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Google Calendar</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('settings.googleCalendarDesc', 'Sincronize seus eventos com o Google Calendar')}
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      {t('settings.connectGoogle', 'Conectar com Google')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
