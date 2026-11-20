// Generates data/profiles.json and placeholder SVG avatars in public/avatars.
// Run with: npm run seed
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// likesYou = this profile has already liked the logged-in user (server-side secret).
const people = [
  ["Aarav", 21, "IIT Delhi", "Chai > coffee. Will beat you at FIFA.", ["Football", "Gaming", "Chai"], true],
  ["Ananya", 20, "Delhi University", "Bookworm with a sarcasm problem.", ["Reading", "Poetry", "Indie music"], true],
  ["Rohan", 22, "BITS Pilani", "Building side projects at 2 AM.", ["Coding", "Startups", "Cycling"], false],
  ["Ishita", 21, "Mumbai", "Dancer. Overthinker. Dog person.", ["Dance", "Dogs", "Travel"], true],
  ["Kabir", 23, "Bengaluru", "Weekend trekker, weekday spreadsheet guy.", ["Trekking", "Photography", "Finance"], false],
  ["Meera", 20, "Ashoka University", "Philosophy major, meme minor.", ["Philosophy", "Memes", "Coffee"], true],
  ["Vihaan", 22, "NIT Trichy", "Guitarist in a band that has no name yet.", ["Guitar", "Music", "Anime"], false],
  ["Saanvi", 19, "Pune", "Sketching strangers at cafes.", ["Art", "Cafes", "Journaling"], false],
  ["Arjun", 24, "Hyderabad", "Gym, biryani, repeat.", ["Fitness", "Food", "Cricket"], true],
  ["Diya", 21, "St. Stephen's College", "Debate society. I will win this argument.", ["Debating", "Politics", "Quizzing"], false],
  ["Reyansh", 22, "IIM Ahmedabad", "Case studies and chai breaks.", ["Business", "Chess", "Chai"], false],
  ["Navya", 20, "Jaipur", "Thrifting queen and playlist curator.", ["Fashion", "Thrifting", "Playlists"], true],
  ["Aditya", 23, "Delhi", "Stand-up open mic regular.", ["Comedy", "Writing", "Movies"], false],
  ["Kiara", 21, "Christ University", "Pottery on Sundays.", ["Pottery", "Yoga", "Plants"], false],
  ["Ishaan", 22, "IIT Bombay", "Robotics nerd. Surprisingly social.", ["Robotics", "Badminton", "Sci-fi"], true],
  ["Tara", 20, "Chandigarh", "Road trips and bad karaoke.", ["Road trips", "Karaoke", "Baking"], false],
  ["Dev", 24, "Gurugram", "Product manager who hikes.", ["Hiking", "Podcasts", "Coffee"], false],
  ["Myra", 19, "Lady Shri Ram College", "Aspiring journalist, professional snacker.", ["Journalism", "Snacks", "Theatre"], true],
  ["Yash", 21, "VIT Vellore", "Valorant and late night maggi.", ["Gaming", "Maggi", "Football"], false],
  ["Riya", 22, "Kolkata", "Rabindra sangeet and rooftop sunsets.", ["Music", "Sunsets", "Photography"], false],
  ["Neil", 23, "Goa", "Surfer who actually codes.", ["Surfing", "Coding", "Beaches"], true],
  ["Zoya", 21, "Jamia Millia Islamia", "Architecture student, coffee-powered.", ["Architecture", "Sketching", "Coffee"], false],
  ["Krish", 20, "Delhi Technological University", "Trying to learn salsa.", ["Salsa", "Cooking", "Cricket"], false],
  ["Anika", 22, "Pune", "Marathon runner and cat parent.", ["Running", "Cats", "Brunch"], true],
  ["Samar", 24, "Lucknow", "Poetry, kebabs, and old Bollywood.", ["Poetry", "Food", "Bollywood"], false],
  ["Pihu", 19, "Noida", "Dance reels and skincare nerd.", ["Dance", "Skincare", "Reels"], false],
  ["Ayaan", 23, "Chennai", "Carnatic vocals meet lo-fi beats.", ["Music", "Lo-fi", "Filter coffee"], false],
  ["Sia", 21, "Ahmedabad", "Entrepreneur in the making, garba fan.", ["Startups", "Garba", "Travel"], true],
  ["Veer", 22, "Shimla", "Mountains are my therapist.", ["Mountains", "Camping", "Chess"], false],
  ["Mahi", 20, "Indore", "Poha, pottery, and puns.", ["Pottery", "Puns", "Food"], false],
  ["Rudra", 23, "IISc Bangalore", "Researcher who swears he is fun.", ["Science", "Board games", "Running"], false],
  ["Lavanya", 21, "Mumbai University", "Film buff, will ruin your favourite movie.", ["Movies", "Writing", "Theatre"], false],
];

const palettes = [
  ["#ff6b8b", "#ffb36b"], ["#6b8bff", "#6bffd9"], ["#b36bff", "#ff6bd9"],
  ["#ff8a5b", "#ffd36b"], ["#4cc9a4", "#4c8bc9"], ["#f06595", "#845ef7"],
  ["#20c997", "#339af0"], ["#fd7e14", "#e64980"],
];

fs.mkdirSync(path.join(root, "public/avatars"), { recursive: true });
fs.mkdirSync(path.join(root, "data"), { recursive: true });

const profiles = people.map(([name, age, place, bio, interests, likesYou], i) => {
  const id = `u${String(i + 1).padStart(2, "0")}`;
  const [c1, c2] = palettes[i % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="600" height="800" fill="url(#g)"/>
<circle cx="300" cy="320" r="120" fill="rgba(255,255,255,0.28)"/>
<path d="M110 760c0-110 85-190 190-190s190 80 190 190z" fill="rgba(255,255,255,0.28)"/>
<text x="300" y="365" font-family="Arial, sans-serif" font-size="130" font-weight="700" fill="#fff" text-anchor="middle">${name[0]}</text>
</svg>`;
  fs.writeFileSync(path.join(root, `public/avatars/${id}.svg`), svg);
  return { id, name, age, photo: `/avatars/${id}.svg`, bio, location: place, interests, likesYou };
});

fs.writeFileSync(path.join(root, "data/profiles.json"), JSON.stringify(profiles, null, 2));
console.log(`Seeded ${profiles.length} profiles (${profiles.filter((p) => p.likesYou).length} already like you).`);
