import type { User } from '../../core/domain/User';
import { boardingLocationRepository } from '../../core/repositories/BoardingLocationRepository';
import { boatRepository } from '../../core/repositories/BoatRepository';
import { clientRepository } from '../../core/repositories/ClientRepository';
import { CompanyDataRepository } from '../../core/repositories/CompanyDataRepository';
import { eventRepository } from '../../core/repositories/EventRepository';
import { expenseCategoryRepository } from '../../core/repositories/ExpenseCategoryRepository';
import { expenseRepository } from '../../core/repositories/ExpenseRepository';
import { incomeRepository } from '../../core/repositories/IncomeRepository';
import { paymentRepository } from '../../core/repositories/PaymentRepository';
import { productRepository } from '../../core/repositories/ProductRepository';
import { tourTypeRepository } from '../../core/repositories/TourTypeRepository';
import { VoucherAppearanceRepository } from '../../core/repositories/VoucherAppearanceRepository';
import { VoucherTermsRepository } from '../../core/repositories/VoucherTermsRepository';

export const disposeRepositories = () => {
  productRepository.dispose();
  boatRepository.dispose();
  boardingLocationRepository.dispose();
  clientRepository.dispose();
  eventRepository.dispose();
  expenseCategoryRepository.dispose();
  expenseRepository.dispose();
  incomeRepository.dispose();
  paymentRepository.dispose();
  tourTypeRepository.dispose();
  VoucherAppearanceRepository.getInstance().dispose();
  VoucherTermsRepository.getInstance().dispose();
  CompanyDataRepository.getInstance().dispose();
};

export const initializeRepositories = (user: User) => {
  productRepository.initialize(user);
  boatRepository.initialize(user);
  boardingLocationRepository.initialize(user);
  clientRepository.initialize(user);
  eventRepository.initialize(user);
  expenseCategoryRepository.initialize(user);
  expenseRepository.initialize(user);
  incomeRepository.initialize(user);
  paymentRepository.initialize();
  tourTypeRepository.initialize(user);
  VoucherAppearanceRepository.getInstance().initialize(user);
  VoucherTermsRepository.getInstance().initialize(user);
  CompanyDataRepository.getInstance().initialize(user);
};
