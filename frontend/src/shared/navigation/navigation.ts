import { Banknote, ClipboardList, Settings2, Store, type LucideIcon } from "lucide-react";

export interface NavigationPage {
  id: string;
  label: string;
  to: string;
  permissions?: string[];
  aliases?: string[];
  badge?: "messages" | "inquiries";
}

export interface NavigationModule {
  id: string;
  label: string;
  pages: NavigationPage[];
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: LucideIcon;
  modules: NavigationModule[];
}

interface Access {
  isAdministrator: boolean;
  isSupplier: boolean;
  hasPermission: (permission: string) => boolean;
}

export function createNavigation(access: Access): NavigationSection[] {
  const sections: NavigationSection[] = access.isSupplier
    ? [
        {
          id: "supplier-portal",
          label: "sections.supplier",
          icon: Store,
          modules: [
            {
              id: "opportunities",
              label: "modules.opportunities",
              pages: [
                {
                  id: "open-tenders",
                  label: "pages.openTenders",
                  to: "/supplier/tenders",
                  permissions: ["tender.view"],
                  aliases: [
                    "/tenders",
                    "/submit",
                    "/supplier/submit",
                    "/supplier/proposal",
                    "/proposals",
                    "/proposal",
                  ],
                },
              ],
            },
            {
              id: "company",
              label: "modules.company",
              pages: [
                {
                  id: "supplier-profile",
                  label: "pages.companyProfile",
                  to: "/profile",
                  permissions: ["tender.view"],
                },
              ],
            },
          ],
        },
      ]
    : [
        {
          id: "sourcing",
          label: "sections.sourcing",
          icon: Store,
          modules: [
            {
              id: "suppliers",
              label: "modules.suppliers",
              pages: [
                {
                  id: "suppliers-list",
                  label: "pages.supplierDirectory",
                  to: "/suppliers",
                  permissions: ["supplier.view"],
                },
                {
                  id: "suppliers-new",
                  label: "pages.newSupplier",
                  to: "/suppliers/new",
                  permissions: ["supplier.create"],
                },
              ],
            },
            {
              id: "quotations",
              label: "modules.quotations",
              pages: [
                {
                  id: "rfq-list",
                  label: "pages.rfqs",
                  to: "/rfq",
                  permissions: ["rfq.view", "rfq.view_all"],
                },
                {
                  id: "rfq-new",
                  label: "pages.newRfq",
                  to: "/rfq/new",
                  permissions: ["rfq.create"],
                },
              ],
            },
            {
              id: "tenders",
              label: "modules.tenders",
              pages: [
                {
                  id: "tenders-list",
                  label: "pages.tenderRegister",
                  to: access.isAdministrator ? "/super-admin/tenders" : "/tenders",
                  aliases: ["/tenders", "/super-admin/tenders"],
                  permissions: ["tender.view"],
                },
                {
                  id: "tenders-new",
                  label: "pages.newTender",
                  to: "/create-tender",
                  permissions: ["tender.create"],
                },
                {
                  id: "tenders-approvals",
                  label: "pages.approvalQueue",
                  to: "/super-admin/queue",
                  permissions: ["tender.approve"],
                },
              ],
            },
            {
              id: "evaluation",
              label: "modules.evaluation",
              pages: [
                {
                  id: "rankings",
                  label: "pages.rankings",
                  to: "/rankings",
                  aliases: ["/proposal", "/proposals"],
                  permissions: ["tender.evaluate"],
                },
              ],
            },
          ],
        },
        {
          id: "procurement",
          label: "sections.procurement",
          icon: ClipboardList,
          modules: [
            {
              id: "requisitions",
              label: "modules.requisitions",
              pages: [
                {
                  id: "requests-list",
                  label: "pages.requests",
                  to: "/purchase-requisitions",
                  permissions: ["purchase_request.view", "purchase_request.view_all"],
                },
                {
                  id: "requests-new",
                  label: "pages.newRequest",
                  to: "/purchase-requisitions/new",
                  permissions: ["purchase_request.create"],
                },
              ],
            },
            {
              id: "orders",
              label: "modules.orders",
              pages: [
                {
                  id: "orders-list",
                  label: "pages.orders",
                  to: "/purchase-orders",
                  permissions: ["purchase_order.view", "purchase_order.view_all"],
                },
                {
                  id: "orders-new",
                  label: "pages.newOrder",
                  to: "/purchase-orders/new",
                  permissions: ["purchase_order.create"],
                },
              ],
            },
            {
              id: "receiving",
              label: "modules.receiving",
              pages: [
                {
                  id: "receipts-list",
                  label: "pages.receipts",
                  to: "/goods-receipts",
                  permissions: ["goods_receipt.view", "goods_receipt.view_all"],
                },
                {
                  id: "receipts-new",
                  label: "pages.newReceipt",
                  to: "/goods-receipts/new",
                  permissions: ["goods_receipt.create"],
                },
              ],
            },
            {
              id: "invoices",
              label: "modules.invoices",
              pages: [
                {
                  id: "invoices-list",
                  label: "pages.invoices",
                  to: "/invoices",
                  permissions: ["invoice.view", "invoice.view_all"],
                },
                {
                  id: "invoices-new",
                  label: "pages.newInvoice",
                  to: "/invoices/new",
                  permissions: ["invoice.create"],
                },
              ],
            },
          ],
        },
        {
          id: "finance",
          label: "sections.finance",
          icon: Banknote,
          modules: [
            {
              id: "budgets",
              label: "modules.budgets",
              pages: [
                {
                  id: "budgets-list",
                  label: "pages.budgets",
                  to: "/budgets",
                  permissions: ["budget.view"],
                },
                {
                  id: "budgets-new",
                  label: "pages.newBudget",
                  to: "/budgets/new",
                  permissions: ["budget.create"],
                },
              ],
            },
            {
              id: "contracts",
              label: "modules.contracts",
              pages: [
                {
                  id: "contracts-list",
                  label: "pages.contracts",
                  to: "/contracts",
                  permissions: ["contract.view", "contract.view_all"],
                },
                {
                  id: "contracts-new",
                  label: "pages.newContract",
                  to: "/contracts/new",
                  permissions: ["contract.create"],
                },
              ],
            },
          ],
        },
        {
          id: "administration",
          label: "sections.administration",
          icon: Settings2,
          modules: [
            {
              id: "access",
              label: "modules.access",
              pages: [
                {
                  id: "users",
                  label: "pages.users",
                  to: "/users",
                  aliases: ["/super-admin/users"],
                  permissions: ["user.view"],
                },
                { id: "roles", label: "pages.roles", to: "/roles", permissions: ["role.view"] },
              ],
            },
            {
              id: "workspace",
              label: "modules.workspace",
              pages: [
                {
                  id: "company-profile",
                  label: "pages.companyProfile",
                  to: "/admin/profile",
                  permissions: ["tender.create"],
                },
                {
                  id: "settings",
                  label: "pages.settings",
                  to: "/settings",
                  permissions: ["settings.view"],
                },
                {
                  id: "email",
                  label: "pages.email",
                  to: "/settings/smtp",
                  permissions: ["settings.manage_smtp"],
                },
              ],
            },
            {
              id: "communications",
              label: "modules.communications",
              pages: [
                {
                  id: "messages",
                  label: "pages.messages",
                  to: "/super-admin/messages",
                  permissions: ["settings.manage"],
                  badge: "messages",
                },
                {
                  id: "inquiries",
                  label: "pages.inquiries",
                  to: "/super-admin/inquiries",
                  permissions: ["settings.manage"],
                  badge: "inquiries",
                },
              ],
            },
          ],
        },
      ];

  return sections
    .map((section) => ({
      ...section,
      modules: section.modules
        .map((module) => ({
          ...module,
          pages: module.pages.filter(
            (page) => !page.permissions || page.permissions.some(access.hasPermission)
          ),
        }))
        .filter((module) => module.pages.length > 0),
    }))
    .filter((section) => section.modules.length > 0);
}

export function findActiveBranch(sections: NavigationSection[], pathname: string) {
  let selected:
    | { section: NavigationSection; module: NavigationModule; page: NavigationPage; length: number }
    | undefined;
  for (const section of sections)
    for (const module of section.modules)
      for (const page of module.pages) {
        for (const path of [page.to, ...(page.aliases || [])]) {
          if (
            (pathname === path || pathname.startsWith(path + "/")) &&
            path.length > (selected?.length || 0)
          ) {
            selected = { section, module, page, length: path.length };
          }
        }
      }
  return selected;
}
