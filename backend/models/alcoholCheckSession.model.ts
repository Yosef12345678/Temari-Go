import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Bus } from './bus.model';
import { RouteRun } from './routeRun.model';
import { AlcoholTest } from './alcoholTest.model';

@Table({ tableName: 'alcohol_check_sessions', underscored: true, timestamps: true })
export class AlcoholCheckSession extends Model {
  @ForeignKey(() => RouteRun)
  @Column({ type: DataType.INTEGER, allowNull: false })
  route_run_id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  driver_id!: number;

  @ForeignKey(() => Bus)
  @Column({ type: DataType.INTEGER, allowNull: false })
  bus_id!: number;

  @Column({ type: DataType.ENUM('pending', 'passed', 'failed', 'expired'), allowNull: false, defaultValue: 'pending' })
  status!: 'pending' | 'passed' | 'failed' | 'expired';

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at!: Date;

  @ForeignKey(() => AlcoholTest)
  @Column({ type: DataType.INTEGER, allowNull: true })
  alcohol_test_id?: number | null;

  @BelongsTo(() => RouteRun)
  routeRun!: RouteRun;

  @BelongsTo(() => User, 'driver_id')
  driver!: User;

  @BelongsTo(() => Bus)
  bus!: Bus;

  @BelongsTo(() => AlcoholTest)
  alcoholTest?: AlcoholTest;
}
