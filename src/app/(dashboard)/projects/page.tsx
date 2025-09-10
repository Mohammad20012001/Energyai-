"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Loader2, Trash2, Sun, Zap, DollarSign, Calendar, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getProjectsAction, deleteProjectAction } from "@/app/actions/projects";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { type OptimizeDesignOutput } from "@/ai/tool-schemas";


interface Project {
  id: string;
  name: string;
  createdAt: Date;
  design: OptimizeDesignOutput;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);


  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;
      setIsLoading(true);
      const result = await getProjectsAction(user.uid);
      if (result.success && result.data) {
        setProjects(result.data as Project[]);
      } else {
        toast({ variant: "destructive", title: "فشل في جلب المشاريع", description: result.error });
      }
      setIsLoading(false);
    }
    fetchProjects();
  }, [user, toast]);

  const handleDelete = async (projectId: string) => {
    const result = await deleteProjectAction(projectId);
    if(result.success) {
      setProjects(projects.filter(p => p.id !== projectId));
      toast({title: "تم حذف المشروع بنجاح"});
    } else {
      toast({variant: "destructive", title: "فشل حذف المشروع", description: result.error});
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mr-4">جاري تحميل المشاريع...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">مشاريعي المحفوظة</h1>
        <p className="text-muted-foreground mt-2">
          هنا تجد جميع تصميمات الأنظمة الشمسية التي قمت بحفظها.
        </p>
      </div>
       {projects.length === 0 ? (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] border-dashed">
                <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <FolderKanban className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">لا توجد مشاريع محفوظة بعد</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground max-w-md">
                    اذهب إلى <span className="font-bold">محسن التصميم</span>، قم بإنشاء تصميم، ثم اضغط على "حفظ المشروع" لتجده هنا.
                </p>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map(project => (
                    <Card key={project.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{project.name}</CardTitle>
                                    <CardDescription>
                                        تم إنشاؤه في: {new Date(project.createdAt).toLocaleDateString('ar-JO')}
                                    </CardDescription>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            هذا الإجراء سيقوم بحذف المشروع نهائياً ولا يمكن التراجع عنه.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive hover:bg-destructive/90">
                                            نعم، احذف المشروع
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                <span className="flex items-center gap-2 text-muted-foreground"><Zap className="w-4 h-4"/> حجم النظام</span>
                                <span className="font-bold">{project.design.summary.optimizedSystemSize.toFixed(1)} kWp</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                <span className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4"/> التكلفة</span>
                                <span className="font-bold">{project.design.summary.totalCost.toFixed(0)} دينار</span>
                            </div>
                             <div className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4"/> الاسترداد</span>
                                <span className="font-bold">{project.design.summary.paybackPeriod.toFixed(1)} سنوات</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}
