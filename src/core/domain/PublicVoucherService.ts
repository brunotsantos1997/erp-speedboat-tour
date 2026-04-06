import type { EventType } from './types';
import { logger } from '../common/Logger';
import { CompanyDataRepository } from '../repositories/CompanyDataRepository';
import { eventRepository } from '../repositories/EventRepository';
import { paymentRepository } from '../repositories/PaymentRepository';
import { PublicVoucherRepository } from '../repositories/PublicVoucherRepository';
import { VoucherAppearanceRepository } from '../repositories/VoucherAppearanceRepository';
import { VoucherTermsRepository } from '../repositories/VoucherTermsRepository';

const sanitizeEventForPublicVoucher = (event: EventType): EventType => {
  const {
    createdByUserId: _createdByUserId,
    googleCalendarEventIds: _googleCalendarEventIds,
    rentalCost: _rentalCost,
    productsCost: _productsCost,
    taxCost: _taxCost,
    additionalCosts: _additionalCosts,
    payments: _payments,
    autoCancelled: _autoCancelled,
    ...safeEvent
  } = event;

  return {
    ...safeEvent,
    client: {
      ...safeEvent.client,
      phone: '',
      totalTrips: 0
    },
    products: safeEvent.products.map(({ snapshotCost: _snapshotCost, ...product }) => product)
  };
};

export class PublicVoucherService {
  static async syncForEvent(eventId: string): Promise<void> {
    const event = await eventRepository.getById(eventId);
    if (!event) {
      await PublicVoucherRepository.getInstance().remove(eventId);
      return;
    }

    const [companyData, voucherTerms, appearanceData, payments] = await Promise.all([
      CompanyDataRepository.getInstance().get(),
      VoucherTermsRepository.getInstance().get(),
      VoucherAppearanceRepository.getInstance().get(),
      paymentRepository.getByEventId(eventId)
    ]);

    await PublicVoucherRepository.getInstance().upsert({
      id: eventId,
      event: sanitizeEventForPublicVoucher(event),
      companyData: companyData
        ? {
            id: companyData.id,
            appName: companyData.appName,
            cnpj: companyData.cnpj,
            phone: companyData.phone,
            reservationFeePercentage: companyData.reservationFeePercentage
          }
        : null,
      voucherTerms,
      watermarkImageUrl: appearanceData?.watermarkImageUrl || appearanceData?.watermarkImageBase64 || null,
      payments,
      updatedAt: Date.now()
    });
  }

  static async removeForEvent(eventId: string): Promise<void> {
    try {
      await PublicVoucherRepository.getInstance().remove(eventId);
    } catch (error) {
      logger.error('Failed to remove public voucher snapshot', error as Error, { eventId });
    }
  }
}
