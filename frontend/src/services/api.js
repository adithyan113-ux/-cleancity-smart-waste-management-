/**
 * API Service for CleanCity Smart Waste Management
 * Includes client-side mobile image compression, role headers, and error resilience.
 */

const API_BASE = '/api';

// Demo users setup for quick role switching and mobile testing
export const DEMO_USERS = {
  citizen: {
    username: 'citizen1',
    role: 'citizen',
    name: 'Sarah Jenkins',
    title: 'Active Community Member'
  },
  worker: {
    username: 'worker1',
    role: 'worker',
    name: 'Dave Miller',
    title: 'Sanitation Truck Driver (Unit 4)'
  },
  admin: {
    username: 'admin1',
    role: 'admin',
    name: 'Elena Martinez',
    title: 'Chief Municipal Sanitation Officer'
  }
};

export const getStoredUser = () => {
  const saved = localStorage.getItem('cleancity_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('cleancity_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('cleancity_user');
  }
};

const getHeaders = (isMultipart = false) => {
  const user = getStoredUser() || DEMO_USERS.citizen;
  const headers = {
    'X-User-Username': user.username || 'citizen1',
    'X-User-Role': user.role || 'citizen',
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

/**
 * Compresses an image client-side using an offscreen canvas
 * Resizes large camera photos (e.g. 15-20MB) down to max 1280px width, JPEG 80%
 * Drastically improves mobile battery life, upload speed, and avoids memory spikes.
 */
export const compressImageFile = async (file, maxWidth = 1280, quality = 0.82) => {
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // If file is already tiny (under 300KB), return as is
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`Compressed image: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export const api = {
  // Authentication: Same login function for Citizen, Worker, and Admin
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please check your username and password.');
    }
    const profile = data.user?.profile || {};
    const normalizedUser = {
      id: data.user?.id,
      username: data.user?.username,
      email: data.user?.email || '',
      name: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim() || data.user?.username,
      first_name: data.user?.first_name || '',
      last_name: data.user?.last_name || '',
      role: data.role || profile.role || 'citizen',
      points: data.points !== undefined ? data.points : (profile.reward_points || 0),
      phone: profile.phone || '',
      mobile: profile.phone || '',
      age: profile.age !== null && profile.age !== undefined ? profile.age : '',
      gender: profile.gender || '',
      gender_display: profile.gender_display || (profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : ''),
      address: profile.address || '',
      id_details: profile.id_details || '',
      profile_photo: profile.profile_photo || '',
      photo: profile.profile_photo || '',
      is_approved: profile.is_approved !== undefined ? profile.is_approved : true,
      total_reports: profile.total_reports || 0,
      total_vouchers_redeemed: profile.total_vouchers_redeemed || 0,
      created_at: profile.created_at || '',
      is_superuser: data.is_superuser || data.user?.is_superuser || false,
      title: data.role === 'admin' ? 'Chief Municipal Sanitation Officer' : (data.role === 'worker' ? 'Sanitation Truck Driver' : 'Active Community Member')
    };
    setStoredUser(normalizedUser);
    return {
      user: normalizedUser,
      role: normalizedUser.role,
      redirect_tab: data.redirect_tab || (normalizedUser.role === 'worker' ? 'worker' : (normalizedUser.role === 'admin' ? 'admin' : 'dashboard')),
      message: data.message
    };
  },

  async register({ username, password, email, mobile, full_name, age, gender, address, id_details, profile_photo, role = 'citizen' }) {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        email,
        mobile,
        phone: mobile,
        full_name,
        age,
        gender,
        address,
        id_details,
        profile_photo,
        role
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    return data;
  },

  logout() {
    setStoredUser(null);
  },

  // Current user & Profile
  async getCurrentUser() {
    try {
      const res = await fetch(`${API_BASE}/auth/me/`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      const profile = data.profile || {};
      const normalized = {
        id: data.id,
        username: data.username,
        email: data.email || '',
        name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        role: profile.role || 'citizen',
        points: profile.reward_points !== undefined ? profile.reward_points : 0,
        phone: profile.phone || '',
        mobile: profile.phone || '',
        age: profile.age !== null && profile.age !== undefined ? profile.age : '',
        gender: profile.gender || '',
        gender_display: profile.gender_display || '',
        address: profile.address || '',
        total_reports: profile.total_reports || 0,
        total_vouchers_redeemed: profile.total_vouchers_redeemed || 0,
        created_at: profile.created_at || '',
        is_superuser: data.is_superuser || false,
        title: profile.role === 'admin' ? 'Chief Municipal Sanitation Officer' : (profile.role === 'worker' ? 'Sanitation Truck Driver' : 'Active Community Member')
      };
      setStoredUser(normalized);
      return normalized;
    } catch (err) {
      console.warn('API fallback for user:', err);
      return getStoredUser() || { username: 'citizen1', role: 'citizen', points: 140 };
    }
  },

  // Update Profile with edit option
  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/auth/me/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile.');
    }
    const user = data.user || {};
    const profile = user.profile || {};
    const updatedUser = {
      id: user.id,
      username: user.username,
      email: user.email || '',
      name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: profile.role || 'citizen',
      points: profile.reward_points !== undefined ? profile.reward_points : 0,
      phone: profile.phone || '',
      mobile: profile.phone || '',
      age: profile.age !== null && profile.age !== undefined ? profile.age : '',
      gender: profile.gender || '',
      gender_display: profile.gender_display || '',
      address: profile.address || '',
      id_details: profile.id_details || '',
      profile_photo: profile.profile_photo || '',
      photo: profile.profile_photo || '',
      is_approved: profile.is_approved !== undefined ? profile.is_approved : true,
      total_reports: profile.total_reports || 0,
      total_vouchers_redeemed: profile.total_vouchers_redeemed || 0,
      created_at: profile.created_at || '',
      is_superuser: user.is_superuser || false,
      title: profile.role === 'admin' ? 'Chief Municipal Sanitation Officer' : (profile.role === 'worker' ? 'Sanitation Truck Driver' : 'Active Community Member')
    };
    setStoredUser(updatedUser);
    return {
      message: data.message || 'Profile updated successfully!',
      user: updatedUser
    };
  },

  // Citizen Dashboard Summary
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return await res.json();
  },

  // Waste Reports List & Filtering
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports/?${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return await res.json();
  },

  // Server-side AI Image Classification Preview
  async classifyImagePreview(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await fetch(`${API_BASE}/ai/classify/`, {
      method: 'POST',
      headers: {
        'X-User-Username': getStoredUser().username,
      },
      body: formData,
    });
    if (!res.ok) throw new Error('AI classification failed');
    return await res.json();
  },

  // Submit Waste Report
  async submitReport(formData) {
    const res = await fetch(`${API_BASE}/reports/`, {
      method: 'POST',
      headers: {
        'X-User-Username': getStoredUser().username,
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.errors ? Object.values(data.errors).join(' ') : (data.error || 'Submission failed');
      throw new Error(errorMsg);
    }
    return data;
  },

  // Voucher Redemption
  async redeemVoucher(catalogItem) {
    const res = await fetch(`${API_BASE}/rewards/redeem/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        catalog_id: catalogItem.id,
        title: catalogItem.title,
        partner_name: catalogItem.partner_name,
        points_cost: catalogItem.points_cost,
        discount_text: catalogItem.discount_text
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to redeem voucher');
    return data;
  },

  // Admin Management Endpoints
  async getAdminReports() {
    const res = await fetch(`${API_BASE}/admin/reports/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Forbidden or failed to fetch admin data');
    return await res.json();
  },

  async updateReportStatus(reportId, action, workerId = null) {
    const res = await fetch(`${API_BASE}/admin/reports/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        report_id: reportId,
        action,
        worker_id: workerId
      })
    });
    if (!res.ok) throw new Error('Failed to update report');
    return await res.json();
  },

  async generateDynamicRoute(workerId = null) {
    const res = await fetch(`${API_BASE}/admin/routes/generate/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ worker_id: workerId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate dynamic route');
    return data;
  },

  // Admin User & Citizen Management / Approval
  async getAdminUsers(role = null) {
    const url = role ? `${API_BASE}/admin/users/?role=${role}` : `${API_BASE}/admin/users/`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user list');
    return await res.json();
  },

  async approveUser(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/approve/`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to approve user');
    return data;
  },

  async deleteUser(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  },

  // Worker Endpoints
  async getWorkerStops() {
    const res = await fetch(`${API_BASE}/worker/stops/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Worker access error');
    return await res.json();
  },

  async updateStopStatus(stopId, newStatus, notes = '') {
    const res = await fetch(`${API_BASE}/worker/stops/${stopId}/status/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status: newStatus, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update stop status');
    return data;
  }
};
