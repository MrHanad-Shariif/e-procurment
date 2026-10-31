import { UnifiedPublic, UnifiedShell, UnifiedOverview } from '@/shared/layout/UnifiedLayout';
import TenderHome from '@/features/portal/pages/HomePage';
import TenderLogin from '@/features/identity/pages/PortalLogin';
import PublicTenders from '@/features/portal/pages/PublicTenders';
import PublicTenderDetail from '@/features/portal/pages/PublicTenderDetail';
import TenderList from '@/features/tendering/pages/TendersList';
import TenderDetail from '@/features/tendering/pages/TenderDetails';
import CreateTender from '@/features/tendering/pages/CreateTender';
import SupplierSubmission from '@/features/tendering/pages/SupplierSubmission';
import SupplierDashboard from '@/features/supplier-portal/pages/SupplierDashboard';
import SupplierProfile from '@/features/supplier-portal/pages/SupplierProfile';
import Rankings from '@/features/tendering/pages/Rankings';
import ProposalDetails from '@/features/tendering/pages/ProposalDetails';
import ApprovalQueue from '@/features/tendering/pages/ApprovalQueue';
import Contact from '@/features/portal/pages/ContactPage';
import Apply from '@/features/portal/pages/Apply';
import InquiryQueue from '@/features/administration/communications/pages/InquiryQueue';
import Messages from '@/features/administration/communications/pages/Messages';
import AdminProfile from '@/features/supplier-portal/pages/AdminProfile';
import ChangePassword from '@/features/identity/pages/ChangePassword';
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/app/providers/AuthContext";
import { TenantProvider } from "@/app/providers/TenantContext";
import { RootLayout } from "@/shared/layout/RootLayout";
import { ProtectedRoute } from "@/features/identity/components/ProtectedRoute";

const SignupPage = lazy(() =>
  import("@/features/identity/pages/SignupPage").then((module) => ({ default: module.SignupPage }))
);
const NotFoundPage = lazy(() =>
  import("@/app/pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage }))
);
const OrgSettingsPage = lazy(() =>
  import("@/features/administration/settings/pages/OrgSettingsPage").then((module) => ({ default: module.OrgSettingsPage }))
);
const SmtpSettingsPage = lazy(() =>
  import("@/features/administration/settings/pages/SmtpSettingsPage").then((module) => ({
    default: module.SmtpSettingsPage,
  }))
);
const UserListPage = lazy(() =>
  import("@/features/administration/users/pages/UserListPage").then((module) => ({ default: module.UserListPage }))
);
const UserDetailPage = lazy(() =>
  import("@/features/administration/users/pages/UserDetailPage").then((module) => ({ default: module.UserDetailPage }))
);
const RoleListPage = lazy(() =>
  import("@/features/administration/roles/pages/RoleListPage").then((module) => ({ default: module.RoleListPage }))
);
const RoleDetailPage = lazy(() =>
  import("@/features/administration/roles/pages/RoleDetailPage").then((module) => ({ default: module.RoleDetailPage }))
);
const SupplierListPage = lazy(() =>
  import("@/features/sourcing/suppliers/pages/SupplierListPage").then((module) => ({
    default: module.SupplierListPage,
  }))
);
const SupplierDetailPage = lazy(() =>
  import("@/features/sourcing/suppliers/pages/SupplierDetailPage").then((module) => ({
    default: module.SupplierDetailPage,
  }))
);
const SupplierCreatePage = lazy(() =>
  import("@/features/sourcing/suppliers/pages/SupplierCreatePage").then((module) => ({
    default: module.SupplierCreatePage,
  }))
);
const PrListPage = lazy(() =>
  import("@/features/procurement/purchase-requisitions/pages/PrListPage").then((module) => ({
    default: module.PrListPage,
  }))
);
const PrDetailPage = lazy(() =>
  import("@/features/procurement/purchase-requisitions/pages/PrDetailPage").then((module) => ({
    default: module.PrDetailPage,
  }))
);
const PrCreatePage = lazy(() =>
  import("@/features/procurement/purchase-requisitions/pages/PrCreatePage").then((module) => ({
    default: module.PrCreatePage,
  }))
);
const RfqListPage = lazy(() =>
  import("@/features/sourcing/rfq/pages/RfqListPage").then((module) => ({ default: module.RfqListPage }))
);
const RfqDetailPage = lazy(() =>
  import("@/features/sourcing/rfq/pages/RfqDetailPage").then((module) => ({ default: module.RfqDetailPage }))
);
const RfqCreatePage = lazy(() =>
  import("@/features/sourcing/rfq/pages/RfqCreatePage").then((module) => ({ default: module.RfqCreatePage }))
);
const PoListPage = lazy(() =>
  import("@/features/procurement/purchase-orders/pages/PoListPage").then((module) => ({ default: module.PoListPage }))
);
const PoDetailPage = lazy(() =>
  import("@/features/procurement/purchase-orders/pages/PoDetailPage").then((module) => ({
    default: module.PoDetailPage,
  }))
);
const PoCreatePage = lazy(() =>
  import("@/features/procurement/purchase-orders/pages/PoCreatePage").then((module) => ({
    default: module.PoCreatePage,
  }))
);
const GrListPage = lazy(() =>
  import("@/features/procurement/goods-receipts/pages/GrListPage").then((module) => ({ default: module.GrListPage }))
);
const GrDetailPage = lazy(() =>
  import("@/features/procurement/goods-receipts/pages/GrDetailPage").then((module) => ({
    default: module.GrDetailPage,
  }))
);
const GrCreatePage = lazy(() =>
  import("@/features/procurement/goods-receipts/pages/GrCreatePage").then((module) => ({
    default: module.GrCreatePage,
  }))
);
const InvoiceListPage = lazy(() =>
  import("@/features/procurement/invoices/pages/InvoiceListPage").then((module) => ({ default: module.InvoiceListPage }))
);
const InvoiceDetailPage = lazy(() =>
  import("@/features/procurement/invoices/pages/InvoiceDetailPage").then((module) => ({
    default: module.InvoiceDetailPage,
  }))
);
const InvoiceCreatePage = lazy(() =>
  import("@/features/procurement/invoices/pages/InvoiceCreatePage").then((module) => ({
    default: module.InvoiceCreatePage,
  }))
);

const BudgetListPage = lazy(() =>
  import("@/features/finance/budgets/pages/BudgetListPage").then((module) => ({ default: module.BudgetListPage }))
);
const BudgetDetailPage = lazy(() =>
  import("@/features/finance/budgets/pages/BudgetDetailPage").then((module) => ({ default: module.BudgetDetailPage }))
);
const BudgetCreatePage = lazy(() =>
  import("@/features/finance/budgets/pages/BudgetCreatePage").then((module) => ({ default: module.BudgetCreatePage }))
);

const ContractListPage = lazy(() =>
  import("@/features/finance/contracts/pages/ContractListPage").then((module) => ({ default: module.ContractListPage }))
);
const ContractDetailPage = lazy(() =>
  import("@/features/finance/contracts/pages/ContractDetailPage").then((module) => ({ default: module.ContractDetailPage }))
);
const ContractCreatePage = lazy(() =>
  import("@/features/finance/contracts/pages/ContractCreatePage").then((module) => ({ default: module.ContractCreatePage }))
);

function App() {
  const { t } = useTranslation("common");
  return (
    <AuthProvider>
      <TenantProvider>
        <RootLayout>
          <Suspense
            fallback={
              <div
                role="status"
                className="text-muted-foreground flex min-h-80 items-center justify-center text-sm"
              >
                {t("common.loading")}
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<UnifiedPublic><TenderHome /></UnifiedPublic>} />
              <Route path="/login" element={<TenderLogin />} />
              <Route path="/browse" element={<UnifiedPublic><PublicTenders /></UnifiedPublic>} />
              <Route path="/browse/:tenderId" element={<UnifiedPublic><PublicTenderDetail /></UnifiedPublic>} />
              <Route path="/contact" element={<UnifiedPublic><Contact /></UnifiedPublic>} />
              <Route path="/apply" element={<UnifiedPublic><Apply /></UnifiedPublic>} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <UnifiedShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/super-admin" element={<UnifiedOverview />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/super-admin/users" element={<UserListPage />} />
                <Route path="/supplier/tenders" element={<TenderList />} />
                <Route path="/supplier/tenders/:tenderId" element={<TenderDetail />} />
                <Route path="/supplier/proposal/:proposalId" element={<ProposalDetails />} />
                <Route path="/supplier/submit/:tenderId" element={<SupplierSubmission />} />
                <Route path="/proposal/:proposalId" element={<ProposalDetails />} />
                <Route path="/super-admin/queue" element={<ApprovalQueue />} />
                <Route path="/super-admin/tenders" element={<TenderList />} />
                <Route path="/super-admin/messages" element={<Messages />} />
                <Route path="/super-admin/inquiries" element={<InquiryQueue />} />
                <Route path="/tenders" element={<TenderList />} />
                <Route path="/tenders/:tenderId" element={<TenderDetail />} />
                <Route path="/create-tender" element={<CreateTender />} />
                <Route path="/tenders/:tenderId/submit" element={<SupplierSubmission />} />
                <Route path="/submit/:tenderId" element={<SupplierSubmission />} />
                <Route path="/supplier" element={<SupplierDashboard />} />
                <Route path="/profile" element={<SupplierProfile />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/rankings/:tenderId" element={<Rankings />} />
                <Route path="/proposals/:proposalId" element={<ProposalDetails />} />
                <Route path="/dashboard" element={<UnifiedOverview />} />
                <Route path="/settings" element={<OrgSettingsPage />} />
                <Route path="/settings/smtp" element={<SmtpSettingsPage />} />
                <Route path="/users" element={<UserListPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/roles" element={<RoleListPage />} />
                <Route path="/roles/:id" element={<RoleDetailPage />} />
                <Route path="/suppliers" element={<SupplierListPage />} />
                <Route path="/suppliers/new" element={<SupplierCreatePage />} />
                <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
                <Route path="/purchase-requisitions" element={<PrListPage />} />
                <Route path="/purchase-requisitions/new" element={<PrCreatePage />} />
                <Route path="/purchase-requisitions/:id" element={<PrDetailPage />} />
                <Route path="/rfq" element={<RfqListPage />} />
                <Route path="/rfq/new" element={<RfqCreatePage />} />
                <Route path="/rfq/:id" element={<RfqDetailPage />} />
                <Route path="/purchase-orders" element={<PoListPage />} />
                <Route path="/purchase-orders/new" element={<PoCreatePage />} />
                <Route path="/purchase-orders/:id" element={<PoDetailPage />} />
                <Route path="/goods-receipts" element={<GrListPage />} />
                <Route path="/goods-receipts/new" element={<GrCreatePage />} />
                <Route path="/goods-receipts/:id" element={<GrDetailPage />} />
                <Route path="/invoices" element={<InvoiceListPage />} />
                <Route path="/invoices/new" element={<InvoiceCreatePage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/budgets" element={<BudgetListPage />} />
                <Route path="/budgets/new" element={<BudgetCreatePage />} />
                <Route path="/budgets/:id" element={<BudgetDetailPage />} />
                <Route path="/contracts" element={<ContractListPage />} />
                <Route path="/contracts/new" element={<ContractCreatePage />} />
                <Route path="/contracts/:id" element={<ContractDetailPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </RootLayout>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
