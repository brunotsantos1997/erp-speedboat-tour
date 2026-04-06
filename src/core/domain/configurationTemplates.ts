import type { BusinessHours, CompanyData, DayOfWeek, VoucherTerms } from './types';

const buildDefaultBusinessHours = (): BusinessHours => {
  const days: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ];

  return days.reduce<BusinessHours>((acc, day) => {
    acc[day] = {
      startTime: '08:00',
      endTime: '18:00',
      isClosed: day === 'sunday' || day === 'saturday'
    };
    return acc;
  }, {} as BusinessHours);
};

export const createCompanyDataDraft = (id = 'default'): CompanyData => ({
  id,
  cnpj: '',
  phone: '',
  appName: '',
  reservationFeePercentage: 30,
  businessHours: buildDefaultBusinessHours(),
  commissionBasis: 'RENTAL_ONLY'
});

export const DEFAULT_VOUCHER_TERMS_TEMPLATE = `
  <h2>Termos e Condicoes</h2>
  <p><strong>1. Cancelamento e reembolso:</strong> defina aqui a politica real da empresa.</p>
  <p><strong>2. Condicoes climaticas:</strong> explique quando o passeio pode ser remarcado.</p>
  <p><strong>3. Embarque:</strong> informe horario de chegada, tolerancia e orientacoes gerais.</p>
  <p><strong>4. Responsabilidades:</strong> registre regras de uso, seguranca e comportamento.</p>
`.trim();

export const createVoucherTermsDraft = (id = 'default'): VoucherTerms => ({
  id,
  terms: DEFAULT_VOUCHER_TERMS_TEMPLATE
});
