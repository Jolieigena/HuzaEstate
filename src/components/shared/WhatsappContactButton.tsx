"use client";

import { useWhatsappContact, type ChatKind } from "@/lib/whatsapp/chat";
import WhatsappChatButton from "./WhatsappChatButton";

/** The chat button for someone whose number is looked up after sign-in (a professional, a designer or a supplier). */
export default function WhatsappContactButton({ kind, id, message, className }: { kind: ChatKind; id: string | undefined; message: string; className?: string }) {
  const phone = useWhatsappContact(kind, id);
  return <WhatsappChatButton phone={phone} message={message} className={className} />;
}
