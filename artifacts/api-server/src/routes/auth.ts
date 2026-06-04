import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    initials: user.initials,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      initials: user.initials,
      role: user.role,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { userId: number } };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    initials: user.initials,
    role: user.role,
  });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ ok: true });
});

export default router;
