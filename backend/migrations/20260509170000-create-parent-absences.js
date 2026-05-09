'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('parent_absences', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      absence_date: { type: Sequelize.DATEONLY, allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      status: {
        type: Sequelize.ENUM('reported', 'acknowledged'),
        allowNull: false,
        defaultValue: 'reported',
      },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('parent_absences', ['student_id', 'absence_date'], {
      unique: true,
      name: 'uniq_parent_absence_student_day',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('parent_absences', 'uniq_parent_absence_student_day');
    await queryInterface.dropTable('parent_absences');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_parent_absences_status";');
  },
};
