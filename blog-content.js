import { designReferences } from "./catalog.js";

const royal = designReferences.find(item => item.slug === "igbo-kwenu-earth-weave");
const ochre = designReferences.find(item => item.slug === "warri-poise-ochre-tux-kente-kilt");

export const articles = [{
  slug: "where-the-cloth-takes-us",
  title: "Where the Cloth Takes Us",
  category: "African fashion & diaspora",
  minutesRead: 2,
  excerpt: "How Royal Frequency ’84 and Ochre Tux — Kente Kilt bring Igbo dress and Ghanaian weaving into conversation with ’80s tailoring and the Scottish kilt.",
  hero: royal,
  introduction: "When I look at Royal Frequency ’84, my eye goes to the copper lions before I take in the wide shoulders. With Ochre Tux — Kente Kilt, I follow the blocks of colour down to the pleats. That is where these two looks begin for me. The cut catches your eye, and the cloth gives you a reason to stay with it.",
  sections: [
    {
      heading: "Royal Frequency ’84",
      look: royal,
      caption: "Royal Frequency ’84, a concept from Igbo Kwenu. Copper lions repeat across the jacket and drape.",
      paragraphs: [
        "In Igbo dress in southeastern Nigeria, isi agu is a garment recognised by its repeating animal-head motifs. It is worn on occasions that bring people together, including Igbo celebrations in the diaspora. In Royal Frequency ’84, copper lions run across an oxblood jacket and continue into a draped panel. The red cap brings another familiar element of Igbo dress into view.",
        "The ’84 in the name points to the shoulders. Their breadth and the double-breasted front recall the bold proportions of 1980s tailoring. I like how the drape interrupts the jacket’s symmetry. Follow the lions across the two surfaces and you can see the motif holding the look together."
      ]
    },
    {
      heading: "Ochre Tux — Kente Kilt",
      look: ochre,
      caption: "Ochre Tux — Kente Kilt, a concept from Warri Poise. The kente runs across the flat front apron and into the pleats.",
      paragraphs: [
        "In Warri Poise, the original Ochre Tux pairs a cream dinner jacket with a long wrapper. This version keeps the jacket and takes the lower half in a different direction. Its flat front apron and pressed pleats borrow from the Scottish kilt, while the design calls for Ghanaian kente, a strip-woven textile with distinct Asante and Ewe traditions. The ochre and burnt-orange bands sit flat at the front. Where the cloth folds, the pattern starts to disappear and return.",
        "That change is what draws me in. The pleats give the weave a different rhythm, and the weave changes how you read the shape of the kilt. Each tradition has a visible part in the finished look."
      ]
    },
    {
      heading: "What travels with us",
      paragraphs: [
        "For me, the diaspora connection is in the way we dress across places. An Igbo motif can sit on a jacket cut with ’80s proportions. A cloth from Ghana can keep its character in a Scottish cut. That is what makes these looks Afrocentric for me. The African motif or cloth leads the design. I want the person wearing either piece to be able to point to a detail and tell you where it comes from, then tell you why they chose to wear it that way."
      ]
    }
  ],
  sources: [
    { title: "Isi Agu and Igbo dress · Anambra State Government", href: "https://anambrastate.gov.ng/isi-agu-more-than-fashion-a-lasting-symbol-of-igbo-identity-and-heritage/" },
    { title: "A 1984 suit by Kenzo · Philadelphia Museum of Art", href: "https://www.philamuseum.org/objects/91794" },
    { title: "Traditional Ghanaian kente weaving · UNESCO", href: "https://ich.unesco.org/en/decisions/19.COM/7.B.38" },
    { title: "Asante and Ewe weaving · The Metropolitan Museum of Art", href: "https://resources.metmuseum.org/resources/metpublications/pdf/The_Essential_Art_of_African_Textiles_Design_Without_End.pdf" },
    { title: "Highland dress and the kilt · Scottish Tartans Museum", href: "https://scottishtartansmuseum.org/education/brief-history-of-tartan/" }
  ]
}];

export const getArticle = slug => articles.find(article => article.slug === slug);
