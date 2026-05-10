import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  HasMany,
  ForeignKey,
} from 'sequelize-typescript';
import { Bus } from './bus.model';
import { Route } from './route.model';
import { RouteRunAssignment } from './routeRunAssignment.model';

@Table({ tableName: 'route_runs', underscored: true })
export class RouteRun extends Model {
  @ForeignKey(() => Route)
  @Column({ type: DataType.INTEGER, allowNull: false })
  route_id!: number;

  @ForeignKey(() => Bus)
  @Column({ type: DataType.INTEGER, allowNull: false })
  bus_id!: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  run_date!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.TIME, allowNull: true })
  start_time?: string;

  @Column({ type: DataType.TIME, allowNull: true })
  end_time?: string;

  @Column({
    type: DataType.ENUM('assigned', 'accepted', 'arrived', 'picked_up', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'assigned',
  })
  lifecycle_status!: 'assigned' | 'accepted' | 'arrived' | 'picked_up' | 'completed' | 'cancelled';

  @Column({ type: DataType.DATE, allowNull: true })
  accepted_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  arrived_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  picked_up_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  completed_at?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  cancelled_at?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  cancel_reason?: string;

  @BelongsTo(() => Route)
  route!: Route;

  @BelongsTo(() => Bus)
  bus!: Bus;

  @HasMany(() => RouteRunAssignment)
  routeRunAssignments!: RouteRunAssignment[];
}
