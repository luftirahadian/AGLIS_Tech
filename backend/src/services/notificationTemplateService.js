// ═══════════════════════════════════════════════════════════════
// 🔔 NOTIFICATION TEMPLATE SERVICE
// ═══════════════════════════════════════════════════════════════
// Handles template management and rendering with variable substitution
// ═══════════════════════════════════════════════════════════════

const pool = require('../config/database');

class NotificationTemplateService {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📄 TEMPLATE MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get all templates with optional filtering
   */
  async getAllTemplates(filters = {}) {
    const { category, type, is_active } = filters;
    
    let query = `
      SELECT 
        t.*,
        u1.username as created_by_username,
        u2.username as updated_by_username
      FROM notification_templates t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.updated_by = u2.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND t.category = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND t.type = $${params.length}`;
    }
    
    if (is_active !== undefined) {
      params.push(is_active);
      query += ` AND t.is_active = $${params.length}`;
    }
    
    query += ` ORDER BY t.category, t.template_name`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id) {
    const result = await pool.query(
      `SELECT 
        t.*,
        u1.username as created_by_username,
        u2.username as updated_by_username
      FROM notification_templates t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.updated_by = u2.id
      WHERE t.id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  /**
   * Get template by code
   */
  async getTemplateByCode(code) {
    const result = await pool.query(
      `SELECT * FROM notification_templates WHERE template_code = $1`,
      [code]
    );
    
    return result.rows[0];
  }

  /**
   * Create new template
   */
  async createTemplate(templateData, userId) {
    const {
      template_code,
      template_name,
      description,
      category,
      type,
      priority = 'normal',
      title_template,
      message_template,
      variables = [],
      example_data = {},
      channels = ['web', 'mobile'],
      icon,
      color,
      action_url_template
    } = templateData;

    const result = await pool.query(
      `INSERT INTO notification_templates (
        template_code, template_name, description, category, type, priority,
        title_template, message_template, variables, example_data, channels,
        icon, color, action_url_template, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
      RETURNING *`,
      [
        template_code, template_name, description, category, type, priority,
        title_template, message_template, JSON.stringify(variables),
        JSON.stringify(example_data), JSON.stringify(channels),
        icon, color, action_url_template, userId
      ]
    );

    return result.rows[0];
  }

  /**
   * Update template
   */
  async updateTemplate(id, templateData, userId) {
    const {
      template_name,
      description,
      category,
      type,
      priority,
      title_template,
      message_template,
      variables,
      example_data,
      channels,
      icon,
      color,
      action_url_template,
      is_active
    } = templateData;

    const result = await pool.query(
      `UPDATE notification_templates SET
        template_name = COALESCE($1, template_name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        type = COALESCE($4, type),
        priority = COALESCE($5, priority),
        title_template = COALESCE($6, title_template),
        message_template = COALESCE($7, message_template),
        variables = COALESCE($8, variables),
        example_data = COALESCE($9, example_data),
        channels = COALESCE($10, channels),
        icon = COALESCE($11, icon),
        color = COALESCE($12, color),
        action_url_template = COALESCE($13, action_url_template),
        is_active = COALESCE($14, is_active),
        updated_by = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *`,
      [
        template_name, description, category, type, priority,
        title_template, message_template,
        variables ? JSON.stringify(variables) : null,
        example_data ? JSON.stringify(example_data) : null,
        channels ? JSON.stringify(channels) : null,
        icon, color, action_url_template, is_active, userId, id
      ]
    );

    return result.rows[0];
  }

  /**
   * Delete template
   */
  async deleteTemplate(id) {
    const result = await pool.query(
      `DELETE FROM notification_templates WHERE id = $1 RETURNING *`,
      [id]
    );
    
    return result.rows[0];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 TEMPLATE RENDERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Render template with data
   * Replaces {{variable}} placeholders with actual values
   */
  renderTemplate(template, data) {
    if (!template || !data) {
      throw new Error('Template and data are required');
    }

    let rendered = template;
    
    // Replace all {{variable}} with data values
    const regex = /\{\{(\w+)\}\}/g;
    rendered = rendered.replace(regex, (match, variable) => {
      // Check if variable exists in data
      if (data.hasOwnProperty(variable)) {
        return data[variable];
      }
      // Return original placeholder if variable not found
      console.warn(`⚠️  Variable '${variable}' not found in data`);
      return match;
    });
    
    return rendered;
  }

  /**
   * Render notification from template
   * Returns complete notification object
   */
  async renderNotification(templateCode, data) {
    const template = await this.getTemplateByCode(templateCode);
    
    if (!template) {
      throw new Error(`Template '${templateCode}' not found`);
    }

    if (!template.is_active) {
      throw new Error(`Template '${templateCode}' is not active`);
    }

    // Validate required variables
    const variables = template.variables || [];
    const missingVariables = variables.filter(v => !data.hasOwnProperty(v));
    
    if (missingVariables.length > 0) {
      console.warn(`⚠️  Missing variables for template '${templateCode}':`, missingVariables);
    }

    // Render title and message
    const title = this.renderTemplate(template.title_template, data);
    const message = this.renderTemplate(template.message_template, data);
    
    // Render action URL if exists
    let action_url = null;
    if (template.action_url_template) {
      action_url = this.renderTemplate(template.action_url_template, data);
    }

    return {
      type: template.type,
      title,
      message,
      data: data,
      priority: template.priority,
      icon: template.icon,
      color: template.color,
      action_url,
      template_id: template.id,
      template_data: data
    };
  }

  /**
   * Preview template with example data
   */
  async previewTemplate(templateId) {
    const template = await this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const exampleData = template.example_data || {};
    
    return {
      template: template,
      preview: {
        title: this.renderTemplate(template.title_template, exampleData),
        message: this.renderTemplate(template.message_template, exampleData),
        action_url: template.action_url_template 
          ? this.renderTemplate(template.action_url_template, exampleData)
          : null
      }
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 TEMPLATE STATISTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE is_read = true) as total_read,
        COUNT(*) FILTER (WHERE is_archived = true) as total_archived,
        AVG(EXTRACT(EPOCH FROM (read_at - created_at))) as avg_time_to_read
      FROM notifications
      WHERE template_id = $1`,
      [templateId]
    );
    
    return result.rows[0];
  }

  /**
   * Get template categories
   */
  async getCategories() {
    const result = await pool.query(
      `SELECT DISTINCT category 
      FROM notification_templates 
      WHERE category IS NOT NULL 
      ORDER BY category`
    );
    
    return result.rows.map(r => r.category);
  }

  /**
   * Get template types
   */
  async getTypes() {
    const result = await pool.query(
      `SELECT DISTINCT type 
      FROM notification_templates 
      ORDER BY type`
    );
    
    return result.rows.map(r => r.type);
  }
}

module.exports = new NotificationTemplateService();

