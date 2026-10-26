import type { LegalDocument } from "@/components/legal/LegalPage";

export const DELETE_ACCOUNT: LegalDocument = {
  title: "Delete your account",
  updated: "26 October 2026",
  intro:
    "Anyone with a HuzaEstate account (buyer, seller, professional, furniture supplier or organisation staff) can ask us to delete it here. This page explains how, what is deleted and what we keep.",
  sections: [
    {
      id: "how",
      heading: "How to ask",
      body: [
        {
          list: [
            "Enter the email address of your account in the form at the end of this page and send the request.",
            "We email a confirmation link to that address. Open it, so we know the request is really yours. Nothing is deleted until you do.",
            "Once you confirm, our team deletes your account. We aim to finish within 30 days.",
          ],
        },
        "You can also use the form if you can no longer sign in, as long as you can still read email sent to the address of the account.",
      ],
    },
    {
      id: "deleted",
      heading: "What is deleted",
      body: [
        "When your account is deleted, we remove:",
        {
          list: [
            "your account details: name, email address, password, phone number, address, country and company details;",
            "your listings, with the inquiries sent about them, and your posting plan;",
            "your professional profile, portfolio and designs, with the inquiries and reviews attached to them;",
            "your furniture shop profile, products, orders and reviews;",
            "your landlord profile, saved items and notifications.",
          ],
        },
        "Deleting an account also removes the orders and products it holds. If you sell furniture, finish open orders and collect any payout owed to you first.",
      ],
    },
    {
      id: "kept",
      heading: "What we keep",
      body: [
        "We keep only what the law or a fair settlement of a dispute requires:",
        {
          list: [
            "records of payments and invoices, which we and our payment provider must keep for accounting and tax duties;",
            "messages you sent to listing owners or professionals, which stay with the person who received them;",
            "visitor statistics, which follow the schedule in our Privacy Policy and are not linked to your name once your account is gone.",
          ],
        },
      ],
    },
    {
      id: "listing",
      heading: "Removing a listing only",
      body: [
        "If you only want a listing gone, you do not need to delete your account. Sign in, open your portal and delete or unpublish the listing there.",
      ],
    },
    {
      id: "request",
      heading: "Send your request",
      body: ["Use the form below. We reply to the address you enter."],
    },
  ],
};
