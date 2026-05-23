'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alcohol_check_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      route_run_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'route_runs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      bus_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'buses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'passed', 'failed', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      alcohol_test_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'alcohol_tests',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('alcohol_check_sessions', ['route_run_id', 'status']);
    await queryInterface.addIndex('alcohol_check_sessions', ['bus_id', 'status', 'expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('alcohol_check_sessions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_alcohol_check_sessions_status";');
  }
};
