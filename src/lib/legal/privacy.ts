import type { LegalDocument } from "@/components/legal/LegalPage";

export const PRIVACY: LegalDocument = {
  title: "Privacy Policy",
  updated: "20 October 2026",
  intro:
    "This policy explains what personal information HuzaEstate collects, why, who sees it, how long we keep it and what choices you have. It applies to our website and services, whether or not you have an account.",
  sections: [
    {
      id: "who",
      heading: "Who we are",
      body: [
        "HuzaEstate is an online property, design and furniture marketplace based in Rwanda. We decide how and why the information described here is used. You can reach us through the Contact page.",
      ],
    },
    {
      id: "collect",
      heading: "What we collect",
      body: [
        "Information you give us:",
        {
          list: [
            "Account details: your name, email address, password (kept only in scrambled form), country and, for some roles, phone number, address, company name and logo.",
            "Content you post: listings, photos, descriptions, profiles, portfolios, reviews and project briefs.",
            "Messages: inquiries to owners and professionals, replies, design requests and furniture quote requests, including the contact details you put in them.",
            "Orders and payments: what you order, delivery details and the status of your payment. Card numbers are entered with our payment provider and are not stored by us.",
          ],
        },
        "Information collected as you use the service:",
        {
          list: [
            "Sign-in and security information, such as when you signed in.",
            "Your approximate country, worked out from your internet address, so we can show relevant listings and prices.",
            "Visit information for our visitor statistics, described in the next section.",
          ],
        },
      ],
    },
    {
      id: "analytics",
      heading: "Visitor statistics",
      body: [
        "To understand where our visitors are and which pages they use, we record each visit to our public pages:",
        {
          list: [
            "your internet (IP) address, and the approximate country and city we work out from it with an outside lookup service;",
            "the page you opened, the site you came from, and whether you used a phone or a computer;",
            "if you were signed in, a reference to your account and its role, so we can tell members from visitors who are not signed in.",
          ],
        },
        "These statistics are seen only by HuzaEstate administrators. They are not shown to other users and are not used to advertise to you. We do not record visits from people whose browser sends a Do Not Track signal, or from automated programs.",
        "Your full internet address is kept for 30 days after your last visit and is then shortened so it can no longer identify you. Individual page visits are deleted after 90 days, and the remaining location records after 400 days.",
      ],
    },
    {
      id: "use",
      heading: "How we use your information",
      body: [
        {
          list: [
            "To run your account and the service: show listings, deliver messages, process orders and payments, and send the emails the service depends on, such as confirmations, sign-in details and replies.",
            "To review and moderate listings and content, prevent fraud and misuse, and keep the platform safe.",
            "To understand and improve HuzaEstate, using the visitor statistics above.",
            "To promote listings you have published, for example on our website and social media channels.",
            "To meet our legal duties and respond to lawful requests.",
          ],
        },
      ],
    },
    {
      id: "sharing",
      heading: "Who we share it with",
      body: [
        "We do not sell your personal information. We share it only as follows:",
        {
          list: [
            "With the people you contact. When you send an inquiry or place an order, the owner, professional or supplier receives the details needed to answer or fulfil it. Anything you publish, such as a listing or a profile, is visible to visitors.",
            "With companies that help us run the service: our payment provider, email delivery, hosting and storage, an internet-address lookup service for approximate location, and the map provider whose map tiles we show. They may only use the information to provide their service to us.",
            "With authorities or other parties where the law requires it, or to protect our users, our rights or the service.",
            "If HuzaEstate is reorganised or sold, with the new owner, who must continue to protect your information.",
          ],
        },
        "When you view a map, your browser requests map images directly from the map provider, which can therefore see your internet address.",
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and browser storage",
      body: [
        "We use a small session cookie and your browser's local storage to keep you signed in, remember the workspace you last used, and remember accounts you have saved on this device so you can switch between them. We also keep your detected country for a few hours so pages do not have to look it up each time.",
        "These are needed for the service to work. Clearing your browser data, or logging out, removes them. We do not use advertising cookies.",
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      body: [
        "We keep your account information while your account is open. Listings, messages, orders and payment records are kept as long as they are needed to run the service and to meet accounting and legal duties. Visitor statistics follow the schedule above. When an account is deleted, we delete or anonymise its personal information, except what we must keep by law or to resolve a dispute.",
      ],
    },
    {
      id: "rights",
      heading: "Your choices and rights",
      body: [
        {
          list: [
            "You can see and correct most of your details in your account settings.",
            "You can ask us for a copy of your information, to correct it, or to delete your account and its data, through the Contact page.",
            "You can ask us to stop using your information for a purpose that is not needed to run the service.",
            "You can turn on Do Not Track in your browser to stay out of our visitor statistics.",
            "You can remove saved accounts from a device, and log out of one or all of them, from the account menu.",
          ],
        },
        "If you think we have handled your information wrongly, please tell us first so we can put it right. You may also complain to the data protection authority in your country.",
      ],
    },
    {
      id: "security",
      heading: "Keeping your information safe",
      body: [
        "We protect your information with measures such as scrambled passwords, restricted access for staff, checks that stop suspended accounts from using the service, and limits on repeated sign-in attempts. No system is perfectly secure, so please use a strong, unique password and log out on shared devices.",
      ],
    },
    {
      id: "children",
      heading: "Children",
      body: ["HuzaEstate is for people aged 18 and over. We do not knowingly collect information from children. If you believe a child has given us information, contact us and we will delete it."],
    },
    {
      id: "transfers",
      heading: "Where your information is processed",
      body: [
        "Our service providers may process information in countries other than yours. Where that happens, we expect them to protect it to a standard consistent with this policy.",
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      body: ["We may update this policy. The date at the top shows the latest version, and we will tell you in the service or by email when a change matters to you."],
    },
  ],
};
