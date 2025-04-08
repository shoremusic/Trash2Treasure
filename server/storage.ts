import { 
  users, type User, type InsertUser,
  posts, type Post, type InsertPost,
  items, type Item, type InsertItem,
  images, type Image, type InsertImage,
  comments, type Comment, type InsertComment,
  kudos, type Kudos, type InsertKudos,
  type PostWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastPosted(userId: number): Promise<void>;
  updateUserKudos(userId: number, increment: number): Promise<void>;

  // Post methods
  createPost(post: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getPostWithDetails(id: number, userId?: number): Promise<PostWithDetails | undefined>;
  updatePostStatus(id: number, status: string): Promise<Post | undefined>;
  getNearbyPosts(lat: string, lng: string, radius: number, userId?: number): Promise<PostWithDetails[]>;
  getRecentPosts(limit: number, userId?: number): Promise<PostWithDetails[]>;
  getUserPosts(userId: number): Promise<PostWithDetails[]>;

  // Item methods
  createItem(item: InsertItem): Promise<Item>;
  updateItemStatus(id: number, status: string): Promise<Item | undefined>;
  getItemsByPostId(postId: number): Promise<Item[]>;

  // Image methods
  createImage(image: InsertImage): Promise<Image>;
  getImagesByPostId(postId: number): Promise<Image[]>;

  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;

  // Kudos methods
  addKudos(kudos: InsertKudos): Promise<Kudos>;
  removeKudos(postId: number, userId: number): Promise<void>;
  getKudosByPostId(postId: number): Promise<Kudos[]>;
  hasUserGivenKudos(postId: number, userId: number): Promise<boolean>;

  // Participation check
  canUserViewImmediately(userId?: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private items: Map<number, Item[]>;
  private images: Map<number, Image[]>;
  private comments: Map<number, Comment[]>;
  private kudos: Map<number, Kudos[]>;
  
  private userId: number;
  private postId: number;
  private itemId: number;
  private imageId: number;
  private commentId: number;
  private kudosId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.items = new Map();
    this.images = new Map();
    this.comments = new Map();
    this.kudos = new Map();

    this.userId = 1;
    this.postId = 1;
    this.itemId = 1;
    this.imageId = 1;
    this.commentId = 1;
    this.kudosId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      lastPosted: null,
      kudos: 0,
      canViewImmediately: false
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLastPosted(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.lastPosted = new Date();
      user.canViewImmediately = true;
      this.users.set(userId, user);
    }
  }

  async updateUserKudos(userId: number, increment: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.kudos += increment;
      this.users.set(userId, user);
    }
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postId++;
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertPost.status || "available",
      description: insertPost.description || null
    };
    this.posts.set(id, post);
    
    // Update user's last posted time
    await this.updateUserLastPosted(insertPost.userId);
    
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async updatePostStatus(id: number, status: string): Promise<Post | undefined> {
    const post = await this.getPost(id);
    if (post) {
      post.status = status;
      post.updatedAt = new Date();
      this.posts.set(id, post);
      return post;
    }
    return undefined;
  }

  async getPostWithDetails(id: number, userId?: number): Promise<PostWithDetails | undefined> {
    const post = await this.getPost(id);
    if (!post) return undefined;

    const user = await this.getUser(post.userId);
    if (!user) return undefined;

    const postItems = await this.getItemsByPostId(id);
    const postImages = await this.getImagesByPostId(id);
    const postComments = await this.getCommentsByPostId(id);
    const postKudos = await this.getKudosByPostId(id);
    const userKudos = userId ? await this.hasUserGivenKudos(id, userId) : false;

    return {
      ...post,
      user,
      items: postItems,
      images: postImages,
      comments: postComments,
      kudosCount: postKudos.length,
      userKudos
    };
  }

  async getNearbyPosts(lat: string, lng: string, radius: number, userId?: number): Promise<PostWithDetails[]> {
    // In a real implementation, this would use geospatial queries
    // For now, we'll just return all posts
    const allPosts = Array.from(this.posts.values());
    const result: PostWithDetails[] = [];
    
    for (const post of allPosts) {
      const postWithDetails = await this.getPostWithDetails(post.id, userId);
      if (postWithDetails) {
        // Apply delayed viewing logic
        if (await this.canUserViewImmediately(userId) || this.isPostOlderThan24Hours(post)) {
          result.push(postWithDetails);
        }
      }
    }
    
    return result;
  }

  async getRecentPosts(limit: number, userId?: number): Promise<PostWithDetails[]> {
    const allPosts = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const result: PostWithDetails[] = [];
    
    for (const post of allPosts) {
      const postWithDetails = await this.getPostWithDetails(post.id, userId);
      if (postWithDetails) {
        // Apply delayed viewing logic
        if (await this.canUserViewImmediately(userId) || this.isPostOlderThan24Hours(post)) {
          result.push(postWithDetails);
        }
      }
    }
    
    return result;
  }

  async getUserPosts(userId: number): Promise<PostWithDetails[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId);
    
    const result: PostWithDetails[] = [];
    
    for (const post of userPosts) {
      const postWithDetails = await this.getPostWithDetails(post.id, userId);
      if (postWithDetails) {
        result.push(postWithDetails);
      }
    }
    
    return result;
  }

  private isPostOlderThan24Hours(post: Post): boolean {
    const now = new Date();
    const postDate = post.createdAt;
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  }

  // Item methods
  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.itemId++;
    const item: Item = { 
      ...insertItem, 
      id,
      status: insertItem.status || "available"
    };
    
    const postItems = this.items.get(insertItem.postId) || [];
    postItems.push(item);
    this.items.set(insertItem.postId, postItems);
    
    return item;
  }

  async updateItemStatus(id: number, status: string): Promise<Item | undefined> {
    // Use the downlevelIteration flag for iterating Map.entries()
    for (const entry of Array.from(this.items.entries())) {
      const [postId, postItems] = entry;
      const itemIndex = postItems.findIndex((item: Item) => item.id === id);
      if (itemIndex !== -1) {
        postItems[itemIndex].status = status;
        this.items.set(postId, postItems);
        return postItems[itemIndex];
      }
    }
    return undefined;
  }

  async getItemsByPostId(postId: number): Promise<Item[]> {
    return this.items.get(postId) || [];
  }

  // Image methods
  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.imageId++;
    const createdAt = new Date();
    const image: Image = { ...insertImage, id, createdAt };
    
    const postImages = this.images.get(insertImage.postId) || [];
    postImages.push(image);
    this.images.set(insertImage.postId, postImages);
    
    return image;
  }

  async getImagesByPostId(postId: number): Promise<Image[]> {
    return this.images.get(postId) || [];
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const createdAt = new Date();
    const comment: Comment = { ...insertComment, id, createdAt };
    
    const postComments = this.comments.get(insertComment.postId) || [];
    postComments.push(comment);
    this.comments.set(insertComment.postId, postComments);
    
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return this.comments.get(postId) || [];
  }

  // Kudos methods
  async addKudos(insertKudos: InsertKudos): Promise<Kudos> {
    // Check if user already gave kudos to this post
    const hasKudos = await this.hasUserGivenKudos(insertKudos.postId, insertKudos.userId);
    if (hasKudos) {
      throw new Error("User already gave kudos to this post");
    }
    
    const id = this.kudosId++;
    const createdAt = new Date();
    const kudosEntry: Kudos = { ...insertKudos, id, createdAt };
    
    const postKudos = this.kudos.get(insertKudos.postId) || [];
    postKudos.push(kudosEntry);
    this.kudos.set(insertKudos.postId, postKudos);
    
    // Get post to update user kudos
    const post = await this.getPost(insertKudos.postId);
    if (post) {
      await this.updateUserKudos(post.userId, 1);
    }
    
    return kudosEntry;
  }

  async removeKudos(postId: number, userId: number): Promise<void> {
    const postKudos = this.kudos.get(postId) || [];
    const updatedKudos = postKudos.filter(k => k.userId !== userId);
    
    // If kudos was removed, decrease user kudos count
    if (updatedKudos.length < postKudos.length) {
      const post = await this.getPost(postId);
      if (post) {
        await this.updateUserKudos(post.userId, -1);
      }
    }
    
    this.kudos.set(postId, updatedKudos);
  }

  async getKudosByPostId(postId: number): Promise<Kudos[]> {
    return this.kudos.get(postId) || [];
  }

  async hasUserGivenKudos(postId: number, userId: number): Promise<boolean> {
    const postKudos = this.kudos.get(postId) || [];
    return postKudos.some(k => k.userId === userId);
  }

  // Participation check - users who posted in the last 7 days can view immediately
  async canUserViewImmediately(userId?: number): Promise<boolean> {
    if (!userId) return false;
    
    const user = await this.getUser(userId);
    if (!user || !user.lastPosted) return false;
    
    const now = new Date();
    const lastPosted = user.lastPosted;
    const diffDays = (now.getTime() - lastPosted.getTime()) / (1000 * 60 * 60 * 24);
    
    return diffDays <= 7;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ 
        ...insertUser, 
        canViewImmediately: false 
      })
      .returning();
    return user;
  }

  async updateUserLastPosted(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastPosted: new Date(),
        canViewImmediately: true 
      })
      .where(eq(users.id, userId));
  }

  async updateUserKudos(userId: number, increment: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        kudos: sql`${users.kudos} + ${increment}` 
      })
      .where(eq(users.id, userId));
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    
    // Update user's last posted time and status
    await this.updateUserLastPosted(insertPost.userId);
    
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async updatePostStatus(id: number, status: string): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async getPostWithDetails(id: number, userId?: number): Promise<PostWithDetails | undefined> {
    const post = await this.getPost(id);
    if (!post) return undefined;

    const [user] = await db.select().from(users).where(eq(users.id, post.userId));
    if (!user) return undefined;

    const postItems = await this.getItemsByPostId(id);
    const postImages = await this.getImagesByPostId(id);
    const postComments = await this.getCommentsByPostId(id);
    const postKudos = await this.getKudosByPostId(id);
    const userKudos = userId ? await this.hasUserGivenKudos(id, userId) : false;

    return {
      ...post,
      user,
      items: postItems,
      images: postImages,
      comments: postComments,
      kudosCount: postKudos.length,
      userKudos
    };
  }

  async getNearbyPosts(lat: string, lng: string, radius: number, userId?: number): Promise<PostWithDetails[]> {
    // In a real implementation, this would use geospatial queries
    // For now, we'll use a simplified approach based on string matching of coordinates
    // to demonstrate the database workflow
    const allPosts = await db.select().from(posts);
    const result: PostWithDetails[] = [];
    
    for (const post of allPosts) {
      const postWithDetails = await this.getPostWithDetails(post.id, userId);
      if (postWithDetails) {
        // Apply delayed viewing logic
        if (await this.canUserViewImmediately(userId) || this.isPostOlderThan24Hours(post)) {
          result.push(postWithDetails);
        }
      }
    }
    
    return result;
  }

  async getRecentPosts(limit: number, userId?: number): Promise<PostWithDetails[]> {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    
    const result: PostWithDetails[] = [];
    
    for (const post of allPosts) {
      const postWithDetails = await this.getPostWithDetails(post.id, userId);
      if (postWithDetails) {
        // Apply delayed viewing logic
        if (await this.canUserViewImmediately(userId) || this.isPostOlderThan24Hours(post)) {
          result.push(postWithDetails);
        }
      }
    }
    
    return result;
  }

  async getUserPosts(userId: number): Promise<PostWithDetails[]> {
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId));
    
    const result: PostWithDetails[] = [];
    
    for (const post of userPosts) {
      const postWithDetails = await this.getPostWithDetails(post.id, userId);
      if (postWithDetails) {
        result.push(postWithDetails);
      }
    }
    
    return result;
  }

  private isPostOlderThan24Hours(post: Post): boolean {
    const now = new Date();
    const postDate = post.createdAt;
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  }

  // Item methods
  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateItemStatus(id: number, status: string): Promise<Item | undefined> {
    const [updatedItem] = await db
      .update(items)
      .set({ status })
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }

  async getItemsByPostId(postId: number): Promise<Item[]> {
    return db.select().from(items).where(eq(items.postId, postId));
  }

  // Image methods
  async createImage(insertImage: InsertImage): Promise<Image> {
    const [image] = await db
      .insert(images)
      .values(insertImage)
      .returning();
    return image;
  }

  async getImagesByPostId(postId: number): Promise<Image[]> {
    return db.select().from(images).where(eq(images.postId, postId));
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.postId, postId));
  }

  // Kudos methods
  async addKudos(insertKudos: InsertKudos): Promise<Kudos> {
    // Check if user already gave kudos to this post
    const hasKudos = await this.hasUserGivenKudos(insertKudos.postId, insertKudos.userId);
    if (hasKudos) {
      throw new Error("User already gave kudos to this post");
    }
    
    const [kudosEntry] = await db
      .insert(kudos)
      .values(insertKudos)
      .returning();
    
    // Get post to update user kudos
    const post = await this.getPost(insertKudos.postId);
    if (post) {
      await this.updateUserKudos(post.userId, 1);
    }
    
    return kudosEntry;
  }

  async removeKudos(postId: number, userId: number): Promise<void> {
    // Get post before removing kudos
    const post = await this.getPost(postId);
    
    // Check if kudos exists
    const hasKudos = await this.hasUserGivenKudos(postId, userId);
    
    if (hasKudos && post) {
      // Remove kudos
      await db
        .delete(kudos)
        .where(and(
          eq(kudos.postId, postId),
          eq(kudos.userId, userId)
        ));
      
      // Update user kudos count
      await this.updateUserKudos(post.userId, -1);
    }
  }

  async getKudosByPostId(postId: number): Promise<Kudos[]> {
    return db.select().from(kudos).where(eq(kudos.postId, postId));
  }

  async hasUserGivenKudos(postId: number, userId: number): Promise<boolean> {
    const [kudosEntry] = await db
      .select()
      .from(kudos)
      .where(and(
        eq(kudos.postId, postId),
        eq(kudos.userId, userId)
      ));
    return !!kudosEntry;
  }

  // Participation check - users who posted in the last 7 days can view immediately
  async canUserViewImmediately(userId?: number): Promise<boolean> {
    if (!userId) return false;
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return false;
    
    return user.canViewImmediately;
  }
}

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();
