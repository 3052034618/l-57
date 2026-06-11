export type UserRole = 'enterprise' | 'supplier';

export type TaskStatus = 'pending' | 'draft' | 'submitted' | 'auditing' | 'approved' | 'rejected';

export type ActivityStage = 'material' | 'production' | 'transport';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  company: string;
  avatar?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  contactEmail: string;
  category: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
}

export interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  unit: string;
  value: number;
  source: string;
  year: number;
  isRecommended?: boolean;
}

export interface ActivityData {
  id: string;
  stage: ActivityStage;
  name: string;
  description?: string;
  quantity: number | null;
  unit: string;
  factorId: string | null;
  emission: number | null;
  remark?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadTime: string;
  url?: string;
}

export interface TaskVersion {
  version: number;
  submitTime: string;
  submitter: string;
  comment?: string;
  data: ActivityData[];
  attachments: Attachment[];
}

export interface AuditComment {
  id: string;
  taskId: string;
  version: number;
  author: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  references?: string[];
}

export interface Task {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  supplierId: string;
  supplierName: string;
  templateId: string;
  status: TaskStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
  versions: TaskVersion[];
  comments: AuditComment[];
  anomalies: string[];
}

export interface Reminder {
  id: string;
  taskId: string;
  sender: string;
  receiver: string;
  content: string;
  sendTime: string;
  isRead: boolean;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  productCode: string;
  totalEmission: number;
  materialEmission: number;
  productionEmission: number;
  transportEmission: number;
  supplierBreakdown: { supplierId: string; supplierName: string; emission: number }[];
  lastUpdated: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  missingFields: string[];
}

export interface TaskFilter {
  status?: TaskStatus;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportRecord {
  id: string;
  exportTime: string;
  fileType: 'pdf' | 'excel';
  fileName: string;
  fileSize: number;
  filters: {
    selectedProduct: string;
    selectedProductLabel: string;
    selectedSuppliers: string[];
    selectedSuppliersLabels: string[];
    dateFrom: string;
    dateTo: string;
  };
  summaryCount: number;
}
