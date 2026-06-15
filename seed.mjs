import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

// ── Courses ──────────────────────────────────────────────
const courses = [
  {
    title: 'AI Script Writing Masterclass',
    description: 'Learn to write cinematic scripts using AI tools like ChatGPT and Claude. Covers story structure, dialogue, and scene direction.',
    image: '/courses/v1.png',
    price: 999,
    originalPrice: 1999,
    duration: '6 Hours',
    isPublished: true,
    lessons: [
      { title: 'Introduction to AI Script Writing', duration: '12:30', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { title: 'Story Structure with AI', duration: '18:45', order: 2, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { title: 'Dialogue Generation Techniques', duration: '22:10', order: 3, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { title: 'Scene Direction & Visuals', duration: '15:00', order: 4, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { title: 'Final Project: Write a Short Film Script', duration: '30:00', order: 5, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    ],
  },
  {
    title: 'Animate Photos with AI',
    description: 'Turn static photos into cinematic moving sequences using Runway, Pika, and Kling AI. No animation experience required.',
    image: '/courses/v2.png',
    price: 1299,
    originalPrice: 2499,
    duration: '8 Hours',
    isPublished: true,
    lessons: [
      { title: 'Getting Started with Runway ML', duration: '10:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Motion Brush Techniques', duration: '20:15', order: 2, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Animating Portraits', duration: '25:30', order: 3, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Cinematic Camera Moves', duration: '18:00', order: 4, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Pika AI Deep Dive', duration: '22:45', order: 5, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Export & Post Processing', duration: '14:20', order: 6, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
    ],
  },
  {
    title: 'AI Avatar Masterclass',
    description: 'Create hyper-realistic AI avatars for YouTube, social media, and branding using HeyGen, D-ID, and Synthesia.',
    image: '/courses/v3.png',
    price: 799,
    originalPrice: 1599,
    duration: '5 Hours',
    isPublished: true,
    lessons: [
      { title: 'What are AI Avatars?', duration: '08:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'HeyGen Setup & First Avatar', duration: '16:30', order: 2, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Cloning Your Voice', duration: '19:15', order: 3, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Lip Sync & Language Dubbing', duration: '21:00', order: 4, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Brand Avatar for Business', duration: '17:45', order: 5, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
    ],
  },
  {
    title: 'AI Fashion Model Creation',
    description: 'Generate professional fashion model photography for e-commerce and editorial shoots using Midjourney and Adobe Firefly.',
    image: '/courses/v4.png',
    price: 1499,
    originalPrice: 2999,
    duration: '10 Hours',
    isPublished: true,
    lessons: [
      { title: 'Fashion AI Overview', duration: '09:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Midjourney Prompting for Fashion', duration: '24:00', order: 2, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Consistent Model Looks', duration: '28:30', order: 3, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Background & Lighting Control', duration: '22:15', order: 4, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'E-commerce Product Shots', duration: '30:00', order: 5, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Editorial Shoots', duration: '26:45', order: 6, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
    ],
  },
  {
    title: 'Master AI Color Restoration',
    description: 'Restore and colorize old black & white photos and films using AI. Learn Deoldify, Remini, and custom LoRA workflows.',
    image: '/courses/v5.png',
    price: 999,
    originalPrice: 1799,
    duration: '7 Hours',
    isPublished: true,
    lessons: [
      { title: 'History of Photo Restoration', duration: '07:30', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Deoldify Workflow', duration: '18:00', order: 2, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Remini for Portrait Enhancement', duration: '20:00', order: 3, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Manual Color Grading in Lightroom', duration: '25:00', order: 4, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Film Frame Restoration Project', duration: '32:00', order: 5, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
    ],
  },
  {
    title: 'AI Face Enhancement Masterclass',
    description: 'Fix, enhance, and de-age faces in photos and video using ADetailer, FaceFusion, and ComfyUI workflows.',
    image: '/courses/v6.png',
    price: 1199,
    originalPrice: 2299,
    duration: '9 Hours',
    isPublished: true,
    lessons: [
      { title: 'Intro to Face Enhancement AI', duration: '11:00', order: 1, isFree: true, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'ADetailer in Stable Diffusion', duration: '23:00', order: 2, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'FaceFusion Setup', duration: '19:30', order: 3, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'De-aging Techniques', duration: '27:00', order: 4, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Batch Processing Faces', duration: '21:15', order: 5, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { title: 'Ethical Use of Face AI', duration: '12:00', order: 6, videoUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
    ],
  },
];

// ── Workshops ─────────────────────────────────────────────
const workshops = [
  {
    title: 'AI-Driven Cinematography & Lighting Masterclass',
    description: 'A hands-on intensive covering AI-powered lighting design, camera angle generation, and cinematographic language for the modern filmmaker.',
    image: '/workshops/w1.png',
    price: 1499,
    duration: '4 Hours',
    mode: 'ONLINE',
    scheduledAt: new Date('2026-07-24T10:00:00'),
    seats: 50,
    isPublished: true,
  },
  {
    title: 'Advanced Character Design for Games & Films',
    description: 'Master AI character design workflows using Midjourney, Leonardo AI, and ControlNet. From concept to final render.',
    image: '/workshops/w2.png',
    price: 2999,
    duration: '6 Hours',
    mode: 'OFFLINE',
    scheduledAt: new Date('2026-07-28T09:00:00'),
    seats: 30,
    isPublished: true,
  },
  {
    title: 'Architectural Visualization with Unreal Engine 5',
    description: 'Create photorealistic architectural walkthroughs combining AI generation with Unreal Engine\'s Lumen lighting system.',
    image: '/workshops/w3.png',
    price: 4499,
    duration: '8 Hours',
    mode: 'ONLINE',
    scheduledAt: new Date('2026-08-05T11:00:00'),
    seats: 30,
    isPublished: false,
  },
];

// ── Bootcamps ─────────────────────────────────────────────
const bootcamps = [
  {
    title: 'AI Filmmaking Bootcamp — Cohort 4',
    description: 'An intensive 8-week program designed to take you from beginner to advanced in AI filmmaking. Learn to use generative AI for scripts, visuals, sound, and editing — and graduate with a complete short film.',
    image: '/bootcamps/b1.png',
    price: 2499,
    duration: '8 Weeks',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-09-26'),
    seats: 30,
    isPublished: true,
    syllabus: [
      { week: 1, topic: 'AI Tools Overview & Setup' },
      { week: 2, topic: 'Script Writing with AI' },
      { week: 3, topic: 'Visual Generation & Storyboarding' },
      { week: 4, topic: 'AI Video Generation' },
      { week: 5, topic: 'Voice, Music & Sound Design' },
      { week: 6, topic: 'Editing & Post-production' },
      { week: 7, topic: 'Color Grading & VFX' },
      { week: 8, topic: 'Final Film Showcase & Pitching' },
    ],
    instructors: [
      { name: 'Ravi Shankar', bio: 'Award-winning filmmaker with 12+ years in AI cinematography.' },
      { name: 'Priya Mehta', bio: 'AI researcher and visual storytelling expert.' },
    ],
  },
  {
    title: 'AI Content Creator Bootcamp — Cohort 2',
    description: 'A 6-week intensive program for aspiring creators who want to build, grow, and monetize a content channel using AI tools.',
    image: '/bootcamps/b2.png',
    price: 1799,
    duration: '6 Weeks',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-10-13'),
    seats: 40,
    isPublished: true,
    syllabus: [
      { week: 1, topic: 'Niche Selection & Channel Strategy' },
      { week: 2, topic: 'AI Script & Thumbnail Workflow' },
      { week: 3, topic: 'AI Voiceover & Avatar Creation' },
      { week: 4, topic: 'Video Editing with AI' },
      { week: 5, topic: 'YouTube SEO & Growth' },
      { week: 6, topic: 'Monetization & Brand Deals' },
    ],
    instructors: [
      { name: 'Arjun Sharma', bio: 'YouTube creator with 500K subscribers and AI content specialist.' },
    ],
  },
];

// ── Insert with duplicate guard ───────────────────────────
async function seedCollection(collectionName, data, uniqueField = 'title') {
  const col = db.collection(collectionName);
  let inserted = 0;
  for (const doc of data) {
    const exists = await col.findOne({ [uniqueField]: doc[uniqueField] });
    if (!exists) {
      await col.insertOne({ ...doc, createdAt: new Date(), updatedAt: new Date() });
      inserted++;
    }
  }
  console.log(`  ${collectionName}: ${inserted} inserted, ${data.length - inserted} already existed`);
}

await seedCollection('courses', courses);
await seedCollection('workshops', workshops);
await seedCollection('bootcamps', bootcamps);

console.log('\n✅ Seed complete.');
process.exit(0);
