import type { LegalDocument } from "@/components/legal/LegalPage";

export const SELLER_TERMS: LegalDocument = {
  title: "Seller Terms & Conditions",
  updated: "20 October 2026",
  intro:
    "These terms apply to anyone who posts property on HuzaEstate, which is operated by Huzalabs, to sell or let it: owners, landlords and agents. They are in addition to our Terms of Service and Privacy Policy. By becoming a seller or posting a listing you agree to them.",
  sections: [
    {
      id: "authority",
      heading: "Your right to list",
      body: [
        "You may list a property only if you own it or the owner has given you clear authority to market it. If you are an agent, you must be authorised by the owner, and you must say that you are an agent when you sign up. Give us proof of ownership or authority if we ask for it.",
      ],
    },
    {
      id: "accuracy",
      heading: "Accurate, complete listings",
      body: [
        "Every listing must be complete and truthful. It needs a clear title, a real description of at least 20 characters, the price, the location, the type of property and whether it is for sale or to let.",
        {
          list: [
            "Photos must show the property you are listing. Do not use stock pictures, pictures of other properties or pictures you do not have the right to use. At least one photo is required.",
            "Say plainly about anything a buyer or tenant would reasonably want to know, such as the condition, the size and any charges.",
            "Update the listing when the price or details change, and take it down or mark it unavailable as soon as the property is let, sold or withdrawn.",
          ],
        },
      ],
    },
    {
      id: "one-listing",
      heading: "One listing for each property",
      body: [
        "Post each property once. A second listing with the same title, in the same city, for the same sale or let is not accepted. To change a listing, edit it instead of posting it again.",
      ],
    },
    {
      id: "review",
      heading: "Review and publication",
      body: [
        "Listings are checked before they go live, unless your account or organisation has been set up to publish straight away. A listing may be published, returned to you with requested changes, or declined, and we will give the reason. We may also review, unpublish or remove a listing after it is published if it breaks these terms.",
        "You can save a listing as a draft while you finish it. A draft is not visible to anyone and does not use your allowance.",
      ],
    },
    {
      id: "plans",
      heading: "Plans, limits and how long a listing stays live",
      body: [
        "Your plan sets how many listings you can post each month and how long each stays live. These are shown on the plans page and when you post. When a listing expires it is no longer shown, and you can renew it by posting again within your plan.",
        "When you move to a higher plan, the posts you made before the upgrade are not counted against the new plan, and you start with its full allowance.",
      ],
    },
    {
      id: "inquiries",
      heading: "Handling inquiries",
      body: [
        "People who are interested in your listing will send you messages. We pass you their name, email address, phone number (if given) and message, and we notify you. Reply promptly and honestly.",
        {
          list: [
            "Use the contact details only to answer the inquiry. Do not add people to mailing lists or pass their details on.",
            "Treat everyone fairly. Do not discriminate on grounds such as ethnicity, religion, gender, disability, family status or nationality.",
            "You may not send an inquiry about your own listing.",
          ],
        },
      ],
    },
    {
      id: "conduct",
      heading: "What is not allowed",
      body: [
        {
          list: [
            "Listing property that does not exist, is not available, or that you have no right to sell or let.",
            "Asking for deposits, fees or payments under false pretences, or taking money for a viewing or reservation that you cannot honour.",
            "Posting misleading prices, photos or descriptions, or listing a property to attract visitors for something else.",
            "Using several accounts to get around a limit, a suspension or a review.",
            "Anything else prohibited by our Terms of Service.",
          ],
        },
      ],
    },
    {
      id: "deals",
      heading: "Your deals and your responsibilities",
      body: [
        "Any sale, lease or commission is an agreement between you and the other party. HuzaEstate does not take part in it, does not guarantee that a deal will be made, and is not responsible for what is agreed. You are responsible for the contracts, taxes, permits and legal checks that apply to your property and your country.",
        "You permit us to display and promote your published listings on our website, in our emails and on our social media channels.",
      ],
    },
    {
      id: "ending",
      heading: "Suspension and ending",
      body: [
        "We may suspend your seller account, unpublish or remove listings, or close your account if you break these terms or our Terms of Service, or to protect other users. You can stop selling at any time by taking your listings down. Refunds of plan fees follow what is set out at checkout and on the plans page, and the law.",
      ],
    },
    {
      id: "changes",
      heading: "Changes and contact",
      body: [
        "We may update these terms. The date at the top shows the latest version, and we will tell you in the service or by email when a change matters to you. Questions can be sent through the Contact page.",
      ],
    },
  ],
};
