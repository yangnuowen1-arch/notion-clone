"use client"

import Toolbar from "@/app/(main)/_components/toolbar";
import Cover from "@/components/cover";
import { Editor } from "@/components/editor";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
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

  const update = useMutation(api.documents.update)
  const onChange = (content: string) => {
    console.log('onChange triggered:', content)
    update({
      id: documentId,
      content
    })
  }

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
        <Editor
          initialContent={document.content}
          onChange={onChange}
          editable
        />
      </div>
    </div>
  );
}
 
export default DocumentIdPage;