import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { CompanyData, EventType, Payment, VoucherTerms } from '../core/domain/types';
import { PublicVoucherRepository } from '../core/repositories/PublicVoucherRepository';
import { useModal } from '../ui/contexts/modal/useModal';

interface VoucherDetails extends EventType {
  reservationFee: number;
  remainingReservationFee: number;
  remainingBalance: number;
  durationHours: number;
  totalPaid: number;
  isFullyPaid: boolean;
}

const buildVoucherState = (
  currentEvent: EventType,
  currentPayments: Payment[],
  reservationFeePercentage: number,
  overrideName: string | null
): VoucherDetails => {
  const totalPaid = currentPayments.reduce((acc, payment) => acc + payment.amount, 0);
  const reservationFee = currentEvent.total * (reservationFeePercentage / 100);
  const displaySignal = Math.max(reservationFee, totalPaid);
  const remainingReservationFee = Math.max(0, reservationFee - totalPaid);
  const remainingBalance = Math.max(0, currentEvent.total - totalPaid);
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  return {
    ...currentEvent,
    client: {
      ...currentEvent.client,
      name: overrideName || currentEvent.client.name
    },
    reservationFee: displaySignal,
    remainingReservationFee,
    remainingBalance,
    durationHours: parseTime(currentEvent.endTime) - parseTime(currentEvent.startTime),
    totalPaid,
    isFullyPaid: totalPaid >= currentEvent.total
  };
};

export const useVoucherViewModel = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const { showAlert } = useModal();
  const overrideName = searchParams.get('name');
  const [voucher, setVoucher] = useState<VoucherDetails | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [voucherTerms, setVoucherTerms] = useState<VoucherTerms | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('ID do evento nao fornecido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const repository = PublicVoucherRepository.getInstance();

    repository.getByEventId(eventId)
      .then((snapshot) => {
        if (!snapshot) {
          setError('Voucher publico nao encontrado.');
          setIsLoading(false);
        }
      })
      .catch(() => {
        setError('Falha ao carregar voucher publico.');
        setIsLoading(false);
      });

    const unsubscribe = repository.subscribeToEvent(eventId, (snapshot) => {
      if (!snapshot) {
        setError('Voucher publico nao encontrado.');
        setIsLoading(false);
        return;
      }

      setCompanyData(snapshot.companyData as CompanyData | null);
      setVoucherTerms(snapshot.voucherTerms);
      setWatermark(snapshot.watermarkImageUrl);
      setVoucher(buildVoucherState(
        snapshot.event,
        snapshot.payments,
        snapshot.companyData?.reservationFeePercentage || 30,
        overrideName
      ));

      if (!snapshot.companyData || !snapshot.voucherTerms) {
        setError('A configuracao publica do voucher ainda nao foi concluida.');
      } else {
        setError(null);
      }

      document.title = `Voucher - ${overrideName || snapshot.event.client.name}`;
      setIsLoading(false);
    });

    return unsubscribe;
  }, [eventId, overrideName]);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('voucher-content');
    const button = document.getElementById('download-pdf-button') as HTMLButtonElement;
    if (!element || !voucher) return;

    if (button) {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.innerHTML = '<span class="animate-spin">...</span> Gerando PDF...';
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0.5,
        filename: `voucher-${voucher.client.name.replace(/\s+/g, '-')}-${voucher.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: {
          unit: 'in',
          format: 'letter',
          orientation: 'portrait' as const,
          compress: true
        }
      };

      await html2pdf()
        .from(element)
        .set(opt)
        .save();
    } catch (downloadError) {
      const errorMessage = downloadError instanceof Error
        ? `Ocorreu um erro ao gerar o PDF: ${downloadError.message}`
        : 'Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.';

      await showAlert('Erro no PDF', errorMessage);
    } finally {
      if (button) {
        button.disabled = false;
        button.style.opacity = '1';
        button.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="hidden sm:inline">Baixar PDF</span>
        `;
      }
    }
  };

  return {
    voucher,
    companyData,
    voucherTerms,
    watermark,
    isLoading,
    error,
    handleDownloadPdf
  };
};
