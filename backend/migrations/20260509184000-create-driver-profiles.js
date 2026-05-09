'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('driver_profiles', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      onboarding_status: {
        type: Sequelize.ENUM('pending_verification', 'active', 'rejected', 'suspended'),
        allowNull: false,
        defaultValue: 'pending_verification',
      },
      first_login_pending: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      verified_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      rejected_reason: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('driver_profiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_driver_profiles_onboarding_status";');
  },
};
