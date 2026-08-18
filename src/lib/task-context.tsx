"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Task, Category } from "./types";
import { createClient } from "./supabase/client";

interface TaskContextValue {
  tasks: Task[];
  categories: Category[];
  profile: any | null;
  loading: boolean;
  user: any | null;
  addTask: (
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "reminderSent">
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getTasksByDate: (date: string) => Task[];
  getOverdueTasks: () => Task[];
  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  refreshData: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const supabase = createClient();

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchUserData = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setTasks([]);
        setCategories([]);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch Profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      setProfile(profData);

      // Fetch Categories
      const { data: catData, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (catErr) throw catErr;

      const mappedCats: Category[] = (catData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      }));
      setCategories(mappedCats);

      // Fetch Tasks with Joined task_categories
      const { data: taskData, error: taskErr } = await supabase
        .from("tasks")
        .select(`
          *,
          task_categories (
            category_id
          )
        `)
        .order("date", { ascending: true });

      if (taskErr) throw taskErr;

      const mappedTasks: Task[] = (taskData || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        date: t.date,
        startTime: t.start_time || undefined,
        endTime: t.end_time || undefined,
        isImportant: Boolean(t.is_important),
        isUrgent: Boolean(t.is_urgent),
        status: t.status as "pending" | "completed",
        reminderAt: t.reminder_at || undefined,
        reminderSent: Boolean(t.reminder_sent),
        categoryIds: (t.task_categories || []).map((tc: any) => tc.category_id),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTasks(mappedTasks);
    } catch (err) {
      console.error("Error fetching user data from Supabase:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserData();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, supabase]);

  const addTask = useCallback(
    async (t: Omit<Task, "id" | "createdAt" | "updatedAt" | "reminderSent">) => {
      if (!user) return;
      try {
        const { data: newTask, error: taskErr } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            title: t.title,
            description: t.description || null,
            date: t.date,
            start_time: t.startTime || null,
            end_time: t.endTime || null,
            is_important: t.isImportant,
            is_urgent: t.isUrgent,
            status: t.status,
            reminder_at: t.reminderAt || null,
          })
          .select()
          .single();

        if (taskErr) throw taskErr;

        // Insert category junctions
        if (t.categoryIds && t.categoryIds.length > 0) {
          const junctions = t.categoryIds.map((cid) => ({
            task_id: newTask.id,
            category_id: cid,
          }));
          await supabase.from("task_categories").insert(junctions);
        }

        await fetchUserData();
      } catch (err) {
        console.error("Error adding task to Supabase:", err);
      }
    },
    [user, supabase, fetchUserData]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return;
      const nextStatus = current.status === "pending" ? "completed" : "pending";

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );

      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
      } catch (err) {
        console.error("Error toggling task status:", err);
        await fetchUserData();
      }
    },
    [tasks, supabase, fetchUserData]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Error deleting task:", err);
        await fetchUserData();
      }
    },
    [supabase, fetchUserData]
  );

  const addCategory = useCallback(
    async (cat: Omit<Category, "id">) => {
      if (!user) return;
      try {
        const { error } = await supabase.from("categories").insert({
          user_id: user.id,
          name: cat.name,
          color: cat.color,
        });
        if (error) throw error;
        await fetchUserData();
      } catch (err) {
        console.error("Error adding category:", err);
      }
    },
    [user, supabase, fetchUserData]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
        await fetchUserData();
      } catch (err) {
        console.error("Error deleting category:", err);
      }
    },
    [supabase, fetchUserData]
  );

  const getTasksByDate = useCallback(
    (date: string) => tasks.filter((t) => t.date === date),
    [tasks]
  );

  const getOverdueTasks = useCallback(
    () => tasks.filter((t) => t.date < todayStr && t.status === "pending"),
    [tasks, todayStr]
  );

  const getTodayTasks = useCallback(
    () => tasks.filter((t) => t.date === todayStr),
    [tasks, todayStr]
  );

  const getUpcomingTasks = useCallback(
    () =>
      tasks
        .filter((t) => t.date > todayStr && t.status === "pending")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [tasks, todayStr]
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        categories,
        profile,
        loading,
        user,
        addTask,
        toggleTask,
        deleteTask,
        addCategory,
        deleteCategory,
        getTasksByDate,
        getOverdueTasks,
        getTodayTasks,
        getUpcomingTasks,
        refreshData: fetchUserData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
}
