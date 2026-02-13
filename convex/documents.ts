import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";


//归档
export const archive = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Document not found");
    }

    if (existingDocument.userId !== userId) {
      throw new Error("Not authorized");
    }

    //documents 表中某条记录的 ID
    const recursiveArchive = async (documentId: Id<"documents">) => {
      // 1. 找到当前文档的所有子文档
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q
            .eq("userId", userId)
            .eq("parentDocument", documentId)
        )
        .collect();


      // 2. 串行处理每个子文档
      //这里不使用map的原因是这里需要串行执行
      for (const child of children) {
        // 2.1 归档这个子文档
        await ctx.db.patch(child._id, {
          isArchived: true
        })
        // 2.2 递归归档这个子文档的所有子文档
        await recursiveArchive(child._id)
      }

    }

    // 先归档所有子文档
    await recursiveArchive(args.id)

    // 最后归档根文档
    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });


    return document;
  },
});

export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    const documents = await ctx.db.query("documents")
      .withIndex("by_user_parent", (q) =>
        q
          .eq("userId", userId)
          .eq("parentDocument", args.parentDocument)
      )
      .filter((q) =>
        q.eq(q.field("isArchived"), false)
      )
      .order("desc")
      .collect();

    return documents;
  },
});

//增删才能使用到mutation
export const create = mutation({
  //前端在调用这个函数时，必须传递的数据格式
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const document = await ctx.db.insert("documents", {
      title: args.title,
      userId: userId,
      parentDocument: args.parentDocument,
      isArchived: false,
      isPublished: false
    });

    return document;
  }
})

export const getTrash = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.eq(q.field("isArchived"), true)
      )
      .order("desc")
      .collect()

    return documents
  }
})

//归档恢复 文档本身加里面的所有子文件夹和文件都恢复，文档父文档不做任何处理
export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== userId) {
      throw new Error("Not authorized");
    }


    //这个递归只处理子文档，不处理父文档
    const recursiveArchive = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q
            .eq("userId", userId)
            .eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false
        })
        await recursiveArchive(child._id)
      }

    }

    //Partial 所有变成可选字段
    const options: Partial<Doc<"documents">> = {
      isArchived: false
    }

    //检查：这个文档有父文档吗？
    if (document.parentDocument) {
      const parent = await ctx.db.get(document.parentDocument)
      if (parent?.isArchived) {
        //把自己从父文档下移出来（变成根文档）
        options.parentDocument = undefined
      }
    }

    await recursiveArchive(args.id)
    await ctx.db.patch(args.id, options)

    return document
  }
})

//永久删除
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const document = await ctx.db.get(args.id);

    if (!document) {
      throw new Error("Document not found");
    }

    if (document.userId !== userId) {
      throw new Error("Not authorized");
    }

    const recursiveDelete = async (documentId: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) =>
          q
            .eq("userId", userId)
            .eq("parentDocument", documentId)
        )
        .collect();

      for (const child of children) {
        await recursiveDelete(child._id)
      }

      await ctx.db.delete(documentId)
    }

    await recursiveDelete(args.id)

    return document
  }
})

//搜索
export const getSearch = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) =>
        q
          .eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  }
})

export const getById = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new Error("Not found");
    }

    if (document.isPublished && !document.isArchived) {
      return document;
    }

    // 检查权限
    if (document.userId !== identity?.subject) {
      throw new Error("Not authorized");
    }

    return document;
  }
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;
    const { id, ...rest } = args;


    const existingDocument = await ctx.db.get(args.id)
    if (!existingDocument) {
      throw new Error("Not found")
    }
    if (existingDocument.userId !== userId) {
      throw new Error("Not authorized")
    }

    const document = await ctx.db.patch(args.id, {
      ...rest,
    })

    return document;
  }
});


export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }
    if (existingDocument.userId !== userId) {
      throw new Error("Not authorized");
    }
    const document = await ctx.db.patch(args.id, {
      icon: undefined,
    })
    return document;
  }
});

export const removeCoverImage = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const userId = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) {
      throw new Error("Not found");
    }
    if (existingDocument.userId !== userId) {
      throw new Error("Not authorized");
    }
    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    })
    return document;
  }
});