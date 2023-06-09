import { NextFunction, Request, Response } from "express";
import { Memory, PrismaClient } from "@prisma/client";
import { z } from "zod";
import fs from "fs";
import slug from "slug";
import crypto from "crypto";
import lodash from "lodash";

import { MemoryType } from "@/utils/options";

const prisma = new PrismaClient();

class MemoriesControllers {
  // TODO: create memory
  async createMemory(req: Request, res: Response) {
    const bodyData = req.body;

    const { body, slug, title, images, place, category, tags, memoryType } = z
      .object({
        slug: z.string({ required_error: "⚠️ Slug is required 🔥" }).trim(),
        title: z
          .string({ required_error: "⚠️ Title is required 🔥" })
          .max(100, "⚠️ Title is too long 🔥")
          .trim(),
        body: z.string({ required_error: "⚠️ body is required 🔥" }).trim(),
        images: z.string().array().optional(),
        place: z
          .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            country: z.string().optional(),
            zip: z.string().optional(),
          })
          .optional(),
        tags: z.string({ required_error: "⚠️ Tags name is required 🔥" }),
        category: z.string({ required_error: "⚠️ category is required 🔥" }),
        memoryType: z.nativeEnum(MemoryType),
      })
      .parse(bodyData);

    const tagsArr = tags.split(",");

    if (!req.user) {
      res.status(404);
      throw new Error("⚠️ User not found ❌");
    }

    const memory = await prisma.memory.create({
      data: {
        user: { connect: { id: req.user.id } },
        body,
        slug,
        title,
        images,
        category,
        memoryType,
        tags: tagsArr,
        place: { create: { ...place } },
      },
      include: {
        place: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            userType: true,
            email: true,
            avatar: true,
          },
        },
        comments: true,
      },
    });

    res.status(201).json(memory);
  }

  // TODO: get all memories with condition
  async getAllMemories(req: Request, res: Response) {
    let memories: Memory[] | null;

    if (req.readPermission === "Public") {
      memories = await prisma.memory.findMany({
        where: { AND: { memoryType: "Public" } },
        include: {
          place: { select: { country: true } },
          user: {
            select: { id: true, name: true, avatar: true, username: true },
          },
        },
      });
      res.status(201).json(memories);
    } else if (req.readPermission === "Private") {
      if (!req.user) {
        res.status(403);
        throw new Error("⚠️ un auth 🔥");
      }
      memories = await prisma.memory.findMany({
        where: { NOT: { memoryType: "Secret" } },
        include: {
          place: { select: { country: true } },
          user: {
            select: { id: true, name: true, avatar: true, username: true },
          },
        },
      });

      const memoriesSecret = await prisma.memory.findMany({
        where: {
          AND: [
            { memoryType: "Secret" },
            { joined: { hasEvery: [req.user.id] } },
          ],
        },
        include: {
          place: { select: { country: true } },
          user: {
            select: { id: true, name: true, avatar: true, username: true },
          },
        },
      });
      res.status(201).json([...memories, ...memoriesSecret]);
    }
  }

  // TODO: delete photo
  async deleteMemoryPhoto(req: Request, res: Response, next: NextFunction) {
    const photoName = req.query.photoName;

    if (!photoName) {
      res.status(404);
      throw new Error("⚠️ Photo name not found! 🔥");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fs.stat(`./public/memory/${photoName}`, function (err, state) {
      if (err) return next(err);
      else {
        fs.unlink(`./public/memory/${photoName}`, function (err) {
          if (err) return next(err);
          else {
            res.status(200).json({ success: true, photoName });
          }
        });
      }
    });
  }

  // TODO: get memory by slug
  async memoryDetails(req: Request, res: Response) {
    console.log("query 😍😍😍 ", req.params);

    const slug = req.params.slug as string;

    if (!slug) {
      res.status(404);
      throw new Error("🔥 slug not found! ⚠️");
    }

    const memory = await prisma.memory.findFirst({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            userType: true,
            email: true,
            avatar: true,
          },
        },
        place: true,
      },
    });

    if (memory?.memoryType === "Private") {
      if (req.user) {
        res.status(200).json(memory);
      } else {
        res.status(403);
        throw new Error("🔥 Memory is private, please login! ⚠️");
      }
    } else if (memory?.memoryType === "Secret") {
      if (req.user) {
        if (lodash.includes(memory.joined, req.user?.id)) {
          res.status(200).json(memory);
        } else {
          res.status(403);
          throw new Error("🔥 Your don't have permission to the memory! ⚠️");
        }
      } else {
        res.status(403);
        throw new Error("🔥 Memory is Secret, please login! ⚠️");
      }
    } else if (memory?.memoryType === "Public") {
      res.status(200).json(memory);
    }
  }

  // TODO: slug generator
  async slugGenerator(req: Request, res: Response) {
    const slugBody = req.body.slug;

    if (!slug) {
      res.status(500);
      throw new Error("⚠️ Slug not found 🐼");
    }
    let generatedSlug = slug(slugBody, "-");

    const isExistingSlug = await prisma.memory.findFirst({
      where: { slug: generatedSlug },
    });

    if (isExistingSlug) {
      generatedSlug =
        generatedSlug + "-" + crypto.randomBytes(5).toString("hex");
    }

    res.status(201).json({ success: true, slug: generatedSlug });
  }
}

export default new MemoriesControllers();
