// src/ui/screens/UserCommissionsScreen.tsx
import React, { useState } from 'react';
import { useUserCommissionViewModel } from '../../viewmodels/useUserCommissionViewModel';
import type { User, UserCommissionSettings } from '../../core/domain/User';
import { Toast } from '../components/Toast';
import { Save, User as UserIcon, Percent, Settings2 } from 'lucide-react';

export const UserCommissionsScreen: React.FC = () => {
  const { users, isLoading, updateCommission } = useUserCommissionViewModel();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<UserCommissionSettings | null>(null);

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleUserSelect = (user: User) => {
    setSelectedUserId(user.id);
    setLocalSettings(user.commissionSettings || {
      rentalEnabled: true,
      rentalPercentage: user.commissionPercentage || 0,
      rentalBase: 'NET',
      productEnabled: false,
      productPercentage: 0,
      productBase: 'NET'
    });
  };

  const handleSave = async () => {
    if (!selectedUserId || !localSettings) return;
    try {
      await updateCommission(selectedUserId, localSettings);
      setToastMessage('Configurações de comissão atualizadas!');
    } catch (err) {
      setToastMessage('Erro ao atualizar configurações.');
    }
  };

  if (isLoading) return <div className="p-8">Carregando usuários...</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-blue-600" />
            Configurações de Comissão por Usuário
          </h1>
          <p className="text-gray-600 mt-2">Defina regras personalizadas de comissão para cada membro da equipe.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700">Equipe</div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedUserId === user.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500 uppercase">{user.role}</div>
                  </div>
                </button>
              ))}
              {users.length === 0 && <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>}
            </div>
          </div>

          {/* Commission Settings Form */}
          <div className="lg:col-span-2">
            {selectedUser && localSettings ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-500">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-shadow shadow-sm font-medium"
                  >
                    <Save size={18} />
                    Salvar Alterações
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Rental Commission */}
                  <section className="p-6 rounded-xl border border-blue-100 bg-blue-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                          <Percent size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Comissão sobre o Passeio (Barco)</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.rentalEnabled}
                          onChange={e => setLocalSettings({ ...localSettings, rentalEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">{localSettings.rentalEnabled ? 'Ativado' : 'Desativado'}</span>
                      </label>
                    </div>

                    {localSettings.rentalEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Porcentagem (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={localSettings.rentalPercentage}
                              onChange={e => setLocalSettings({ ...localSettings, rentalPercentage: parseFloat(e.target.value) || 0 })}
                              className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              min="0"
                              max="100"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Base de Cálculo</label>
                          <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-lg border border-gray-300">
                            <button
                              onClick={() => setLocalSettings({ ...localSettings, rentalBase: 'GROSS' })}
                              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${localSettings.rentalBase === 'GROSS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              Bruto
                            </button>
                            <button
                              onClick={() => setLocalSettings({ ...localSettings, rentalBase: 'NET' })}
                              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${localSettings.rentalBase === 'NET' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              Líquido
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            {localSettings.rentalBase === 'GROSS'
                              ? '* Calculado sobre o valor total do aluguel antes dos descontos.'
                              : '* Calculado sobre o valor do aluguel após descontos proporcionais.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Product Commission */}
                  <section className="p-6 rounded-xl border border-purple-100 bg-purple-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg text-white">
                          <Percent size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Comissão sobre Produtos (Extras)</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.productEnabled}
                          onChange={e => setLocalSettings({ ...localSettings, productEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">{localSettings.productEnabled ? 'Ativado' : 'Desativado'}</span>
                      </label>
                    </div>

                    {localSettings.productEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Porcentagem (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={localSettings.productPercentage}
                              onChange={e => setLocalSettings({ ...localSettings, productPercentage: parseFloat(e.target.value) || 0 })}
                              className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                              min="0"
                              max="100"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Base de Cálculo</label>
                          <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-lg border border-gray-300">
                            <button
                              onClick={() => setLocalSettings({ ...localSettings, productBase: 'GROSS' })}
                              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${localSettings.productBase === 'GROSS' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              Bruto
                            </button>
                            <button
                              onClick={() => setLocalSettings({ ...localSettings, productBase: 'NET' })}
                              className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${localSettings.productBase === 'NET' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                              Líquido
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            {localSettings.productBase === 'GROSS'
                              ? '* Calculado sobre o valor total dos produtos antes dos descontos.'
                              : '* Calculado sobre o valor dos produtos após descontos proporcionais.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <UserIcon size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione um membro da equipe</h3>
                <p className="text-gray-500">Escolha alguém da lista à esquerda para configurar suas regras de comissão.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
