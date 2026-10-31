import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/features/administration/notifications/hooks/useNotifications";
import { Button } from "@/shared/ui/procurement/button";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

const ENTITY_ROUTES: Record<string, string> = {
  purchase_requisition: "/purchase-requisitions",
  purchase_order: "/purchase-orders",
  goods_receipt: "/goods-receipts",
  purchase_invoice: "/invoices",
  contract: "/contracts",
  budget: "/budgets",
};

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadCount();
  const { data } = useNotifications(1, 10);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications: NotificationItem[] = data?.items || [];

  function handleClick(n: NotificationItem) {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.entityType && n.entityId) {
      const route = ENTITY_ROUTES[n.entityType];
      if (route) navigate(`${route}/${n.entityId}`);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(!open)}
        aria-label={t("notifications.title")}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">{t("notifications.title")}</span>
              {count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => markAllRead.mutate()}
                >
                  <CheckCheck className="h-3 w-3" />
                  {t("notifications.markAllRead")}
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("notifications.empty")}
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`w-full border-b px-4 py-3 text-start transition-colors hover:bg-muted/50 ${!n.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
