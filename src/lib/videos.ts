export interface ProcessVideoData {
  id: string;
  title: string;
  description: string;
  src: string;
  poster: string;
  duration?: string;
  transcript?: string;
}

// Existing HuzaEstate imagery used as posters/fallbacks until the real
// demo footage below is recorded and dropped into /public/videos.
export const buildVideos = {
  overview: {
    id: "build-overview",
    title: "How HuzaEstate Build works",
    description:
      "A quick walkthrough of turning your ideas into a personalised home concept with Huza AI, from your first prompt to a saved design.",
    src: "/videos/build/build-overview.mp4",
    poster: "/hero-house-ai.jpg",
    duration: "2:14",
    transcript:
      "Full transcript will be published alongside the demo video. In short: you describe your plot and requirements, Huza AI proposes layout and exterior directions, you compare and refine them, then share your favourite with a professional for review.",
  },
  describeYourHome: {
    id: "build-describe-your-home",
    title: "Describe your home",
    description: "Complete a guided form or send Huza AI a natural-language prompt describing what you want.",
    src: "/videos/build/describe-your-home.mp4",
    poster: "/hero-house.jpg",
    duration: "1:05",
  },
  generateConcepts: {
    id: "build-generate-concepts",
    title: "Generate design directions",
    description: "Huza AI creates alternative layout and visual concepts based on your confirmed requirements.",
    src: "/videos/build/generate-concepts.mp4",
    poster: "/hero-house-final.jpg",
    duration: "1:20",
  },
  refineDesign: {
    id: "build-refine-design",
    title: "Compare and refine",
    description: "Compare options side by side, request changes and save the versions you like best.",
    src: "/videos/build/refine-design.mp4",
    poster: "/hero-house-white.jpg",
    duration: "1:32",
  },
  professionalReview: {
    id: "build-professional-review",
    title: "Request professional review",
    description: "Share your selected concept with an architect, engineer or quantity surveyor.",
    src: "/videos/build/professional-review.mp4",
    poster: "/hero-house-spacious.jpg",
    duration: "0:58",
  },
} satisfies Record<string, ProcessVideoData>;

export const renovateVideos = {
  overview: {
    id: "renovate-overview",
    title: "How HuzaEstate Renovate works",
    description:
      "See how existing photos and a short description become renovation concepts you can compare, refine and share with a contractor.",
    src: "/videos/renovate/renovate-overview.mp4",
    poster: "/hero-house-final.jpg",
    duration: "2:02",
    transcript:
      "Full transcript will be published alongside the demo video. In short: you upload your existing space, describe what should change, Huza AI proposes renovation directions, you refine selected areas, then request a professional quotation.",
  },
  uploadYourSpace: {
    id: "renovate-upload-your-space",
    title: "Upload your existing space",
    description: "Add room photographs, a floor plan, a sketch or a walkthrough video of the property.",
    src: "/videos/renovate/upload-your-space.mp4",
    poster: "/hero-house.jpg",
    duration: "1:10",
  },
  generateRenovation: {
    id: "renovate-generate-renovation",
    title: "Generate renovation options",
    description: "Huza AI creates alternative concepts that respect your existing layout and structure.",
    src: "/videos/renovate/generate-renovation.mp4",
    poster: "/hero-house-ai.jpg",
    duration: "1:28",
  },
  refineRenovation: {
    id: "renovate-refine-renovation",
    title: "Refine selected areas",
    description: "Request focused changes to walls, finishes, furniture, colours, roofing or landscaping.",
    src: "/videos/renovate/refine-renovation.mp4",
    poster: "/hero-house-white.jpg",
    duration: "1:15",
  },
  requestQuotation: {
    id: "renovate-request-quotation",
    title: "Prepare for execution",
    description: "Save your preferred direction and request a professional review or contractor quotation.",
    src: "/videos/renovate/request-quotation.mp4",
    poster: "/hero-house-spacious.jpg",
    duration: "0:52",
  },
} satisfies Record<string, ProcessVideoData>;
