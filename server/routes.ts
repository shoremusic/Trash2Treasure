import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertPostSchema, 
  insertCommentSchema, 
  insertKudosSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

function validateSessionUser(req: Request): number | null {
  // Check if user is authenticated using Passport
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }
  return req.user.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication with Passport
  setupAuth(app);
  
  // Post routes
  app.post('/api/posts', async (req, res) => {
    const userId = validateSessionUser(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Create post
      const postData = insertPostSchema.parse({
        ...req.body,
        userId
      });
      
      const post = await storage.createPost(postData);
      
      // Create items
      const items = req.body.items || [];
      for (const itemName of items) {
        await storage.createItem({
          postId: post.id,
          name: itemName,
          status: "available"
        });
      }
      
      // Create images - in a real implementation we'd handle file uploads
      const imageUrls = req.body.imageUrls || [];
      for (const url of imageUrls) {
        await storage.createImage({
          postId: post.id,
          url
        });
      }
      
      const postWithDetails = await storage.getPostWithDetails(post.id, userId);
      
      return res.status(201).json(postWithDetails);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create post" });
    }
  });
  
  app.get('/api/posts/nearby', async (req, res) => {
    const userId = validateSessionUser(req);
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    
    try {
      const posts = await storage.getNearbyPosts(
        latitude as string, 
        longitude as string, 
        Number(radius),
        userId || undefined
      );
      
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get nearby posts" });
    }
  });
  
  app.get('/api/posts/recent', async (req, res) => {
    const userId = validateSessionUser(req);
    const { limit = 10 } = req.query;
    
    try {
      const posts = await storage.getRecentPosts(
        Number(limit),
        userId || undefined
      );
      
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get recent posts" });
    }
  });
  
  app.get('/api/posts/user/:userId', async (req, res) => {
    const currentUserId = validateSessionUser(req);
    const { userId } = req.params;
    
    if (!currentUserId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const posts = await storage.getUserPosts(Number(userId));
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get user posts" });
    }
  });
  
  app.get('/api/posts/:id', async (req, res) => {
    const userId = validateSessionUser(req);
    const { id } = req.params;
    
    try {
      const post = await storage.getPostWithDetails(Number(id), userId || undefined);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user can view this post (participation-based)
      if (!userId || !(await storage.canUserViewImmediately(userId))) {
        // Check if post is older than 24 hours
        const now = new Date();
        const postDate = post.createdAt;
        const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
          return res.status(403).json({ 
            message: "You need to participate by posting to view recent finds immediately" 
          });
        }
      }
      
      return res.status(200).json(post);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get post" });
    }
  });
  
  app.patch('/api/posts/:id', async (req, res) => {
    const userId = validateSessionUser(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const post = await storage.getPost(Number(id));
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Update post status if provided
      if (req.body.status) {
        await storage.updatePostStatus(Number(id), req.body.status);
      }
      
      // Update item statuses if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          if (item.id && item.status) {
            await storage.updateItemStatus(item.id, item.status);
          }
        }
      }
      
      // Add new images if provided
      if (req.body.newImageUrls && Array.isArray(req.body.newImageUrls)) {
        for (const url of req.body.newImageUrls) {
          await storage.createImage({
            postId: Number(id),
            url
          });
        }
      }
      
      const updatedPost = await storage.getPostWithDetails(Number(id), userId);
      return res.status(200).json(updatedPost);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update post" });
    }
  });
  
  // Comments
  app.post('/api/posts/:id/comments', async (req, res) => {
    const userId = validateSessionUser(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const commentData = insertCommentSchema.parse({
        postId: Number(id),
        userId,
        content: req.body.content
      });
      
      const comment = await storage.createComment(commentData);
      
      // Get user to attach to response
      const user = await storage.getUser(userId);
      
      return res.status(201).json({
        ...comment,
        user: {
          id: user?.id,
          username: user?.username
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  // Kudos
  app.post('/api/posts/:id/kudos', async (req, res) => {
    const userId = validateSessionUser(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const kudosData = insertKudosSchema.parse({
        postId: Number(id),
        userId
      });
      
      const kudos = await storage.addKudos(kudosData);
      return res.status(201).json(kudos);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Failed to add kudos" });
    }
  });
  
  app.delete('/api/posts/:id/kudos', async (req, res) => {
    const userId = validateSessionUser(req);
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      await storage.removeKudos(Number(id), userId);
      return res.status(200).json({ message: "Kudos removed" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to remove kudos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
