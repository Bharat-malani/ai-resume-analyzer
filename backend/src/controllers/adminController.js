const db = require('../db');

const adminController = {
  async getStats(req, res, next) {
    try {
      const stats = await db.getSystemStats();
      res.json({
        success: true,
        stats
      });
    } catch (err) {
      next(err);
    }
  },

  async getUsers(req, res, next) {
    try {
      const users = await db.users.listAll();
      res.json({
        success: true,
        count: users.length,
        users
      });
    } catch (err) {
      next(err);
    }
  },

  async getSkills(req, res, next) {
    try {
      const skills = await db.skillsCatalog.listAll();
      res.json({
        success: true,
        count: skills.length,
        skills
      });
    } catch (err) {
      next(err);
    }
  },

  async createSkill(req, res, next) {
    try {
      const { name, category } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Skill name is required.' });
      }

      const newSkill = await db.skillsCatalog.create({
        name: name.trim(),
        category: category || 'General'
      });

      res.status(201).json({
        success: true,
        message: 'Skill added to catalog.',
        skill: newSkill
      });
    } catch (err) {
      next(err);
    }
  },

  async updateSkill(req, res, next) {
    try {
      const { id } = req.params;
      const { name, category } = req.body;

      const updated = await db.skillsCatalog.update(id, { name, category });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Skill not found.' });
      }

      res.json({
        success: true,
        message: 'Skill updated successfully.',
        skill: updated
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteSkill(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await db.skillsCatalog.delete(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Skill not found.' });
      }

      res.json({
        success: true,
        message: 'Skill deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = adminController;
