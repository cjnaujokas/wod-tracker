import "dotenv/config";
import { prisma } from "../lib/prisma";

type Category = "Weightlifting" | "Gymnastics" | "Monostructural";

const movements: { name: string; category: Category }[] = [
  // Weightlifting
  { name: "Back Squat", category: "Weightlifting" },
  { name: "Front Squat", category: "Weightlifting" },
  { name: "Overhead Squat", category: "Weightlifting" },
  { name: "Deadlift", category: "Weightlifting" },
  { name: "Sumo Deadlift High Pull", category: "Weightlifting" },
  { name: "Power Clean", category: "Weightlifting" },
  { name: "Hang Power Clean", category: "Weightlifting" },
  { name: "Squat Clean", category: "Weightlifting" },
  { name: "Clean and Jerk", category: "Weightlifting" },
  { name: "Snatch", category: "Weightlifting" },
  { name: "Power Snatch", category: "Weightlifting" },
  { name: "Hang Power Snatch", category: "Weightlifting" },
  { name: "Strict Press", category: "Weightlifting" },
  { name: "Push Press", category: "Weightlifting" },
  { name: "Push Jerk", category: "Weightlifting" },
  { name: "Split Jerk", category: "Weightlifting" },
  { name: "Thruster", category: "Weightlifting" },
  { name: "Bench Press", category: "Weightlifting" },
  { name: "Kettlebell Swing", category: "Weightlifting" },
  { name: "Wall Ball", category: "Weightlifting" },
  { name: "Dumbbell Snatch", category: "Weightlifting" },
  // Gymnastics
  { name: "Air Squat", category: "Gymnastics" },
  { name: "Push-up", category: "Gymnastics" },
  { name: "Sit-up", category: "Gymnastics" },
  { name: "Lunge", category: "Gymnastics" },
  { name: "Pistol", category: "Gymnastics" },
  { name: "Burpee", category: "Gymnastics" },
  { name: "Box Jump", category: "Gymnastics" },
  { name: "Pull-up", category: "Gymnastics" },
  { name: "Chest-to-Bar Pull-up", category: "Gymnastics" },
  { name: "Toes-to-Bar", category: "Gymnastics" },
  { name: "Bar Muscle-up", category: "Gymnastics" },
  { name: "Ring Muscle-up", category: "Gymnastics" },
  { name: "Ring Dip", category: "Gymnastics" },
  { name: "Handstand Push-up", category: "Gymnastics" },
  { name: "Handstand Walk", category: "Gymnastics" },
  { name: "Rope Climb", category: "Gymnastics" },
  // Monostructural
  { name: "Run", category: "Monostructural" },
  { name: "Row", category: "Monostructural" },
  { name: "Bike", category: "Monostructural" },
  { name: "Ski Erg", category: "Monostructural" },
  { name: "Single-Under", category: "Monostructural" },
  { name: "Double-Under", category: "Monostructural" },
];

async function main() {
  for (const m of movements) {
    await prisma.movement.upsert({
      where: { name: m.name },
      update: { category: m.category },
      create: m,
    });
  }
  console.log(`Seeded ${movements.length} movements`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
