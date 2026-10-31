import sharedApi from '@/shared/lib/api';
import { toast } from 'sonner';

export async function downloadDocument(relative) {
  try {
    const path = relative.split('/').map(encodeURIComponent).join('/');
    const response = await sharedApi.get(`/v1/tendering/documents/${path}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = relative.split('/').pop();
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { toast.error('Could not download this document.'); }
}

const request = (method, path, data, config = {}) => {
  const url = path.replace(/^\/api/, '/v1/tendering');
  return sharedApi.request({ method, url, data, ...config })
    .then(response => ({ ...response, data: response.data.data }))
    .catch(error => {
      if (error.response?.data?.error) error.response.data.message = error.response.data.error;
      throw error;
    });
};
const api = {
  get: (path, config) => request('get', path, undefined, config),
  post: (path, data, config) => request('post', path, data, config),
  patch: (path, data, config) => request('patch', path, data, config),
  delete: (path, config) => request('delete', path, undefined, config),
};

// Core Auth endpoints
export const loginUser = async (email, password) => {
  const response = await api.post('/api/login', { email, password });
  return response.data;
};

export const apiService = {
  // Auth
  register: (name, email, password, role) =>
    api.post('/api/register', { name, email, password, role }),

  login: (email, password) =>
    api.post('/api/login', { email, password }),

  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/change-password', { current_password: currentPassword, new_password: newPassword }),

  // Profile
  getProfile: () => api.get('/api/profile'),
  updateProfile: (data) => api.patch('/api/profile', data),

  // Tenders (authenticated)
  getTenders: () => api.get('/api/tenders'),
  getTender: (id) => api.get(`/api/tenders/${id}`),
  createTender: (formData) =>
    api.post('/api/tenders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateTender: (id, data) => api.patch(`/api/tenders/${id}`, data),
  deleteTender: (id) => api.delete(`/api/tenders/${id}`),

  // Public (no auth required)
  getPublicTenders: () => api.get('/api/tenders/public'),
  getPublicTender: (id) => api.get(`/api/tenders/public/${id}`),
  getPublicStats: () => api.get('/api/stats/public'),

  // Proposals
  submitProposal: (formData) =>
    api.post('/api/proposals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getProposal: (id) => api.get(`/api/proposals/${id}`),
  getProposals: () => api.get('/api/proposals'),
  updateProposalStatus: (id, status) =>
    api.patch(`/api/proposals/${id}/status`, { status }),
  deleteProposal: (id) => api.delete(`/api/proposals/${id}`),
  replaceProposal: (id, formData) =>
    api.patch(`/api/proposals/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Rankings
  getRankings: (tenderId) => api.get(`/api/rankings/${tenderId}`),

  // Admin (Company Procurement Officer)
  getAdminStats: () => api.get('/api/admin/stats'),
  getSupplierProfile: (userId) => api.get(`/api/admin/suppliers/${userId}`),
  submitTenderForApproval: (id) => api.patch(`/api/tenders/${id}/submit`),
  rescoreProposals: (id) => api.post(`/api/tenders/${id}/rescore`),
  startScreening: (id) => api.post(`/api/tenders/${id}/start-screening`),
  notifyResults: (id, force = false) => api.post(`/api/tenders/${id}/notify-results`, { force }),

  // Super Admin
  getSuperAdminStats: () => api.get('/api/super-admin/stats'),
  getApprovalQueue: () => api.get('/api/super-admin/queue'),
  approveTender: (id) => api.post(`/api/super-admin/tenders/${id}/approve`),
  unpublishTender: (id) => api.post(`/api/super-admin/tenders/${id}/unpublish`),
  rejectTender: (id, reason) => api.post(`/api/super-admin/tenders/${id}/reject`, { reason }),
  getAllUsers: () => api.get('/api/super-admin/users'),
  createUser: (data) => api.post('/api/super-admin/users', data),
  updateUser: (id, data) => api.patch(`/api/super-admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/super-admin/users/${id}`),

  // Notifications
  getNotifications: () => api.get('/api/notifications'),
  markNotificationRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/api/notifications/read-all'),

  // Inquiries (public — no auth required)
  submitInquiry: (formData) =>
    api.post('/api/public/inquiries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Inquiries (super admin)
  getInquiries: () => api.get('/api/super-admin/inquiries'),
  approveInquiry: (id) => api.post(`/api/super-admin/inquiries/${id}/approve`),
  rejectInquiry: (id, reason) => api.post(`/api/super-admin/inquiries/${id}/reject`, { reason }),
  reverifyInquiry: (id) => api.post(`/api/super-admin/inquiries/${id}/reverify`),

  // Contact messages
  submitContact: (data) => api.post('/api/contact', data),
  getMessages: () => api.get('/api/super-admin/messages'),
  markMessageRead: (id) => api.patch(`/api/super-admin/messages/${id}/read`),
  markAllMessagesRead: () => api.patch('/api/super-admin/messages/read-all'),
};

export default api;
