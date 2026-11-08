import { NAV_LINKS } from "@/components/NavLinks";
import { FOOTER_LINKS } from "@/components/Footer";
import { ADMIN_NAV_ITEMS } from "@/components/admin/adminNavItems";
import { PROFESSIONAL_NAV_ITEMS } from "@/components/professional/professionalNavItems";
import { ORG_ADMIN_NAV_ITEMS } from "@/components/org-admin/orgAdminNavItems";
import { SIDEBAR_NAV_ITEMS } from "@/components/SidebarNavItems";
import { SUPPLIER_NAV_ITEMS } from "@/components/supplier/SupplierShell";
import { KEYED_NAV_ITEMS } from "@/components/manager/ManagerSidebar";
import { DESIGN_TAB_ITEMS } from "@/lib/designs/api";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/properties/types";
import type { MenuId } from "./menus";

export interface MenuDefinition {
  id: MenuId;
  title: string;
  items: { key: string; label: string; href?: string }[];
  /** Whether the administrator can add their own links to it (the owner menu switches tabs, so it cannot). */
  customLinks: boolean;
  /** Links that can never be hidden. */
  locked?: string[];
}

const footer = (id: MenuId) => FOOTER_LINKS.find((group) => group.id === id)!;

/** Every menu the administrator can edit, with the links the site has today. */
export const MENU_DEFINITIONS: MenuDefinition[] = [
  { id: "main", title: "Main menu", items: NAV_LINKS, customLinks: true },
  { id: "footer-explore", title: "Footer: Explore", items: footer("footer-explore").links.map((l) => ({ ...l, key: l.href })), customLinks: true },
  { id: "footer-company", title: "Footer: Company", items: footer("footer-company").links.map((l) => ({ ...l, key: l.href })), customLinks: true },
  { id: "footer-account", title: "Footer: Account", items: footer("footer-account").links.map((l) => ({ ...l, key: l.href })), customLinks: true },
  { id: "admin", title: "Admin sidebar", items: ADMIN_NAV_ITEMS, customLinks: true, locked: ["settings"] },
  { id: "customer", title: "Customer sidebar", items: SIDEBAR_NAV_ITEMS, customLinks: true },
  { id: "owner", title: "Owner sidebar", items: KEYED_NAV_ITEMS, customLinks: false },
  { id: "professional", title: "Professional sidebar", items: PROFESSIONAL_NAV_ITEMS, customLinks: true },
  { id: "supplier", title: "Supplier sidebar", items: SUPPLIER_NAV_ITEMS, customLinks: true },
  { id: "org-admin", title: "Organisation sidebar", items: ORG_ADMIN_NAV_ITEMS, customLinks: true },
  { id: "designs-tabs", title: "Designs page tabs", items: DESIGN_TAB_ITEMS, customLinks: false },
  {
    id: "professionals-filters",
    title: "Professionals page filters",
    items: [
      { key: "services", label: "All Services" },
      { key: "locations", label: "All Locations" },
      { key: "experienced", label: "5+ Years Exp." },
      { key: "individuals", label: "Individuals" },
      { key: "firms", label: "Firms" },
    ],
    customLinks: false,
  },
  { id: "property-types", title: "Property types filter", items: PROPERTY_TYPE_OPTIONS.map((o) => ({ key: o.label, label: o.label })), customLinks: false },
];
