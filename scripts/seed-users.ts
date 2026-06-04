import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const users = [
  { username: "admin",       password: "Admin@2024",  fullName: "System Administrator", initials: "SA", role: "data_manager"     },
  { username: "datamanager", password: "Data@2024",   fullName: "Data Manager",         initials: "DM", role: "data_manager"     },
  { username: "fieldtech",   password: "Field@2024",  fullName: "Field Technician",     initials: "FT", role: "field_technician" },
];

for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  await pool.query(
    "INSERT INTO users (username, password_hash, full_name, initials, role) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO NOTHING",
    [u.username, hash, u.fullName, u.initials, u.role]
  );
  console.log(`✓ ${u.username} / ${u.password}  (${u.role})`);
}

await pool.end();
console.log("Done.");
