// src/viewmodels/useVoucherViewModel.ts
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { EventType, CompanyData, VoucherTerms, Payment } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { useModal } from '../ui/contexts/modal/useModal';

interface VoucherDetails extends EventType {
  reservationFee: number;
  remainingReservationFee: number;
  remainingBalance: number;
  durationHours: number;
  totalPaid: number;
  isFullyPaid: boolean;
}

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
      setError('ID do evento não fornecido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const companyRepo = CompanyDataRepository.getInstance();
    const termsRepo = VoucherTermsRepository.getInstance();
    const appearanceRepo = VoucherAppearanceRepository.getInstance();

    // Public voucher should work without authentication - repositories handle their own initialization
    const unsubs: (() => void)[] = [];

    unsubs.push(companyRepo.subscribe((data) => {
      if (data) setCompanyData(data);
    }));

    unsubs.push(termsRepo.subscribe((data) => {
      if (data) setVoucherTerms(data);
    }));

    unsubs.push(appearanceRepo.subscribe((data) => {
      if (data) {
        // Use imageUrl if available, fallback to base64 during migration
        setWatermark(data.watermarkImageUrl || data.watermarkImageBase64 || null);
      }
    }));

    let currentEvent: EventType | undefined;
    let currentPayments: Payment[] = [];

    const updateVoucherState = () => {
      if (!currentEvent) return;

      const totalPaid = currentPayments.reduce((acc, p) => acc + p.amount, 0);
      const reservationFeePercentage = companyData?.reservationFeePercentage || 30;
      const reservationFee = currentEvent.total * (reservationFeePercentage / 100);

      const displaySignal = Math.max(reservationFee, totalPaid);
      const remainingReservationFee = Math.max(0, reservationFee - totalPaid);
      const remainingBalance = Math.max(0, currentEvent.total - totalPaid);

      const parseTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
      };
      const durationHours = parseTime(currentEvent.endTime) - parseTime(currentEvent.startTime);

      setVoucher({
        ...currentEvent,
        client: {
          ...currentEvent.client,
          name: overrideName || currentEvent.client.name
        },
        reservationFee: displaySignal,
        remainingReservationFee,
        remainingBalance,
        durationHours,
        totalPaid,
        isFullyPaid: totalPaid >= currentEvent.total
      });

      if (overrideName || currentEvent.client?.name) {
        document.title = `Voucher - ${overrideName || currentEvent.client.name}`;
      }
      setIsLoading(false);
    };

    unsubs.push(eventRepository.subscribeToId(eventId, (event) => {
      if (event) {
        currentEvent = event;
        updateVoucherState();
      } else {
        setError('Evento não encontrado.');
        setIsLoading(false);
      }
    }));

    unsubs.push(paymentRepository.subscribeToEventPayments(eventId, (payments) => {
      currentPayments = payments;
      updateVoucherState();
    }));

    return () => unsubs.forEach(fn => fn());
  }, [eventId, companyData?.reservationFeePercentage, overrideName]);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('voucher-content');
    const button = document.getElementById('download-pdf-button') as HTMLButtonElement;
    if (!element || !voucher) return;

    // Disable button and show loading state
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.innerHTML = '<span class="animate-spin">⏳</span> Gerando PDF...';
    }

    try {
      // Dynamic import to avoid loading the heavy PDF library until needed
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0.5,
        filename: `voucher-${voucher.client.name.replace(/\s+/g, '-')}-${voucher.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false, // Reduce console noise
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' as const,
          compress: true // Reduce file size
        }
      };

      // Show progress feedback
      console.log('Iniciando geração do PDF...');
      
      await html2pdf()
        .from(element)
        .set(opt)
        .save();
      
      console.log('PDF gerado com sucesso');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      
      // More descriptive error message
      const errorMessage = err instanceof Error 
        ? `Ocorreu um erro ao gerar o PDF: ${err.message}` 
        : 'Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.';
      
      await showAlert('Erro no PDF', errorMessage);
    } finally {
      // Restore button state
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
    handleDownloadPdf,
  };
};
