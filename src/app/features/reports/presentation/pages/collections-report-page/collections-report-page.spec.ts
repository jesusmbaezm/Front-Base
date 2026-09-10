import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';

import { CustomerLookupItem } from '@app/core/models/customer.models';
import { BranchesApiService } from '@app/core/security/branches-api.service';
import { CustomerLookupService } from '@app/core/security/customer-lookup.service';
import { ReportsApiService } from '@app/core/security/reports-api.service';
import { ToastService } from '@app/shared/services/toast.service';

import { CollectionsReportPage } from './collections-report-page';

describe('CollectionsReportPage', () => {
  let fixture: ComponentFixture<CollectionsReportPage>;
  let component: CollectionsReportPage;
  let reportsApi: jasmine.SpyObj<ReportsApiService>;
  let toast: jasmine.SpyObj<ToastService>;

  const customerLookupItem: CustomerLookupItem = {
    id: 16,
    name: 'Jesus Baez',
    contactName: 'Jesus',
    rfc: 'XAXX010101000',
    displayText: 'Jesus Baez',
    creditLimit: 5000,
    usedCredit: 1801.97,
    availableCredit: 3198.03,
    hasOverduePayments: true,
    defaultPaymentPlanId: 1,
  };

  const reportResponse = {
    message: '',
    data: {
      customers: [
        {
          customerId: 16,
          customerKey: '0015',
          customerName: 'Jesus Baez',
          totalAmount: 2801.97,
          totalBalance: 1801.97,
          totalPaid: 1000,
          schedules: [
            {
              paymentScheduleId: 170,
              remissionId: 67,
              remissionFolio: 'R-260501-0015-01',
              remissionDate: '2026-05-01T06:02:46.287188+00:00',
              installmentNumber: 3,
              dueDate: '2026-05-02T06:02:45.016118+00:00',
              overdueDays: 5,
              amount: 2801.97,
              balance: 1801.97,
              paidAmount: 1000,
            },
          ],
        },
      ],
      totals: {
        totalAmount: 2801.97,
        totalBalance: 1801.97,
        totalPaid: 1000,
      },
    },
    errors: [],
  };

  beforeEach(async () => {
    reportsApi = jasmine.createSpyObj<ReportsApiService>('ReportsApiService', [
      'getCollectionsReport',
      'exportCollectionsReportPdf',
    ]);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['error']);

    reportsApi.getCollectionsReport.and.returnValue(of(reportResponse));
    reportsApi.exportCollectionsReportPdf.and.returnValue(
      of(new Blob(['pdf'], { type: 'application/pdf' })),
    );

    await TestBed.configureTestingModule({
      imports: [CollectionsReportPage, NoopAnimationsModule],
      providers: [
        { provide: ReportsApiService, useValue: reportsApi },
        { provide: ToastService, useValue: toast },
        {
          provide: BranchesApiService,
          useValue: {
            getUserBranches: () => of({ data: [], errors: [], message: '' }),
          },
        },
        {
          provide: CustomerLookupService,
          useValue: {
            lookup: () => of({ data: [], errors: [], message: '' }),
            getProfile: () => of({ data: null, errors: [], message: '' }),
          },
        },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CollectionsReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the report on init without filters', () => {
    createComponent();

    expect(component).toBeTruthy();
    expect(reportsApi.getCollectionsReport).toHaveBeenCalledWith({});
  });

  it('renders totals, customer data and schedule rows', () => {
    createComponent();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Reporte de Cobranza');
    expect(text).toContain('Jesus Baez');
    expect(text).toContain('0015');
    expect(text).toContain('R-260501-0015-01');
    expect(text).toContain('Monto total');
    expect(text).toContain('Saldo pendiente');
    expect(text).toContain('Pagado');
  });

  it('refreshes with the active filters when searching', () => {
    createComponent();

    component.selectedBranchId.set(7);
    component.selectedCustomer.set(customerLookupItem);
    component.onSearch();

    expect(reportsApi.getCollectionsReport).toHaveBeenCalledWith({
      branchId: 7,
      customerId: 16,
    });
  });

  it('clears filters and reloads without filters', () => {
    createComponent();

    component.selectedBranchId.set(7);
    component.selectedCustomer.set(customerLookupItem);

    component.onClearFilters();

    expect(component.selectedBranchId()).toBeNull();
    expect(component.selectedCustomer()).toBeNull();
    expect(reportsApi.getCollectionsReport).toHaveBeenCalledWith({});
  });

  it('exports the pdf with the current filters', () => {
    createComponent();
    component.selectedBranchId.set(4);
    component.selectedCustomer.set(customerLookupItem);

    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    const openSpy = spyOn(window, 'open');

    component.onExportPdf();

    expect(reportsApi.exportCollectionsReportPdf).toHaveBeenCalledWith({
      branchId: 4,
      customerId: 16,
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith('blob:test', '_blank');
  });

  it('shows an empty state when the report has no customers', () => {
    reportsApi.getCollectionsReport.and.returnValue(
      of({
        message: '',
        data: {
          customers: [],
          totals: {
            totalAmount: 0,
            totalBalance: 0,
            totalPaid: 0,
          },
        },
        errors: [],
      }),
    );

    createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'Sin resultados para los filtros actuales',
    );
  });

  it('shows an inline error state when loading fails', () => {
    reportsApi.getCollectionsReport.and.returnValue(
      throwError(() => new Error('load failed')),
    );

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el reporte');
  });

  it('shows loading state while the report request is pending', () => {
    const subject = new Subject<typeof reportResponse>();
    reportsApi.getCollectionsReport.and.returnValue(subject.asObservable());

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Consultando cartera...');

    subject.next(reportResponse);
    subject.complete();
  });

  it('shows a toast when the pdf export fails', () => {
    reportsApi.exportCollectionsReportPdf.and.returnValue(
      throwError(() => new Error('pdf failed')),
    );

    createComponent();
    component.onExportPdf();

    expect(toast.error).toHaveBeenCalledWith(
      'No fue posible exportar el PDF del reporte.',
      'Error',
    );
  });
});
