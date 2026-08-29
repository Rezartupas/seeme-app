"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { Task, Category, Profile } from "./types";
import { createClient } from "./supabase/client";

interface TaskContextValue {
  tasks: Task[];
  categories: Category[];
  profile: Profile | null;
  loading: boolean;
  user: User | null;
  addTask: (
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "reminderSent">
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTasks: (ids: string[]) => Promise<void>;
  deleteTasks: (ids: string[]) => Promise<void>;
  rescheduleTask: (id: string, newDate: string) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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
      if (profData) {
        setProfile(profData as Profile);
      }

      // Fetch Categories
      const { data: catData, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (catErr) throw catErr;

      interface DbCategory {
        id: string;
        name: string;
        color: string;
      }

      const mappedCats: Category[] = ((catData as DbCategory[]) || []).map((c) => ({
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

      interface DbTask {
        id: string;
        title: string;
        description: string | null;
        date: string;
        start_time: string | null;
        end_time: string | null;
        is_important: boolean;
        is_urgent: boolean;
        is_shared: boolean;
        status: string;
        reminder_at: string | null;
        reminder_sent: boolean;
        task_categories?: { category_id: string }[];
        created_at: string;
        updated_at: string;
      }

      const mappedTasks: Task[] = ((taskData as DbTask[]) || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        date: t.date,
        startTime: t.start_time || undefined,
        endTime: t.end_time || undefined,
        isImportant: Boolean(t.is_important),
        isUrgent: Boolean(t.is_urgent),
        isShared: Boolean(t.is_shared),
        status: t.status as "pending" | "completed",
        reminderAt: t.reminder_at || undefined,
        reminderSent: Boolean(t.reminder_sent),
        categoryIds: (t.task_categories || []).map((tc) => tc.category_id),
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
    let mounted = true;

    const initData = async () => {
      if (mounted) {
        await fetchUserData();
      }
    };

    initData();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        initData();
      }
    });

    return () => {
      mounted = false;
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
            is_shared: t.isShared ?? false,
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

        if (t.isShared) {
          const startIso = t.date
            ? t.startTime
              ? new Date(`${t.date}T${t.startTime}`).toISOString()
              : new Date(`${t.date}T00:00:00`).toISOString()
            : null;
          const endIso = t.date
            ? t.endTime
              ? new Date(`${t.date}T${t.endTime}`).toISOString()
              : new Date(`${t.date}T23:59:59`).toISOString()
            : null;
          await supabase.from("activities").upsert({
            user_id: user.id,
            task_id: newTask.id,
            type: "task_shared",
            title: t.title,
            status: t.status,
            start_time: startIso,
            end_time: endIso,
          }, { onConflict: "task_id" });
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

        // Sync activity snapshot if task is shared
        const { data: actRow } = await supabase
          .from("activities")
          .select("id")
          .eq("task_id", id)
          .maybeSingle();
        if (actRow) {
          await supabase
            .from("activities")
            .update({
              status: nextStatus,
              type: nextStatus === "completed" ? "task_completed" : "task_shared",
            })
            .eq("task_id", id);
        }
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

  const restoreTasks = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      const idSet = new Set(ids);
      setTasks((prev) =>
        prev.map((t) => (idSet.has(t.id) ? { ...t, status: "pending" } : t))
      );
      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .in("id", ids);

        if (error) throw error;
      } catch (err) {
        console.error("Error restoring tasks:", err);
        await fetchUserData();
      }
    },
    [supabase, fetchUserData]
  );

  const deleteTasks = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      const idSet = new Set(ids);
      setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
      try {
        const { error } = await supabase.from("tasks").delete().in("id", ids);
        if (error) throw error;
      } catch (err) {
        console.error("Error deleting multiple tasks:", err);
        await fetchUserData();
      }
    },
    [supabase, fetchUserData]
  );

  const rescheduleTask = useCallback(
    async (id: string, newDate: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, date: newDate } : t))
      );
      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            date: newDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
      } catch (err) {
        console.error("Error rescheduling task:", err);
        await fetchUserData();
      }
    },
    [supabase, fetchUserData]
  );

  const updateProfileName = useCallback(
    async (name: string) => {
      if (!user) return;
      setProfile((prev) => (prev ? { ...prev, name } : null));

      try {
        const { error: userError } = await supabase.auth.updateUser({
          data: { full_name: name, name },
        });
        if (userError) console.warn("Supabase auth user metadata update:", userError);

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ name })
          .eq("id", user.id);
        if (profileError) {
          console.warn("Profile table update warning:", profileError);
        }

        await fetchUserData();
      } catch (err) {
        console.error("Error updating profile name:", err);
      }
    },
    [user, supabase, fetchUserData]
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
    () => {
      const today = getLocalDateStr();
      return tasks.filter((t) => t.date < today && t.status === "pending");
    },
    [tasks]
  );

  const getTodayTasks = useCallback(
    () => {
      const today = getLocalDateStr();
      return tasks.filter((t) => t.date === today);
    },
    [tasks]
  );

  const getUpcomingTasks = useCallback(
    () => {
      const today = getLocalDateStr();
      return tasks
        .filter((t) => t.date > today && t.status === "pending")
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [tasks]
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
        restoreTasks,
        deleteTasks,
        rescheduleTask,
        updateProfileName,
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
