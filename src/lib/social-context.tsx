"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  Friendship,
  Activity,
  Comment,
  Reaction,
  Notification,
  PublicProfile,
} from "./types";
import { createClient } from "./supabase/client";

interface SocialContextValue {
  friends: Friendship[];
  incomingRequests: Friendship[];
  outgoingRequests: Friendship[];
  notifications: Notification[];
  unreadCount: number;
  searchUsers: (q: string) => Promise<PublicProfile[]>;
  sendFriendRequest: (addresseeId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string, requesterId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  cancelFriendRequest: (friendshipId: string) => Promise<void>;
  unfriend: (friendshipId: string) => Promise<void>;
  getFriendActivities: (friendId: string) => Promise<Activity[]>;
  getActivityComments: (activityId: string) => Promise<Comment[]>;
  getActivityReactions: (activityId: string) => Promise<Reaction[]>;
  addComment: (activityId: string, content: string, activityOwnerId: string) => Promise<void>;
  toggleReaction: (activityId: string, emoji: string, activityOwnerId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshFriends: () => Promise<void>;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function useSocialContext() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocialContext must be inside SocialProvider");
  return ctx;
}

// DB row interfaces (snake_case from Supabase)
interface DbFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

interface DbActivity {
  id: string;
  user_id: string;
  task_id: string;
  type: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  shared_at: string;
  created_at: string;
}

interface DbComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface DbReaction {
  id: string;
  activity_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface DbNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  activity_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
}

function mapFriendship(r: DbFriendship): Friendship {
  return {
    id: r.id,
    requesterId: r.requester_id,
    addresseeId: r.addressee_id,
    status: r.status as "pending" | "accepted",
    createdAt: r.created_at,
    respondedAt: r.responded_at,
  };
}

function mapActivity(r: DbActivity): Activity {
  return {
    id: r.id,
    userId: r.user_id,
    taskId: r.task_id,
    type: r.type as Activity["type"],
    title: r.title,
    status: r.status as "pending" | "completed",
    startTime: r.start_time,
    endTime: r.end_time,
    sharedAt: r.shared_at,
    createdAt: r.created_at,
  };
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFriends = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false });

    if (error) { console.error("fetchFriends:", error); return; }

    const rows = (data as DbFriendship[]) || [];
    setFriends(rows.filter((r) => r.status === "accepted").map(mapFriendship));
    setIncomingRequests(
      rows
        .filter((r) => r.status === "pending" && r.addressee_id === currentUser.id)
        .map(mapFriendship)
    );
    setOutgoingRequests(
      rows
        .filter((r) => r.status === "pending" && r.requester_id === currentUser.id)
        .map(mapFriendship)
    );
  }, [supabase]);

  const fetchNotifications = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) { console.error("fetchNotifications:", error); return; }

    const rows = (data as DbNotification[]) || [];
    setNotifications(
      rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        actorId: r.actor_id,
        type: r.type as Notification["type"],
        activityId: r.activity_id,
        commentId: r.comment_id,
        isRead: r.is_read,
        createdAt: r.created_at,
      }))
    );
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u);
      if (!u) return;
      await fetchFriends(u);
      await fetchNotifications(u);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) { fetchFriends(u); fetchNotifications(u); }
    });

    // Poll notifications every 30 seconds
    pollingRef.current = setInterval(async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) fetchNotifications(u);
    }, 30000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchFriends, fetchNotifications, supabase]);

  const refreshFriends = useCallback(async () => {
    if (user) await fetchFriends(user);
  }, [user, fetchFriends]);

  const searchUsers = useCallback(async (q: string): Promise<PublicProfile[]> => {
    if (!q.trim() || !user) return [];
    const { data, error } = await supabase
      .from("public_profiles")
      .select("id, username, name, avatar_url")
      .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(20);

    if (error) { console.error("searchUsers:", error); return []; }
    return (data as PublicProfile[]) || [];
  }, [user, supabase]);

  const sendFriendRequest = useCallback(async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) throw error;
    // Notify addressee
    await supabase.from("notifications").insert({
      user_id: addresseeId,
      actor_id: user.id,
      type: "friend_request",
    });
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const acceptFriendRequest = useCallback(
    async (friendshipId: string, requesterId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", friendshipId);
      if (error) throw error;
      // Notify requester
      await supabase.from("notifications").insert({
        user_id: requesterId,
        actor_id: user.id,
        type: "friend_accepted",
      });
      await fetchFriends(user);
    },
    [user, supabase, fetchFriends]
  );

  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const cancelFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const unfriend = useCallback(async (friendshipId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error) throw error;
    await fetchFriends(user);
  }, [user, supabase, fetchFriends]);

  const getFriendActivities = useCallback(
    async (friendId: string): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", friendId)
        .order("start_time", { ascending: true });
      if (error) { console.error("getFriendActivities:", error); return []; }
      return ((data as DbActivity[]) || []).map(mapActivity);
    },
    [supabase]
  );

  const getActivityComments = useCallback(
    async (activityId: string): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });
      if (error) { console.error("getActivityComments:", error); return []; }
      return ((data as DbComment[]) || []).map((r) => ({
        id: r.id,
        activityId: r.activity_id,
        userId: r.user_id,
        content: r.content,
        createdAt: r.created_at,
      }));
    },
    [supabase]
  );

  const getActivityReactions = useCallback(
    async (activityId: string): Promise<Reaction[]> => {
      const { data, error } = await supabase
        .from("reactions")
        .select("*")
        .eq("activity_id", activityId);
      if (error) { console.error("getActivityReactions:", error); return []; }
      return ((data as DbReaction[]) || []).map((r) => ({
        id: r.id,
        activityId: r.activity_id,
        userId: r.user_id,
        emoji: r.emoji,
        createdAt: r.created_at,
      }));
    },
    [supabase]
  );

  const addComment = useCallback(
    async (activityId: string, content: string, activityOwnerId: string) => {
      if (!user || !content.trim()) return;
      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({ activity_id: activityId, user_id: user.id, content: content.trim() })
        .select()
        .single();
      if (error) throw error;
      // Notify owner (skip if self)
      if (activityOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: activityOwnerId,
          actor_id: user.id,
          type: "comment",
          activity_id: activityId,
          comment_id: inserted.id,
        });
      }
    },
    [user, supabase]
  );

  const toggleReaction = useCallback(
    async (activityId: string, emoji: string, activityOwnerId: string) => {
      if (!user) return;
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("activity_id", activityId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("reactions").delete().eq("id", existing.id);
      } else {
        await supabase
          .from("reactions")
          .insert({ activity_id: activityId, user_id: user.id, emoji });
        // Notify owner (skip if self)
        if (activityOwnerId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: activityOwnerId,
            actor_id: user.id,
            type: "reaction",
            activity_id: activityId,
          });
        }
      }
    },
    [user, supabase]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [user, supabase]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SocialContext.Provider
      value={{
        friends,
        incomingRequests,
        outgoingRequests,
        notifications,
        unreadCount,
        searchUsers,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        unfriend,
        getFriendActivities,
        getActivityComments,
        getActivityReactions,
        addComment,
        toggleReaction,
        markAllRead,
        refreshFriends,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}
