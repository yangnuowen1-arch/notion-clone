"use client"

import Toolbar from "@/app/(main)/_components/toolbar";
import Cover from "@/components/cover";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { use } from "react";

interface DocumentIdPageProps{
  params: Promise<{
    documentId: Id<"documents">
  }>
}
const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { documentId } = use(params)
  const document = useQuery(api.documents.getById, {
    documentId
  })

  if(document === undefined){
    return (
      <div>
        Loading...
      </div>
    )
  }

  if (document === null) {
    return (
      <div>
        Document not found
      </div>
    )
  }
  
  return (
    <div className="pb-40">
      <Cover url={document.coverImage} />
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
        <Toolbar initialData={document} />
      </div>
    </div>
  );
}
 
export default DocumentIdPage;