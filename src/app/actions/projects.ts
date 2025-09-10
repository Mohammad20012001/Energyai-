"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { OptimizeDesignOutputSchema } from "@/ai/tool-schemas";

const SaveProjectInputSchema = z.object({
  name: z.string().min(1, "Project name cannot be empty."),
  userId: z.string().min(1, "User ID must be provided."),
  design: OptimizeDesignOutputSchema,
});

type SaveProjectInput = z.infer<typeof SaveProjectInputSchema>;

export async function saveProjectAction(
  input: SaveProjectInput
): Promise<{ success: boolean; data?: { projectId: string }; error?: string }> {
  try {
    const validatedInput = SaveProjectInputSchema.parse(input);
    
    const docRef = await addDoc(collection(db, "projects"), {
      ...validatedInput,
      createdAt: serverTimestamp(),
    });

    return { success: true, data: { projectId: docRef.id } };

  } catch (error) {
    console.error("Error in saveProjectAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "البيانات المدخلة غير صالحة." };
    }
    const errorMessage = (error instanceof Error) ? error.message : "فشل في حفظ المشروع.";
    return { success: false, error: errorMessage };
  }
}

export async function getProjectsAction(
  userId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }
    
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to JS Date
      createdAt: doc.data().createdAt?.toDate()
    }));

    return { success: true, data: projects };

  } catch (error) {
    console.error("Error in getProjectsAction:", error);
    const errorMessage = (error instanceof Error) ? error.message : "فشل في جلب المشاريع.";
    return { success: false, error: errorMessage };
  }
}


export async function deleteProjectAction(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!projectId) {
      throw new Error("Project ID is required.");
    }
    
    await deleteDoc(doc(db, "projects", projectId));

    return { success: true };

  } catch (error) {
    console.error("Error in deleteProjectAction:", error);
    const errorMessage = (error instanceof Error) ? error.message : "فشل في حذف المشروع.";
    return { success: false, error: errorMessage };
  }
}
