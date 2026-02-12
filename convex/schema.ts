import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  documents: defineTable({
    title: v.string(),//文档标题
    userId: v.string(),//用户ID
    isArchived: v.boolean(),//是否归档
    parentDocument: v.optional(v.id("documents")),//父文档ID
    content: v.optional(v.string()),//文档内容
    coverImage: v.optional(v.string()),//封面图片
    icon: v.optional(v.string()),//图标
    isPublished: v.boolean(),
  })
    //加速查询 索引
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"])
})