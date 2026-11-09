import { garments } from "./catalog.js";

const piece = slug => garments.find(item => item.slug === slug);
const entries = [
  {
    slug: "the-hands-behind-the-label",
    category: "Our family",
    title: "The hands behind the label",
    excerpt: "My father is Aaron Acheampong, A Acheampong Snr. His craft put me through school. I am Adwoa, A Acheampong Jnr, carrying that work into its next chapter.",
    garment: "brown-linear",
    heroImage: "/assets/family/adwoa-cream-coffee-original.jpeg",
    heroAlt: "Adwoa Acheampong wearing a cream dress with coffee borders and a bird motif",
    heroWidth: 853,
    heroHeight: 1280,
    caption: "Miss (Adwoa) Acheampong, A Acheampong Jnr, wearing her father’s work.",
    introduction: "Legacy is a family story before it is a name on a label. My father, Aaron Acheampong, has spent more than thirty years making African wear. His work has clothed presidents and leaders. For me, the heart of that story is also what his craft made possible at home.",
    sections: [
      {
        heading: "The life behind the clothes",
        paragraphs: [
          "His work sustained our household and put me through school. It helped make me the woman I am today. When I look at these clothes, I see the skill and commitment that became a source of provision for our family.",
          "That is why the name Legacy matters to me. It holds the connection between my father’s work, the life it helped shape and the possibilities I can now pursue."
        ]
      },
      {
        heading: "What carried us",
        paragraphs: [
          "We give thanks to God for the strength, provision and opportunities that kept the work going. That gratitude stays with us as we look back on what his craft has made possible and turn towards what comes next."
        ]
      },
      {
        heading: "A daughter, a new chapter",
        paragraphs: [
          "I am Miss (Adwoa) Acheampong, now pursuing AI/ML engineering. He is A Acheampong Snr; I am A Acheampong Jnr. My path is taking shape in a different field, and I carry what his craft made possible into that next chapter.",
          "Giving his work a home here is one way I can carry it forward. I want you to see the collection, discover the details and find something you would love to wear. His craft remains the foundation, with room for you to make these clothes part of your own story."
        ]
      }
    ],
    action: { label: "Explore the collection", href: "#/collection" },
    supportingAction: { label: "Our family story", href: "#/legacy" }
  },
  {
    slug: "look-closer-at-the-details",
    category: "The details",
    title: "Look closer at the details",
    excerpt: "A line of embroidery, an offset panel, a bold print. A closer look at three designs from the collection.",
    garment: "asymmetric-cream",
    caption: "Asymmetric Cream, with its offset coffee and gold panel.",
    introduction: "Sometimes, colour is the first thing you notice. Look again and another detail comes forward: the line below a neckline, the placement of a panel, or the way a print meets a plain field. Those details give you another way to find a piece you love.",
    sections: [
      {
        heading: "Coffee Linework: a quiet centre line",
        paragraphs: [
          "On Coffee Linework, fine embroidery follows the centre opening. Warm gold stands against coffee brown, creating a clear focal point while leaving the rest of the garment understated. The interest is in the repetition of those lines."
        ]
      },
      {
        heading: "Asymmetric Cream: a different balance",
        paragraphs: [
          "Asymmetric Cream takes another direction. A coffee and gold panel sits away from the centre, with a chest pocket beside it. The light body gives the offset detail space to stand out.",
          "If that panel catches your eye, open the piece and take a closer look. It is a useful starting point for a conversation about which details you would like to keep."
        ]
      },
      {
        heading: "Red Ochre: let the print speak",
        paragraphs: [
          "Red Ochre brings red, ochre, white and deep green together in a scroll-like print. An ochre placket gives the front a clear centre line, with a small embroidered mark adding another point of interest.",
          "You do not need the right tailoring words to begin. Tell us which piece keeps drawing you back, or simply point to the detail you like. We can take the conversation from there."
        ]
      }
    ],
    action: { label: "View Asymmetric Cream", href: "#/collection/asymmetric-cream" },
    supportingAction: { label: "See every piece", href: "#/collection" }
  },
  {
    slug: "a-custom-piece-starts-with-a-conversation",
    category: "The atelier",
    title: "A custom piece starts with a conversation",
    excerpt: "Begin with a favourite look or an idea of your own. The fit and finer details can follow when we talk.",
    garment: "heritage-panel",
    caption: "Heritage Panel, one possible starting point for a personal request.",
    introduction: "You do not need a finished design brief to speak with us. A favourite piece, an occasion or an idea you have been thinking about is enough to begin. We can work through the finer details together.",
    sections: [
      {
        heading: "Start with what you love",
        paragraphs: [
          "If a piece in the collection catches your eye, open it and choose your preferred size if you know it. You can keep a selection in your bag, or go straight to a conversation about that look. The garment reference travels with your request, so you do not have to describe it again."
        ]
      },
      {
        heading: "Make the first message your own",
        paragraphs: [
          "The atelier offers three simple starting points: this look in your size, a custom version, or help choosing a size. Choose the closest one and edit the message as you like.",
          "You might want to keep a panel, explore a colour or ask whether a detail could work differently. A short note is enough. Measurements and more detailed specifications can come later in the conversation."
        ]
      },
      {
        heading: "Then we talk through the possibilities",
        paragraphs: [
          "All offered sizes are available across the collection. For a custom piece, we talk through fabric, fit, price and timing together. Your size choice helps us begin; measurements and final details can follow.",
          "Prepare your message, then open email or copy it into WhatsApp to share it with us. You review and send it yourself. We will have a clear starting point for the conversation, with room to shape the rest together."
        ]
      }
    ],
    action: { label: "Discuss a custom piece", href: "#/atelier?template=custom&garment=Custom%20piece" },
    supportingAction: { label: "Explore your idea in the design studio", href: "#/design" }
  }
];

export const articles = entries.map(entry => {
  const garment = piece(entry.garment);
  const text = [entry.title, entry.introduction, ...entry.sections.flatMap(section => [section.heading, ...section.paragraphs])].join(" ");
  const wordCount = text.trim().split(/\s+/).length;
  return { ...entry, image: entry.heroImage || garment.image, imageAlt: entry.heroAlt || garment.alt, imageWidth: entry.heroWidth || 1167, imageHeight: entry.heroHeight || 1347, collectionImage: garment.image, collectionAlt: garment.alt, wordCount, minutesRead: Math.max(1, Math.ceil(wordCount / 200)), status: "local-draft" };
});

export const getArticle = slug => articles.find(article => article.slug === slug);
