'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('route_runs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'routes',
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
      run_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      lifecycle_status: {
        type: Sequelize.ENUM('assigned', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'assigned',
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      arrived_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      picked_up_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancel_reason: {
        type: Sequelize.TEXT,
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

    // Unique constraint: one run per route per date
    await queryInterface.addIndex('route_runs', ['route_id', 'run_date'], {
      unique: true,
      name: 'route_runs_route_id_run_date_unique',
    });

    // Index for driver lookups by bus + status + date
    await queryInterface.addIndex('route_runs', ['bus_id', 'run_date', 'lifecycle_status'], {
      name: 'route_runs_bus_date_status_idx',
    });

    // Index for date lookups
    await queryInterface.addIndex('route_runs', ['run_date'], {
      name: 'route_runs_run_date_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('route_runs', 'route_runs_run_date_idx');
    await queryInterface.removeIndex('route_runs', 'route_runs_bus_date_status_idx');
    await queryInterface.removeIndex('route_runs', 'route_runs_route_id_run_date_unique');
    await queryInterface.dropTable('route_runs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_route_runs_lifecycle_status";');
  },
};
