// ═══════════════════════════════════════════════════════════════
// 🎓 MASTER DATA SERVICE (Frontend)
// ═══════════════════════════════════════════════════════════════
// Purpose: API calls for skill levels and specializations
// ═══════════════════════════════════════════════════════════════

import api from './api';

const masterDataService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SKILL LEVELS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  getSkillLevels: (params) => api.get('/skill-levels', { params }),
  
  getSkillLevel: (code) => api.get(`/skill-levels/${code}`),
  
  createSkillLevel: (data) => api.post('/skill-levels', data),
  
  updateSkillLevel: (id, data) => api.put(`/skill-levels/${id}`, data),
  
  deleteSkillLevel: (id) => api.delete(`/skill-levels/${id}`),
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPECIALIZATION CATEGORIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  getSpecializationCategories: (params) => 
    api.get('/specializations/categories', { params }),
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPECIALIZATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  getSpecializations: (params) => api.get('/specializations', { params }),
  
  getSpecializationsGrouped: (params) => 
    api.get('/specializations/grouped', { params }),
  
  getSpecialization: (id) => api.get(`/specializations/${id}`),
  
  createSpecialization: (data) => api.post('/specializations', data),
  
  updateSpecialization: (id, data) => api.put(`/specializations/${id}`, data),
  
  deleteSpecialization: (id) => api.delete(`/specializations/${id}`),
};

export default masterDataService;

