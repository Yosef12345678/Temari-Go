import { Sequelize } from 'sequelize-typescript';
import { config } from '../config';
import { User } from './user.model';
import { Role } from './role.model';
import { RefreshToken } from './refreshToken.model';
import { Student } from './student.model';
import { Bus } from './bus.model';
import { RFIDCard } from './rfidCard.model';
import { Geofence } from './geofence.model';
import { Attendance } from './attendance.model';
import { Location } from './location.model';
import { AlcoholTest } from './alcoholTest.model';
import { AlcoholCheckSession } from './alcoholCheckSession.model';
import { DriverFeedback } from './driverFeedback.model';
import { DriverRating } from './driverRating.model';
import { Payment } from './payment.model';
import { Invoice } from './invoice.model';
import { Notification } from './notification.model';
import { Route } from './route.model';
import { RouteAssignment } from './routeAssignment.model';
import { RouteRun } from './routeRun.model';
import { RouteRunAssignment } from './routeRunAssignment.model';
import { School } from './school.model';
import { Device } from './device.model';
import { ParentAbsence } from './parentAbsence.model';
import { DriverProfile } from './driverProfile.model';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as 'development' | 'production'];

export const sequelize = new Sequelize(dbConfig.url, {
  dialect: 'postgres',
  models: [
    User,
    Role,
    RefreshToken,
    Student,
    Bus,
    RFIDCard,
    Geofence,
    Attendance,
    Location,
    AlcoholTest,
    AlcoholCheckSession,
    DriverFeedback,
    DriverRating,
    Payment,
    Invoice,
    Notification,
    Route,
    RouteAssignment,
    RouteRun,
    RouteRunAssignment,
    School,
    Device,
    ParentAbsence,
    DriverProfile,
  ],
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export const db = {
  sequelize,
  User,
  Role,
  RefreshToken,
  Student,
  Bus,
  RFIDCard,
  Geofence,
  Attendance,
  Location,
  AlcoholTest,
  AlcoholCheckSession,
  DriverFeedback,
  DriverRating,
  Payment,
  Invoice,
  Notification,
  Route,
  RouteAssignment,
  RouteRun,
  RouteRunAssignment,
  School,
  Device,
  ParentAbsence,
  DriverProfile,
};
