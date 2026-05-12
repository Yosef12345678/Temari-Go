'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
    */
    await queryInterface.bulkInsert('Roles', [
      { name: 'admin', created_at: new Date(), updated_at: new Date() },
      { name: 'user', created_at: new Date(), updated_at: new Date() },
      { name: 'parent', created_at: new Date(), updated_at: new Date() },
      { name: 'driver', created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', {
      name: ['admin', 'user', 'parent', 'driver'],
    });
  }
};
