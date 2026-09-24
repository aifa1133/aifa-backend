import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const promptSchema = new mongoose.Schema({
  title: String, category: String, image: String, text: String, order: Number, isPublished: Boolean,
}, { timestamps: true });
const Prompt = mongoose.models.Prompt || mongoose.model("Prompt", promptSchema);

const PROMPTS = [
  { title: "Futuristic Hologram Portrait", category: "Cinematic", image: "/propmt/pr1.png", text: "Hyper-realistic cinematic portrait of a young man in a dark blue futuristic studio, holding a glowing holographic film reel. Electric blue energy waves surround the hologram. Neon blue lighting with volumetric fog. Deep blue gradient background with star particles. Style: Ultra-realistic, cinematic VFX, 8K resolution, --ar 16:9 --style raw --v 6", order: 1 },
  { title: "Sci-Fi Space Station Interior", category: "Landscape", image: "/propmt/pr2.png", text: "Hyper-realistic interior of a deep-space research station, curved white corridors with blue LED strips, astronaut in orange spacesuit walking through airlock, Earth visible through panoramic windows, dramatic natural lighting from planet below, lens flare, 8K, --ar 16:9 --v 6", order: 2 },
  { title: "Vintage Film Noir Detective", category: "Character", image: "/propmt/pr3.png", text: "Film noir detective portrait, 1940s style, man in fedora and trenchcoat under a flickering street lamp in the rain, dramatic chiaroscuro lighting, heavy shadows, wet cobblestones, cigarette smoke, black and white with selective amber tone, cinematic grain, Leica 35mm --ar 4:5 --style raw", order: 3 },
  { title: "Luxury Perfume Product Shot", category: "Product", image: "/propmt/pr4.png", text: "Ultra-luxury perfume bottle on black marble surface, golden liquid, studio light with dramatic side-lighting, bokeh background with gold dust particles, reflections on marble surface, editorial photography, 4K commercial quality, --ar 4:5 --style raw --v 6", order: 4 },
  { title: "Cyberpunk City Street", category: "Landscape", image: "/propmt/pr5.png", text: "Cyberpunk mega-city street at night, neon signs in Japanese and Hindi, rain-slicked asphalt reflecting holographic ads, flying vehicles overhead, dense crowd with umbrellas, fog and smog, blade runner aesthetic, cinematic anamorphic lens, --ar 21:9 --v 6", order: 5 },
  { title: "AI Energy Burst Portrait", category: "VFX", image: "/propmt/pr6.png", text: "Dynamic portrait of a young woman, electric golden energy bursting from her hands, particles swirling around her body, dark studio background, dramatic rim lighting, cinematic composition, high-contrast, hyperrealistic skin texture, 8K resolution --ar 2:3 --style raw", order: 6 },
  { title: "Isometric Smart City", category: "Landscape", image: "/propmt/pr7.png", text: "Isometric view of a futuristic smart city at golden hour, solar panels on every rooftop, autonomous vehicles on clean white roads, vertical gardens on skyscrapers, soft warm lighting, clean graphic style, 3D render quality, detailed, --ar 1:1 --v 6", order: 7 },
  { title: "Ancient Warrior Character", category: "Character", image: "/propmt/pr8.png", text: "Epic fantasy warrior, ancient Indian Rajput armour in gold and crimson, dramatic battle pose, monsoon storm background with lightning, extreme detail on armour engravings, hyper-realistic skin texture, cinematic lighting, close-up composition, --ar 2:3 --style raw --v 6", order: 8 },
  { title: "AI Exploding Paint Splash VFX", category: "VFX", image: "/propmt/pr9.png", text: "Slow-motion explosion of multicolour paint against pure black background, hyper-realistic paint physics, droplets frozen in time, vivid saturated reds blues greens, studio strobe lighting, ultra-high-speed photography style, 8K --ar 16:9 --style raw", order: 9 },
  { title: "Cinematic Ocean Storm", category: "Landscape", image: "/propmt/pr10.png", text: "Massive cargo ship battling a 100-foot rogue wave in a North Atlantic storm, dramatic grey sky with lightning, spray and foam, low camera angle at water level, cinematic anamorphic lens, ultra-realistic ocean simulation, photographic quality, --ar 21:9 --v 6", order: 10 },
  { title: "Tech Product Reveal", category: "Product", image: "/propmt/pr11.png", text: "Next-gen wireless earbuds floating on a gradient blue-to-purple studio background, dramatic side lighting highlighting product curves, metallic finish with holographic accents, minimalist composition, Apple-style commercial photography, 4K --ar 1:1 --style raw", order: 11 },
  { title: "Dramatic Sunset Portrait", category: "Cinematic", image: "/propmt/pr12.png", text: "Silhouette of a lone filmmaker standing on a hilltop at sunset, golden hour orange and purple sky, camera on tripod, cinematic wide shot, dust particles in air, dramatic rays of light through clouds, moody atmospheric, 8K, --ar 16:9 --v 6", order: 12 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const existing = await Prompt.countDocuments();
  if (existing > 0) {
    console.log(`${existing} prompts already in DB — skipping seed. Delete them first if you want to re-seed.`);
    await mongoose.disconnect();
    return;
  }

  const docs = PROMPTS.map(p => ({ ...p, isPublished: true }));
  await Prompt.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} prompts`);
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
