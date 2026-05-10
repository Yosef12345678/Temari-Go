'use strict';

/**
 * Route lifecycle and driver workflow timestamps now live on `route_runs`, not `routes`.
 * Fresh installs use `20251229143706-create-routes.js` (template-only). This migration is a no-op.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up() {},

  async down() {},
};
