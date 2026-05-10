'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_run_assignments', {
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
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      pickup_latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      pickup_longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      pickup_order: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    // Prevent duplicate student assignments on the same run
    await queryInterface.addIndex('route_run_assignments', ['route_run_id', 'student_id'], {
      unique: true,
      name: 'route_run_assignments_run_id_student_id_unique',
    });

    // Index for run lookups
    await queryInterface.addIndex('route_run_assignments', ['route_run_id'], {
      name: 'route_run_assignments_route_run_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('route_run_assignments', 'route_run_assignments_route_run_id_idx');
    await queryInterface.removeIndex('route_run_assignments', 'route_run_assignments_run_id_student_id_unique');
    await queryInterface.dropTable('route_run_assignments');
  },
};
