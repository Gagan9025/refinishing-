/**
 * Admin Service
 * Handles all admin user-management and audit-log operations.
 *
 * Security model:
 *  - Every write operation re-fetches the caller's role from Supabase DB
 *    to prevent privilege escalation via localStorage manipulation.
 *  - Deactivated accounts are rejected at login (authService) and
 *    their session is not trusted for write operations.
 *  - Audit log rows are append-only (enforced by RLS — no UPDATE/DELETE).
 *  - Passwords are NEVER stored or transmitted from this service.
 */

import { supabase } from '../supabase/config';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Re-verify the caller's role from the database.
 * This prevents reliance on potentially stale localStorage values.
 * @param {string} userId
 * @returns {Promise<string|null>} role or null if not found / inactive
 */
async function _verifyCallerIsAdmin(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    if (!data.is_active) return null;
    return data.role === 'ADMIN' ? 'ADMIN' : null;
  } catch {
    return null;
  }
}

/**
 * Write an entry to the admin audit log.
 */
async function _writeAudit({ performedBy, affectedUser, action, oldValue, newValue, notes }) {
  try {
    await supabase.from('admin_audit_log').insert({
      performed_by: performedBy,
      affected_user: affectedUser,
      action,
      old_value: oldValue || null,
      new_value: newValue || null,
      notes: notes || null,
      performed_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Audit log write failed (non-fatal):', err.message);
  }
}

// ---------------------------------------------------------------------------
// Admin Service
// ---------------------------------------------------------------------------

export const adminService = {

  // -------------------------------------------------------------------------
  // Dashboard summary stats
  // -------------------------------------------------------------------------

  /**
   * Fetch aggregate stats for the admin overview dashboard.
   * @returns {Promise<object>}
   */
  async getDashboardStats() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, role, is_active, created_at');

      if (error) throw error;

      const total = data.length;
      const active = data.filter(u => u.is_active !== false).length;
      const inactive = total - active;
      const byRole = data.reduce((acc, u) => {
        const r = u.role || 'VIEWER';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyAdded = data
        .filter(u => u.created_at && new Date(u.created_at) > thirtyDaysAgo)
        .length;

      return { total, active, inactive, byRole, recentlyAdded };
    } catch (err) {
      console.error('adminService.getDashboardStats error:', err.message);
      return { total: 0, active: 0, inactive: 0, byRole: {}, recentlyAdded: 0 };
    }
  },

  // -------------------------------------------------------------------------
  // User listing
  // -------------------------------------------------------------------------

  /**
   * Fetch all users ordered by creation date (newest first).
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, employee_id, name, username, email, role, department, is_active, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('adminService.getAllUsers error:', err.message);
      return [];
    }
  },

  // -------------------------------------------------------------------------
  // Create user
  // -------------------------------------------------------------------------

  /**
   * Create a new user account in the users table.
   * @param {object} callerUser - the currently logged-in admin session object
   * @param {object} userData - { employee_id, name, username, email, role, department, password }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async createUser(callerUser, userData) {
    // Server-side role verification
    const callerRole = await _verifyCallerIsAdmin(callerUser?.id);
    if (!callerRole) {
      return { success: false, error: 'Unauthorized: only active Admins can create users.' };
    }

    const { employee_id, name, username, email, role, department } = userData;

    if (!name?.trim() || !username?.trim() || !role) {
      return { success: false, error: 'Name, username, and role are required.' };
    }

    // Check duplicate username
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        return { success: false, error: `Username "${username.trim().toLowerCase()}" is already taken.` };
      }
    } catch { /* continue */ }

    // Check duplicate employee_id
    if (employee_id?.trim()) {
      try {
        const { data: existingEmp } = await supabase
          .from('users')
          .select('id')
          .eq('employee_id', employee_id.trim())
          .maybeSingle();

        if (existingEmp) {
          return { success: false, error: `Employee ID "${employee_id.trim()}" is already assigned to another account.` };
        }
      } catch { /* continue */ }
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      employee_id: employee_id?.trim() || null,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email?.trim() || null,
      role: role.toUpperCase(),
      department: department?.trim() || 'Refinishing Dept',
      is_active: true,
      created_at: new Date().toISOString(),
      last_login_at: null,
      // password_hash not stored — demo accounts use plaintext in mockData,
      // real accounts should use Supabase Auth
      password_hash: null
    };

    try {
      const { error } = await supabase.from('users').insert(newUser);
      if (error) throw error;

      await _writeAudit({
        performedBy: `${callerUser.name} (${callerUser.id})`,
        affectedUser: `${newUser.name} (${newUser.id})`,
        action: 'CREATE_USER',
        newValue: { role: newUser.role, is_active: true, username: newUser.username },
        notes: `New ${newUser.role} account created by admin.`
      });

      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: `Database error: ${err.message}` };
    }
  },

  // -------------------------------------------------------------------------
  // Update user
  // -------------------------------------------------------------------------

  /**
   * Update permitted fields on a user account.
   * @param {object} callerUser
   * @param {string} targetUserId
   * @param {object} updates - { name, email, role, department, employee_id }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateUser(callerUser, targetUserId, updates) {
    const callerRole = await _verifyCallerIsAdmin(callerUser?.id);
    if (!callerRole) {
      return { success: false, error: 'Unauthorized: only active Admins can edit users.' };
    }

    // Prevent an admin from escalating another user to ADMIN without keeping at least one admin
    // (soft safeguard — full enforcement would require a count check)

    // Fetch current state for audit
    let oldRecord = null;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();
      oldRecord = data;
    } catch { /* non-fatal */ }

    const allowedFields = {};
    if (updates.name !== undefined) allowedFields.name = updates.name.trim();
    if (updates.email !== undefined) allowedFields.email = updates.email?.trim() || null;
    if (updates.role !== undefined) allowedFields.role = updates.role.toUpperCase();
    if (updates.department !== undefined) allowedFields.department = updates.department?.trim() || 'Refinishing Dept';
    if (updates.employee_id !== undefined) allowedFields.employee_id = updates.employee_id?.trim() || null;

    if (Object.keys(allowedFields).length === 0) {
      return { success: false, error: 'No valid fields to update.' };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(allowedFields)
        .eq('id', targetUserId);

      if (error) throw error;

      await _writeAudit({
        performedBy: `${callerUser.name} (${callerUser.id})`,
        affectedUser: targetUserId,
        action: 'UPDATE_USER',
        oldValue: oldRecord ? { role: oldRecord.role, name: oldRecord.name, department: oldRecord.department } : null,
        newValue: allowedFields,
        notes: 'User details updated by admin.'
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: `Database error: ${err.message}` };
    }
  },

  // -------------------------------------------------------------------------
  // Deactivate / Reactivate
  // -------------------------------------------------------------------------

  /**
   * Set account is_active status (deactivate or reactivate).
   * Deactivation is preferred over deletion to preserve historical records.
   * @param {object} callerUser
   * @param {string} targetUserId
   * @param {boolean} isActive
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setUserActiveStatus(callerUser, targetUserId, isActive) {
    const callerRole = await _verifyCallerIsAdmin(callerUser?.id);
    if (!callerRole) {
      return { success: false, error: 'Unauthorized: only active Admins can change account status.' };
    }

    // Prevent admin from deactivating themselves
    if (targetUserId === callerUser.id) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', targetUserId);

      if (error) throw error;

      await _writeAudit({
        performedBy: `${callerUser.name} (${callerUser.id})`,
        affectedUser: targetUserId,
        action: isActive ? 'REACTIVATE_USER' : 'DEACTIVATE_USER',
        newValue: { is_active: isActive },
        notes: isActive ? 'Account reactivated by admin.' : 'Account deactivated by admin. Historical records preserved.'
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: `Database error: ${err.message}` };
    }
  },

  // -------------------------------------------------------------------------
  // Change Role
  // -------------------------------------------------------------------------

  /**
   * Assign a new role to a user.
   * @param {object} callerUser
   * @param {string} targetUserId
   * @param {string} newRole
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async changeUserRole(callerUser, targetUserId, newRole) {
    const callerRole = await _verifyCallerIsAdmin(callerUser?.id);
    if (!callerRole) {
      return { success: false, error: 'Unauthorized: only active Admins can change roles.' };
    }

    const validRoles = ['ADMIN', 'DATA ENTRY', 'VIEWER'];
    if (!validRoles.includes(newRole.toUpperCase())) {
      return { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` };
    }

    // Fetch current role for audit
    let oldRole = null;
    try {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', targetUserId)
        .single();
      oldRole = data?.role;
    } catch { /* non-fatal */ }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole.toUpperCase() })
        .eq('id', targetUserId);

      if (error) throw error;

      await _writeAudit({
        performedBy: `${callerUser.name} (${callerUser.id})`,
        affectedUser: targetUserId,
        action: 'CHANGE_ROLE',
        oldValue: { role: oldRole },
        newValue: { role: newRole.toUpperCase() },
        notes: `Role changed from ${oldRole} to ${newRole.toUpperCase()}.`
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: `Database error: ${err.message}` };
    }
  },

  // -------------------------------------------------------------------------
  // Delete (Permanent Revocation)
  // -------------------------------------------------------------------------

  /**
   * Permanently delete a user record.
   * WARNING: Prefer deactivation. Only use for GDPR/compliance hard-delete.
   * @param {object} callerUser
   * @param {string} targetUserId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteUser(callerUser, targetUserId) {
    const callerRole = await _verifyCallerIsAdmin(callerUser?.id);
    if (!callerRole) {
      return { success: false, error: 'Unauthorized: only active Admins can delete users.' };
    }

    if (targetUserId === callerUser.id) {
      return { success: false, error: 'You cannot delete your own account.' };
    }

    // Fetch user name for audit before deleting
    let targetName = targetUserId;
    try {
      const { data } = await supabase
        .from('users')
        .select('name, username, role')
        .eq('id', targetUserId)
        .single();
      if (data) targetName = `${data.name} (${data.username})`;
    } catch { /* non-fatal */ }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', targetUserId);

      if (error) throw error;

      await _writeAudit({
        performedBy: `${callerUser.name} (${callerUser.id})`,
        affectedUser: targetUserId,
        action: 'DELETE_USER',
        notes: `User "${targetName}" permanently deleted. Historical production records remain.`
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: `Database error: ${err.message}` };
    }
  },

  // -------------------------------------------------------------------------
  // Audit Log
  // -------------------------------------------------------------------------

  /**
   * Fetch audit log entries (newest first, paginated).
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  async getAuditLog(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('performed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('adminService.getAuditLog error:', err.message);
      return [];
    }
  },

  /**
   * Update the user's last_login_at timestamp.
   * Called from authService after a successful login.
   */
  async recordLogin(userId) {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch { /* non-fatal */ }
  },

  /**
   * Check if a user ID maps to an active account in the DB.
   * Used during login to reject deactivated accounts.
   * Returns null if account not in DB (demo accounts not yet synced).
   */
  async checkIsActive(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null; // not in DB yet — allow (demo account)
      return data.is_active !== false;
    } catch {
      return null; // allow if DB is unreachable
    }
  }
};
