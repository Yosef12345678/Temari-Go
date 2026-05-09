'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const routeColumns = await queryInterface.describeTable('routes');
    if (!routeColumns.lifecycle_status) {
      await queryInterface.addColumn('routes', 'lifecycle_status', {
        type: Sequelize.ENUM('assigned', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'assigned',
      });
    }

    if (!routeColumns.accepted_at) {
      await queryInterface.addColumn('routes', 'accepted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!routeColumns.arrived_at) {
      await queryInterface.addColumn('routes', 'arrived_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!routeColumns.picked_up_at) {
      await queryInterface.addColumn('routes', 'picked_up_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!routeColumns.completed_at) {
      await queryInterface.addColumn('routes', 'completed_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!routeColumns.cancelled_at) {
      await queryInterface.addColumn('routes', 'cancelled_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!routeColumns.cancel_reason) {
      await queryInterface.addColumn('routes', 'cancel_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('routes', 'cancel_reason');
    await queryInterface.removeColumn('routes', 'cancelled_at');
    await queryInterface.removeColumn('routes', 'completed_at');
    await queryInterface.removeColumn('routes', 'picked_up_at');
    await queryInterface.removeColumn('routes', 'arrived_at');
    await queryInterface.removeColumn('routes', 'accepted_at');
    await queryInterface.removeColumn('routes', 'lifecycle_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_routes_lifecycle_status";');
  },
};
