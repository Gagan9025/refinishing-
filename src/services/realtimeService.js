import { supabase } from '../supabase/config';
import { Storage } from '../utils/storage';

/**
 * Unified Realtime Service
 * Provides:
 * 1. Multi-user Live Data Synchronization (Supabase Realtime Broadcast + Postgres Changes + Local BroadcastChannel)
 * 2. Active Online Users Presence Tracking ("Who is on the web")
 */

class RealtimeService {
  constructor() {
    this.channel = null;
    this.presenceChannel = null;
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.onlineUsers = [];
    this.dataListeners = new Set();
    this.userListeners = new Set();
    this.notificationListeners = new Set();
    this.broadcastBus = null;
    this.heartbeatTimer = null;
    this.isInitialized = false;

    // Cross-tab broadcast channel
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        this.broadcastBus = new BroadcastChannel('refinishing_realtime_bus');
        this.broadcastBus.onmessage = (event) => {
          this.handleBusMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or failed:', e);
      }
    }

    // Storage event listener as fallback for cross-tab sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('refinishing_')) {
          this.notifyDataListeners({
            source: 'local_storage',
            table: e.key,
            action: 'UPDATE',
            timestamp: new Date().toISOString()
          });
        }
      });
    }
  }

  /**
   * Initialize realtime subscriptions with current user and active page
   */
  init(user, page = 'dashboard') {
    this.currentUser = user;
    this.currentPage = page;

    if (!user) return;

    this.setupChannels();
    this.startHeartbeat();
    this.isInitialized = true;
  }

  /**
   * Update current user's active page in presence
   */
  updateCurrentPage(page) {
    this.currentPage = page;
    if (this.presenceChannel && this.currentUser) {
      const presencePayload = this.buildPresencePayload();
      try {
        this.presenceChannel.track(presencePayload);
      } catch (e) {
        // silently handle
      }
    }

    // Also broadcast to cross-tab bus
    if (this.broadcastBus) {
      try {
        this.broadcastBus.postMessage({
          type: 'PRESENCE_UPDATE',
          payload: this.buildPresencePayload()
        });
      } catch (e) {}
    }
  }

  buildPresencePayload() {
    return {
      userId: this.currentUser?.id || 'anon',
      username: this.currentUser?.username || 'user',
      name: this.currentUser?.name || 'Anonymous User',
      role: this.currentUser?.role || 'VIEWER',
      department: this.currentUser?.department || 'Refinishing Dept',
      page: this.currentPage,
      onlineAt: this.currentUser?.loginAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      tabId: this.getTabId()
    };
  }

  getTabId() {
    if (!this._tabId) {
      this._tabId = 'tab_' + Math.random().toString(36).substring(2, 9);
    }
    return this._tabId;
  }

  /**
   * Setup Supabase Realtime Channels
   */
  setupChannels() {
    if (!supabase) return;

    try {
      // 1. Data Broadcast & Postgres Changes Channel
      if (!this.channel) {
        this.channel = supabase.channel('refinishing-live-data', {
          config: { broadcast: { self: false } }
        });

        // Listen for live broadcast messages from other users
        this.channel.on('broadcast', { event: 'data_changed' }, ({ payload }) => {
          this.notifyDataListeners(payload);
          this.notifyToast(payload);
        });

        // Listen for direct postgres database changes
        const tables = [
          'hourly_production',
          'daily_targets',
          'batch_production',
          'vehicle_loading',
          'vehicle_unloading',
          'attendance',
          'seen_records'
        ];

        tables.forEach((table) => {
          this.channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => {
              const changeInfo = {
                source: 'postgres_changes',
                table,
                action: payload.eventType,
                record: payload.new || payload.old,
                timestamp: new Date().toISOString()
              };
              this.notifyDataListeners(changeInfo);
            }
          );
        });

        this.channel.subscribe((status) => {
          // Connected
        });
      }

      // 2. Presence Channel ("Who is on the web")
      if (!this.presenceChannel) {
        this.presenceChannel = supabase.channel('refinishing-presence');

        this.presenceChannel
          .on('presence', { event: 'sync' }, () => {
            this.handlePresenceSync();
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            this.handlePresenceSync();
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            this.handlePresenceSync();
          });

        this.presenceChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && this.currentUser) {
            try {
              await this.presenceChannel.track(this.buildPresencePayload());
            } catch (e) {
              console.warn('Presence track error:', e);
            }
          }
        });
      }
    } catch (err) {
      console.warn('Realtime channel setup error:', err);
    }
  }

  /**
   * Handle presence state sync from Supabase
   */
  handlePresenceSync() {
    if (!this.presenceChannel) return;

    try {
      const state = this.presenceChannel.presenceState();
      const userMap = new Map();

      // Ensure current user is always included
      if (this.currentUser) {
        userMap.set(this.currentUser.id, this.buildPresencePayload());
      }

      Object.values(state).forEach((presences) => {
        if (Array.isArray(presences)) {
          presences.forEach((p) => {
            if (p && p.userId) {
              userMap.set(p.userId, {
                ...p,
                isCurrentSession: p.userId === this.currentUser?.id
              });
            }
          });
        }
      });

      this.onlineUsers = Array.from(userMap.values());
      this.notifyUserListeners(this.onlineUsers);
    } catch (e) {
      console.warn('Error syncing presence:', e);
    }
  }

  /**
   * Handle messages from other browser tabs
   */
  handleBusMessage(msg) {
    if (!msg) return;

    if (msg.type === 'DATA_CHANGED') {
      this.notifyDataListeners(msg.payload);
      this.notifyToast(msg.payload);
    } else if (msg.type === 'PRESENCE_UPDATE') {
      // Add or update other local tab user
      const exists = this.onlineUsers.some((u) => u.tabId === msg.payload.tabId);
      if (!exists && msg.payload.userId !== this.currentUser?.id) {
        this.onlineUsers.push(msg.payload);
        this.notifyUserListeners(this.onlineUsers);
      }
    }
  }

  /**
   * Start lightweight heartbeat to keep session and presence fresh
   */
  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (this.presenceChannel && this.currentUser) {
        try {
          this.presenceChannel.track(this.buildPresencePayload());
        } catch (e) {}
      }

      // Also ensure self is visible in local online users list
      if (this.currentUser && (!this.onlineUsers || this.onlineUsers.length === 0)) {
        this.onlineUsers = [this.buildPresencePayload()];
        this.notifyUserListeners(this.onlineUsers);
      }
    }, 15000); // 15 seconds
  }

  /**
   * Broadcast a data change to all other users across the web immediately
   * @param {object} info - { table, action, record, summary, userName }
   */
  notifyDataChange(info) {
    const payload = {
      source: 'client_broadcast',
      table: info.table || 'data',
      action: info.action || 'UPDATE',
      summary: info.summary || 'Data was updated',
      userName: info.userName || this.currentUser?.name || 'Operator',
      userRole: info.userRole || this.currentUser?.role || 'DATA ENTRY',
      date: info.date,
      timestamp: new Date().toISOString()
    };

    // 1. Broadcast via Supabase Realtime channel to other devices/browsers
    if (this.channel) {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'data_changed',
          payload
        });
      } catch (e) {
        console.warn('Supabase broadcast error:', e);
      }
    }

    // 2. Broadcast via BroadcastChannel to other tabs in the same browser
    if (this.broadcastBus) {
      try {
        this.broadcastBus.postMessage({
          type: 'DATA_CHANGED',
          payload
        });
      } catch (e) {}
    }

    // 3. Notify local listeners on the current page
    this.notifyDataListeners(payload);
  }

  /**
   * Subscribe to data changes (used by pages to trigger auto-refresh)
   */
  subscribeToDataChanges(callback) {
    this.dataListeners.add(callback);
    return () => {
      this.dataListeners.delete(callback);
    };
  }

  notifyDataListeners(payload) {
    this.dataListeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error('Error in data listener callback:', e);
      }
    });
  }

  /**
   * Subscribe to online users / presence updates
   */
  subscribeToOnlineUsers(callback) {
    this.userListeners.add(callback);
    // Call immediately with current list
    if (this.onlineUsers && this.onlineUsers.length > 0) {
      callback(this.onlineUsers);
    } else if (this.currentUser) {
      const initial = [this.buildPresencePayload()];
      this.onlineUsers = initial;
      callback(initial);
    }
    return () => {
      this.userListeners.delete(callback);
    };
  }

  notifyUserListeners(users) {
    this.userListeners.forEach((cb) => {
      try {
        cb(users);
      } catch (e) {
        console.error('Error in user listener callback:', e);
      }
    });
  }

  /**
   * Subscribe to live toast alerts (e.g. "Rajesh entered 45 pcs for 9:30-10:30")
   */
  subscribeToToasts(callback) {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  notifyToast(payload) {
    this.notificationListeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error('Error in toast listener callback:', e);
      }
    });
  }

  getOnlineUsers() {
    if (this.onlineUsers.length === 0 && this.currentUser) {
      return [this.buildPresencePayload()];
    }
    return this.onlineUsers;
  }

  cleanup() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.presenceChannel) {
      supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
    if (this.broadcastBus) {
      this.broadcastBus.close();
      this.broadcastBus = null;
    }
    this.dataListeners.clear();
    this.userListeners.clear();
    this.notificationListeners.clear();
    this.isInitialized = false;
  }
}

export const realtimeService = new RealtimeService();
